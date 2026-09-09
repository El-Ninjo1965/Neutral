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
    const details = result.ok ? AdminCommon.unwrapData(result, 'permissionDetails', []) : [];
    container.innerHTML = `
      <div class="admin-permissions-view">
        <div class="section-header">
          <h2>Permission Catalog</h2>
          <p class="form-help">This read-only registry lists permissions provided by the Core and installed modules. Assign them through roles; do not delete catalog entries.</p>
        </div>
        <form class="inline-form" id="permission-filters"><input type="search" name="query" placeholder="Search permissions" /><select name="scope"><option value="">All areas</option><option>Admin</option><option>User-App</option></select><select name="source"><option value="">All sources</option><option value="Core">Core</option><option value="Module">Modules</option></select></form>
        ${permissions.length
          ? `<div class="admin-table-container"><table class="admin-table"><thead><tr><th>Permission key</th><th>Description</th><th>Area</th><th>Source</th></tr></thead><tbody id="permission-rows">${permissions.map((permission) => {
            const detail = details.find((entry) => entry.key === permission) || {};
            return `<tr data-scope="${AdminCommon.formatValue(detail.scope || '')}" data-source="${AdminCommon.formatValue(detail.source || '')}" data-search="${AdminCommon.formatValue(`${permission} ${detail.description || ''}`.toLowerCase())}"><td><code>${AdminCommon.formatValue(permission)}</code></td><td>${AdminCommon.formatValue(detail.description || 'Registered permission')}</td><td>${AdminCommon.formatValue(detail.scope || 'User-App')}</td><td>${AdminCommon.formatValue(detail.source || 'Module')}</td></tr>`;
          }).join('')}</tbody></table></div>`
          : '<p class="empty-state">Permission catalog is not available.</p>'
        }
      </div>
    `;
    container.querySelector('#permission-filters')?.addEventListener('input', (event) => {
      const form = event.currentTarget;
      const query = String(form.elements.query.value || '').toLowerCase();
      const scope = form.elements.scope.value;
      const source = form.elements.source.value;
      container.querySelectorAll('#permission-rows tr').forEach((row) => {
        row.hidden = Boolean((query && !row.dataset.search.includes(query)) || (scope && row.dataset.scope !== scope) || (source && !row.dataset.source.startsWith(source)));
      });
    });
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
          <h2>Device Sessions</h2><p class="form-help">One row represents a revocable browser installation. Expired and revoked history is retained server-side only for the configured cleanup period.</p>
        </div>
        ${sessions.length
          ? `
            <table class="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Roles</th>
                  <th>Device</th>
                  <th>Platform</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Last activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${sessions.map((session) => `
                  <tr>
                    <td>${session.displayName || session.username || '—'}${session.username ? ` <span class="small-muted">@${session.username}</span>` : ''}</td>
                    <td>${Array.isArray(session.roles) ? session.roles.join(', ') : '—'}</td>
                    <td>${session.deviceLabel || 'Browser installation'}${session.current ? ' <strong class="status-badge">Current session</strong>' : ''}</td>
                    <td>${session.platform || 'Browser'}</td><td>${session.status || 'active'}</td>
                    <td>${session.issuedAt || '—'}</td>
                    <td>${session.lastSeenAt || '—'}</td>
                    <td>${session.current ? '<span class="small-muted">Use Logout</span>' : `<button type="button" class="btn btn-sm btn-danger" data-session-invalidate="${session.sessionId}">Revoke device</button>`}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `
          : '<p class="empty-state">No tracked sessions available.</p>'
        }
      </div>
    `;
    container.querySelectorAll('[data-session-invalidate]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (!AdminCommon.confirmAction('End this session? The session will no longer authenticate.')) return;
        const response = await this.api.invalidateSession(button.dataset.sessionInvalidate);
        if (!response.ok) {
          AdminCommon.showAlert(`Session could not be ended: ${response.error || 'Unknown error'}`, 'error');
          return;
        }
        AdminCommon.showAlert('Session ended successfully.', 'success');
        await this.init(container);
      });
    });
  }
}

class AdminDashboardView {
  constructor(apiClient) {
    this.api = apiClient;
    this.snapshot = null;
  }

