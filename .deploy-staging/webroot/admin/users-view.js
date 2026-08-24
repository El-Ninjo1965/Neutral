'use strict';

/**
 * Admin Users View
 * User management UI with CRUD operations
 */

// Utility function to escape HTML
const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

class AdminUsersView {
  constructor(apiClient) {
    this.api = apiClient;
    this.users = [];
    this.editingUserId = null;
  }

  // Initialize the view
  async init(container) {
    this.container = container;
    await this.loadUsers();
    this.render();
  }

  // Load users from API
  async loadUsers() {
    const result = await this.api.getUsers();
    if (result.ok) {
      this.users = result.data.users || [];
    } else {
      AdminCommon.showAlert(`Failed to load users: ${result.error}`, 'error');
      this.users = [];
    }
  }

  // Render the view
  render() {
    this.container.innerHTML = `
      <div class="admin-users-view">
        <div class="section-header">
          <h2>User Management</h2>
          <button class="btn btn-primary" onclick="adminUsers.showCreateForm()">+ New User</button>
        </div>

        <div class="users-table-container" id="users-table"></div>
        <div class="create-form-container" id="create-form" style="display:none;"></div>
      </div>
    `;

    this.renderTable();
  }

  // Render users table
  renderTable() {
    const tableDiv = document.getElementById('users-table');
    if (!tableDiv) return;

    if (this.users.length === 0) {
      tableDiv.innerHTML = '<p class="empty-state">No users found. Create one to get started.</p>';
      return;
    }

    const table = document.createElement('table');
    table.className = 'admin-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Username</th>
          <th>Email</th>
          <th>Role</th>
          <th>Status</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${this.users.map(user => `
          <tr>
            <td><strong>${escapeHtml(user.username)}</strong></td>
            <td>${escapeHtml(user.email)}</td>
            <td><span class="badge badge-${user.role}">${escapeHtml(user.role)}</span></td>
            <td><span class="badge badge-${user.status}">${escapeHtml(user.status)}</span></td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            <td class="action-buttons">
              <button class="btn btn-sm btn-info" onclick="adminUsers.showEditForm('${user.id}')">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="adminUsers.deleteUser('${user.id}')">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    `;

    tableDiv.innerHTML = '';
    tableDiv.appendChild(table);
  }

  // Show create form
  showCreateForm() {
    this.editingUserId = null;
    this.showForm();
  }

  // Show edit form
  showEditForm(userId) {
    this.editingUserId = userId;
    this.showForm();
  }

  // Show create/edit form
  showForm() {
    const formDiv = document.getElementById('create-form');
    if (!formDiv) return;

    const user = this.editingUserId ? this.users.find(u => u.id === this.editingUserId) : null;
    const title = this.editingUserId ? 'Edit User' : 'Create New User';
    const submitText = this.editingUserId ? 'Update User' : 'Create User';

    const form = document.createElement('form');
    form.className = 'admin-form';
    form.innerHTML = `
      <h3>${title}</h3>
      
      ${!this.editingUserId ? `
        <div class="form-group">
          <label for="username">Username *</label>
          <input type="text" id="username" name="username" required placeholder="e.g., alice" value="${user ? escapeHtml(user.username) : ''}">
          <small>At least 3 characters</small>
        </div>
      ` : ''}

      <div class="form-group">
        <label for="email">Email *</label>
        <input type="email" id="email" name="email" required placeholder="e.g., user@example.com" value="${user ? escapeHtml(user.email) : ''}">
      </div>

      <div class="form-group">
        <label for="displayName">Display Name</label>
        <input type="text" id="displayName" name="displayName" placeholder="e.g., Alice Developer" value="${user ? escapeHtml(user.displayName || '') : ''}">
      </div>

      <div class="form-group">
        <label for="role">Role *</label>
        <select id="role" name="role" required>
          <option value="">Select a role</option>
          <option value="admin" ${user?.role === 'admin' ? 'selected' : ''}>Admin</option>
          <option value="developer" ${user?.role === 'developer' ? 'selected' : ''}>Developer</option>
          <option value="user" ${user?.role === 'user' ? 'selected' : ''}>User</option>
          <option value="viewer" ${user?.role === 'viewer' ? 'selected' : ''}>Viewer</option>
        </select>
      </div>

      <div class="form-group">
        <label for="status">Status *</label>
        <select id="status" name="status" required>
          <option value="active" ${user?.status === 'active' ? 'selected' : ''}>Active</option>
          <option value="inactive" ${user?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
          <option value="pending" ${user?.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="archived" ${user?.status === 'archived' ? 'selected' : ''}>Archived</option>
        </select>
      </div>

      ${this.editingUserId ? `
        <div class="form-group">
          <label for="password">New Password (leave empty to keep current)</label>
          <input type="password" id="password" name="password" placeholder="Leave empty to keep unchanged">
        </div>
      ` : `
        <div class="form-group">
          <label for="password">Password *</label>
          <input type="password" id="password" name="password" required placeholder="Enter a strong password">
        </div>
      `}

      <div class="form-actions">
        <button type="submit" class="btn btn-primary">${submitText}</button>
        <button type="button" class="btn btn-secondary" onclick="adminUsers.cancelForm()">Cancel</button>
      </div>
    `;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      
      if (this.editingUserId) {
        // Remove password if empty on edit
        if (!data.password) {
          delete data.password;
        }
        this.updateUser(data);
      } else {
        this.createUser(data);
      }
    });

    formDiv.innerHTML = '';
    formDiv.appendChild(form);
    formDiv.style.display = 'block';
  }

  // Create user
  async createUser(data) {
    const result = await this.api.createUser(data);
    if (result.ok) {
      AdminCommon.showAlert(`User "${data.username}" created successfully`, 'success');
      this.cancelForm();
      await this.loadUsers();
      this.renderTable();
    } else {
      AdminCommon.showAlert(`Failed to create user: ${result.error}`, 'error');
    }
  }

  // Update user
  async updateUser(data) {
    const result = await this.api.updateUser(this.editingUserId, data);
    if (result.ok) {
      AdminCommon.showAlert('User updated successfully', 'success');
      this.cancelForm();
      await this.loadUsers();
      this.renderTable();
    } else {
      AdminCommon.showAlert(`Failed to update user: ${result.error}`, 'error');
    }
  }

  // Delete user
  async deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    const result = await this.api.deleteUser(userId);
    if (result.ok) {
      AdminCommon.showAlert('User deleted successfully', 'success');
      await this.loadUsers();
      this.renderTable();
    } else {
      AdminCommon.showAlert(`Failed to delete user: ${result.error}`, 'error');
    }
  }

  // Cancel form
  cancelForm() {
    const formDiv = document.getElementById('create-form');
    if (formDiv) {
      formDiv.style.display = 'none';
    }
    this.editingUserId = null;
  }
}

// Export for browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminUsersView;
}
