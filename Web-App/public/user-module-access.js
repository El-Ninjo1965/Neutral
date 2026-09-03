'use strict';

(() => {
  const normalizePermissions = (value) => Array.isArray(value)
    ? value.map((entry) => String(entry || '').trim()).filter(Boolean)
    : [];

  const isActive = (module) => !!module && (
    module.active === true
    || module.enabled === true
    || ['active', 'enabled'].includes(String(module.status || '').toLowerCase())
    || String(module.lifecycleState || '').toUpperCase() === 'ACTIVE'
  );

  const isVisible = (module, currentUser) => {
    if (!module || !module.id || !isActive(module)) {
      return false;
    }

    if (!currentUser) {
      const clientAccess = module.clientAccess;
      return !!clientAccess
        && clientAccess.mode === 'anonymous'
        && clientAccess.canView === true;
    }

    const required = normalizePermissions(module.access && module.access.visibilityPermissions);
    if (required.length === 0) {
      return true;
    }
    const effective = normalizePermissions(currentUser.permissions);
    return effective.includes('admin.write') || required.some((permission) => effective.includes(permission));
  };

  const visibleModules = (modules, options = {}) => {
    const list = Array.isArray(modules) ? modules : [];
    const currentUser = options.currentUser || null;
    const selected = Array.isArray(options.visibleModuleIds)
      ? new Set(options.visibleModuleIds.map(String))
      : null;

    return list.filter((module) => isVisible(module, currentUser))
      .filter((module) => !selected || selected.has(String(module.id)));
  };

  const findVisibleModule = (modules, moduleId, options = {}) => visibleModules(modules, options)
    .find((module) => String(module.id) === String(moduleId)) || null;

  const api = Object.freeze({ isActive, isVisible, visibleModules, findVisibleModule });

  if (typeof window !== 'undefined') {
    window.NeutralUserModuleAccess = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();

