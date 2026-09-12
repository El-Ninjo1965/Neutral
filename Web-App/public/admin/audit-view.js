'use strict';

class AdminAuditView {
  constructor(apiClient) {
    this.api = apiClient;
    this.entries = [];
    this.allowClearAll = false;
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
    this.allowClearAll = result.ok && AdminCommon.unwrapData(result, 'allowClearAll', false) === true;
  }

  render() {
    this.container.innerHTML = `
      <div class="admin-audit-view">
        <div class="section-header">
          <h2>Audit Log</h2>
        </div>
        <section class="audit-filter-section" aria-labelledby="audit-filter-heading"><h3 id="audit-filter-heading">Filter entries</h3><form id="audit-filter-form" class="audit-filter-grid">
          <label>Action<input type="text" id="auditAction" placeholder="e.g. settings.update" value="${this.escape(this.filters.action)}" /></label>
          <label>Resource<input type="text" id="auditResource" placeholder="e.g. settings" value="${this.escape(this.filters.resource)}" /></label>
          <label>Actor user ID<input type="text" id="auditUser" inputmode="numeric" value="${this.escape(this.filters.user)}" /></label>
          <label>Result<select id="auditResult"><option value="">All results</option><option value="ok">OK</option><option value="error">Error</option></select></label>
          <label for="auditFrom">From date<input type="date" id="auditFrom" value="${this.escape(this.filters.from)}" /></label><label for="auditTo">To date<input type="date" id="auditTo" value="${this.escape(this.filters.to)}" /></label>
          <div class="audit-filter-actions"><button type="submit" class="btn btn-secondary">Apply filters</button><button type="button" class="btn btn-secondary" onclick="adminAudit.resetFilters()">Reset filters</button></div>
        </form></section>
        <section class="audit-retention-section" aria-labelledby="audit-retention-heading"><div><h3 id="audit-retention-heading">Retention action</h3><p class="form-help" id="audit-purge-explanation">Delete audit entries older than 90 days. This cannot be undone and the purge itself is audited.</p></div><label>Retention period<select id="auditRetention"><option value="30">30 days</option><option value="90" selected>90 days</option><option value="180">180 days</option><option value="365">365 days</option></select></label><button type="button" class="btn btn-danger" id="auditPurge">Delete entries older than 90 days</button></section>
        ${this.allowClearAll ? '<section class="audit-clear-section" aria-labelledby="audit-clear-heading"><div><h3 id="audit-clear-heading">Delete All</h3><p class="form-help">Permanently delete every previous entry. A new audit record of this action is created afterwards.</p></div><button type="button" class="btn btn-danger" id="auditClearAll">Delete All</button></section>' : ''}
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
    const retention = document.getElementById('auditRetention');
    const purge = document.getElementById('auditPurge');
    const explanation = document.getElementById('audit-purge-explanation');
    retention?.addEventListener('change', () => {
      const days = Number(retention.value || 90);
      if (purge) purge.textContent = `Delete entries older than ${days} days`;
      if (explanation) explanation.textContent = `Delete audit entries older than ${days} days. This cannot be undone and the purge itself is audited.`;
    });
    purge?.addEventListener('click', async () => {
      const retentionDays = Number(document.getElementById('auditRetention')?.value || 90);
      if (!await AdminCommon.confirmAction(`Permanently purge audit entries older than ${retentionDays} days? The purge itself will be audited.`)) return;
      const result = await this.api.post('/api/admin/audit/purge', { retentionDays });
      if (result.ok) { const payload = AdminCommon.unwrapData(result, null, {}); AdminCommon.showAlert(`${Number(payload.purged || 0)} audit entries deleted.`, 'success'); await this.init(this.container); }
      else AdminCommon.showAlert(`Audit purge failed: ${result.error || 'Unknown error'}`, 'error');
    });
    document.getElementById('auditClearAll')?.addEventListener('click', async () => {
      if (!await AdminCommon.confirmAction('Delete ALL previous audit entries? This cannot be undone.')) return;
      const result = await this.api.post('/api/admin/audit/clear', { confirmed: true });
      if (result.ok) { const payload = AdminCommon.unwrapData(result, null, {}); AdminCommon.showAlert(`${Number(payload.deleted || 0)} audit entries deleted.`, 'success'); await this.init(this.container); }
      else AdminCommon.showAlert(`Audit clear failed: ${result.error || 'Unknown error'}`, 'error');
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
              <td>${entry.actorUsername ? `${this.escape(entry.actorUsername)} <span class="small-muted">#${this.escape(entry.actorUserId || '')}</span>` : this.escape(entry.actorUserId ? `#${entry.actorUserId}` : 'System')}</td>
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
