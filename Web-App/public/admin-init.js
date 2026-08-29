'use strict';

/* Admin router starts once, only after master-ui confirms the server session. */
(() => {
  let initialization = null;

  const dependenciesReady = () => [
    window.ApiClient, window.AdminCommon, window.AdminUsersView, window.AdminRolesView,
    window.AdminSettingsView, window.AdminAuditView, window.AdminModulesView, window.AdminRouter
  ].every(Boolean);

  const resolveBase = () => {
    const pathname = window.location && typeof window.location.pathname === 'string' ? window.location.pathname : '/';
    const basePath = pathname.replace(/\/[^/]*$/, '');
    return basePath === '/' ? '' : basePath.replace(/\/+$/, '');
  };

  const initialize = () => {
    if (document.body.dataset.page !== 'admin') return Promise.resolve(false);
    if (initialization) return initialization;
    initialization = Promise.resolve().then(async () => {
      const appShell = document.getElementById('appShell');
      if (!appShell || appShell.classList.contains('hidden') || !dependenciesReady()) return false;

      const apiClient = new window.ApiClient(resolveBase());
      const roleElement = document.getElementById('summaryRoleBadge');
      apiClient.setAuthRole(roleElement ? roleElement.textContent.toLowerCase() : 'admin');
      let container = document.getElementById('adminPanel');
      if (!container) {
        container = document.createElement('div');
        container.id = 'adminPanel';
        const main = document.getElementById('mainContent');
        if (main && main.parentNode) main.parentNode.replaceChild(container, main);
        else document.body.appendChild(container);
      }
      window.adminRouter = new window.AdminRouter(apiClient);
      await window.adminRouter.init(container);
      Object.assign(window, {
        adminUsers: window.adminRouter.views.users,
        adminRoles: window.adminRouter.views.roles,
        adminSettings: window.adminRouter.views.settings,
        adminAudit: window.adminRouter.views.audit,
        adminModules: window.adminRouter.views.modules
      });
      if (window.CorePerformance) window.CorePerformance.mark('admin-router-ready');
      return true;
    }).finally(() => {
      if (!window.adminRouter) initialization = null;
    });
    return initialization;
  };

  window.addEventListener('neutral:auth-ready', initialize, { once: true });
  if (document.readyState !== 'loading') initialize();
  else document.addEventListener('DOMContentLoaded', initialize, { once: true });
})();
