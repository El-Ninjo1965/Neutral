'use strict';

/**
 * Admin Roles View
 * Role management UI with CRUD operations
 */

// Utility function to escape HTML
const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

class AdminRolesView {
  constructor(apiClient) {
    this.api = apiClient;
    this.roles = [];
    this.editingRoleId = null;
  }

  // Initialize the view
  async init(container) {
    this.container = container;
    await this.loadRoles();
    this.render();
  }

  // Load roles from API
  async loadRoles() {
    const result = await this.api.getRoles();
    if (result.ok) {
      this.roles = result.data.roles || [];
    } else {
      AdminCommon.showAlert(`Failed to load roles: ${result.error}`, 'error');
      this.roles = [];
    }
  }

  // Render the view
  render() {
    this.container.innerHTML = `
      <div class="admin-roles-view">
        <div class="section-header">
          <h2>Role Management</h2>
          <button class="btn btn-primary" onclick="adminRoles.showCreateForm()">+ New Role</button>
        </div>

        <div class="roles-table-container" id="roles-table"></div>
        <div class="create-form-container" id="create-form" style="display:none;"></div>
      </div>
    `;

    this.renderTable();
  }

  // Render roles table
  renderTable() {
    const tableDiv = document.getElementById('roles-table');
    if (!tableDiv) return;

    if (this.roles.length === 0) {
      tableDiv.innerHTML = '<p class="empty-state">No roles found.</p>';
      return;
    }

    const table = document.createElement('table');
    table.className = 'admin-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Role Name</th>
          <th>Description</th>
          <th>Permissions</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${this.roles.map(role => `
          <tr>
            <td><strong>${escapeHtml(role.name)}</strong></td>
            <td>${escapeHtml(role.description || '—')}</td>
            <td>
              <details>
                <summary>${role.permissions.length} permissions</summary>
                <ul>${role.permissions.map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul>
              </details>
            </td>
            <td class="action-buttons">
              <button class="btn btn-sm btn-info" onclick="adminRoles.showEditForm('${role.id}')">Edit</button>
              ${['admin', 'developer', 'user', 'viewer'].includes(role.name) 
                ? '<button class="btn btn-sm btn-secondary" disabled title="Built-in role">Delete</button>'
                : `<button class="btn btn-sm btn-danger" onclick="adminRoles.deleteRole('${role.id}')">Delete</button>`
              }
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
    this.editingRoleId = null;
    this.showForm();
  }

  // Show edit form
  showEditForm(roleId) {
    this.editingRoleId = roleId;
    this.showForm();
  }

  // Show create/edit form
  showForm() {
    const formDiv = document.getElementById('create-form');
    if (!formDiv) return;

    const role = this.editingRoleId ? this.roles.find(r => r.id === this.editingRoleId) : null;
    const title = this.editingRoleId ? 'Edit Role' : 'Create New Role';
    const submitText = this.editingRoleId ? 'Update Role' : 'Create Role';
    const isBuiltIn = role && ['admin', 'developer', 'user', 'viewer'].includes(role.name);

    const form = document.createElement('form');
    form.className = 'admin-form';
    form.innerHTML = `
      <h3>${title}</h3>
      
      ${!this.editingRoleId ? `
        <div class="form-group">
          <label for="name">Role Name *</label>
          <input type="text" id="name" name="name" required placeholder="e.g., moderator" value="">
          <small>Lowercase, no spaces</small>
        </div>
      ` : ''}

      <div class="form-group">
        <label for="description">Description</label>
        <textarea id="description" name="description" placeholder="Describe the role's purpose" rows="3">${role ? escapeHtml(role.description || '') : ''}</textarea>
      </div>

      <div class="form-group">
        <label>Permissions</label>
        <div class="permissions-checklist">
          ${this.renderPermissionCheckboxes(role)}
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" ${isBuiltIn ? 'disabled' : ''}>${submitText}</button>
        <button type="button" class="btn btn-secondary" onclick="adminRoles.cancelForm()">Cancel</button>
      </div>
    `;

    if (!isBuiltIn) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const permissions = [];
        formData.forEach((value, key) => {
          if (key === 'permission' && value) {
            permissions.push(value);
          }
        });

        const data = {
          name: formData.get('name') || role?.name,
          description: formData.get('description'),
          permissions
        };

        if (this.editingRoleId) {
          delete data.name; // Can't change role name
          this.updateRole(data);
        } else {
          this.createRole(data);
        }
      });
    }

    formDiv.innerHTML = '';
    formDiv.appendChild(form);
    formDiv.style.display = 'block';
  }

  // Render permission checkboxes
  renderPermissionCheckboxes(role) {
    const availablePermissions = [
      'admin.read', 'admin.write',
      'user.read', 'user.write',
      'role.read', 'role.write',
      'app.read', 'app.write',
      'settings.read', 'settings.write'
    ];

    return availablePermissions.map(perm => `
      <label class="permission-checkbox">
        <input type="checkbox" name="permission" value="${perm}" 
          ${role?.permissions?.includes(perm) ? 'checked' : ''} />
        ${escapeHtml(perm)}
      </label>
    `).join('');
  }

  // Create role
  async createRole(data) {
    const result = await this.api.createRole(data);
    if (result.ok) {
      AdminCommon.showAlert(`Role "${data.name}" created successfully`, 'success');
      this.cancelForm();
      await this.loadRoles();
      this.renderTable();
    } else {
      AdminCommon.showAlert(`Failed to create role: ${result.error}`, 'error');
    }
  }

  // Update role
  async updateRole(data) {
    const result = await this.api.updateRole(this.editingRoleId, data);
    if (result.ok) {
      AdminCommon.showAlert('Role updated successfully', 'success');
      this.cancelForm();
      await this.loadRoles();
      this.renderTable();
    } else {
      AdminCommon.showAlert(`Failed to update role: ${result.error}`, 'error');
    }
  }

  // Delete role
  async deleteRole(roleId) {
    if (!confirm('Are you sure you want to delete this role?')) return;

    const result = await this.api.deleteRole(roleId);
    if (result.ok) {
      AdminCommon.showAlert('Role deleted successfully', 'success');
      await this.loadRoles();
      this.renderTable();
    } else {
      AdminCommon.showAlert(`Failed to delete role: ${result.error}`, 'error');
    }
  }

  // Cancel form
  cancelForm() {
    const formDiv = document.getElementById('create-form');
    if (formDiv) {
      formDiv.style.display = 'none';
    }
    this.editingRoleId = null;
  }
}

// Export for browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminRolesView;
}
