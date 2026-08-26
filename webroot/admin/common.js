'use strict';

/**
 * Admin Common Components
 * Shared UI components for admin panel
 */

// Utility function to escape HTML
const escapeHtmlCommon = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const AdminCommon = {
  unwrapData(result, key = null, fallback = null) {
    if (!result || result.ok !== true || !result.data || typeof result.data !== 'object') {
      return fallback;
    }

    const payload = result.data && result.data.ok === true && result.data.data && typeof result.data.data === 'object'
      ? result.data.data
      : result.data;

    if (key === null) {
      return payload;
    }

    const nestedValue = Object.prototype.hasOwnProperty.call(payload, key)
      ? payload[key]
      : (Object.prototype.hasOwnProperty.call(result.data, key) ? result.data[key] : fallback);

    return nestedValue === undefined ? fallback : nestedValue;
  },

  // Create a form container
  createForm(id, title, fields, onSubmit) {
    const form = document.createElement('form');
    form.id = id;
    form.className = 'admin-form';
    form.innerHTML = `
      <h3>${escapeHtmlCommon(title)}</h3>
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
          `<option value="${opt.value}">${escapeHtmlCommon(opt.label)}</option>`
        ).join('') : '';
        input = `<select name="${field.name}" ${field.required ? 'required' : ''}>${options}</select>`;
      } else if (field.type === 'checkbox') {
        input = `<input type="checkbox" name="${field.name}" />`;
      } else {
        input = `<input type="${field.type || 'text'}" name="${field.name}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''} />`;
      }
      
      fieldGroup.innerHTML = `
        <label>${escapeHtmlCommon(field.label)}</label>
        ${input}
        ${field.help ? `<small>${escapeHtmlCommon(field.help)}</small>` : ''}
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
        <h3>${escapeHtmlCommon(title)}</h3>
        <button class="btn btn-sm btn-primary" onclick="document.getElementById('${id}-modal').style.display='block'">+ Add New</button>
      </div>
      <table id="${id}" class="admin-table">
        <thead>
          <tr>
            ${columns.map(col => `<th>${escapeHtmlCommon(col.label)}</th>`).join('')}
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
        ${columns.map(col => `<td>${escapeHtmlCommon(String(row[col.key] || ''))}</td>`).join('')}
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
          <h2>${escapeHtmlCommon(title)}</h2>
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
        ${escapeHtmlCommon(message)}
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
    return escapeHtmlCommon(String(value));
  }
};

// Export for browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AdminCommon, escapeHtml: escapeHtmlCommon };
}
