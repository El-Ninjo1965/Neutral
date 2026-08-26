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

    const runtime = statusResult.ok && statusResult.data && typeof statusResult.data === 'object' ? statusResult.data : {};
    const health = healthResult.ok && healthResult.data && typeof healthResult.data === 'object' && healthResult.data.health
      ? healthResult.data.health
      : (healthResult.ok && healthResult.data ? healthResult.data : {});
    const users = usersResult.ok && Array.isArray(usersResult.data?.users) ? usersResult.data.users : [];
    const sessions = sessionsResult.ok && Array.isArray(sessionsResult.data?.sessions) ? sessionsResult.data.sessions : [];
    const modules = modulesResult.ok && Array.isArray(modulesResult.data?.modules) ? modulesResult.data.modules : [];
    const settings = settingsResult.ok && settingsResult.data ? settingsResult.data : {};

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
  constructor(apiClient, kind = 'system') {
    this.api = apiClient;
    this.kind = kind;
  }

  async init(container) {
    this.container = container;
    const [connectionsResult, providersResult, backupsResult, releaseResult] = await Promise.all([
      this.api.get('/api/connections'),
      this.api.get('/api/providers'),
      this.api.get('/api/backups'),
      this.api.get('/api/admin/release/status')
    ]);

    this.snapshot = {
      connections: connectionsResult.ok && Array.isArray(connectionsResult.data?.connections) ? connectionsResult.data.connections : [],
      providers: providersResult.ok && Array.isArray(providersResult.data?.providers) ? providersResult.data.providers : [],
      backups: backupsResult.ok && Array.isArray(backupsResult.data?.backups) ? backupsResult.data.backups : [],
      release: releaseResult.ok && releaseResult.data && releaseResult.data.release ? releaseResult.data.release : null
    };
    this.render();
  }

  render() {
    const connections = this.snapshot.connections || [];
    const providers = this.snapshot.providers || [];
    const backups = this.snapshot.backups || [];
    const release = this.snapshot.release || {};
    const title = this.kind === 'server' ? 'Server' : this.kind === 'database' ? 'Database' : this.kind === 'connections' ? 'Connections' : 'Infrastructure';

    this.container.innerHTML = `
      <div class="admin-infrastructure-view">
        <div class="section-header">
          <h2>${title}</h2>
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
        <aside class="admin-sidebar">
          <div class="admin-logo">
            <h1>Neutral Framework Administration</h1>
          </div>

          <nav class="admin-nav">
            <div class="admin-nav-group">
              <h3>Dashboard</h3>
              <a href="#" class="nav-link" data-view="dashboard">Dashboard</a>
            </div>
            <div class="admin-nav-group">
              <h3>Users</h3>
              <a href="#" class="nav-link" data-view="users">Users</a>
              <a href="#" class="nav-link" data-view="roles">Roles</a>
              <a href="#" class="nav-link" data-view="permissions">Permissions</a>
              <a href="#" class="nav-link" data-view="sessions">Sessions</a>
            </div>
            <div class="admin-nav-group">
              <h3>Modules</h3>
              <a href="#" class="nav-link" data-view="modules">Modules</a>
            </div>
            <div class="admin-nav-group">
              <h3>Settings</h3>
              <a href="#" class="nav-link" data-view="settings">Settings</a>
              <a href="#" class="nav-link" data-view="theme">Theme</a>
            </div>
            <div class="admin-nav-group">
              <h3>Infrastructure</h3>
              <a href="#" class="nav-link" data-view="connections">Connections</a>
              <a href="#" class="nav-link" data-view="server">Server</a>
              <a href="#" class="nav-link" data-view="database">Database</a>
              <a href="#" class="nav-link" data-view="diagnostics">Diagnostics</a>
            </div>
            <div class="admin-nav-group">
              <h3>Audit</h3>
              <a href="#" class="nav-link" data-view="audit">Audit Log</a>
            </div>
            <div class="admin-nav-group">
              <h3>Updates</h3>
              <a href="#" class="nav-link" data-view="updates">Updates</a>
              <a href="#" class="nav-link" data-view="infrastructure">Backup</a>
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
