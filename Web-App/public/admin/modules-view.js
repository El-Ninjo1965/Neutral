'use strict';

const escapeHtmlModules = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

class AdminModulesView {
  constructor(apiClient) {
    this.api = apiClient;
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
    this.modules = modules;
  }

  getModule(moduleId) {
    return this.modules.find((module) => String(module.id) === String(moduleId)) || null;
  }

  render() {
    this.container.innerHTML = `
      <div class="admin-modules-view">
        <div class="section-header">
          <h2>Module Administration</h2>
          <button class="btn btn-secondary" onclick="adminModules.reload()">Reload</button>
        </div>
        <div id="modules-table"></div>
        <div id="module-details" class="card" style="margin-top: 1rem; display: none;"></div>
      </div>
    `;
    this.renderTable();
    if (this.activeModuleId) {
      this.showDetails(this.activeModuleId);
    }
  }

  renderTable() {
    const host = document.getElementById('modules-table');
    if (!host) {
      return;
    }

    if (!this.modules.length) {
      host.innerHTML = '<p class="empty-state">No modules discovered.</p>';
      return;
    }

    host.innerHTML = `
      <table class="admin-table">
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
          ${this.modules.map((module) => this.renderRow(module)).join('')}
        </tbody>
      </table>
    `;
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
          <button class="btn btn-sm btn-secondary" onclick="adminModules.showDetails('${moduleId}')">Details</button>
          <button class="btn btn-sm btn-primary" onclick="adminModules.install('${moduleId}')" ${canInstall ? '' : 'disabled'}>Install</button>
          <button class="btn btn-sm btn-info" onclick="adminModules.activate('${moduleId}')" ${canActivate ? '' : 'disabled'}>Activate</button>
          <button class="btn btn-sm btn-warning" onclick="adminModules.deactivate('${moduleId}')" ${canDeactivate ? '' : 'disabled'}>Deactivate</button>
          <button class="btn btn-sm btn-danger" onclick="adminModules.uninstall('${moduleId}')" ${canUninstall ? '' : 'disabled'}>Uninstall</button>
        </td>
      </tr>
    `;
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

  formatStandaloneLink(module) {
    const standalone = module && module.standalone && typeof module.standalone === 'object'
      ? module.standalone
      : null;
    if (!standalone || !standalone.entry || !module.modulePath) {
      return '<p class="small-muted">No standalone test entry declared.</p>';
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
    const detailHost = document.getElementById('module-details');
    if (!detailHost) {
      return;
    }

    const [moduleResult, permissionsResult] = await Promise.all([
      this.api.getAdminModule(moduleId),
      this.api.getAdminModulePermissions(moduleId)
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
        <div class="card">
          <div class="card-header"><h4 class="card-title">Standalone test</h4></div>
          ${this.formatStandaloneLink(module)}
        </div>
        <div class="card">
          <div class="card-header"><h4 class="card-title">Permissions</h4></div>
          ${this.renderPermissionEditor(module, modulePermissions)}
        </div>
      </div>
    `;

    const form = detailHost.querySelector('#module-permission-form');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        await this.savePermissions(module.id);
      });
    }
  }

  collectRoleAssignments(moduleId) {
    const host = document.getElementById('module-details');
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
    AdminCommon.showAlert(`Module permissions for ${moduleId} updated`, 'success');
    await this.reload();
    await this.showDetails(moduleId);
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
    if (!AdminCommon.confirmAction(`Uninstall module "${moduleId}" and remove its registered state, settings namespace and declared permissions?`)) {
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
