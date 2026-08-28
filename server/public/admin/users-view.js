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
    this.editingUserId = null;
    this.filters = { q: '', status: '', role: '' };
  }

  async init(container) {
    this.container = container;
    await this.loadRoles();
    await this.loadUsers();
    this.render();
  }

  async loadRoles() {
    const result = await this.api.getRoles();
    this.roles = result.ok ? AdminCommon.unwrapData(result, 'roles', []) : [];
  }

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
            ${['active', 'inactive', 'pending', 'archived'].map((status) => `
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
        <label for="email">Email *</label>
        <input type="email" id="email" name="email" required value="${escapeHtmlUsers(user?.email || '')}">
      </div>
      <div class="form-group">
        <label for="displayName">Display Name</label>
        <input type="text" id="displayName" name="displayName" value="${escapeHtmlUsers(user?.displayName || '')}">
      </div>
      <div class="form-group">
        <label for="status">Status</label>
        <select id="status" name="status" required>
          ${['active', 'inactive', 'pending', 'archived'].map((status) => `
            <option value="${status}" ${user?.status === status ? 'selected' : ''}>${status}</option>
          `).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Roles</label>
        <div class="permissions-checklist">${roleOptions || '<small>No roles available.</small>'}</div>
      </div>
      <div class="form-group">
        <label for="password">${this.editingUserId ? 'New Password (optional)' : 'Password *'}</label>
        <input type="password" id="password" name="password" ${this.editingUserId ? '' : 'required'} minlength="8">
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
      const payload = {
        email: formData.get('email') || '',
        displayName: formData.get('displayName') || '',
        status: formData.get('status') || 'active',
        roles
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
    if (!confirm('Delete this user? This action cannot be undone.')) {
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminUsersView;
}
