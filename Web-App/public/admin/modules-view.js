'use strict';

const escapeHtmlModules = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

class AdminModulesView {
  constructor(apiClient, category = null) {
    this.api = apiClient;
    this.category = category;
    this.modules = [];
    this.activeModuleId = null;
  }

  async init(container) {
    this.container = container;
    await this.loadModules();
    this.render();
  }

  async loadModules() {
    const result = await this.api.getAdminModules();
    const modules = AdminCommon.unwrapData(result, 'modules', []);
    if (!result.ok || !Array.isArray(modules)) {
      this.modules = [];
      AdminCommon.showAlert(`Failed to load modules: ${result.error || 'Unknown error'}`, 'error');
      return;
    }
    this.modules = this.category ? modules.filter((module) => (module.category || 'user') === this.category) : modules;
  }

  getModule(moduleId) {
    return this.modules.find((module) => String(module.id) === String(moduleId)) || null;
  }

  render() {
    this.container.innerHTML = `
      <div class="admin-modules-view">
        <div class="section-header">
          <h2>${this.category === 'system' ? 'System Modules' : (this.category === 'user' ? 'App Modules' : 'Module Administration')}</h2>
          <button type="button" class="btn btn-secondary" data-module-action="reload">Reload</button>
        </div>
        <div id="modules-table"></div>
      </div>
    `;
    this.renderTable();
    this.bindLifecycleActions();
  }

  renderTable() {
    const host = this.container.querySelector('#modules-table');
    if (!host) {
      return;
    }

    if (!this.modules.length) {
      host.innerHTML = '<p class="empty-state">No modules discovered.</p>';
      return;
    }

    const groups = this.category
      ? [['', this.modules]]
      : [['App Modules', this.modules.filter((module) => (module.category || 'user') === 'user')], ['System Modules', this.modules.filter((module) => module.category === 'system')]];
    host.innerHTML = groups.map(([label, modules]) => `
      <section class="module-category" data-module-category="${label.startsWith('System') ? 'system' : 'user'}">
      ${label ? `<h3>${label}</h3>` : ''}
      <div class="admin-table-container"><table class="admin-table">
        <thead>
          <tr>
            <th>Module</th>
            <th>Version</th>
            <th>Lifecycle</th>
            <th>Registered</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${modules.length ? modules.map((module) => this.renderRow(module)).join('') : '<tr><td colspan="5" class="empty-state">No modules in this category.</td></tr>'}
        </tbody>
      </table></div></section>
    `).join('');
  }

  renderRow(module) {
    const moduleId = escapeHtmlModules(module.id);
    const lifecycle = escapeHtmlModules(module.lifecycleState || 'DISCOVERED');
    const status = escapeHtmlModules(module.status || 'discovered');
    const registered = module.registered ? 'yes' : 'no';
    const isActive = lifecycle === 'ACTIVE';
    const canInstall = !module.registered;
    const canActivate = module.registered && !isActive;
    const canDeactivate = module.registered && isActive;
    const canUninstall = module.registered;

    return `
      <tr>
        <td>
          <strong>${escapeHtmlModules(module.displayName || module.name || module.id)}</strong>
          <div class="small-muted">${moduleId}</div>
        </td>
        <td>${escapeHtmlModules(module.version || '—')}</td>
        <td><span class="status-badge ${isActive ? 'ok' : ''}">${lifecycle}</span><div class="small-muted">${status}</div></td>
        <td>${registered}</td>
        <td class="action-buttons">
          <button type="button" class="btn btn-sm btn-secondary" data-module-action="details" data-module-id="${moduleId}">Details</button>
          <button type="button" class="btn btn-sm btn-primary" data-module-action="install" data-module-id="${moduleId}" ${canInstall ? '' : 'disabled'}>Install</button>
          <button type="button" class="btn btn-sm btn-info" data-module-action="activate" data-module-id="${moduleId}" ${canActivate ? '' : 'disabled'}>Activate</button>
          <button type="button" class="btn btn-sm btn-warning" data-module-action="deactivate" data-module-id="${moduleId}" ${canDeactivate ? '' : 'disabled'}>Deactivate</button>
          <button type="button" class="btn btn-sm btn-danger" data-module-action="uninstall" data-module-id="${moduleId}" ${canUninstall ? '' : 'disabled'}>Uninstall</button>
        </td>
      </tr>
    `;
  }

