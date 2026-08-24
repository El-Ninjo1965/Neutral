'use strict';

/**
 * Admin Common Components
 * Shared UI components for admin panel
 */

// Utility function to escape HTML
const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const AdminCommon = {
  // Create a form container
  createForm(id, title, fields, onSubmit) {
    const form = document.createElement('form');
    form.id = id;
    form.className = 'admin-form';
    form.innerHTML = `
      <h3>${escapeHtml(title)}</h3>
      <div class="form-fields"></div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Save</button>
        <button type="button" class="btn btn-secondary" onclick="this.form.reset()">Reset</button>
      </div>
    `;

    const fieldsContainer = form.querySelector('.form-fields');
    
    fields.forEach(field => {
      const fieldGroup = document.createElement('div');
      fieldGroup.className = 'form-group';
      
      let input = '';
      if (field.type === 'textarea') {
        input = `<textarea name="${field.name}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}></textarea>`;
      } else if (field.type === 'select') {
        const options = field.options ? field.options.map(opt => 
          `<option value="${opt.value}">${escapeHtml(opt.label)}</option>`
        ).join('') : '';
        input = `<select name="${field.name}" ${field.required ? 'required' : ''}>${options}</select>`;
      } else if (field.type === 'checkbox') {
        input = `<input type="checkbox" name="${field.name}" />`;
      } else {
        input = `<input type="${field.type || 'text'}" name="${field.name}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''} />`;
      }
      
      fieldGroup.innerHTML = `
        <label>${escapeHtml(field.label)}</label>
        ${input}
        ${field.help ? `<small>${escapeHtml(field.help)}</small>` : ''}
      `;
      
      fieldsContainer.appendChild(fieldGroup);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      onSubmit(data);
    });

    return form;
  },

  // Create a data table
  createTable(id, title, columns, rows, actions) {
    const container = document.createElement('div');
    container.className = 'admin-table-container';
    
    container.innerHTML = `
      <div class="table-header">
        <h3>${escapeHtml(title)}</h3>
        <button class="btn btn-sm btn-primary" onclick="document.getElementById('${id}-modal').style.display='block'">+ Add New</button>
      </div>
      <table id="${id}" class="admin-table">
        <thead>
          <tr>
            ${columns.map(col => `<th>${escapeHtml(col.label)}</th>`).join('')}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    `;

    const tbody = container.querySelector('tbody');
    
    rows.forEach((row, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        ${columns.map(col => `<td>${escapeHtml(String(row[col.key] || ''))}</td>`).join('')}
        <td class="action-buttons">
          ${actions.edit ? `<button class="btn btn-sm btn-info" onclick="editRow('${row.id}', ${idx})">Edit</button>` : ''}
          ${actions.delete ? `<button class="btn btn-sm btn-danger" onclick="deleteRow('${row.id}', ${idx})">Delete</button>` : ''}
        </td>
      `;
      tbody.appendChild(tr);
    });

    return container;
  },

  // Create a modal dialog
  createModal(id, title, content) {
    const modal = document.createElement('div');
    modal.id = id;
    modal.className = 'admin-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${escapeHtml(title)}</h2>
          <button class="close" onclick="document.getElementById('${id}').style.display='none'">&times;</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
      </div>
    `;
    return modal;
  },

  // Create an alert/notification
  showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
      <div class="alert-content">
        ${escapeHtml(message)}
        <button class="close" onclick="this.parentElement.parentElement.remove()">&times;</button>
      </div>
    `;
    document.body.insertBefore(alert, document.body.firstChild);
    
    // Auto-close after 5 seconds
    if (type !== 'error') {
      setTimeout(() => alert.remove(), 5000);
    }
  },

  // Format data for display
  formatValue(value, type = 'text') {
    if (value === null || value === undefined) return '—';
    if (type === 'date') return new Date(value).toLocaleString();
    if (type === 'array') return Array.isArray(value) ? value.join(', ') : value;
    return escapeHtml(String(value));
  }
};

// Helper to escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Export for browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AdminCommon, escapeHtml };
}
