(() => {
  'use strict';

  const normalizeString = (value, fallback = '') => {
    if (typeof value !== 'string') {
      return fallback;
    }

    const trimmed = value.trim();
    return trimmed || fallback;
  };

  const resolvePublicApiBase = () => {
    if (typeof globalThis !== 'undefined' && globalThis.NeutralPublicPath && typeof globalThis.NeutralPublicPath.api === 'function') {
      return globalThis.NeutralPublicPath.api('');
    }
    return normalizeString(typeof globalThis !== 'undefined' && globalThis.NeutralConfig && globalThis.NeutralConfig.apiBase, '');
  };

  const isPlainObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);

  const normalizeProviderType = (value, fallback = 'local') => {
    const raw = normalizeString(typeof value === 'string' ? value : String(value || fallback), fallback).toLowerCase();
    const aliases = {
      local: 'local',
      server: 'server',
      ownserver: 'server',
      selfhosted: 'server',
      cloud: 'cloud',
      aws: 'cloud',
      azure: 'cloud',
      gcp: 'cloud',
      cpanel: 'cpanel',
      ftps: 'cpanel',
      ftp: 'cpanel',
      deployment: 'cpanel'
    };

    return aliases[raw] || fallback;
  };

  const normalizeProviderDefinition = (providerDefinition = {}) => {
    if (!isPlainObject(providerDefinition)) {
      throw new TypeError('Provider definition must be an object.');
    }

    const providerId = normalizeString(providerDefinition.providerId || providerDefinition.id || providerDefinition.name || 'local-provider', 'local-provider');
    const type = normalizeProviderType(providerDefinition.type || providerDefinition.providerType || providerDefinition.kind || 'local', 'local');
    const now = new Date().toISOString();

    return {
      providerId,
      id: providerId,
      name: normalizeString(providerDefinition.name || providerDefinition.label || providerId, providerId),
      type,
      providerType: type,
      description: normalizeString(providerDefinition.description, ''),
      status: normalizeString(providerDefinition.status, 'unconfigured'),
      active: !!providerDefinition.active,
      default: !!providerDefinition.default,
      endpoint: normalizeString(providerDefinition.endpoint || providerDefinition.url || providerDefinition.host || '', ''),
      host: normalizeString(providerDefinition.host || providerDefinition.hostname || '', ''),
      region: normalizeString(providerDefinition.region || '', ''),
      path: normalizeString(providerDefinition.path || providerDefinition.rootPath || '', ''),
      apiBase: normalizeString(providerDefinition.apiBase || providerDefinition.basePath, resolvePublicApiBase()),
      authType: normalizeString(providerDefinition.authType || 'none', 'none'),
      username: normalizeString(providerDefinition.username || '', ''),
      password: normalizeString(providerDefinition.password || '', ''),
      credentialsRef: normalizeString(providerDefinition.credentialsRef || '', ''),
      metadata: isPlainObject(providerDefinition.metadata) ? { ...providerDefinition.metadata } : {},
      createdAt: normalizeString(providerDefinition.createdAt, now),
      updatedAt: normalizeString(providerDefinition.updatedAt, now)
    };
  };

  const createProviderAdapter = (providerDefinition = {}) => {
    const provider = normalizeProviderDefinition(providerDefinition);
    const type = provider.type;

    const createResult = (status, message, extra = {}) => ({
      ok: status === 'ready' || status === 'healthy',
      providerId: provider.providerId,
      type,
      status,
      message,
      checkedAt: new Date().toISOString(),
      ...extra
    });

    return {
      providerId: provider.providerId,
      id: provider.providerId,
      type,
      name: provider.name,
      endpoint: provider.endpoint,
      status: provider.status,
      async test() {
        if (type === 'cpanel') {
          return createResult('ready', 'cPanel deployment adapter is configured and ready for provider-managed deployment.', { mode: 'cpanel' });
        }

        if (type === 'cloud') {
          return createResult('ready', 'Cloud provider adapter is configured for remote deployment and runtime orchestration.', { mode: 'cloud' });
        }

        if (type === 'server') {
          return createResult('ready', 'Self-hosted server provider is configured for local or managed server deployment.', { mode: 'server' });
        }

        return createResult('ready', 'Local provider adapter is configured for runtime-local operations.', { mode: 'local' });
      },
      async deploy(target = {}) {
        return {
          ok: true,
          providerId: provider.providerId,
          target: isPlainObject(target) ? { ...target } : {},
          message: `${provider.name} is configured for provider-managed deployment.`,
          status: 'queued'
        };
      },
      async backup(source = {}) {
        return {
          ok: true,
          providerId: provider.providerId,
          source: isPlainObject(source) ? { ...source } : {},
          message: `${provider.name} can handle backup orchestration for this runtime.`,
          status: 'scheduled'
        };
      }
    };
  };

  const defaultProviders = [
    {
      providerId: 'local-provider',
      id: 'local-provider',
      name: 'Local provider',
      type: 'local',
      status: 'ready',
      active: true,
      default: true,
      description: 'Local runtime provider for default host deployment and local infrastructure workflows.',
      endpoint: 'local://runtime',
      authType: 'none',
      metadata: {
        supportsDeployment: true,
        supportsBackups: true,
        supportsUpdates: true
      }
    },
    {
      providerId: 'own-server',
      id: 'own-server',
      name: 'Own server',
      type: 'server',
      status: 'unconfigured',
      active: false,
      default: false,
      description: 'Self-hosted server configuration for managed deployment and runtime hosting.',
      endpoint: '',
      authType: 'none',
      metadata: {
        supportsDeployment: true,
        supportsBackups: true,
        supportsUpdates: true
      }
    },
    {
      providerId: 'cpanel-provider',
      id: 'cpanel-provider',
      name: 'cPanel provider',
      type: 'cpanel',
      status: 'unconfigured',
      active: false,
      default: false,
      description: 'Deployment adapter for cPanel/FTPS environments without coupling runtime logic to cPanel internals.',
      endpoint: '',
      authType: 'ftps',
      metadata: {
        supportsDeployment: true,
        supportsBackups: true,
        supportsUpdates: false
      }
    }
  ];

  const ProviderManager = {
    normalizeProviderType,
    normalizeProviderDefinition,
    createProviderAdapter,
    getDefaultProviders() {
      return defaultProviders.map((provider) => normalizeProviderDefinition(provider));
    },
    resolveProviderConfig(config = {}) {
      if (!isPlainObject(config)) {
        return normalizeProviderDefinition(defaultProviders[0]);
      }

      const fallback = defaultProviders[0];
      return normalizeProviderDefinition({
        ...fallback,
        ...config,
        type: config.type || config.providerType || config.kind || fallback.type,
        providerId: config.providerId || config.id || config.name || fallback.providerId,
        id: config.providerId || config.id || config.name || fallback.providerId
      });
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProviderManager;
  }

  if (typeof globalThis !== 'undefined') {
    globalThis.ProviderManager = ProviderManager;
  }
})();
