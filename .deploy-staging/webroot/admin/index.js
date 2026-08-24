'use strict';

/**
 * Admin Panel Main Router
 * Manages navigation between admin views
 */

class AdminRouter {
  constructor(apiClient) {
    this.api = apiClient;
    this.currentView = null;
    this.views = {
      users: new AdminUsersView(apiClient),
      roles: new AdminRolesView(apiClient),
      settings: new AdminSettingsView(apiClient)
    };
  }

  // Initialize admin panel
  async init(container) {
    this.container = container;
    this.renderLayout();
    this.setupNavigation();
    
    // Load and display users view by default
    await this.showView('users');
  }

  // Render main layout
  renderLayout() {
    this.container.innerHTML = `
      <div class="admin-panel">
        <div class="admin-sidebar">
          <div class="admin-logo">
            <h1>Admin Panel</h1>
          </div>
          <nav class="admin-nav">
            <ul>
              <li><a href="#" class="nav-link" data-view="users">
                <span class="icon">👥</span> Users
              </a></li>
              <li><a href="#" class="nav-link" data-view="roles">
                <span class="icon">🔐</span> Roles
              </a></li>
              <li><a href="#" class="nav-link" data-view="settings">
                <span class="icon">⚙️</span> Settings
              </a></li>
            </ul>
          </nav>
          <div class="admin-footer">
            <button class="btn btn-sm btn-secondary" onclick="adminRouter.logout()">Logout</button>
          </div>
        </div>

        <div class="admin-content">
          <div class="admin-header">
            <div class="breadcrumb">
              <span id="breadcrumb-text">Dashboard</span>
            </div>
            <div class="admin-user-info">
              <span id="current-user">Admin</span>
            </div>
          </div>

          <div class="admin-main" id="admin-main">
            <!-- Views will be loaded here -->
          </div>
        </div>
      </div>
    `;

    // Add admin styles
    this.injectStyles();
  }

