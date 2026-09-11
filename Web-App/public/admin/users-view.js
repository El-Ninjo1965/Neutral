'use strict';

const escapeHtmlUsers = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

class AdminUsersView {
  constructor(apiClient) {
    this.api = apiClient;
    this.users = [];
    this.roles = [];
    this.licenses = [];
    this.packages = [];
    this.editingUserId = null;
    this.filters = { q: '', status: '', role: '' };
    this.viewState = 'list';
    this.sort = { key: 'id', direction: 'asc' };
  }

  async init(container) {
    this.container = container;
    await Promise.all([this.loadRoles(), this.loadLicenses(), this.loadPackages()]);
    await this.loadUsers();
    this.render();
  }

  async loadRoles() {
    const result = await this.api.getRoles();
    this.roles = result.ok ? AdminCommon.unwrapData(result, 'roles', []) : [];
  }

  async loadLicenses() { const result=await this.api.get('/api/admin/licenses');this.licenses=result.ok?AdminCommon.unwrapData(result,'licenses',[]):[]; }

  async loadPackages() { const result=await this.api.get('/api/admin/packages');this.packages=result.ok?AdminCommon.unwrapData(result,'packages',[]):[]; }

  async loadUsers() {
    const result = await this.api.searchUsers(this.filters);
    if (result.ok) {
      this.users = Array.isArray(AdminCommon.unwrapData(result, 'users', [])) ? AdminCommon.unwrapData(result, 'users', []) : [];
    } else {
      AdminCommon.showAlert(`Failed to load users: ${result.error}`, 'error');
      this.users = [];
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="admin-users-view" data-user-view="${this.viewState}">
        <div class="section-header">
          <h2>User Management</h2>
          <button class="btn btn-primary" onclick="adminUsers.showCreateForm()">+ New User</button>
        </div>
        <form id="users-filter-form" class="inline-form">
          <input type="text" id="filterQuery" placeholder="Search username, email, display name" value="${escapeHtmlUsers(this.filters.q || '')}" />
          <select id="filterStatus">
            <option value="">All statuses</option>
            ${['active', 'blocked'].map((status) => `
              <option value="${status}" ${this.filters.status === status ? 'selected' : ''}>${status}</option>
            `).join('')}
          </select>
          <select id="filterRole">
            <option value="">All roles</option>
            ${this.roles.map((role) => `
              <option value="${escapeHtmlUsers(role.id)}" ${this.filters.role === role.id ? 'selected' : ''}>${escapeHtmlUsers(role.name)}</option>
            `).join('')}
          </select>
          <button type="submit" class="btn btn-secondary">Apply</button>
          <button type="button" class="btn btn-secondary" onclick="adminUsers.resetFilters()">Reset</button>
        </form>
        <div class="users-table-container" id="users-table"></div>
        <div class="create-form-container" id="create-form" style="display:none;"></div>
      </div>
    `;
    this.bindFilterForm();
    this.renderTable();
  }

  bindFilterForm() {
    const form = document.getElementById('users-filter-form');
    if (!form) {
      return;
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      this.filters = {
        q: document.getElementById('filterQuery')?.value || '',
        status: document.getElementById('filterStatus')?.value || '',
        role: document.getElementById('filterRole')?.value || ''
      };
      await this.loadUsers();
      this.renderTable();
    });
  }

  async resetFilters() {
    this.filters = { q: '', status: '', role: '' };
    await this.loadUsers();
    this.render();
  }

  renderTable() {
    const tableDiv = document.getElementById('users-table');
    if (!tableDiv) return;
    if (this.users.length === 0) {
      tableDiv.innerHTML = '<p class="empty-state">No matching users found.</p>';
      return;
    }
    const valueFor = (user, key) => {
      if (key === 'user') return `${String(user.id || '').padStart(12, '0')} ${user.username || ''}`;
      if (key === 'roles') return (user.roles || []).join(',');
      if (key === 'devices') return Number(user.usedDevices || 0);
      if (key === 'package') return `${user.packageName || ''} ${user.licenseId || ''}`;
      return user[key] || '';
    };
    const direction = this.sort.direction === 'desc' ? -1 : 1;
    const users = this.users.map((user, index) => ({ user, index })).sort((a, b) => {
      const left = valueFor(a.user, this.sort.key);
      const right = valueFor(b.user, this.sort.key);
      const compared = typeof left === 'number' && typeof right === 'number'
        ? left - right
        : String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
      return compared === 0 ? a.index - b.index : compared * direction;
    }).map(({ user }) => user);
    const heading = (label, key) => `<button type="button" class="table-sort" data-user-sort="${key}" aria-label="Sort by ${label}">${label}${this.sort.key === key ? (this.sort.direction === 'asc' ? ' ↑' : ' ↓') : ''}</button>`;
    const sourceLabel = (user) => {
      if (user.deviceLimitSource === 'user_override') return 'User override';
      if (user.deviceLimitSource === 'license_default') return 'License default';
      if (user.deviceLimitSource === 'package_default') return `Package ${user.packageName || 'default'}`;
      return 'System default';
    };
    tableDiv.innerHTML = `
      <table class="admin-table">
        <thead><tr>
          <th>${heading('User / ID', 'user')}</th><th>${heading('Role', 'roles')}</th><th>${heading('Status', 'status')}</th>
          <th>${heading('Created', 'createdAt')}</th><th>${heading('Last Activity', 'lastActivityAt')}</th><th>${heading('Devices', 'devices')}</th>
          <th>${heading('License / Package', 'package')}</th><th>${heading('Organization', 'organizationName')}</th><th>Actions</th>
        </tr></thead>
        <tbody>${users.map((user) => `
          <tr>
            <td><strong>${escapeHtmlUsers(user.username)}</strong><br><small>#${escapeHtmlUsers(user.id)}</small></td>
            <td>${Array.isArray(user.roles) && user.roles.length ? user.roles.map((role) => `<span class="chip">${escapeHtmlUsers(role)}</span>`).join(' ') : '—'}</td>
            <td><span class="badge badge-${escapeHtmlUsers(user.status || 'active')}">${escapeHtmlUsers(user.status || 'active')}</span></td>
            <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</td>
            <td>${user.lastActivityAt ? new Date(user.lastActivityAt.replace(' ', 'T') + 'Z').toLocaleString() : 'Inactive'}</td>
            <td><button type="button" class="btn btn-sm btn-secondary" onclick="adminRouter.showView('sessions')">${Number(user.usedDevices || 0)} / ${user.allowedDevices == null ? 'Unlimited' : Number(user.allowedDevices)}</button><br><small>${escapeHtmlUsers(sourceLabel(user))}</small></td>
            <td>${user.licenseId ? `License #${escapeHtmlUsers(user.licenseId)}<br>` : ''}${escapeHtmlUsers(user.packageName || 'Unassigned')}<br><small>${user.packageSource === 'direct' ? 'Direct package' : (user.packageSource === 'license' ? 'From license' : 'System policy')}</small></td>
            <td>${escapeHtmlUsers(user.organizationName || '—')}</td>
            <td class="action-buttons"><button class="btn btn-sm btn-info" onclick="adminUsers.showEditForm('${escapeHtmlUsers(user.id)}')">Edit</button><button class="btn btn-sm btn-danger" onclick="adminUsers.deleteUser('${escapeHtmlUsers(user.id)}')">Delete</button></td>
          </tr>`).join('')}</tbody>
      </table>`;
    tableDiv.querySelectorAll('[data-user-sort]').forEach((button) => button.addEventListener('click', () => {
      const key = button.dataset.userSort;
      this.sort = { key, direction: this.sort.key === key && this.sort.direction === 'asc' ? 'desc' : 'asc' };
      this.renderTable();
    }));
  }

  showCreateForm() {
    this.editingUserId = null;
    this.showForm();
  }

  showEditForm(userId) {
    this.editingUserId = String(userId);
    this.showForm();
  }

  showForm() {
    const formDiv = document.getElementById('create-form');
    if (!formDiv) {
      return;
    }

    const user = this.editingUserId ? this.users.find((entry) => String(entry.id) === String(this.editingUserId)) : null;
    const title = this.editingUserId ? 'Edit User' : 'Create New User';
    const submitText = this.editingUserId ? 'Update User' : 'Create User';
    const selectedRoles = Array.isArray(user?.roles) ? user.roles : [];

    const roleOptions = this.roles.map((role) => `
      <label class="permission-checkbox">
        <input type="checkbox" name="roles" value="${escapeHtmlUsers(role.id)}" ${selectedRoles.includes(role.id) ? 'checked' : ''} />
        ${escapeHtmlUsers(role.name)}
      </label>
    `).join('');

    const form = document.createElement('form');
    form.className = 'admin-form';
    form.innerHTML = `
      <h3>${title}</h3>
      ${!this.editingUserId ? `
        <div class="form-group">
          <label for="username">Username *</label>
          <input type="text" id="username" name="username" required minlength="3" value="">
        </div>
      ` : `
        <div class="form-group"><label for="userId">User ID</label><input type="text" id="userId" value="${escapeHtmlUsers(user?.id || '')}" readonly></div>
        <div class="form-group"><label for="editUsername">Username</label><input type="text" id="editUsername" value="${escapeHtmlUsers(user?.username || '')}" readonly></div>
      `}
      <div class="form-group">
        <label for="displayName">Display Name</label>
        <input type="text" id="displayName" name="displayName" value="${escapeHtmlUsers(user?.displayName || '')}">
      </div>
      <div class="form-group">
        <label for="email">Email (optional)</label>
        <input type="email" id="email" name="email" value="${escapeHtmlUsers(user?.email || '')}">
      </div>
      <div class="form-group">
        <label for="packageId">Package</label>
        <select id="packageId" name="packageId"><option value="">Unassigned</option>${this.packages.filter((p) => p.status === 'active' || String(p.id) === String(user?.directPackageId || '')).map((p) => `<option value="${escapeHtmlUsers(p.id)}" ${String(user?.directPackageId || user?.effectivePackageId || '') === String(p.id) ? 'selected' : ''}>${escapeHtmlUsers(p.name)}</option>`).join('')}</select>
        <small id="package-source-help">Direct package for an individual user.</small>
      </div>
      <div class="form-group">
        <label for="licenseId">License / Organization</label>
        <select id="licenseId" name="licenseId"><option value="">Unassigned</option>${this.licenses.map(l=>`<option value="${escapeHtmlUsers(l.id)}" ${String(user?.licenseId||'')===String(l.id)?'selected':''}>${escapeHtmlUsers(l.organizationName)} — ${escapeHtmlUsers(l.packageName)}</option>`).join('')}</select>
      </div>
      <fieldset class="form-group device-limit-fieldset"><legend>Allowed devices</legend>
        <label><input type="radio" name="deviceLimitMode" value="default" ${user?.deviceLimitSource !== 'user_override' ? 'checked' : ''}> Package / License default</label>
        <label><input type="radio" name="deviceLimitMode" value="custom" ${user?.deviceLimitSource === 'user_override' && user?.allowedDevices != null ? 'checked' : ''}> Custom device limit</label>
        <label><input type="radio" name="deviceLimitMode" value="unlimited" ${user?.deviceLimitSource === 'user_override' && user?.allowedDevices == null ? 'checked' : ''}> Unlimited</label>
        <label class="custom-limit-field" for="allowedDevices">Custom device limit<input id="allowedDevices" name="allowedDevices" type="number" min="1" max="1000" inputmode="numeric" value="${user?.deviceLimitSource === 'user_override' && user?.allowedDevices != null ? Number(user.allowedDevices) : ''}"></label>
        <small>Lowering the limit does not revoke existing sessions; additional devices are blocked until explicitly revoked.</small>
      </fieldset>
      <div class="form-group">
        <label for="status">Status</label>
        <select id="status" name="status" required>
          ${['active', 'blocked'].map((status) => `
            <option value="${status}" ${user?.status === status ? 'selected' : ''}>${status}</option>
          `).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Role *</label>
        <div class="permissions-checklist">${roleOptions || '<small>No roles available.</small>'}</div>
      </div>
      <div class="form-group">
        <label for="password">${this.editingUserId ? 'New Password (optional)' : 'Password *'}</label>
        <input type="password" id="password" name="password" ${this.editingUserId ? '' : 'required'} minlength="8" maxlength="25" pattern="\\S{8,25}" aria-describedby="password-help">
        <small id="password-help">8–25 characters, no spaces. No other composition rules.</small>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">${submitText}</button>
        <button type="button" class="btn btn-secondary" onclick="adminUsers.cancelForm()">Cancel</button>
      </div>
    `;

    const licenseSelect = form.querySelector('#licenseId');
    const packageSelect = form.querySelector('#packageId');
    const packageHelp = form.querySelector('#package-source-help');
    const syncPackageSource = () => {
      const license = this.licenses.find((entry) => String(entry.id) === String(licenseSelect.value));
      if (license) {
        packageSelect.value = String(license.packageId);
        packageSelect.disabled = true;
        packageHelp.textContent = `Effective package is inherited from ${license.organizationName}. Removing the license keeps this package as the direct fallback.`;
      } else {
        packageSelect.disabled = false;
        packageHelp.textContent = 'Direct package for an individual user.';
      }
    };
    licenseSelect.addEventListener('change', syncPackageSource);
    syncPackageSource();

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const roles = formData.getAll('roles').map((entry) => String(entry));
      if (roles.length === 0) { AdminCommon.showAlert('Select one role.', 'error'); return; }
      const deviceLimitMode = formData.get('deviceLimitMode') || 'default';
      const customDeviceLimit = String(formData.get('allowedDevices') || '').trim();
      if (deviceLimitMode === 'custom' && customDeviceLimit === '') { AdminCommon.showAlert('Enter a custom device limit.', 'error'); return; }
      const payload = {
        email: formData.get('email') || '',
        displayName: formData.get('displayName') || '',
        status: formData.get('status') || 'active',
        roles
        ,licenseId: formData.get('licenseId') || '', packageId: packageSelect.value || '', allowedDevices: deviceLimitMode === 'custom' ? customDeviceLimit : deviceLimitMode
      };

      if (!this.editingUserId) {
        payload.username = formData.get('username') || '';
      }

      const password = formData.get('password');
      if (password) {
        payload.password = password;
      }

      if (this.editingUserId) {
        this.updateUser(payload);
      } else {
        this.createUser(payload);
      }
    });

    formDiv.innerHTML = '';
    formDiv.appendChild(form);
    formDiv.style.display = 'block';
    this.viewState = this.editingUserId ? 'edit' : 'create';
    this.container.querySelector('.admin-users-view')?.setAttribute('data-user-view', this.viewState);
    this.container.querySelector('.users-table-container')?.setAttribute('hidden', '');
    this.container.querySelector('#users-filter-form')?.setAttribute('hidden', '');
    this.container.querySelector('.section-header > .btn-primary')?.setAttribute('hidden', '');
    window.NeutralUiFeedback?.enhancePasswordFields(form);
  }

  async createUser(data) {
    const result = await this.api.createUser(data);
    if (!result.ok) {
      AdminCommon.showAlert(`Failed to create user: ${result.error}`, 'error');
      return;
    }
    AdminCommon.showAlert(`User "${data.username}" created successfully`, 'success');
    this.cancelForm();
    await this.loadUsers();
    this.renderTable();
  }

  async updateUser(data) {
    const result = await this.api.updateUser(this.editingUserId, data);
    if (!result.ok) {
      AdminCommon.showAlert(`Failed to update user: ${result.error}`, 'error');
      return;
    }
    AdminCommon.showAlert('User updated successfully', 'success');
    this.cancelForm();
    await this.loadUsers();
    this.renderTable();
  }

  async deleteUser(userId) {
    if (!AdminCommon.confirmAction('Delete this user? This action cannot be undone.')) {
      return;
    }
    const result = await this.api.deleteUser(userId);
    if (!result.ok) {
      AdminCommon.showAlert(`Failed to delete user: ${result.error}`, 'error');
      return;
    }
    AdminCommon.showAlert('User deleted successfully', 'success');
    await this.loadUsers();
    this.renderTable();
  }

  cancelForm() {
    const formDiv = document.getElementById('create-form');
    if (formDiv) {
      formDiv.style.display = 'none';
    }
    this.editingUserId = null;
    this.viewState = 'list';
    this.sort = { key: 'id', direction: 'asc' };
    this.container?.querySelector('.admin-users-view')?.setAttribute('data-user-view', 'list');
    this.container?.querySelector('.users-table-container')?.removeAttribute('hidden');
    this.container?.querySelector('#users-filter-form')?.removeAttribute('hidden');
    this.container?.querySelector('.section-header > .btn-primary')?.removeAttribute('hidden');
  }
}

if (typeof window !== 'undefined') {
  window.AdminUsersView = AdminUsersView;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminUsersView;
}
