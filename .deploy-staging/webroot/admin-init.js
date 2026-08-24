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
          typeof AdminRouter === 'undefined') {
        console.error('Admin components not loaded');
        return;
      }

      // Get the current user role from the UI
      const roleElement = document.getElementById('summaryRoleBadge');
      const userRole = roleElement ? roleElement.textContent.toLowerCase() : 'admin';

      // Initialize API client with auth
      const apiClient = new ApiClient('http://localhost:3000');
      apiClient.setAuthRole(userRole);

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