  async init(container) {
    this.container = container;
    const [statusResult, healthResult, usersResult, sessionsResult, modulesResult, settingsResult, backupReadinessResult] = await Promise.all([
      this.api.get('/api/status'),
      this.api.get('/api/admin/system/health'),
      this.api.getUsers(),
      this.api.getSessions(),
      this.api.getAdminModules(),
      this.api.getSettings(),
      this.api.get('/api/admin/backups/readiness')
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
    const backupReadiness = backupReadinessResult.ok ? AdminCommon.unwrapData(backupReadinessResult, 'readiness', {}) : {};

    this.snapshot = {
      runtime,
      health,
      users,
      sessions,
      modules,
      settings,
      backupReadiness
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
    const backupReadiness = this.snapshot?.backupReadiness || {};
    const appName = settings.appName || settings.settings?.appName || 'Neutral Platform';
    const appId = settings.appId || settings.settings?.appId || 'neutral-app';
    const systemStatus = health && typeof health === 'object' && (health.status || health.state) ? String(health.status || health.state) : (runtime.status || 'healthy');
    const moduleActiveCount = modules.filter((module) => module && (module.lifecycleState === 'ACTIVE' || module.status === 'active' || module.active)).length;
    const activeSessions = sessions.filter((session) => String(session.status || 'active').toLowerCase() === 'active').length;
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
      ['Database', this.readableStatus(runtime.database || runtime.databaseStatus || health.database || 'configured')],
      ['Last check', this.formatDate(runtime.timestamp || runtime.generatedAt || new Date().toISOString())]
    ];

    this.container.innerHTML = `
      <div class="admin-dashboard-view">
        <div class="section-header">
          <h2>Dashboard</h2>
        </div>
        ${backupReadiness.keyConfigured === false ? '<div class="admin-state admin-state-warning" role="status"><strong>Backup action required:</strong> configure the host-only encryption key before creating backups.</div>' : ''}
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
            <div class="card-header"><h3>Session overview</h3><span class="small-muted">Showing ${Math.min(sessions.length, 8)} of ${sessions.length}</span></div>
            ${sessions.length
              ? `<ul class="mini-list">${sessions.slice(0, 8).map((session) => `<li><span>${session.deviceLabel || 'Browser installation'} · ${session.platform || 'Browser'}${session.current ? ' (current)' : ''}</span><span>${session.username ? `@${session.username}` : session.userId || 'User'}</span></li>`).join('')}</ul>`
              : '<p class="empty-state">No active sessions recorded.</p>'}
            ${sessions.length > 8 ? '<button type="button" class="btn btn-secondary" data-dashboard-all-sessions>View all device sessions</button>' : ''}
          </div>
        </div>
      </div>
    `;
    this.container.querySelector('[data-dashboard-all-sessions]')?.addEventListener('click', () => window.adminRouter?.showView('sessions'));
  }

  readableStatus(value) {
    if (value && typeof value === 'object') return String(value.status || value.state || (value.ready === true ? 'ready' : 'configured'));
    return String(value);
  }

  formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Not recorded' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
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
      connections: this.api.get('/api/admin/connections'),
      providers: this.api.get('/api/admin/providers'),
      backups: this.api.get('/api/admin/backups'),
      backupReadiness: this.api.get('/api/admin/backups/readiness'),
      release: this.api.get('/api/admin/release/status'),
      setup: this.api.get('/api/setup/status'),
      database: this.api.get('/api/admin/database'),
      server: this.api.get('/api/admin/server')
    };

    const results = await Promise.all(Object.entries(requests).map(([key, promise]) => promise.then((result) => [key, result])));
    const snapshot = {};
    for (const [key, result] of results) {
      const payload = AdminCommon.unwrapData(result, null, null);
      if (!result.ok || !payload) {
        snapshot[`${key}Error`] = result.error || 'The service is temporarily unavailable.';
        continue;
      }
      if (key === 'connections') {
        snapshot.connections = Array.isArray(payload.connections) ? payload.connections : [];
        snapshot.connectionsStatus = payload.status || 'available';
      } else if (key === 'providers') {
        snapshot.providers = Array.isArray(payload.providers) ? payload.providers : [];
        snapshot.providersStatus = payload.status || 'available';
      } else if (key === 'backups') {
        snapshot.backups = Array.isArray(payload.backups) ? payload.backups : [];
        snapshot.backupAutomation = payload.automation || {};
      } else if (key === 'backupReadiness') {
        snapshot.backupReadiness = payload.readiness || {};
      } else if (key === 'release') {
        snapshot.release = payload.release || {};
      } else if (key === 'setup') {
        snapshot.setup = payload.setup || {};
      } else if (key === 'database') {
        snapshot.database = payload.database || {};
      } else if (key === 'server') {
        snapshot.server = payload.server || payload.result || {};
      }
    }
    this.snapshot = snapshot;
  }

