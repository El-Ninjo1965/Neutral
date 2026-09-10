'use strict';

const commerceEscape = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const limitValue = (value) => value == null ? 'unlimited' : String(value);
const customLimit = (mode, value, fallback = null) => {
  if (mode === 'unlimited') return 'unlimited';
  if (mode === 'default') return null;
  const normalized = String(value ?? '').trim();
  return normalized === '' ? fallback : normalized;
};

class AdminPackagesView {
  constructor(api) { this.api = api; this.packages = []; this.modules = []; }

  async init(container) {
    this.container = container;
    const [packages, modules] = await Promise.all([this.api.get('/api/admin/packages'), this.api.discoverModules()]);
    this.packages = AdminCommon.unwrapData(packages, 'packages', []);
    this.modules = AdminCommon.unwrapData(modules, 'modules', []);
    this.render();
  }

  render() {
    this.container.innerHTML = `<div class="admin-packages-view"><div class="section-header"><h2>Packages / Entitlements</h2><button class="btn btn-primary" id="newPackage">+ New Package</button></div><p class="form-help">Packages control functional access and limits, never security roles.</p><div class="card-grid">${this.packages.map((p) => `<article class="card"><h3>${commerceEscape(p.name)}</h3><p>${commerceEscape(p.description || '')}</p><dl class="detail-list"><div><dt>Status</dt><dd>${commerceEscape(p.status)}</dd></div><div><dt>Default allowed devices per user</dt><dd>${p.allowedDevices == null ? 'Unlimited' : p.allowedDevices}</dd></div><div><dt>Active licenses</dt><dd>${p.activeLicenses || 0}</dd></div></dl><button class="btn btn-secondary" data-edit-package="${p.id}">Edit</button><button class="btn btn-danger" data-delete-package="${p.id}" ${Number(p.activeLicenses) > 0 ? 'disabled' : ''}>Delete</button></article>`).join('')}</div><div id="packageEditor"></div></div>`;
    this.container.querySelector('#newPackage')?.addEventListener('click', () => this.editor());
    this.container.querySelectorAll('[data-edit-package]').forEach((button) => button.addEventListener('click', () => this.editor(this.packages.find((p) => String(p.id) === button.dataset.editPackage))));
    this.container.querySelectorAll('[data-delete-package]').forEach((button) => button.addEventListener('click', async () => {
      if (!AdminCommon.confirmAction('Delete this unassigned package?')) return;
      const result = await this.api.delete(`/api/admin/packages/${button.dataset.deletePackage}`);
      if (result.ok) await this.init(this.container); else AdminCommon.showAlert(result.error, 'error');
    }));
  }

