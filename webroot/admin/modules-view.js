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
          <button class="btn btn-sm btn-info" onclick="adminModules.activate('${moduleId}')" ${module.registered && !isActive ? '' : 'disabled'}>Activate</button>
          <button class="btn btn-sm btn-warning" onclick="adminModules.deactivate('${moduleId}')" ${module.registered && isActive ? '' : 'disabled'}>Deactivate</button>
        </td>
      </tr>
    `;
  }

  async showDetails(moduleId) {
    const detailHost = document.getElementById('module-details');
    if (!detailHost) {
      return;
    }
    const result = await this.api.getAdminModule(moduleId);
    if (!result.ok || !result.data || !result.data.module) {
      AdminCommon.showAlert(`Failed to load module details: ${result.error || 'Unknown error'}`, 'error');
      detailHost.style.display = 'none';
      return;
    }
    const module = result.data.module;
    detailHost.style.display = 'block';
    detailHost.innerHTML = `
      <div class="card-header">
        <h3 class="card-title">${escapeHtmlModules(module.displayName || module.name || module.id)}</h3>
      </div>
      <div class="small-muted">${escapeHtmlModules(module.id)}</div>
      <p>${escapeHtmlModules(module.description || 'No description.')}</p>
      <p><strong>Status:</strong> ${escapeHtmlModules(module.lifecycleState || module.status || 'DISCOVERED')}</p>
      <p><strong>Registered:</strong> ${module.registered ? 'yes' : 'no'}</p>
      <p><strong>Path:</strong> ${escapeHtmlModules(module.modulePath || '—')}</p>
    `;
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

  async reload() {
    await this.loadModules();
    this.render();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminModulesView;
}