  getTitle() {
    if (this.kind === 'connections') return 'Connections';
    if (this.kind === 'server') return 'Server';
    if (this.kind === 'database') return 'Database';
    if (this.kind === 'backups') return 'Backups & Restore';
    if (this.kind === 'updates') return 'Maintenance & Updates';
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
    if (this.kind === 'backups') {
      this.renderBackups();
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
        ${this.snapshot.connectionsError ? `<div class="admin-state admin-state-error" role="alert">${this.escape(this.snapshot.connectionsError)}</div>` : ''}
        <div class="card-grid">
          <div class="card panel-box">
            <div class="card-header"><h3>Active providers</h3></div>
            ${providers.length
              ? `<ul class="mini-list">${providers.map((entry) => `<li>${entry.name || entry.providerId || 'Provider'} <span>${entry.active ? 'active' : 'inactive'}</span></li>`).join('')}</ul>`
              : this.snapshot.providersError
                ? `<p class="admin-state admin-state-error" role="alert">${this.escape(this.snapshot.providersError)}</p>`
                : '<p class="empty-state">Optional providers are not configured.</p>'}
          </div>
          <div class="card panel-box">
            <div class="card-header"><h3>Current connection</h3></div>
            <dl class="detail-list">
              <div><dt>Name</dt><dd>${primaryConnection.connectionId || primaryConnection.name || '—'}</dd></div>
              <div><dt>Type</dt><dd>${primaryConnection.connectionType || primaryConnection.storageType || primaryConnection.type || 'MySQL'}</dd></div>
              <div><dt>Status</dt><dd>${primaryConnection.status || 'unknown'}</dd></div>
              <div><dt>Role</dt><dd>${primaryConnection.default === false ? 'Configured database' : 'Primary database'}</dd></div>
            </dl>
          </div>
        </div>
        <div class="card panel-box"><div class="card-header"><h3>Configuration source</h3></div><p class="form-help">Connections are read-only here and come from authoritative host/runtime configuration. Optional external providers are configured only through reviewed provider contracts; secrets are never displayed.</p></div>
      </div>
    `;

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
        ${this.snapshot.serverError ? `<div class="admin-state admin-state-error" role="alert">${this.escape(this.snapshot.serverError)}</div>` : ''}
        <div class="card-grid">
          <div class="card panel-box">
            <div class="card-header"><h3>Runtime status</h3></div>
            <dl class="detail-list">
              <div><dt>Status</dt><dd>${server.status || 'unknown'}</dd></div>
              ${server.reachable === undefined ? '' : `<div><dt>Reachable</dt><dd>${server.reachable ? 'yes' : 'no'}</dd></div>`}
              <div><dt>Target</dt><dd>${currentUrl}</dd></div>
              <div><dt>API Base</dt><dd>${server.apiBase || setup.serverState?.apiBase || window.NeutralPublicPath.api('')}</dd></div>
            </dl>
          </div>
        </div>
        <div class="card panel-box">
          <div class="card-header"><h3>Test server endpoint</h3></div>
          <form id="server-form" class="admin-form compact-form">
            <div class="form-grid">
              <p class="form-help">Tests the configured server runtime and API route without accepting alternate targets or credentials.</p>
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
        const result = await this.api.get('/api/server/test');
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
        ${this.snapshot.databaseError ? `<div class="admin-state admin-state-error" role="alert">${this.escape(this.snapshot.databaseError)}</div>` : ''}
        <div class="card-grid">
          <div class="card panel-box">
            <div class="card-header"><h3>Current database status</h3></div>
            <dl class="detail-list">
              <div><dt>Status</dt><dd>${database.status || 'unknown'}</dd></div>
              <div><dt>Type</dt><dd>${database.type || dbConfig.type || 'mysql'}</dd></div>
              <div><dt>Host</dt><dd>${database.host || dbConfig.host || '—'}</dd></div>
              <div><dt>Name</dt><dd>${database.name || dbConfig.name || '—'}</dd></div>
              ${(database.username || dbConfig.username) ? `<div><dt>Username</dt><dd>${this.escape(database.username || dbConfig.username)}</dd></div>` : ''}
            </dl>
          </div>
        </div>
        <div class="card panel-box">
          <div class="card-header"><h3>Test current database</h3></div>
          <form id="database-form" class="admin-form compact-form">
            <p class="form-help">Uses only the existing protected runtime configuration. No password or connection secret is accepted by this view.</p>
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
        const result = await this.api.get('/api/admin/database');
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
    const release = this.snapshot.release || {};
    this.container.innerHTML = `
      <div class="admin-infrastructure-view">
        <div class="section-header">
          <h2>Maintenance & Updates</h2>
        </div>
        <div class="card-grid">
          <div class="card panel-box">
            <div class="card-header"><h3>Release</h3></div>
            <dl class="detail-list">
              <div><dt>Status</dt><dd>${release.maintenanceMode ? 'Maintenance mode' : 'Operational'}</dd></div>
              <div><dt>Version</dt><dd>${release.version || '—'}</dd></div>
              <div><dt>Commit</dt><dd><code>${this.escape(release.commit || 'Unavailable')}</code></dd></div>
              <div><dt>Built</dt><dd>${this.escape(release.buildAt || 'Unavailable')}</dd></div>
              <div><dt>Updater</dt><dd>${release.updateActionsSupported ? 'Available' : 'Not supported; releases are deployed externally'}</dd></div>
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

  }

  renderBackups() {
    const backups = this.snapshot.backups || [];
    const automation = this.snapshot.backupAutomation || {};
    const readiness = this.snapshot.backupReadiness || {};
    const backupReady = readiness.keyConfigured === true && readiness.cryptoAvailable === true
      && readiness.databaseReady === true && readiness.managedTablesReady === true && readiness.storageReady === true;
    this.container.innerHTML = `
      <div class="admin-infrastructure-view">
        <div class="section-header"><h2>Backups & Restore</h2></div>
        ${this.snapshot.backupsError ? `<div class="admin-state admin-state-error" role="alert">${this.escape(this.snapshot.backupsError)}</div>` : ''}
        <div class="card panel-box">
          <div class="card-header"><h3>Encrypted database backups</h3></div>
          <p class="form-help">Backups contain managed platform data. Restoring replaces the current managed data and signs you out.</p>
          <p class="form-help">Automatic scheduler: ${this.escape(automation.scheduler || 'external-cron-required')}. Last success: ${this.escape(automation.lastSuccess ? new Date(Number(automation.lastSuccess) * 1000).toISOString() : 'No scheduled backup recorded')}. ${automation.lastError ? `Last error: ${this.escape(automation.lastError)}` : ''}</p>
          <dl class="detail-list"><div><dt>Encryption key</dt><dd>${readiness.keyConfigured ? 'Ready' : 'Host configuration required'}</dd></div><div><dt>Crypto</dt><dd>${readiness.cryptoAvailable ? 'Ready' : 'Unavailable'}</dd></div><div><dt>Database/schema</dt><dd>${readiness.databaseReady && readiness.managedTablesReady ? 'Ready' : 'Host check required'}</dd></div><div><dt>Protected storage</dt><dd>${readiness.storageReady ? 'Ready' : 'Host check required'}</dd></div></dl>
          ${backupReady ? '' : '<p class="admin-state admin-state-warning" id="backup-readiness-help">Host encryption key must be configured before manual or automatic encrypted backups can run.</p>'}
          ${backups.length ? `<div class="admin-table-container"><table class="admin-table"><thead><tr><th>Created</th><th>Size</th><th>Backup ID</th><th>Actions</th></tr></thead><tbody>${backups.map((backup) => `<tr><td>${this.escape(backup.createdAt || '—')}</td><td>${this.escape(this.formatBytes(backup.size))}</td><td><code>${this.escape(backup.backupId || '')}</code></td><td class="action-buttons"><button class="btn btn-sm btn-secondary" data-backup-download="${this.escape(backup.backupId)}">Download</button><button class="btn btn-sm btn-danger" data-backup-restore="${this.escape(backup.backupId)}">Restore</button><button class="btn btn-sm btn-danger" data-backup-delete="${this.escape(backup.backupId)}">Delete</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="empty-state">No backups available yet.</p>'}
          <form id="backup-form" class="admin-form compact-form"><div class="form-actions"><button type="submit" class="btn btn-primary" ${backupReady ? '' : 'disabled aria-disabled="true" aria-describedby="backup-readiness-help"'}>Create backup</button><label class="btn btn-secondary">Upload encrypted backup<input id="backup-upload" type="file" accept=".neutral-backup,application/octet-stream" class="sr-only" /></label></div></form>
        </div>
      </div>`;

    const backupForm = this.container.querySelector('#backup-form');
    if (backupForm) {
      backupForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const result = await this.api.post('/api/admin/backups', {});
        if (result.ok) {
          this.notify('Backup created', 'success');
          await this.init(this.container);
        } else {
          this.notify(`Backup creation failed: ${result.error || 'Unknown error'}`, 'error');
        }
      });
    }
    const upload = this.container.querySelector('#backup-upload');
    if (upload) upload.addEventListener('change', async () => {
      const file = upload.files && upload.files[0];
      if (!file) return;
      const result = await this.api.upload('/api/admin/backups/upload', file);
      if (result.ok) { this.notify('Encrypted backup uploaded', 'success'); await this.init(this.container); }
      else this.notify(`Backup upload failed: ${result.error || 'Unknown error'}`, 'error');
    });
    this.container.querySelectorAll('[data-backup-download]').forEach((button) => button.addEventListener('click', () => this.downloadBackup(button.dataset.backupDownload)));
    this.container.querySelectorAll('[data-backup-restore]').forEach((button) => button.addEventListener('click', () => this.restoreBackup(button.dataset.backupRestore)));
    this.container.querySelectorAll('[data-backup-delete]').forEach((button) => button.addEventListener('click', async () => {
      if (!AdminCommon.confirmAction('Delete this encrypted backup permanently?')) return;
      const result = await this.api.delete(`/api/admin/backups/${button.dataset.backupDelete}`);
      if (result.ok) { this.notify('Backup deleted', 'success'); await this.init(this.container); } else this.notify(`Backup delete failed: ${result.error || 'Unknown error'}`, 'error');
    }));
  }

  async downloadBackup(backupId) {
    const result = await this.api.download(`/api/admin/backups/${backupId}/download`);
    if (!result.ok) { this.notify(`Backup download failed: ${result.error || 'Unknown error'}`, 'error'); return; }
    const url = URL.createObjectURL(result.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${backupId}.neutral-backup`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async restoreBackup(backupId) {
    const confirmed = window.AdminCommon.confirmAction(`Restore backup ${backupId}? Current managed data will be replaced and you will be signed out.`);
    if (!confirmed) return;
    const result = await this.api.post(`/api/admin/backups/${backupId}/restore`, {});
    if (!result.ok) { this.notify(`Backup restore failed: ${result.error || 'Unknown error'}`, 'error'); return; }
    window.location.replace(window.NeutralPublicPath.admin());
  }

  formatBytes(value) {
    const bytes = Number(value || 0);
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
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
      health: AdminCommon.unwrapData(healthResult, 'health', null),
      framework: AdminCommon.unwrapData(frameworkResult, 'framework', null),
      error: !healthResult.ok ? healthResult.error : (!frameworkResult.ok ? frameworkResult.error : null)
    };
    this.render();
  }

  render() {
    const health = this.snapshot?.health || {};
    const framework = this.snapshot?.framework || {};
    const runtime = health.runtime || {};
    const detailEntries = [
      ['Status', health.status || health.state || 'unknown'],
      ['Runtime', runtime.phpVersion ? `PHP ${runtime.phpVersion} (${runtime.sapi || 'runtime'})` : 'Unavailable on this runtime'],
      ['Environment', health.environment || framework.environment || 'production'],
      ['Memory', runtime.memoryLimit || 'Unavailable on this runtime'],
      ['Disk', runtime.diskFree == null ? 'Unavailable on this runtime' : `${Math.round(runtime.diskFree / 1048576)} MB free`],
      ['Modules', String(health.modules ?? framework.modulesCount ?? 'Unavailable')],
      ['Apps', String(health.apps ?? framework.appsCount ?? 'Unavailable')]
    ];

    this.container.innerHTML = `
      <div class="admin-diagnostics-view">
        <div class="section-header">
          <h2>Diagnostics</h2>
        </div>
        ${this.snapshot.error ? `<div class="admin-state admin-state-error" role="alert">${AdminCommon.formatValue(this.snapshot.error)}</div>` : ''}
        <div class="card-grid">
          <div class="card panel-box">
            <div class="card-header"><h3>System check</h3></div>
            <dl class="detail-list">
              ${detailEntries.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}
            </dl>
          </div>
          ${Object.keys(framework).length ? `<div class="card panel-box"><div class="card-header"><h3>Framework summary</h3></div><dl class="detail-list"><div><dt>Modules</dt><dd>${AdminCommon.formatValue(framework.modulesCount ?? health.modules ?? 'Not reported')}</dd></div><div><dt>Apps</dt><dd>${AdminCommon.formatValue(framework.appsCount ?? health.apps ?? 'Not reported')}</dd></div></dl></div>` : ''}
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
      theme: new AdminAppearanceView(apiClient),
      audit: new AdminAuditView(apiClient),
      modules: new AdminModulesView(apiClient),
      dashboard: new AdminDashboardView(apiClient),
      updates: new AdminInfrastructureView(apiClient, 'updates'),
      backups: new AdminInfrastructureView(apiClient, 'backups'),
      infrastructure: new AdminInfrastructureView(apiClient, 'infrastructure'),
      connections: new AdminInfrastructureView(apiClient, 'connections'),
      server: new AdminInfrastructureView(apiClient, 'server'),
      database: new AdminInfrastructureView(apiClient, 'database'),
      diagnostics: new AdminDiagnosticsView(apiClient)
    };
  }

  async init(container) {
    this.container = container;
    const currentUser = window.CoreAuth && typeof window.CoreAuth.getCurrentUser === 'function'
      ? window.CoreAuth.getCurrentUser()
      : null;
    this.shell = new window.AdminShell(container, {
      groups: window.AdminNavigation.groups,
      userLabel: currentUser?.displayName || currentUser?.username || 'Developer',
      onNavigate: (viewId) => this.showView(viewId),
      onLogout: () => this.logout()
    });
    this.shell.mount();
    await this.showView('dashboard');
  }

  async showView(viewName) {
    const view = this.views[viewName];
    if (!view) {
      return;
    }
    AdminCommon.clearRouteAlerts();
    const mainContainer = document.getElementById('admin-main');
    const viewContainer = document.createElement('div');
    viewContainer.className = 'admin-view-host';
    const revision = (this.navigationRevision || 0) + 1;
    this.navigationRevision = revision;
    const title = this.formatViewName(viewName);
    this.shell.setActive(viewName);
    this.shell.setTitle(title);
    this.currentView = viewName;
    mainContainer.replaceChildren(viewContainer);
    try {
      await view.init(viewContainer);
      if (revision === this.navigationRevision) this.shell.focusTitle();
    } catch (error) {
      if (revision === this.navigationRevision) {
        viewContainer.innerHTML = `<div class="admin-state admin-state-error" role="alert">${AdminCommon.formatValue(error?.message || 'This view could not be loaded.')}</div>`;
      }
    }
  }

  formatViewName(name) {
    const names = {
      users: 'User Management',
      roles: 'Role Management',
      permissions: 'Permission Catalog',
      sessions: 'Session Overview',
      audit: 'Audit Log',
      settings: 'System Settings',
      theme: 'Appearance',
      dashboard: 'Dashboard',
      modules: 'Module Administration',
      updates: 'Updates',
      backups: 'Backups & Restore',
      infrastructure: 'Backup / Infrastructure',
      connections: 'Connections',
      server: 'Server',
      database: 'Database',
      diagnostics: 'Diagnostics'
    };
    return names[name] || name;
  }

  async logout() {
    if (!AdminCommon.confirmAction('Logout now?')) return;
    await this.api.logout();
    window.location.replace(window.NeutralPublicPath.admin());
  }
}

if (typeof window !== 'undefined') {
  window.AdminRouter = AdminRouter;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminRouter;
  module.exports.AdminInfrastructureView = AdminInfrastructureView;
  module.exports.AdminDiagnosticsView = AdminDiagnosticsView;
  module.exports.AdminDashboardView = AdminDashboardView;
}