  editor(packageData = { modules: {} }) {
    const host = this.container.querySelector('#packageEditor');
    const mode = packageData.allowedDevices == null ? 'unlimited' : 'custom';
    host.innerHTML = `<form class="admin-form"><h3>${packageData.id ? 'Edit' : 'Create'} Package</h3><label>Key<input name="key" required pattern="[a-z0-9]+(?:[-_][a-z0-9]+)*" value="${commerceEscape(packageData.key || '')}"></label><small>Lowercase letters, numbers, hyphens and underscores; no spaces.</small><label>Name<input name="name" required value="${commerceEscape(packageData.name || '')}"></label><label>Description<input name="description" maxlength="500" value="${commerceEscape(packageData.description || '')}"></label><label>Status<select name="status"><option value="active">Active</option><option value="inactive" ${packageData.status === 'inactive' ? 'selected' : ''}>Inactive</option></select></label><fieldset class="device-limit-fieldset"><legend>Default allowed devices per user</legend><label><input type="radio" name="deviceLimitMode" value="custom" ${mode === 'custom' ? 'checked' : ''}> Custom limit</label><label><input type="radio" name="deviceLimitMode" value="unlimited" ${mode === 'unlimited' ? 'checked' : ''}> Unlimited</label><label class="custom-limit-field">Custom device limit<input name="deviceLimitValue" type="number" min="1" max="1000" inputmode="numeric" value="${mode === 'custom' ? commerceEscape(packageData.allowedDevices) : ''}"></label></fieldset><fieldset><legend>Module access</legend>${this.modules.map((module) => `<label>${commerceEscape(module.name || module.id)}<select data-module="${commerceEscape(module.id)}">${['available', 'locked', 'hidden'].map((state) => `<option ${packageData.modules?.[module.id] === state ? 'selected' : ''}>${state}</option>`).join('')}</select></label>`).join('')}</fieldset><button class="btn btn-primary" type="submit">Save Package</button></form>`;
    host.querySelector('form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const submit = form.querySelector('[type="submit"]');
      if (submit.disabled) return;
      const data = new FormData(form);
      const modules = {};
      host.querySelectorAll('[data-module]').forEach((select) => { modules[select.dataset.module] = select.value; });
      const allowedDevices = customLimit(data.get('deviceLimitMode'), data.get('deviceLimitValue'));
      if (data.get('deviceLimitMode') === 'custom' && allowedDevices == null) { AdminCommon.showAlert('Enter a custom device limit.', 'error'); return; }
      submit.disabled = true;
      const body = { key: data.get('key'), name: data.get('name'), description: data.get('description'), status: data.get('status'), allowedDevices, modules };
      try {
        const result = packageData.id ? await this.api.put(`/api/admin/packages/${packageData.id}`, body) : await this.api.post('/api/admin/packages', body);
        if (result.ok) { AdminCommon.showAlert(packageData.id ? 'Package updated successfully.' : 'Package created successfully.', 'success'); await this.init(this.container); } else AdminCommon.showAlert(result.error, 'error');
      } finally { if (submit.isConnected) submit.disabled = false; }
    });
  }
}

class AdminLicensesView {
  constructor(api) { this.api = api; this.licenses = []; this.packages = []; this.managerUsers = []; }

  async init(container) {
    this.container = container;
    const [licenses, packages, users] = await Promise.all([this.api.get('/api/admin/licenses'), this.api.get('/api/admin/packages'), this.api.searchUsers({ status: 'active' })]);
    this.licenses = AdminCommon.unwrapData(licenses, 'licenses', []);
    this.packages = AdminCommon.unwrapData(packages, 'packages', []);
    this.managerUsers = users.ok ? AdminCommon.unwrapData(users, 'users', []) : [];
    this.render();
  }

  render() {
    this.container.innerHTML = `<div class="admin-licenses-view"><div class="section-header"><h2>Licenses / Organizations</h2><button class="btn btn-primary" id="newLicense">+ New License</button></div><p class="form-help">User limits and device limits per user are managed independently. Revoke a referenced license instead of deleting its history.</p><div class="card-grid">${this.licenses.map((license) => `<article class="card"><h3>${commerceEscape(license.organizationName)}</h3><dl class="detail-list"><div><dt>Package</dt><dd>${commerceEscape(license.packageName)}</dd></div><div><dt>Users</dt><dd>${license.usedSeats} / ${license.seatLimit == null ? 'Unlimited' : license.seatLimit}</dd></div><div><dt>Devices per user</dt><dd>${license.allowedDevices == null ? 'Unlimited' : license.allowedDevices} (${commerceEscape(license.deviceLimitSource)})</dd></div><div><dt>License manager</dt><dd>${commerceEscape(license.managerUsername || 'None')}</dd></div><div><dt>Status</dt><dd>${commerceEscape(license.status)}</dd></div></dl><button class="btn btn-secondary" data-edit-license="${license.id}">Edit</button><button class="btn btn-danger" data-delete-license="${license.id}">Delete</button></article>`).join('')}</div><div id="licenseEditor"></div></div>`;
    this.container.querySelector('#newLicense')?.addEventListener('click', () => this.editor());
    this.container.querySelectorAll('[data-edit-license]').forEach((button) => button.addEventListener('click', () => this.editor(this.licenses.find((license) => String(license.id) === button.dataset.editLicense))));
    this.container.querySelectorAll('[data-delete-license]').forEach((button) => button.addEventListener('click', async () => {
      if (!AdminCommon.confirmAction('Delete this unreferenced license permanently? Assigned users or managers must be removed first.')) return;
      const result = await this.api.delete(`/api/admin/licenses/${button.dataset.deleteLicense}`);
      if (result.ok) { AdminCommon.showAlert('License deleted.', 'success'); await this.init(this.container); }
      else AdminCommon.showAlert(result.error || 'License could not be deleted.', 'error');
    }));
  }

