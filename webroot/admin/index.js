'use strict';

class AdminPlaceholderView {
  constructor(title, description) {
    this.title = title;
    this.description = description;
  }

  async init(container) {
    container.innerHTML = `
      <div class="admin-placeholder">
        <h2>${this.title}</h2>
        <p>${this.description}</p>
      </div>
    `;
  }
}

class AdminPermissionsView {
  constructor(apiClient) {
    this.api = apiClient;
  }

  async init(container) {
    const result = await this.api.getPermissions();
    const permissions = result.ok ? AdminCommon.unwrapData(result, 'permissions', []) : [];
    container.innerHTML = `
      <div class="admin-permissions-view">
        <div class="section-header">
          <h2>Permission Catalog</h2>
        </div>
        ${permissions.length
          ? `<div class="permission-list">${permissions.map((permission) => `<span class="chip">${permission}</span>`).join('')}</div>`
          : '<p class="empty-state">Permission catalog is not available.</p>'
        }
      </div>
    `;
  }
}

class AdminSessionsView {
  constructor(apiClient) {
    this.api = apiClient;
  }

  async init(container) {
    const result = await this.api.getSessions();
    const sessions = result.ok ? AdminCommon.unwrapData(result, 'sessions', []) : [];

    container.innerHTML = `
      <div class="admin-sessions-view">
        <div class="section-header">
          <h2>Sessions</h2>
        </div>
        ${sessions.length
          ? `
            <table class="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Roles</th>
                  <th>Status</th>
                  <th>Issued</th>
                  <th>Expires</th>
                </tr>
              </thead>
              <tbody>
                ${sessions.map((session) => `
                  <tr>
                    <td>${session.username || session.userId || '—'}</td>
                    <td>${Array.isArray(session.roles) ? session.roles.join(', ') : '—'}</td>
                    <td>${session.status || 'active'}</td>
                    <td>${session.issuedAt || '—'}</td>
                    <td>${session.expiresAt || '—'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `
          : '<p class="empty-state">No tracked sessions available.</p>'
        }
      </div>
    `;
  }
}

class AdminDashboardView {
  constructor(apiClient) {
    this.api = apiClient;
    this.snapshot = null;
  }

  async init(container) {
    this.container = container;
    const [statusResult, healthResult, usersResult, sessionsResult, modulesResult, settingsResult] = await Promise.all([
      this.api.get('/api/status'),
      this.api.get('/api/admin/system/health'),
      this.api.getUsers(),
      this.api.getSessions(),
      this.api.getAdminModules(),
      this.api.getSettings()
    ]);

    const runtime = statusResult.ok ? AdminCommon.unwrapData(statusResult, null, {}) : {};
    const healthPayload = healthResult.ok ? AdminCommon.unwrapData(healthResult, null, {}) : {};
    const health = healthPayload && typeof healthPayload === 'object' && healthPayload.health
      ? healthPayload.health
      : healthPayload;
    const users = usersResult.ok ? AdminCommon.unwrapData(usersResult, 'users', []) : [];
    const sessions = sessionsResult.ok ? AdminCommon.unwrapData(sessionsResult, 'sessions', []) : [];
    const modules = modulesResult.ok ? AdminCommon.unwrapData(modulesResult, 'modules', []) : [];
    const settings = settingsResult.ok ? AdminCommon.unwrapData(settingsResult, 'settings', {}) : {};

    this.snapshot = {
      runtime,
      health,
      users,
      sessions,
      modules,
      settings
    };

    this.render();
  }

  render() {
    const runtime = this.snapshot?.runtime || {};
    const health = this.snapshot?.health || {};
    const users = this.snapshot?.users || [];
    const sessions = this.snapshot?.sessions || [];
    const modules = this.snapshot?.modules || [];
    const settings = this.snapshot?.settings || {};
    const appName = settings.appName || settings.settings?.appName || 'Neutral Platform';
    const appId = settings.appId || settings.settings?.appId || 'neutral-app';
    const systemStatus = health && typeof health === 'object' && (health.status || health.state) ? String(health.status || health.state) : (runtime.status || 'healthy');
    const moduleActiveCount = modules.filter((module) => module && (module.lifecycleState === 'ACTIVE' || module.status === 'active' || module.active)).length;
    const activeSessions = sessions.filter((session) => String(session.status || 'active').toLowerCase() !== 'expired').length;
    const metrics = [
      { label: 'Status', value: systemStatus, tone: 'ok' },
      { label: 'Users', value: String(users.length), tone: 'neutral' },
      { label: 'Active sessions', value: String(activeSessions), tone: 'neutral' },
      { label: 'Modules', value: `${moduleActiveCount}/${modules.length || 0}`, tone: moduleActiveCount ? 'ok' : 'warn' }
    ];

    const details = [
      ['Application', appName],
      ['App ID', appId],
      ['Runtime', String(runtime.environment || runtime.runtime || 'PHP/LiteSpeed')],
      ['Database', String(runtime.database || runtime.databaseStatus || 'configured')],
      ['Last check', String(runtime.timestamp || runtime.generatedAt || new Date().toISOString())]
    ];

    this.container.innerHTML = `
      <div class="admin-dashboard-view">
        <div class="section-header">
          <h2>Dashboard</h2>
        </div>
        <div class="stat-grid">
          ${metrics.map((metric) => `
            <div class="stat-card">
              <span class="stat-label">${metric.label}</span>
              <strong class="stat-value ${metric.tone}">${metric.value}</strong>
            </div>
          `).join('')}
        </div>
        <div class="summary-grid">
          <div class="card-grid">
            <div class="card panel-box">
              <div class="card-header"><h3>Summary</h3></div>
              <dl class="detail-list">
                ${details.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}
              </dl>
            </div>
            <div class="card panel-box">
              <div class="card-header"><h3>Module status</h3></div>
              <div class="chip-list">
                ${modules.length
                  ? modules.slice(0, 8).map((module) => `<span class="chip">${module.displayName || module.name || module.id}</span>`).join('')
                  : '<span class="empty-state inline-empty">No modules discovered.</span>'}
              </div>
            </div>
          </div>
          <div class="card panel-box">
            <div class="card-header"><h3>Session overview</h3></div>
            ${sessions.length
              ? `<ul class="mini-list">${sessions.slice(0, 5).map((session) => `<li>${session.username || session.userId || 'Session'} <span>${session.status || 'active'}</span></li>`).join('')}</ul>`
              : '<p class="empty-state">No active sessions recorded.</p>'}
          </div>
        </div>
      </div>
    `;
  }
}

class AdminInfrastructureView {
  constructor(apiClient, kind = 'infrastructure') {
    this.api = apiClient;
    this.kind = kind;
    this.snapshot = {};
  }

  async init(container) {
    this.container = container;
    await this.loadData();
    this.render();
  }

  async loadData() {
    const requests = {
      connections: this.api.get('/api/connections'),
      providers: this.api.get('/api/providers'),
      backups: this.api.get('/api/backups'),
      release: this.api.get('/api/admin/release/status'),
      setup: this.api.get('/api/setup/status'),
      database: this.api.get('/api/database/status'),
      server: this.api.get('/api/server/test')
    };

    const results = await Promise.all(Object.entries(requests).map(([key, promise]) => promise.then((result) => [key, result])));
    const snapshot = {};
    for (const [key, result] of results) {
      if (key === 'connections') {
        snapshot.connections = result.ok && Array.isArray(result.data?.connections) ? result.data.connections : [];
      } else if (key === 'providers') {
        snapshot.providers = result.ok && Array.isArray(result.data?.providers) ? result.data.providers : [];
      } else if (key === 'backups') {
        snapshot.backups = result.ok && Array.isArray(result.data?.backups) ? result.data.backups : [];
      } else if (key === 'release') {
        snapshot.release = result.ok && result.data && result.data.release ? result.data.release : {};
      } else if (key === 'setup') {
        snapshot.setup = result.ok && result.data && result.data.setup ? result.data.setup : {};
      } else if (key === 'database') {
        snapshot.database = result.ok && result.data && result.data.database ? result.data.database : {};
      } else if (key === 'server') {
        snapshot.server = result.ok && result.data && result.data.result ? result.data.result : {};
      }
    }
    this.snapshot = snapshot;
  }

  getTitle() {
    if (this.kind === 'connections') return 'Connections';
    if (this.kind === 'server') return 'Server';
    if (this.kind === 'database') return 'Database';
    if (this.kind === 'updates') return 'Updates & Backup';
    return 'Infrastructure';
  }

  render() {
    if (this.kind === 'connections') {
      this.renderConnections();
      return;
    }
    if (this.kind === 'server') {
      this.renderServer();
      return;
    }
    if (this.kind === 'database') {
      this.renderDatabase();
      return;
    }
    if (this.kind === 'updates') {
      this.renderUpdates();
      return;
    }
    this.renderOverview();
  }

  renderOverview() {
    const connections = this.snapshot.connections || [];
    const providers = this.snapshot.providers || [];
    const backups = this.snapshot.backups || [];
    const release = this.snapshot.release || {};
    const database = this.snapshot.database || {};
    const server = this.snapshot.server || {};

    this.container.innerHTML = `
      <div class="admin-infrastructure-view">
        <div class="section-header">
          <h2>${this.getTitle()}</h2>
        </div>
        <div class="card-grid">
          <div class="card panel-box">
            <div class="card-header"><h3>Release status</h3></div>
            <dl class="detail-list">
              <div><dt>Status</dt><dd>${release.maintenanceMode ? 'Maintenance' : 'Operational'}</dd></div>
              <div><dt>Version</dt><dd>${release.version || '—'}</dd></div>
              <div><dt>Updated</dt><dd>${release.updatedAt || '—'}</dd></div>
            </dl>
          </div>
          <div class="card panel-box">
            <div class="card-header"><h3>Providers</h3></div>
            ${providers.length
              ? `<ul class="mini-list">${providers.map((provider) => `<li>${provider.name || provider.providerId || 'Provider'} <span>${provider.active ? 'active' : 'inactive'}</span></li>`).join('')}</ul>`
              : '<p class="empty-state">No providers configured.</p>'}
          </div>
          <div class="card panel-box">
            <div class="card-header"><h3>Database</h3></div>
            <dl class="detail-list">
              <div><dt>Status</dt><dd>${database.status || 'unknown'}</dd></div>
              <div><dt>Type</dt><dd>${database.type || '—'}</dd></div>
              <div><dt>Name</dt><dd>${database.name || '—'}</dd></div>
            </dl>
          </div>
          <div class="card panel-box">
            <div class="card-header"><h3>Server</h3></div>
            <dl class="detail-list">
              <div><dt>Status</dt><dd>${server.status || 'unknown'}</dd></div>
              <div><dt>Target</dt><dd>${server.serverUrl || server.url || '—'}</dd></div>
              <div><dt>API</dt><dd>${server.apiBase || '—'}</dd></div>
            </dl>
          </div>
        </div>
        <div class="card panel-box">
          <div class="card-header"><h3>Connections</h3></div>
          ${connections.length
            ? `<table class="admin-table"><thead><tr><th>Name</th><th>Type</th><th>Status</th><th>Default</th></tr></thead><tbody>${connections.map((entry) => `
              <tr>
                <td>${entry.connectionId || entry.name || 'Connection'}</td>
                <td>${entry.connectionType || entry.storageType || entry.type || '—'}</td>
                <td>${entry.status || 'unknown'}</td>
                <td>${entry.default ? 'yes' : 'no'}</td>
              </tr>`).join('')}</tbody></table>`
            : '<p class="empty-state">No connections registered.</p>'}
        </div>
        <div class="card panel-box">
          <div class="card-header"><h3>Backups</h3></div>
          ${backups.length
            ? `<ul class="mini-list">${backups.map((backup) => `<li>${backup.label || backup.name || 'Backup'} <span>${backup.status || 'ready'}</span></li>`).join('')}</ul>`
            : '<p class="empty-state">No backups available yet.</p>'}
        </div>
      </div>
    `;
  }

  renderConnections() {
    const connections = this.snapshot.connections || [];
    const providers = this.snapshot.providers || [];
    const primaryConnection = connections[0] || {};
    this.container.innerHTML = `
      <div class="admin-infrastructure-view">
        <div class="section-header">
          <h2>Connections</h2>
        </div>
        <div class="card-grid">
          <div class="card panel-box">
            <div class="card-header"><h3>Active providers</h3></div>
            ${providers.length
              ? `<ul class="mini-list">${providers.map((entry) => `<li>${entry.name || entry.providerId || 'Provider'} <span>${entry.active ? 'active' : 'inactive'}</span></li>`).join('')}</ul>`
              : '<p class="empty-state">No providers configured.</p>'}
          </div>
          <div class="card panel-box">
            <div class="card-header"><h3>Current connection</h3></div>
            <dl class="detail-list">
              <div><dt>Name</dt><dd>${primaryConnection.connectionId || primaryConnection.name || '—'}</dd></div>
              <div><dt>Type</dt><dd>${primaryConnection.connectionType || primaryConnection.storageType || '—'}</dd></div>
              <div><dt>Status</dt><dd>${primaryConnection.status || 'unknown'}</dd></div>
              <div><dt>Default</dt><dd>${primaryConnection.default ? 'yes' : 'no'}</dd></div>
            </dl>
          </div>
        </div>
        <div class="card panel-box">
          <div class="card-header"><h3>Manage connection</h3></div>
          <form id="connection-form" class="admin-form compact-form">
            <div class="form-grid">
              <label>Connection ID<input name="connectionId" value="${this.escape(primaryConnection.connectionId || 'default-connection')}" /></label>
              <label>App ID<input name="appId" value="neutral-app" /></label>
              <label>Type<select name="connectionType"><option value="file">File</option><option value="database">Database</option><option value="api">API</option></select></label>
              <label>Storage Type<select name="storageType"><option value="file">File</option><option value="mysql">MySQL</option><option value="sqlite">SQLite</option></select></label>
              <label>Server URL<input name="serverUrl" value="${this.escape(primaryConnection.serverUrl || '')}" placeholder="https://api.example.com" /></label>
              <label>API Base<input name="apiBase" value="${this.escape(primaryConnection.apiBase || '/api')}" /></label>
              <label>Host<input name="host" value="${this.escape(primaryConnection.host || '')}" /></label>
              <label>Port<input type="number" name="port" value="${this.escape(primaryConnection.port || '')}" /></label>
              <label>Database<input name="databaseName" value="${this.escape(primaryConnection.databaseName || '')}" /></label>
              <label>Username<input name="username" value="${this.escape(primaryConnection.username || '')}" /></label>
              <label>Credential reference<input name="credentialsRef" value="${this.escape(primaryConnection.credentialsRef || '')}" placeholder="env ref or secret key" /></label>
              <label>Auth type<select name="authType"><option value="none">None</option><option value="basic">Basic</option><option value="token">Token</option></select></label>
              <label class="checkbox-label"><input type="checkbox" name="active" ${primaryConnection.active ? 'checked' : ''} /> Active</label>
              <label class="checkbox-label"><input type="checkbox" name="default" ${primaryConnection.default ? 'checked' : ''} /> Default</label>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Save connection</button>
              <button type="button" class="btn btn-secondary" data-action="reload-connections">Reload</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const form = this.container.querySelector('#connection-form');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const payload = {
          connectionId: formData.get('connectionId') || 'default-connection',
          appId: formData.get('appId') || 'neutral-app',
          connectionType: formData.get('connectionType') || 'file',
          storageType: formData.get('storageType') || 'file',
          serverUrl: formData.get('serverUrl') || '',
          apiBase: formData.get('apiBase') || '/api',
          host: formData.get('host') || '',
          port: formData.get('port') || '',
          databaseName: formData.get('databaseName') || '',
          username: formData.get('username') || '',
          credentialsRef: formData.get('credentialsRef') || '',
          authType: formData.get('authType') || 'none',
          active: formData.get('active') === 'on',
          default: formData.get('default') === 'on'
        };
        const result = await this.api.post('/api/connections', payload);
        if (result.ok) {
          this.notify('Connection saved successfully', 'success');
          await this.init(this.container);
        } else {
          this.notify(`Connection save failed: ${result.error || 'Unknown error'}`, 'error');
        }
      });
      const reloadButton = this.container.querySelector('[data-action="reload-connections"]');
      if (reloadButton) {
        reloadButton.addEventListener('click', () => this.init(this.container));
      }
    }
  }

  renderServer() {
    const server = this.snapshot.server || {};
    const setup = this.snapshot.setup || {};
    const currentUrl = setup.serverState?.url || server.serverUrl || window.location.origin || 'http://localhost';
    this.container.innerHTML = `
      <div class="admin-infrastructure-view">
        <div class="section-header">
          <h2>Server</h2>
        </div>
        <div class="card-grid">
          <div class="card panel-box">
            <div class="card-header"><h3>Runtime status</h3></div>
            <dl class="detail-list">
              <div><dt>Status</dt><dd>${server.status || 'unknown'}</dd></div>
              <div><dt>Reachable</dt><dd>${server.reachable === undefined ? '—' : server.reachable ? 'yes' : 'no'}</dd></div>
              <div><dt>Target</dt><dd>${currentUrl}</dd></div>
              <div><dt>API Base</dt><dd>${server.apiBase || setup.serverState?.apiBase || '/api'}</dd></div>
            </dl>
          </div>
          <div class="card panel-box">
            <div class="card-header"><h3>Framework metadata</h3></div>
            <pre class="code-block">${this.safeJson(this.snapshot.setup || {})}</pre>
          </div>
        </div>
        <div class="card panel-box">
          <div class="card-header"><h3>Test server endpoint</h3></div>
          <form id="server-form" class="admin-form compact-form">
            <div class="form-grid">
              <label>Server URL<input name="serverUrl" value="${this.escape(currentUrl)}" /></label>
              <label>API Base<input name="apiBase" value="${this.escape(server.apiBase || setup.serverState?.apiBase || '/api')}" /></label>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Test server</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const form = this.container.querySelector('#server-form');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const payload = {
          serverUrl: formData.get('serverUrl') || currentUrl,
          apiBase: formData.get('apiBase') || '/api'
        };
        const result = await this.api.post('/api/server/test', payload);
        const response = result.ok && result.data && result.data.result ? result.data.result : result.data || {};
        if (result.ok) {
          this.notify(`Server test result: ${response.status || 'ready'}`, 'success');
          await this.init(this.container);
        } else {
          this.notify(`Server test failed: ${result.error || response.message || 'Unknown error'}`, 'error');
        }
      });
    }
  }

  renderDatabase() {
    const database = this.snapshot.database || {};
    const setup = this.snapshot.setup || {};
    const dbConfig = setup.databaseState || setup.database || {};
    this.container.innerHTML = `
      <div class="admin-infrastructure-view">
        <div class="section-header">
          <h2>Database</h2>
        </div>
        <div class="card-grid">
          <div class="card panel-box">
            <div class="card-header"><h3>Current database status</h3></div>
            <dl class="detail-list">
              <div><dt>Status</dt><dd>${database.status || 'unknown'}</dd></div>
              <div><dt>Type</dt><dd>${database.type || dbConfig.type || 'mysql'}</dd></div>
              <div><dt>Host</dt><dd>${database.host || dbConfig.host || '—'}</dd></div>
              <div><dt>Name</dt><dd>${database.name || dbConfig.name || '—'}</dd></div>
              <div><dt>Username</dt><dd>${database.username || dbConfig.username || '—'}</dd></div>
            </dl>
          </div>
          <div class="card panel-box">
            <div class="card-header"><h3>Setup state</h3></div>
            <pre class="code-block">${this.safeJson(dbConfig)}</pre>
          </div>
        </div>
        <div class="card panel-box">
          <div class="card-header"><h3>Test database configuration</h3></div>
          <form id="database-form" class="admin-form compact-form">
            <div class="form-grid">
              <label>Type<select name="type"><option value="mysql" ${((dbConfig.type || database.type || 'mysql') === 'mysql') ? 'selected' : ''}>MySQL</option><option value="sqlite" ${(dbConfig.type === 'sqlite') ? 'selected' : ''}>SQLite</option><option value="postgresql" ${(dbConfig.type === 'postgresql') ? 'selected' : ''}>PostgreSQL</option></select></label>
              <label>Host<input name="host" value="${this.escape(dbConfig.host || database.host || '')}" /></label>
              <label>Port<input type="number" name="port" value="${this.escape(dbConfig.port || database.port || 3306)}" /></label>
              <label>Name<input name="name" value="${this.escape(dbConfig.name || database.name || '')}" /></label>
              <label>Username<input name="username" value="${this.escape(dbConfig.username || database.username || '')}" /></label>
              <label>Credential reference<input name="credentialsRef" value="" placeholder="Prefer a credential reference instead of plain text" /></label>
              <label>Password<input type="password" name="password" value="" placeholder="Only when needed for live test" /></label>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Test database</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const form = this.container.querySelector('#database-form');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const payload = {
          type: formData.get('type') || 'mysql',
          host: formData.get('host') || '',
          port: Number(formData.get('port') || 3306),
          name: formData.get('name') || '',
          username: formData.get('username') || '',
          password: formData.get('password') || '',
          credentialsRef: formData.get('credentialsRef') || ''
        };
        const result = await this.api.post('/api/database/status', payload);
        if (result.ok) {
          this.notify('Database test passed successfully', 'success');
          await this.init(this.container);
        } else {
          this.notify(`Database configuration failed: ${result.error || 'Unknown error'}`, 'error');
        }
      });
    }
  }

  renderUpdates() {
    const backups = this.snapshot.backups || [];
    const release = this.snapshot.release || {};
    this.container.innerHTML = `
      <div class="admin-infrastructure-view">
        <div class="section-header">
          <h2>Updates & Backup</h2>
        </div>
        <div class="card-grid">
          <div class="card panel-box">
            <div class="card-header"><h3>Release</h3></div>
            <dl class="detail-list">
              <div><dt>Status</dt><dd>${release.maintenanceMode ? 'Maintenance mode' : 'Operational'}</dd></div>
              <div><dt>Version</dt><dd>${release.version || '—'}</dd></div>
              <div><dt>Updated</dt><dd>${release.updatedAt || '—'}</dd></div>
            </dl>
          </div>
          <div class="card panel-box">
            <div class="card-header"><h3>Maintenance state</h3></div>
            <form id="maintenance-form" class="admin-form compact-form">
              <label class="checkbox-label"><input type="checkbox" name="maintenanceMode" ${release.maintenanceMode ? 'checked' : ''} /> Enable maintenance mode</label>
              <label>Reason<input name="reason" value="${this.escape(release.reason || '')}" placeholder="Optional maintenance reason" /></label>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary">Apply</button>
              </div>
            </form>
          </div>
        </div>
        <div class="card panel-box">
          <div class="card-header"><h3>Backups</h3></div>
          ${backups.length ? `<ul class="mini-list">${backups.map((backup) => `<li>${backup.label || backup.name || 'Backup'} <span>${backup.status || 'ready'}</span></li>`).join('')}</ul>` : '<p class="empty-state">No backups available yet.</p>'}
          <form id="backup-form" class="admin-form compact-form">
            <div class="form-grid">
              <label>Backup label<input name="label" value="" placeholder="Daily database snapshot" /></label>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Create backup</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const maintenanceForm = this.container.querySelector('#maintenance-form');
    if (maintenanceForm) {
      maintenanceForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(maintenanceForm);
        const payload = { maintenanceMode: formData.get('maintenanceMode') === 'on', reason: formData.get('reason') || '' };
        const result = await this.api.post('/api/admin/release/maintenance', payload);
        if (result.ok) {
          this.notify('Maintenance state updated', 'success');
          await this.init(this.container);
        } else {
          this.notify(`Maintenance update failed: ${result.error || 'Unknown error'}`, 'error');
        }
      });
    }

    const backupForm = this.container.querySelector('#backup-form');
    if (backupForm) {
      backupForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(backupForm);
        const payload = { label: formData.get('label') || `backup-${new Date().toISOString()}` };
        const result = await this.api.post('/api/backups', payload);
        if (result.ok) {
          this.notify('Backup created', 'success');
          await this.init(this.container);
        } else {
          this.notify(`Backup creation failed: ${result.error || 'Unknown error'}`, 'error');
        }
      });
    }
  }

  notify(message, type = 'info') {
    if (window.AdminCommon && typeof window.AdminCommon.showAlert === 'function') {
      window.AdminCommon.showAlert(message, type);
      return;
    }
    if (typeof alert === 'function') {
      alert(message);
    }
  }

  escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  safeJson(data) {
    try {
      return JSON.stringify(data || {}, null, 2);
    } catch {
      return '[]';
    }
  }
}

class AdminDiagnosticsView {
  constructor(apiClient) {
    this.api = apiClient;
  }

  async init(container) {
    this.container = container;
    const [healthResult, frameworkResult] = await Promise.all([
      this.api.get('/api/admin/system/health'),
      this.api.get('/api/framework')
    ]);

    this.snapshot = {
      health: healthResult.ok && healthResult.data && healthResult.data.health ? healthResult.data.health : {},
      framework: frameworkResult.ok && frameworkResult.data && frameworkResult.data.framework ? frameworkResult.data.framework : {}
    };
    this.render();
  }

  render() {
    const health = this.snapshot?.health || {};
    const framework = this.snapshot?.framework || {};
    const detailEntries = [
      ['Status', health.status || health.state || 'unknown'],
      ['Runtime', health.runtime || framework.runtime || 'PHP'],
      ['Environment', health.environment || framework.environment || 'production'],
      ['Memory', health.memory || framework.memory || 'N/A'],
      ['Disk', health.disk || framework.disk || 'N/A'],
      ['Modules', String(framework.modulesCount || framework.moduleCount || 0)],
      ['Apps', String(framework.appsCount || framework.appCount || 0)]
    ];

    this.container.innerHTML = `
      <div class="admin-diagnostics-view">
        <div class="section-header">
          <h2>Diagnostics</h2>
        </div>
        <div class="card-grid">
          <div class="card panel-box">
            <div class="card-header"><h3>System check</h3></div>
            <dl class="detail-list">
              ${detailEntries.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}
            </dl>
          </div>
          <div class="card panel-box">
            <div class="card-header"><h3>Framework summary</h3></div>
            <pre class="code-block">${JSON.stringify(framework, null, 2)}</pre>
          </div>
        </div>
      </div>
    `;
  }
}

class AdminRouter {
  constructor(apiClient) {
    this.api = apiClient;
    this.currentView = null;
    this.views = {
      users: new AdminUsersView(apiClient),
      roles: new AdminRolesView(apiClient),
      permissions: new AdminPermissionsView(apiClient),
      sessions: new AdminSessionsView(apiClient),
      settings: new AdminSettingsView(apiClient),
      audit: new AdminAuditView(apiClient),
      modules: new AdminModulesView(apiClient),
      dashboard: new AdminDashboardView(apiClient),
      updates: new AdminInfrastructureView(apiClient, 'updates'),
      infrastructure: new AdminInfrastructureView(apiClient, 'infrastructure'),
      connections: new AdminInfrastructureView(apiClient, 'connections'),
      server: new AdminInfrastructureView(apiClient, 'server'),
      database: new AdminInfrastructureView(apiClient, 'database'),
      diagnostics: new AdminDiagnosticsView(apiClient),
      theme: new AdminSettingsView(apiClient)
    };
  }

  async init(container) {
    this.container = container;
    this.renderLayout();
    this.setupNavigation();
    await this.showView('dashboard');
    const initial = this.container.querySelector('.nav-link[data-view="dashboard"]');
    if (initial) {
      initial.classList.add('active');
    }
  }

  renderLayout() {
    this.container.innerHTML = `
      <div class="admin-panel">
        <section class="admin-content">
          <header class="admin-header">
            <div class="admin-header-main">
              <div class="breadcrumb">
                <span id="breadcrumb-text">Dashboard</span>
              </div>
              <nav class="admin-top-nav" aria-label="Admin navigation">
                <button type="button" class="nav-link active" data-view="dashboard">Dashboard</button>
                <button type="button" class="nav-link" data-view="users">Users</button>
                <button type="button" class="nav-link" data-view="roles">Roles</button>
                <button type="button" class="nav-link" data-view="permissions">Permissions</button>
                <button type="button" class="nav-link" data-view="sessions">Sessions</button>
                <button type="button" class="nav-link" data-view="modules">Modules</button>
                <button type="button" class="nav-link" data-view="settings">Settings</button>
                <button type="button" class="nav-link" data-view="theme">Theme</button>
                <button type="button" class="nav-link" data-view="connections">Connections</button>
                <button type="button" class="nav-link" data-view="server">Server</button>
                <button type="button" class="nav-link" data-view="database">Database</button>
                <button type="button" class="nav-link" data-view="diagnostics">Diagnostics</button>
                <button type="button" class="nav-link" data-view="audit">Audit Log</button>
                <button type="button" class="nav-link" data-view="updates">Updates</button>
              </nav>
            </div>
            <div class="admin-header-tools">
              <span class="admin-user-info" id="current-user">Admin</span>
              <button class="btn btn-sm btn-secondary" onclick="adminRouter.logout()">Logout</button>
            </div>
          </header>

          <main class="admin-main" id="admin-main"></main>
        </section>
      </div>
    `;
    this.injectStyles();
  }

  setupNavigation() {
    const navLinks = this.container.querySelectorAll('.nav-link');
    navLinks.forEach((link) => {
      link.addEventListener('click', async (event) => {
        event.preventDefault();
        const viewName = link.dataset.view;
        await this.showView(viewName);
        navLinks.forEach((item) => item.classList.remove('active'));
        link.classList.add('active');
      });
    });
  }

  async showView(viewName) {
    const view = this.views[viewName];
    if (!view) {
      return;
    }
    const mainContainer = document.getElementById('admin-main');
    const breadcrumbText = document.getElementById('breadcrumb-text');
    if (breadcrumbText) {
      breadcrumbText.textContent = this.formatViewName(viewName);
    }
    await view.init(mainContainer);
    this.currentView = viewName;
  }

  formatViewName(name) {
    const names = {
      users: 'User Management',
      roles: 'Role Management',
      permissions: 'Permission Catalog',
      sessions: 'Session Overview',
      audit: 'Audit Log',
      settings: 'System Settings',
      theme: 'Theme & Layout',
      dashboard: 'Dashboard',
      modules: 'Module Administration',
      updates: 'Updates',
      infrastructure: 'Backup / Infrastructure',
      connections: 'Connections',
      server: 'Server',
      database: 'Database',
      diagnostics: 'Diagnostics'
    };
    return names[name] || name;
  }

  logout() {
    if (confirm('Logout now?')) {
      window.location.href = '/';
    }
  }

  injectStyles() {
    if (document.getElementById('admin-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'admin-styles';
    style.textContent = `
      .admin-panel { display: flex; min-height: calc(100vh - 40px); background: #f6f8fc; }
      .admin-content { display: flex; flex: 1; flex-direction: column; min-width: 0; }
      .admin-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 24px; background: #fff; border-bottom: 1px solid #e2e8f0; }
      .admin-header-main { display: flex; flex: 1; flex-direction: column; gap: 12px; min-width: 0; }
      .breadcrumb { font-weight: 700; color: #0f172a; }
      .admin-top-nav { display: flex; flex-wrap: wrap; gap: 8px; }
      .nav-link { display: inline-flex; align-items: center; justify-content: center; padding: 8px 12px; border-radius: 999px; border: 1px solid transparent; background: #f1f5f9; color: #0f172a; text-decoration: none; font-weight: 600; cursor: pointer; }
      .nav-link:hover, .nav-link.active { background: rgba(37, 99, 235, 0.12); border-color: rgba(37, 99, 235, 0.2); color: #1d4ed8; }
      .admin-header-tools { display: flex; align-items: center; gap: 12px; }
      .admin-user-info { color: #475569; font-weight: 600; }
      .admin-main { padding: 22px 24px; overflow: auto; }
      .admin-placeholder p { color: #475569; max-width: 760px; }
      .permission-list { display: flex; flex-wrap: wrap; gap: 8px; }
      .inline-form { display: grid; grid-template-columns: 1.5fr 1fr 1fr auto auto; gap: 8px; margin-bottom: 14px; }
      .inline-form input,.inline-form select { padding: 8px; border: 1px solid #cbd5e1; border-radius: 8px; }
      .badge { display: inline-flex; border-radius: 999px; padding: 3px 8px; font-size: .75rem; font-weight: 700; }
      .badge-active { background: #dcfce7; color: #166534; }
      .badge-inactive { background: #fee2e2; color: #991b1b; }
      .badge-pending { background: #fef3c7; color: #92400e; }
      .badge-archived { background: #e2e8f0; color: #334155; }
      .chip { display: inline-flex; padding: 6px 10px; border-radius: 999px; background: #e0e7ff; color: #1e3a8a; font-weight: 600; font-size: .8rem; }
      .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 18px; }
      .stat-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04); }
      .stat-label { display: block; color: #64748b; font-size: .8rem; margin-bottom: 6px; }
      .stat-value { display: block; font-size: 1.65rem; }
      .stat-value.ok { color: #0f766e; }
      .stat-value.warn { color: #b45309; }
      .stat-value.neutral { color: #1d4ed8; }
      .card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 18px; }
      .panel-box { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04); }
      .card-header { margin-bottom: 12px; }
      .card-header h3 { margin: 0; font-size: 1rem; }
      .detail-list { display: grid; gap: 10px; margin: 0; }
      .detail-list div { display: grid; grid-template-columns: minmax(90px, 130px) 1fr; gap: 8px; }
      .detail-list dt { color: #64748b; font-weight: 600; }
      .detail-list dd { margin: 0; color: #0f172a; }
      .mini-list { margin: 0; padding-left: 1.2rem; display: grid; gap: 6px; }
      .mini-list li { display: flex; justify-content: space-between; gap: 8px; }
      .mini-list li span { color: #64748b; }
      .chip-list { display: flex; gap: 8px; flex-wrap: wrap; }
      .inline-empty { display: inline-flex; }
      .code-block { margin: 0; padding: 12px; border-radius: 8px; background: #0f172a; color: #e2e8f0; overflow: auto; font-size: .75rem; }
      @media (max-width: 980px) {
        .admin-header { flex-direction: column; align-items: flex-start; }
        .admin-header-main { width: 100%; }
        .admin-top-nav { width: 100%; }
        .inline-form { grid-template-columns: 1fr; }
      }
      @media (max-width: 640px) {
        .admin-main { padding: 18px 16px; }
        .admin-header { padding: 14px 16px; }
        .nav-link { width: 100%; }
        .admin-top-nav { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); }
      }
    `;
    document.head.appendChild(style);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminRouter;
}
