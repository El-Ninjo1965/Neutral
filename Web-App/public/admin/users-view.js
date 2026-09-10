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
    this.editingUserId = null;
    this.filters = { q: '', status: '', role: '' };
  }

  async init(container) {
    this.container = container;
    await Promise.all([this.loadRoles(), this.loadLicenses()]);
    await this.loadUsers();
    this.render();
  }

  async loadRoles() {
    const result = await this.api.getRoles();
    this.roles = result.ok ? AdminCommon.unwrapData(result, 'roles', []) : [];
  }

  async loadLicenses() { const result=await this.api.get('/api/admin/licenses');this.licenses=result.ok?AdminCommon.unwrapData(result,'licenses',[]):[]; }

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
      <div class="admin-users-view">
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
    if (!tableDiv) {
      return;
    }

    if (this.users.length === 0) {
      tableDiv.innerHTML = '<p class="empty-state">No matching users found.</p>';
      return;
    }

    tableDiv.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Roles</th>
            <th>Status</th>
            <th>Created</th>
            <th>Last Activity</th>
            <th>Devices</th>
            <th>License / Package</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${this.users.map((user) => `
            <tr>
              <td>${escapeHtmlUsers(user.id)}</td>
              <td><strong>${escapeHtmlUsers(user.username)}</strong></td>
              <td>${escapeHtmlUsers(user.email || '—')}</td>
              <td>${Array.isArray(user.roles) && user.roles.length ? user.roles.map((r) => `<span class="chip">${escapeHtmlUsers(r)}</span>`).join(' ') : '—'}</td>
              <td><span class="badge badge-${escapeHtmlUsers(user.status || 'active')}">${escapeHtmlUsers(user.status || 'active')}</span></td>
              <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</td>
              <td>${user.lastActivityAt ? new Date(user.lastActivityAt.replace(' ', 'T') + 'Z').toLocaleString() : 'Inactive'}</td>
              <td><button type="button" class="btn btn-sm btn-secondary" onclick="adminRouter.showView('sessions')">${Number(user.usedDevices || 0)} / ${user.allowedDevices == null ? 'Unlimited' : Number(user.allowedDevices)}</button></td>
              <td>${escapeHtmlUsers(user.packageName||'Unassigned')}<br><small>${escapeHtmlUsers(user.deviceLimitSource||'system_default')}</small></td>
              <td class="action-buttons">
                <button class="btn btn-sm btn-info" onclick="adminUsers.showEditForm('${escapeHtmlUsers(user.id)}')">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="adminUsers.deleteUser('${escapeHtmlUsers(user.id)}')">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
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
      ` : ''}
      <div class="form-group">
        <label for="email">Email (optional)</label>
        <input type="email" id="email" name="email" value="${escapeHtmlUsers(user?.email || '')}">
      </div>
      <div class="form-group">
        <label for="displayName">Display Name</label>
        <input type="text" id="displayName" name="displayName" value="${escapeHtmlUsers(user?.displayName || '')}">
      </div>
      <div class="form-group">
        <label for="licenseId">License / Organization</label>
        <select id="licenseId" name="licenseId"><option value="">Unassigned</option>${this.licenses.map(l=>`<option value="${escapeHtmlUsers(l.id)}" ${String(user?.licenseId||'')===String(l.id)?'selected':''}>${escapeHtmlUsers(l.organizationName)} — ${escapeHtmlUsers(l.packageName)}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label for="allowedDevices">Allowed Devices</label><select id="allowedDevices" name="allowedDevices"><option value="default">Package / License default</option><option value="unlimited" ${user?.allowedDevices==null?'selected':''}>Unlimited override</option>${[1,2,3,5,10].map(n=>`<option value="${n}" ${user?.deviceLimitSource==='user_override'&&Number(user.allowedDevices)===n?'selected':''}>Override: ${n}</option>`).join('')}</select><small>Lowering the limit does not revoke existing sessions; additional devices are blocked until explicitly revoked.</small></div>
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

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const roles = formData.getAll('roles').map((entry) => String(entry));
      if (roles.length === 0) { AdminCommon.showAlert('Select one role.', 'error'); return; }
      const payload = {
        email: formData.get('email') || '',
        displayName: formData.get('displayName') || '',
        status: formData.get('status') || 'active',
        roles
        ,licenseId: formData.get('licenseId') || '', allowedDevices: formData.get('allowedDevices') || 'default'
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
  }
}

if (typeof window !== 'undefined') {
  window.AdminUsersView = AdminUsersView;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminUsersView;
}