  editor(license = {}) {
    const host = this.container.querySelector('#licenseEditor');
    const deviceMode = license.deviceLimitMode || (license.deviceLimitSource === 'license' ? (license.allowedDevices == null ? 'unlimited' : 'custom') : 'default');
    host.innerHTML = `<form class="admin-form"><h3>${license.id ? 'Edit' : 'Create'} License</h3><label>Key<input name="key" required pattern="[a-z0-9]+(?:[-_][a-z0-9]+)*" value="${commerceEscape(license.key || '')}"></label><small>Lowercase letters, numbers, hyphens and underscores; no spaces.</small><label>Organization<input name="organizationName" required value="${commerceEscape(license.organizationName || '')}"></label><label>Package<select name="packageId" required>${this.packages.map((p) => `<option value="${p.id}" ${String(license.packageId) === String(p.id) ? 'selected' : ''}>${commerceEscape(p.name)}</option>`).join('')}</select></label><label>User limit<input name="seatLimit" type="number" min="1" max="1000" inputmode="numeric" placeholder="Leave empty for unlimited" value="${license.seatLimit == null ? '' : commerceEscape(license.seatLimit)}"></label><fieldset class="device-limit-fieldset"><legend>Device limit per user</legend><label><input type="radio" name="deviceLimitMode" value="default" ${deviceMode === 'default' ? 'checked' : ''}> Use package default</label><label><input type="radio" name="deviceLimitMode" value="custom" ${deviceMode === 'custom' ? 'checked' : ''}> Custom limit</label><label><input type="radio" name="deviceLimitMode" value="unlimited" ${deviceMode === 'unlimited' ? 'checked' : ''}> Unlimited</label><label class="custom-limit-field">Custom device limit<input name="deviceLimitValue" type="number" min="1" max="1000" inputmode="numeric" value="${deviceMode === 'custom' ? commerceEscape(license.allowedDevices) : ''}"></label></fieldset><label>License manager<select name="managerUserId"><option value="">No manager</option>${this.managerUsers.map((user) => `<option value="${user.id}" ${String(license.managerUserId || '') === String(user.id) ? 'selected' : ''}>${commerceEscape(user.displayName || user.username)} (${commerceEscape(user.username)})</option>`).join('')}</select></label><label>Status<select name="status">${['active', 'blocked', 'inactive'].map((status) => `<option value="${status}" ${license.status === status ? 'selected' : ''}>${status === 'blocked' ? 'Revoked / blocked' : status}</option>`).join('')}</select></label><button class="btn btn-primary" type="submit">Save License</button></form>`;
    host.querySelector('form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const submit = form.querySelector('[type="submit"]');
      if (submit.disabled) return;
      const data = new FormData(form);
      const mode = data.get('deviceLimitMode');
      const allowedDevices = customLimit(mode, data.get('deviceLimitValue'));
      if (mode === 'custom' && allowedDevices == null) { AdminCommon.showAlert('Enter a custom device limit.', 'error'); return; }
      const body = Object.fromEntries(data);
      body.seatLimit = body.seatLimit === '' ? null : body.seatLimit;
      body.allowedDevices = allowedDevices;
      delete body.deviceLimitValue;
      submit.disabled = true;
      try {
        const result = license.id ? await this.api.put(`/api/admin/licenses/${license.id}`, body) : await this.api.post('/api/admin/licenses', body);
        if (result.ok) { AdminCommon.showAlert(license.id ? 'License updated successfully.' : 'License created successfully.', 'success'); await this.init(this.container); } else AdminCommon.showAlert(result.error, 'error');
      } finally { if (submit.isConnected) submit.disabled = false; }
    });
  }
}

if (typeof window !== 'undefined') { window.AdminPackagesView = AdminPackagesView; window.AdminLicensesView = AdminLicensesView; }
if (typeof module !== 'undefined' && module.exports) module.exports = { AdminPackagesView, AdminLicensesView, customLimit, limitValue };
