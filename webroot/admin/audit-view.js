'use strict';

class AdminAuditView {
  constructor(apiClient) {
    this.api = apiClient;
    this.entries = [];
    this.filters = { action: '', resource: '' };
  }

  async init(container) {
    this.container = container;
    await this.loadEntries();
    this.render();
  }

  async loadEntries() {
    const result = await this.api.getAuditEntries(this.filters);
    this.entries = result.ok && result.data && Array.isArray(result.data.entries)
      ? result.data.entries
      : [];
  }

  render() {
    this.container.innerHTML = `
      <div class="admin-audit-view">
        <div class="section-header">
          <h2>Audit Log</h2>
        </div>
        <form id="audit-filter-form" class="inline-form">
          <input type="text" id="auditAction" placeholder="Action (e.g. settings.update)" value="${this.escape(this.filters.action)}" />
          <input type="text" id="auditResource" placeholder="Resource (e.g. settings)" value="${this.escape(this.filters.resource)}" />
          <button type="submit" class="btn btn-secondary">Apply</button>
          <button type="button" class="btn btn-secondary" onclick="adminAudit.resetFilters()">Reset</button>
        </form>
        <div id="audit-table"></div>
      </div>
    `;

    const form = document.getElementById('audit-filter-form');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        this.filters = {
          action: document.getElementById('auditAction')?.value || '',
          resource: document.getElementById('auditResource')?.value || ''
        };
        await this.loadEntries();
        this.renderTable();
      });
    }

    this.renderTable();
  }

  async resetFilters() {
    this.filters = { action: '', resource: '' };
    await this.loadEntries();
    this.render();
  }

  renderTable() {
    const tableHost = document.getElementById('audit-table');
    if (!tableHost) return;

    if (!this.entries.length) {
      tableHost.innerHTML = '<p class="empty-state">No audit entries available.</p>';
      return;
    }

    tableHost.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Action</th>
            <th>Resource</th>
            <th>Actor</th>
            <th>Result</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          ${this.entries.map((entry) => `
            <tr>
              <td>${this.escape(entry.createdAt || '—')}</td>
              <td>${this.escape(entry.action || '—')}</td>
              <td>${this.escape(entry.resource || '—')}</td>
              <td>${this.escape(entry.actorUserId || '—')}</td>
              <td>${this.escape(entry.result || 'ok')}</td>
              <td><code>${this.escape(JSON.stringify(entry.details || {}))}</code></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminAuditView;
}