  bindLifecycleActions() {
    const root = this.container.querySelector('.admin-modules-view');
    if (!root) return;
    root.addEventListener('click', (event) => {
      const button = event.target.closest('[data-module-action]');
      if (!button || !root.contains(button) || button.disabled) return;
      const action = button.dataset.moduleAction;
      const moduleId = button.dataset.moduleId;
      if (action === 'reload') { void this.reload(); return; }
      const handlers = {
        details: () => this.showDetails(moduleId),
        install: () => this.install(moduleId),
        activate: () => this.activate(moduleId),
        deactivate: () => this.deactivate(moduleId),
        uninstall: () => this.uninstall(moduleId)
      };
      if (handlers[action] && moduleId) void handlers[action]();
    });
  }

  renderPermissionEditor(module, modulePermissions) {
    const permissionData = modulePermissions && typeof modulePermissions === 'object'
      ? modulePermissions
      : null;
    const permissions = Array.isArray(permissionData?.permissions) ? permissionData.permissions : [];
    const roles = Array.isArray(permissionData?.roles) ? permissionData.roles : [];

    if (!permissions.length) {
      return '<p class="small-muted">This module does not declare module-specific permissions.</p>';
    }

    return `
      <form id="module-permission-form" class="admin-form" data-module-id="${escapeHtmlModules(module.id)}">
        <div>
          <h3>Role assignments</h3>
          <p class="small-muted">Assign only this module&apos;s declared permissions. Existing core permissions on each role stay untouched.</p>
          <p class="small-muted">For access without login, the Viewer role needs both the module visibility permission and its usage permission. This mapping never grants anonymous admin or server rights.</p>
        </div>
        <div class="module-permission-grid">
          ${roles.map((role) => `
            <fieldset class="module-role-card">
              <legend>${escapeHtmlModules(role.name || role.id)}</legend>
              <p class="small-muted">${escapeHtmlModules(role.description || (role.isSystem ? 'Built-in role' : 'Custom role'))}</p>
              <div class="permissions-checklist">
                ${permissions.map((permission) => `
                  <label class="permission-checkbox">
                    <input
                      type="checkbox"
                      data-module-role="${escapeHtmlModules(role.id)}"
                      value="${escapeHtmlModules(permission.key)}"
                      ${(role.modulePermissions || []).includes(permission.key) ? 'checked' : ''}
                    />
                    <span>
                      <strong>${escapeHtmlModules(permission.key)}</strong>
                      <small>${escapeHtmlModules(permission.description || 'No description provided.')}</small>
                    </span>
                  </label>
                `).join('')}
              </div>
            </fieldset>
          `).join('')}
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" ${module.registered ? '' : 'disabled'}>Save module permissions</button>
        </div>
      </form>
    `;
  }

  renderVisibilityEditor(module) {
    const visibility = module.visibility || {};
    return `<form id="module-visibility-form" class="admin-form"><p class="small-muted">Navigation visibility is presentation only and never grants permissions.</p><div class="permissions-checklist">${['admin','developer','user','viewer'].map((role) => `<label class="permission-checkbox"><input type="checkbox" data-module-visibility="${role}" ${visibility[role] ? 'checked' : ''}><span>${role}</span></label>`).join('')}</div><div class="form-actions"><button class="btn btn-primary" type="submit">Save visibility</button></div></form>`;
  }

