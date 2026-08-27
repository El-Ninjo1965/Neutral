'use strict';

/**
 * Admin Panel Initialization
 * Loads and initializes the admin panel components when the admin page is ready
 */

(function() {
  // Wait for DOM and dependencies to be ready
  const initAdminPanel = async () => {
    // Check if we're on the admin page
    const pageType = document.body.dataset.page;
    if (pageType !== 'admin') {
      return; // Not an admin page, skip
    }

    // Wait for user to be authenticated
    const waitForAuth = () => {
      return new Promise((resolve) => {
        const checkAuth = setInterval(() => {
          const authPanel = document.getElementById('authPanel');
          const appShell = document.getElementById('appShell');
          
          // Check if auth panel is hidden (meaning user is authenticated)
          if (authPanel && authPanel.classList.contains('hidden') && appShell && !appShell.classList.contains('hidden')) {
            clearInterval(checkAuth);
            resolve();
          }
        }, 100);
        
        // Timeout after 30 seconds
        setTimeout(() => {
          clearInterval(checkAuth);
          resolve();
        }, 30000);
      });
    };

    // Initialize admin panel
    const initWhenReady = async () => {
      await waitForAuth();
      
      // Verify we have ApiClient
      if (typeof ApiClient === 'undefined') {
        console.error('ApiClient not loaded');
        return;
      }

      // Verify we have admin components
      if (typeof AdminCommon === 'undefined' || typeof AdminUsersView === 'undefined' || 
          typeof AdminRolesView === 'undefined' || typeof AdminSettingsView === 'undefined' ||
          typeof AdminAuditView === 'undefined' || typeof AdminModulesView === 'undefined' ||
          typeof AdminRouter === 'undefined') {
        console.error('Admin components not loaded');
        return;
      }

      // Get the current user role from the UI
      const roleElement = document.getElementById('summaryRoleBadge');
      const userRole = roleElement ? roleElement.textContent.toLowerCase() : 'admin';

      // Initialize API client using the current deployment base path so /api resolves correctly on nested installs.
      const currentOrigin = (window.location && window.location.origin && window.location.origin !== 'null')
        ? window.location.origin.replace(/\/+$/, '')
        : (window.location && window.location.protocol && window.location.hostname)
          ? `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`.replace(/\/+$/, '')
          : '';
      const pathname = window.location && typeof window.location.pathname === 'string'
        ? window.location.pathname
        : '/';
      const basePath = pathname.replace(/\/[^/]*$/, '');
      const normalizedBasePath = basePath === '/' ? '' : basePath.replace(/\/+$/, '');
      const apiClient = new ApiClient(`${currentOrigin}${normalizedBasePath}`);
      apiClient.setAuthRole(userRole);

      const statusResult = await apiClient.getStatus();
      const environment = statusResult && statusResult.ok && statusResult.data
        ? String(statusResult.data.environment || 'production')
        : 'production';
      if (environment !== 'production') {
        apiClient.setAuthToken('neutral-dev-token');
      }

      const meResult = await apiClient.me();
      const meData = typeof apiClient.extractEnvelopeData === 'function'
        ? apiClient.extractEnvelopeData(meResult)
        : null;
      const hasAuthenticatedContext = !!(
        meResult.ok &&
        meData &&
        (meData.user || (Array.isArray(meData.roles) && meData.roles.length > 0))
      );
      if (!hasAuthenticatedContext) {
        const authMessage = document.getElementById('authMessage');
        const authPanel = document.getElementById('authPanel');
        const appShell = document.getElementById('appShell');
        if (authMessage) {
          authMessage.className = 'message error';
          authMessage.textContent = 'Server session missing. Please sign in again.';
        }
        if (authPanel) {
          authPanel.classList.remove('hidden');
        }
        if (appShell) {
          appShell.classList.add('hidden');
        }
        return;
      }

      // Create the admin router
      window.adminRouter = new AdminRouter(apiClient);

      // Find or create admin panel container
      let adminContainer = document.getElementById('adminPanel');
      if (!adminContainer) {
        adminContainer = document.createElement('div');
        adminContainer.id = 'adminPanel';
        
        // Get the main content area
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
          // Replace main content with admin panel
          mainContent.innerHTML = '';
          mainContent.parentNode.replaceChild(adminContainer, mainContent);
        } else {
          // Fallback: append to body
          document.body.appendChild(adminContainer);
        }
      }

      // Initialize the admin router with the container
      await window.adminRouter.init(adminContainer);

      // Make views globally accessible for onclick handlers
      window.adminUsers = window.adminRouter.views.users;
      window.adminRoles = window.adminRouter.views.roles;
      window.adminSettings = window.adminRouter.views.settings;
      window.adminAudit = window.adminRouter.views.audit;
      window.adminModules = window.adminRouter.views.modules;
    };

    // Check if document is already ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initWhenReady);
    } else {
      // Small delay to ensure all scripts are loaded
      setTimeout(initWhenReady, 500);
    }
  };

  // Start initialization
  initAdminPanel();
})();
