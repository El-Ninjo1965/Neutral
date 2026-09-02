'use strict';

const escapeHtmlRoles = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

class AdminRolesView {
  constructor(apiClient) {
    this.api = apiClient;
    this.roles = [];
    this.permissions = [];
    this.editingRoleId = null;
  }

  async init(container) {
    this.container = container;
    await this.loadPermissions();
    await this.loadRoles();
    this.render();
  }

  async loadPermissions() {
    const result = await this.api.getPermissions();
    this.permissions = result.ok ? AdminCommon.unwrapData(result, 'permissions', []) : [];
  }

  async loadRoles() {
    const result = await this.api.getRoles();
    if (result.ok) {
      this.roles = AdminCommon.unwrapData(result, 'roles', []);
    } else {
      AdminCommon.showAlert(`Failed to load roles: ${result.error}`, 'error');
      this.roles = [];
    }
  }

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

  renderTable() {
    const tableDiv = document.getElementById('roles-table');
    if (!tableDiv) {
      return;
    }

    if (this.roles.length === 0) {
      tableDiv.innerHTML = '<p class="empty-state">No roles found.</p>';
      return;
    }

    tableDiv.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Role</th>
            <th>Description</th>
            <th>Permissions</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${this.roles.map((role) => `
            <tr>
              <td><strong>${escapeHtmlRoles(role.name)}</strong></td>
              <td>${escapeHtmlRoles(role.description || '—')}</td>
              <td>
                <details>
                  <summary>${Array.isArray(role.permissions) ? role.permissions.length : 0} permissions</summary>
                  <ul>${(role.permissions || []).map((permission) => `<li>${escapeHtmlRoles(permission)}</li>`).join('')}</ul>
                </details>
              </td>
              <td class="action-buttons">
                <button class="btn btn-sm btn-info" onclick="adminRoles.showEditForm('${escapeHtmlRoles(role.id)}')">Edit</button>
                ${['admin', 'developer', 'user', 'viewer'].includes(role.name)
                  ? '<button class="btn btn-sm btn-secondary" disabled title="Built-in role">Delete</button>'
                  : `<button class="btn btn-sm btn-danger" onclick="adminRoles.deleteRole('${escapeHtmlRoles(role.id)}')">Delete</button>`
                }
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  showCreateForm() {
    this.editingRoleId = null;
    this.showForm();
  }

  showEditForm(roleId) {
    this.editingRoleId = String(roleId);
    this.showForm();
  }

  showForm() {
    const formDiv = document.getElementById('create-form');
    if (!formDiv) {
      return;
    }

    const role = this.editingRoleId ? this.roles.find((entry) => String(entry.id) === String(this.editingRoleId)) : null;
    const isBuiltIn = role && ['admin', 'developer', 'user', 'viewer'].includes(role.name);

    const form = document.createElement('form');
    form.className = 'admin-form';
    form.innerHTML = `
      <h3>${this.editingRoleId ? 'Edit Role' : 'Create New Role'}</h3>
      ${!this.editingRoleId ? `
        <div class="form-group">
          <label for="name">Role Name *</label>
          <input type="text" id="name" name="name" required minlength="3" value="">
        </div>
      ` : ''}
      <div class="form-group">
        <label for="description">Description</label>
        <textarea id="description" name="description" rows="3">${escapeHtmlRoles(role?.description || '')}</textarea>
      </div>
      <div class="form-group">
        <label>Permissions</label>
        <div class="permissions-checklist">
          ${this.permissions.map((permission) => `
            <label class="permission-checkbox">
              <input type="checkbox" name="permissions" value="${escapeHtmlRoles(permission)}" ${(role?.permissions || []).includes(permission) ? 'checked' : ''}>
              ${escapeHtmlRoles(permission)}
            </label>
          `).join('')}
        </div>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" ${isBuiltIn ? 'disabled' : ''}>${this.editingRoleId ? 'Update Role' : 'Create Role'}</button>
        <button type="button" class="btn btn-secondary" onclick="adminRoles.cancelForm()">Cancel</button>
      </div>
    `;

    if (!isBuiltIn) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const payload = {
          description: formData.get('description') || '',
          permissions: formData.getAll('permissions').map((entry) => String(entry))
        };

        if (!this.editingRoleId) {
          payload.name = formData.get('name') || '';
          this.createRole(payload);
        } else {
          this.updateRole(payload);
        }
      });
    }

    formDiv.innerHTML = '';
    formDiv.appendChild(form);
    formDiv.style.display = 'block';
  }

  async createRole(data) {
    const result = await this.api.createRole(data);
    if (!result.ok) {
      AdminCommon.showAlert(`Failed to create role: ${result.error}`, 'error');
      return;
    }
    AdminCommon.showAlert(`Role "${data.name}" created successfully`, 'success');
    this.cancelForm();
    await this.loadRoles();
    this.renderTable();
  }

  async updateRole(data) {
    const result = await this.api.updateRole(this.editingRoleId, data);
    if (!result.ok) {
      AdminCommon.showAlert(`Failed to update role: ${result.error}`, 'error');
      return;
    }
    AdminCommon.showAlert('Role updated successfully', 'success');
    this.cancelForm();
    await this.loadRoles();
    this.renderTable();
  }

  async deleteRole(roleId) {
    if (!AdminCommon.confirmAction('Delete this role?')) {
      return;
    }
    const result = await this.api.deleteRole(roleId);
    if (!result.ok) {
      AdminCommon.showAlert(`Failed to delete role: ${result.error}`, 'error');
      return;
    }
    AdminCommon.showAlert('Role deleted successfully', 'success');
    await this.loadRoles();
    this.renderTable();
  }

  cancelForm() {
    const formDiv = document.getElementById('create-form');
    if (formDiv) {
      formDiv.style.display = 'none';
    }
    this.editingRoleId = null;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminRolesView;
}