  formatStandaloneLink(module) {
    const standalone = module && module.standalone && typeof module.standalone === 'object'
      ? module.standalone
      : null;
    if (!standalone || !standalone.entry || !module.modulePath) {
      return '<p class="small-muted">No module self-test declared.</p>';
    }

    const requires = standalone.requires && typeof standalone.requires === 'object' ? standalone.requires : {};
    const requirements = [
      `server: ${requires.server ? 'required' : 'not required'}`,
      `database: ${requires.database ? 'required' : 'not required'}`,
      `auth: ${requires.auth ? 'required' : 'not required'}`
    ].join(' · ');

    return `
      <p><a class="nav-link" href="../${escapeHtmlModules(module.modulePath)}/${escapeHtmlModules(standalone.entry)}" target="_blank" rel="noopener">${escapeHtmlModules(standalone.label || 'Open standalone test')}</a></p>
      <p class="small-muted">${escapeHtmlModules(standalone.description || '')}</p>
      <p class="small-muted">${escapeHtmlModules(requirements)}</p>
    `;
  }

  async showDetails(moduleId) {
    this.activeModuleId = String(moduleId);
    const overviewTitle = this.category === 'system' ? 'System Modules' : 'App Modules';
    this.container.innerHTML = `<div class="admin-modules-view module-detail-view"><div class="section-header"><div><button type="button" class="btn btn-secondary" data-module-back>Back to ${overviewTitle}</button><h2>Module Details</h2></div></div><div id="module-details" class="card"></div></div>`;
    this.container.querySelector('[data-module-back]')?.addEventListener('click', () => { this.activeModuleId = null; this.render(); });
    const detailHost = this.container.querySelector('#module-details');
    if (!detailHost) {
      return;
    }

    const [moduleResult, permissionsResult, settingsResult] = await Promise.all([
      this.api.getAdminModule(moduleId),
      this.api.getAdminModulePermissions(moduleId),
      this.api.getSettings()
    ]);

    const module = AdminCommon.unwrapData(moduleResult, 'module', null);
    if (!moduleResult.ok || !module || typeof module !== 'object') {
      AdminCommon.showAlert(`Failed to load module details: ${moduleResult.error || 'Unknown error'}`, 'error');
      detailHost.style.display = 'none';
      return;
    }
    const modulePermissions = permissionsResult.ok
      ? AdminCommon.unwrapData(permissionsResult, 'modulePermissions', null)
      : null;
    const permissionDefinitions = Array.isArray(module.permissionDefinitions) ? module.permissionDefinitions : [];
    const settings = settingsResult.ok ? AdminCommon.unwrapData(settingsResult, 'settings', {}) : {};

    detailHost.style.display = 'block';
    detailHost.innerHTML = `
      <div class="card-header">
        <h3 class="card-title">${escapeHtmlModules(module.displayName || module.name || module.id)}</h3>
      </div>
      <div class="module-detail-stack">
        <div class="small-muted">${escapeHtmlModules(module.id)}</div>
        <p>${escapeHtmlModules(module.description || 'No description.')}</p>
        <div class="info-grid">
          <div class="info-box">
            <strong>Status</strong>
            <span>${escapeHtmlModules(module.lifecycleState || module.status || 'DISCOVERED')}</span>
          </div>
          <div class="info-box">
            <strong>Registered</strong>
            <span>${module.registered ? 'yes' : 'no'}</span>
          </div>
          <div class="info-box">
            <strong>Path</strong>
            <span>${escapeHtmlModules(module.modulePath || '—')}</span>
          </div>
          <div class="info-box">
            <strong>Declared permissions</strong>
            <span>${permissionDefinitions.length}</span>
          </div>
        </div>
        <div class="form-actions module-detail-lifecycle">
          <button type="button" class="btn btn-primary" data-detail-lifecycle="install" ${module.registered ? 'disabled' : ''}>Install</button>
          <button type="button" class="btn btn-info" data-detail-lifecycle="activate" ${module.registered && !module.active ? '' : 'disabled'}>Activate</button>
          <button type="button" class="btn btn-warning" data-detail-lifecycle="deactivate" ${module.active ? '' : 'disabled'}>Deactivate</button>
          <button type="button" class="btn btn-danger" data-detail-lifecycle="uninstall" ${module.registered && !module.active ? '' : 'disabled'}>Uninstall</button>
        </div>
        <div class="card">
          <div class="card-header"><h4 class="card-title">Visibility / Navigation</h4></div>
          ${this.renderVisibilityEditor(module)}
        </div>
        <div class="card">
          <div class="card-header"><h4 class="card-title">Module self-test</h4></div>
          ${this.formatStandaloneLink(module)}
        </div>
        <div class="card">
          <div class="card-header"><h4 class="card-title">Permissions</h4></div>
          ${this.renderPermissionEditor(module, modulePermissions)}
        </div>
        ${this.renderModuleSettings(module, settings)}
      </div>
    `;

    const form = detailHost.querySelector('#module-permission-form');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        await this.savePermissions(module.id);
      });
    }
    detailHost.querySelectorAll('[data-detail-lifecycle]').forEach((button) => button.addEventListener('click', () => {
      const handler = { install: 'install', activate: 'activate', deactivate: 'deactivate', uninstall: 'uninstall' }[button.dataset.detailLifecycle];
      if (handler && !button.disabled) void this[handler](module.id);
    }));
    detailHost.querySelector('#module-visibility-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const roles = {};
      detailHost.querySelectorAll('[data-module-visibility]').forEach((input) => { roles[input.dataset.moduleVisibility] = input.checked; });
      const result = await this.api.updateAdminModuleVisibility(module.id, roles);
      if (!result.ok) { AdminCommon.showAlert(`Failed to update module visibility: ${result.error || 'Unknown error'}`, 'error'); return; }
      AdminCommon.showAlert('Successfully saved.', 'success', { onClose: () => { this.activeModuleId = null; this.render(); } });
    });
    detailHost.querySelector('#module-admin-settings-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      await this.saveModuleSettings(module, settings, event.currentTarget);
    });
  }

  renderModuleSettings(module, settings) {
    const definitions = Array.isArray(module.admin?.settings) ? module.admin.settings : [];
    if (!definitions.length) return '';
    const readPath = (path) => String(path || '').split('.').filter(Boolean).reduce((value, segment) => value && typeof value === 'object' ? value[segment] : undefined, settings);
    const controls = definitions.map((definition) => {
      const value = readPath(definition.path);
      const key = escapeHtmlModules(definition.key);
      const label = escapeHtmlModules(definition.label || definition.key);
      if (definition.type === 'boolean') return `<label class="checkbox-label"><input type="checkbox" name="${key}" ${value ?? definition.defaultValue ? 'checked' : ''}> ${label}</label>`;
      const secret = definition.secret === true;
      return `<label>${label}<input name="${key}" type="${secret ? 'password' : (definition.type === 'number' ? 'number' : 'text')}" ${definition.min != null ? `min="${Number(definition.min)}"` : ''} ${definition.step != null ? `step="${Number(definition.step)}"` : ''} value="${secret ? '' : escapeHtmlModules(value ?? definition.defaultValue ?? '')}" ${secret ? 'autocomplete="new-password" placeholder="Leave empty to keep the stored value"' : ''}></label>`;
    }).join('');
    return `<div class="card"><div class="card-header"><h4 class="card-title">${escapeHtmlModules(module.admin.title || 'Module settings')}</h4></div><p class="small-muted">${escapeHtmlModules(module.admin.description || '')}</p><form id="module-admin-settings-form" class="admin-form compact-form">${controls}<div class="form-actions"><button type="submit" class="btn btn-primary">Save settings</button></div></form></div>`;
  }

  async saveModuleSettings(module, settings, form) {
    const next = JSON.parse(JSON.stringify(settings));
    const writePath = (path, value) => { const parts = String(path).split('.').filter(Boolean); let target = next; parts.slice(0, -1).forEach((part) => { if (!target[part] || typeof target[part] !== 'object') target[part] = {}; target = target[part]; }); target[parts.at(-1)] = value; };
    for (const definition of module.admin.settings) {
      const input = form.elements.namedItem(definition.key);
      const value = definition.type === 'boolean' ? input.checked : definition.type === 'number' ? Number(input.value) : input.value;
      if (definition.secret === true && value === '') continue;
      writePath(definition.path, value);
    }
    const result = await this.api.updateSettings(next);
    if (!result.ok) { AdminCommon.showAlert(`Failed to save module settings: ${result.error || 'Unknown error'}`, 'error'); return; }
    AdminCommon.showAlert('Successfully saved.', 'success', { onClose: () => { this.activeModuleId = null; this.render(); } });
  }

  collectRoleAssignments(moduleId) {
    const host = this.container.querySelector('#module-details');
    if (!host) {
      return {};
    }

    const assignments = {};
    host.querySelectorAll(`[data-module-role]`).forEach((input) => {
      const roleId = input.dataset.moduleRole;
      if (!roleId) {
        return;
      }
      if (!assignments[roleId]) {
        assignments[roleId] = [];
      }
      if (input.checked) {
        assignments[roleId].push(String(input.value));
      }
    });

    return assignments;
  }

  async savePermissions(moduleId) {
    const assignments = this.collectRoleAssignments(moduleId);
    const result = await this.api.updateAdminModulePermissions(moduleId, assignments);
    if (!result.ok) {
      AdminCommon.showAlert(`Failed to update module permissions: ${result.error || 'Unknown error'}`, 'error');
      return;
    }
    AdminCommon.showAlert('Successfully saved.', 'success', { onClose: () => { this.activeModuleId = null; this.render(); } });
  }

  async install(moduleId) {
    const result = await this.api.installModule(moduleId);
    if (!result.ok) {
      AdminCommon.showAlert(`Install failed: ${result.error}`, 'error');
      return;
    }
    AdminCommon.showAlert(`Module ${moduleId} installed`, 'success');
    await this.reload();
    await this.showDetails(moduleId);
  }

  async activate(moduleId) {
    const result = await this.api.activateModule(moduleId);
    if (!result.ok) {
      AdminCommon.showAlert(`Activation failed: ${result.error}`, 'error');
      return;
    }
    AdminCommon.showAlert(`Module ${moduleId} activated`, 'success');
    await this.reload();
    await this.showDetails(moduleId);
  }

  async deactivate(moduleId) {
    const result = await this.api.deactivateModule(moduleId);
    if (!result.ok) {
      AdminCommon.showAlert(`Deactivation failed: ${result.error}`, 'error');
      return;
    }
    AdminCommon.showAlert(`Module ${moduleId} deactivated`, 'success');
    await this.reload();
    await this.showDetails(moduleId);
  }

  async uninstall(moduleId) {
    if (!await AdminCommon.confirmAction(`Uninstall module "${moduleId}" and remove its registered state, settings namespace and declared permissions?`)) {
      return;
    }
    const result = await this.api.uninstallModule(moduleId);
    if (!result.ok) {
      AdminCommon.showAlert(`Uninstall failed: ${result.error}`, 'error');
      return;
    }
    AdminCommon.showAlert(`Module ${moduleId} uninstalled`, 'success');
    await this.reload();
    await this.showDetails(moduleId);
  }

  async reload() {
    await this.loadModules();
    if (this.activeModuleId && !this.getModule(this.activeModuleId)) {
      this.activeModuleId = null;
    }
    this.render();
  }
}

if (typeof window !== 'undefined') {
  window.AdminModulesView = AdminModulesView;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminModulesView;
}
