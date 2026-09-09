'use strict';

class AdminAuditView {
  constructor(apiClient) {
    this.api = apiClient;
    this.entries = [];
    this.filters = { action: '', resource: '', result: '', user: '', from: '', to: '' };
  }

  async init(container) {
    this.container = container;
    await this.loadEntries();
    this.render();
  }

  async loadEntries() {
    const result = await this.api.getAuditEntries(this.filters);
    this.entries = result.ok ? AdminCommon.unwrapData(result, 'entries', []) : [];
  }

  render() {
    this.container.innerHTML = `
      <div class="admin-audit-view">
        <div class="section-header">
          <h2>Audit Log</h2>
        </div>
        <form id="audit-filter-form" class="inline-form audit-filter-grid">
          <label>Action<input type="text" id="auditAction" placeholder="e.g. settings.update" value="${this.escape(this.filters.action)}" /></label>
          <label>Resource<input type="text" id="auditResource" placeholder="e.g. settings" value="${this.escape(this.filters.resource)}" /></label>
          <label>Actor user ID<input type="text" id="auditUser" inputmode="numeric" value="${this.escape(this.filters.user)}" /></label>
          <label>Result<select id="auditResult"><option value="">All results</option><option value="ok">OK</option><option value="error">Error</option></select></label>
          <label for="auditFrom">From date<input type="date" id="auditFrom" value="${this.escape(this.filters.from)}" /></label><label for="auditTo">To date<input type="date" id="auditTo" value="${this.escape(this.filters.to)}" /></label>
          <button type="submit" class="btn btn-secondary">Apply</button>
          <button type="button" class="btn btn-secondary" onclick="adminAudit.resetFilters()">Reset</button>
          <label>Audit retention<select id="auditRetention"><option value="30">30 days</option><option value="90" selected>90 days</option><option value="180">180 days</option><option value="365">365 days</option></select></label><button type="button" class="btn btn-danger" id="auditPurge">Purge older entries</button>
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
          resource: document.getElementById('auditResource')?.value || '', result: document.getElementById('auditResult')?.value || '', user: document.getElementById('auditUser')?.value || '', from: document.getElementById('auditFrom')?.value || '', to: document.getElementById('auditTo')?.value || ''
        };
        await this.loadEntries();
        this.renderTable();
      });
    }
    document.getElementById('auditPurge')?.addEventListener('click', async () => {
      const retentionDays = Number(document.getElementById('auditRetention')?.value || 90);
      if (!AdminCommon.confirmAction(`Permanently purge audit entries older than ${retentionDays} days? The purge itself will be audited.`)) return;
      const result = await this.api.post('/api/admin/audit/purge', { retentionDays });
      if (result.ok) { AdminCommon.showAlert('Audit retention applied.', 'success'); await this.init(this.container); }
      else AdminCommon.showAlert(`Audit purge failed: ${result.error || 'Unknown error'}`, 'error');
    });

    this.renderTable();
  }

  async resetFilters() {
    this.filters = { action: '', resource: '', result: '', user: '', from: '', to: '' };
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
              <td><details><summary>View details</summary><pre class="code-block">${this.escape(JSON.stringify(entry.details || {}, null, 2))}</pre></details></td>
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

if (typeof window !== 'undefined') {
  window.AdminAuditView = AdminAuditView;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminAuditView;
}
