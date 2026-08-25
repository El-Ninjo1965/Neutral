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
    const permissions = result.ok && Array.isArray(result.data.permissions) ? result.data.permissions : [];
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
    const sessions = result.ok && Array.isArray(result.data.sessions) ? result.data.sessions : [];

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
      infrastructure: new AdminPlaceholderView(
        'Infrastructure',
        'This area is prepared for future generic connection/service administration (databases, APIs, servers, integrations) without binding the core to one runtime type.'
      ),
      diagnostics: new AdminPlaceholderView(
        'Diagnostics',
        'Diagnostics and operational health controls are staged for upcoming phases.'
      )
    };
  }

  async init(container) {
    this.container = container;
    this.renderLayout();
    this.setupNavigation();
    await this.showView('users');
  }

  renderLayout() {
    this.container.innerHTML = `
      <div class="admin-panel">
        <aside class="admin-sidebar">
          <div class="admin-logo">
            <h1>Administration</h1>
            <p>Neutral Core</p>
          </div>

          <nav class="admin-nav">
            <div class="admin-nav-group">
              <h3>Identity</h3>
              <a href="#" class="nav-link" data-view="users">Users</a>
              <a href="#" class="nav-link" data-view="roles">Roles</a>
              <a href="#" class="nav-link" data-view="permissions">Permissions</a>
              <a href="#" class="nav-link" data-view="sessions">Sessions</a>
            </div>
            <div class="admin-nav-group">
              <h3>System</h3>
              <a href="#" class="nav-link" data-view="settings">Settings</a>
              <a href="#" class="nav-link" data-view="infrastructure">Infrastructure</a>
              <a href="#" class="nav-link" data-view="diagnostics">Diagnostics</a>
            </div>
          </nav>

          <div class="admin-footer">
            <button class="btn btn-sm btn-secondary" onclick="adminRouter.logout()">Logout</button>
          </div>
        </aside>

        <section class="admin-content">
          <header class="admin-header">
            <div class="breadcrumb">
              <span id="breadcrumb-text">Users</span>
            </div>
            <div class="admin-user-info">
              <span id="current-user">Admin</span>
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
      settings: 'System Settings',
      infrastructure: 'Infrastructure',
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
      .admin-panel { display: grid; grid-template-columns: 290px 1fr; min-height: calc(100vh - 40px); background: #f6f8fc; }
      .admin-sidebar { background: #1f2937; color: #f8fafc; display: flex; flex-direction: column; }
      .admin-logo { padding: 22px 20px 16px; border-bottom: 1px solid rgba(148,163,184,.2); }
      .admin-logo h1 { margin: 0; font-size: 1.2rem; }
      .admin-logo p { margin: 8px 0 0; color: #cbd5e1; font-size: .82rem; }
      .admin-nav { padding: 16px; display: grid; gap: 16px; }
      .admin-nav-group h3 { margin: 0 0 8px; font-size: .72rem; letter-spacing: .08em; text-transform: uppercase; color: #94a3b8; }
      .nav-link { display: block; padding: 10px 12px; border-radius: 10px; color: #e2e8f0; text-decoration: none; font-weight: 600; }
      .nav-link:hover,.nav-link.active { background: rgba(59,130,246,.24); color: #fff; }
      .admin-footer { margin-top: auto; padding: 16px; border-top: 1px solid rgba(148,163,184,.2); }
      .admin-content { display: flex; flex-direction: column; min-width: 0; }
      .admin-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; background: #fff; border-bottom: 1px solid #e2e8f0; }
      .breadcrumb { font-weight: 700; color: #0f172a; }
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
      @media (max-width: 980px) {
        .admin-panel { grid-template-columns: 1fr; }
        .admin-sidebar { position: sticky; top: 0; z-index: 3; }
        .inline-form { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(style);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminRouter;
}
