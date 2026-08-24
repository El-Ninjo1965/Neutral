(() => {
  'use strict';

  const DEFAULT_THEME = Object.freeze({
    id: 'neutral-theme',
    name: 'Neutral Theme',
    description: 'Default neutral framework theme.',
    config: {
      accent: '#176b52',
      accentSoft: '#dfece6',
      background: '#f5f7f3',
      surface: '#ffffff',
      text: '#17211d',
      muted: '#5d6d67'
    }
  });

  const themes = new Map();
  let activeThemeId = DEFAULT_THEME.id;

  const asPlainObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);

  const normalizeTheme = (theme) => {
    if (!asPlainObject(theme)) {
      throw new TypeError('Theme definition must be an object.');
    }

    const id = typeof theme.id === 'string' && theme.id.trim() ? theme.id.trim() : DEFAULT_THEME.id;
    const normalized = {
      id,
      name: typeof theme.name === 'string' && theme.name.trim() ? theme.name.trim() : id,
      description: typeof theme.description === 'string' ? theme.description : '',
      config: asPlainObject(theme.config) ? { ...theme.config } : { ...DEFAULT_THEME.config },
      active: !!theme.active
    };

    normalized.config = {
      ...DEFAULT_THEME.config,
      ...normalized.config
    };

    return normalized;
  };

  const applyCssVariables = (theme) => {
    if (!document || !document.documentElement) {
      return theme;
    }

    const root = document.documentElement;
    const config = theme && asPlainObject(theme.config) ? theme.config : DEFAULT_THEME.config;

    Object.entries(config).forEach(([key, value]) => {
      const cssKey = key.startsWith('--') ? key : `--${key}`;
      root.style.setProperty(cssKey, String(value));
    });

    if (document.body) {
      document.body.setAttribute('data-theme', theme.id);
      document.body.dataset.theme = theme.id;
    }

    return theme;
  };

  const ThemeEngine = {
    registerTheme(themeDefinition) {
      const theme = normalizeTheme(themeDefinition);
      themes.set(theme.id, theme);
      if (theme.active) {
        this.activateTheme(theme.id);
      }
      return this.getTheme(theme.id);
    },

    getTheme(themeId) {
      const normalized = typeof themeId === 'string' && themeId.trim() ? themeId.trim() : DEFAULT_THEME.id;
      return themes.get(normalized) || themes.get(DEFAULT_THEME.id) || null;
    },

    listThemes() {
      return Array.from(themes.values()).map((theme) => ({ ...theme, config: { ...theme.config } }));
    },

    activateTheme(themeId) {
      const theme = this.getTheme(themeId);
      if (!theme) {
        throw new Error(`Theme not found: ${themeId}`);
      }

      activeThemeId = theme.id;
      theme.active = true;
      for (const entry of themes.values()) {
        if (entry.id !== theme.id) {
          entry.active = false;
        }
      }

      applyCssVariables(theme);
      if (window && typeof window.dispatchEvent === 'function') {
        const event = typeof CustomEvent === 'function'
          ? new CustomEvent('theme:changed', { detail: { themeId: theme.id, theme } })
          : { type: 'theme:changed', detail: { themeId: theme.id, theme } };
        window.dispatchEvent(event);
      }

      return { ...theme, config: { ...theme.config } };
    },

    getCurrentTheme() {
      return this.getTheme(activeThemeId) || this.getTheme(DEFAULT_THEME.id);
    },

    initialize() {
      if (!themes.has(DEFAULT_THEME.id)) {
        themes.set(DEFAULT_THEME.id, normalizeTheme(DEFAULT_THEME));
      }
      return this.activateTheme(DEFAULT_THEME.id);
    }
  };

  themes.set(DEFAULT_THEME.id, normalizeTheme(DEFAULT_THEME));

  if (!window.ThemeEngine) {
    window.ThemeEngine = ThemeEngine;
  }

  if (window && window.Core) {
    window.Core.emit('theme:initialized', {
      currentTheme: ThemeEngine.getCurrentTheme().id,
      availableThemes: ThemeEngine.listThemes().length
    });
  }
})();