  // Setup navigation handlers
  setupNavigation() {
    const navLinks = this.container.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const viewName = link.dataset.view;
        this.showView(viewName);
        
        // Update active nav item
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
    });
  }

  // Show a view
  async showView(viewName) {
    if (!this.views[viewName]) {
      console.error(`View ${viewName} not found`);
      return;
    }

    const view = this.views[viewName];
    const mainContainer = document.getElementById('admin-main');
    
    // Update breadcrumb
    const breadcrumbText = document.getElementById('breadcrumb-text');
    if (breadcrumbText) {
      breadcrumbText.textContent = this.formatViewName(viewName);
    }

    // Initialize view
    await view.init(mainContainer);
    this.currentView = viewName;
  }

  // Format view name for display
  formatViewName(name) {
    const names = {
      users: 'User Management',
      roles: 'Role Management',
      settings: 'System Settings'
    };
    return names[name] || name;
  }

  // Logout
  logout() {
    if (confirm('Are you sure you want to logout?')) {
      window.location.href = '/';
    }
  }

  // Inject admin styles
  injectStyles() {
    if (document.getElementById('admin-styles')) return;

    const style = document.createElement('style');
    style.id = 'admin-styles';
    style.textContent = `
      .admin-panel {
        display: flex;
        height: 100vh;
        background-color: #f5f5f5;
      }

      .admin-sidebar {
        width: 250px;
        background-color: #2c3e50;
        color: white;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .admin-logo {
        padding: 20px;
        border-bottom: 1px solid #34495e;
      }

      .admin-logo h1 {
        margin: 0;
        font-size: 1.3em;
      }

      .admin-nav {
        flex: 1;
        padding: 20px 0;
      }

      .admin-nav ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .admin-nav li {
        margin: 0;
      }

      .nav-link {
        display: flex;
        align-items: center;
        padding: 12px 20px;
        color: #bdc3c7;
        text-decoration: none;
        transition: all 0.3s ease;
      }

      .nav-link:hover,
      .nav-link.active {
        background-color: #34495e;
        color: white;
        border-left: 3px solid #3498db;
      }

      .nav-link .icon {
        margin-right: 10px;
        font-size: 1.2em;
      }

      .admin-footer {
        padding: 20px;
        border-top: 1px solid #34495e;
      }

      .admin-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .admin-header {
        background-color: white;
        padding: 15px 30px;
        border-bottom: 1px solid #ddd;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .breadcrumb {
        font-size: 1.2em;
        font-weight: 500;
        color: #2c3e50;
      }

      .admin-user-info {
        color: #7f8c8d;
        font-size: 0.9em;
      }

      .admin-main {
        flex: 1;
        overflow-y: auto;
        padding: 30px;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 2px solid #ecf0f1;
      }

      .section-header h2 {
        margin: 0;
        color: #2c3e50;
      }

      /* Table Styles */
      .admin-table {
        width: 100%;
        border-collapse: collapse;
        background-color: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }

      .admin-table th {
        background-color: #34495e;
        color: white;
        padding: 12px;
        text-align: left;
        font-weight: 600;
      }

      .admin-table td {
        padding: 12px;
        border-bottom: 1px solid #ecf0f1;
      }

      .admin-table tr:hover {
        background-color: #f9f9f9;
      }

      .action-buttons {
        display: flex;
        gap: 8px;
      }

      /* Form Styles */
      .admin-form {
        background-color: white;
        padding: 20px;
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }

      .admin-form h3 {
        margin-top: 0;
        color: #2c3e50;
      }

      .form-group {
        margin-bottom: 15px;
      }

      .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: #2c3e50;
      }

      .form-group input,
      .form-group select,
      .form-group textarea {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #bdc3c7;
        border-radius: 4px;
        font-size: 1em;
        font-family: inherit;
      }

      .form-group input:focus,
      .form-group select:focus,
      .form-group textarea:focus {
        outline: none;
        border-color: #3498db;
        box-shadow: 0 0 5px rgba(52, 152, 219, 0.3);
      }

      .form-group small {
        display: block;
        margin-top: 4px;
        color: #7f8c8d;
        font-size: 0.9em;
      }

      .form-actions {
        display: flex;
        gap: 10px;
        margin-top: 20px;
      }

      /* Badge Styles */
      .badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 3px;
        font-size: 0.85em;
        font-weight: 500;
      }

      .badge-admin { background-color: #e74c3c; color: white; }
      .badge-developer { background-color: #3498db; color: white; }
      .badge-user { background-color: #2ecc71; color: white; }
      .badge-viewer { background-color: #95a5a6; color: white; }

      .badge-active { background-color: #27ae60; color: white; }
      .badge-inactive { background-color: #95a5a6; color: white; }
      .badge-pending { background-color: #f39c12; color: white; }
      .badge-archived { background-color: #7f8c8d; color: white; }

      /* Alert Styles */
      .alert {
        padding: 15px 20px;
        margin-bottom: 15px;
        border-radius: 4px;
        border-left: 4px solid;
      }

      .alert-success {
        background-color: #d4edda;
        border-left-color: #28a745;
        color: #155724;
      }

      .alert-error {
        background-color: #f8d7da;
        border-left-color: #dc3545;
        color: #721c24;
      }

      .alert-info {
        background-color: #d1ecf1;
        border-left-color: #17a2b8;
        color: #0c5460;
      }

      .alert .close {
        float: right;
        background: none;
        border: none;
        font-size: 1.5em;
        cursor: pointer;
        opacity: 0.7;
      }

      .alert .close:hover {
        opacity: 1;
      }

      /* Button Styles */
      .btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        font-size: 1em;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .btn-primary {
        background-color: #3498db;
        color: white;
      }

      .btn-primary:hover {
        background-color: #2980b9;
      }

      .btn-secondary {
        background-color: #95a5a6;
        color: white;
      }

      .btn-secondary:hover {
        background-color: #7f8c8d;
      }

      .btn-info {
        background-color: #17a2b8;
        color: white;
      }

      .btn-danger {
        background-color: #dc3545;
        color: white;
      }

      .btn-danger:hover {
        background-color: #c82333;
      }

      .btn-sm {
        padding: 4px 8px;
        font-size: 0.85em;
      }

      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .empty-state {
        text-align: center;
        color: #7f8c8d;
        padding: 40px 20px;
        font-size: 1.1em;
      }

      .permission-checkbox {
        display: inline-flex;
        align-items: center;
        margin-right: 15px;
        margin-bottom: 10px;
      }

      .permission-checkbox input {
        width: auto;
        margin-right: 8px;
      }

      fieldset {
        border: 1px solid #ecf0f1;
        border-radius: 4px;
        padding: 15px;
        margin-bottom: 20px;
      }

      legend {
        font-weight: 600;
        color: #2c3e50;
        padding: 0 10px;
      }

      details {
        cursor: pointer;
      }

      summary {
        font-weight: 500;
        color: #3498db;
        user-select: none;
      }

      details ul {
        margin-top: 10px;
        margin-left: 20px;
        list-style: disc;
      }

      details li {
        color: #7f8c8d;
        font-size: 0.9em;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .admin-panel {
          flex-direction: column;
        }

        .admin-sidebar {
          width: 100%;
          flex-direction: row;
        }

        .admin-nav {
          flex: 1;
          padding: 0;
        }

        .admin-nav ul {
          display: flex;
        }

        .nav-link {
          flex: 1;
          border-left: none;
          border-bottom: 3px solid transparent;
          justify-content: center;
        }

        .nav-link.active {
          border-left: none;
          border-bottom: 3px solid #3498db;
        }

        .admin-main {
          padding: 15px;
        }
      }
    `;

    document.head.appendChild(style);
  }
}

// Global reference for onclick handlers
let adminRouter = null;
let adminUsers = null;
let adminRoles = null;
let adminSettings = null;

// Export for browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminRouter;
}
