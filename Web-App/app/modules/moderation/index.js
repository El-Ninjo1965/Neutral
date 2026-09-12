(() => {
  'use strict';
  const NeutralModerationModule = {
    id: 'moderation', name: 'Moderation', version: '1.0.0', system: true, status: 'available', active: false,
    install() { this.status = 'installed'; return true; },
    initialize() { return true; },
    enable() { this.status = 'enabled'; this.active = true; return true; },
    disable() { this.status = 'disabled'; this.active = false; return true; },
    uninstall() { this.status = 'available'; this.active = false; return true; },
    renderUserInterface(container) {
      if (!container) return null;
      container.innerHTML = '<section class="moderation-workspace"><h1>Moderation</h1><p>Review access is available.</p><div role="status" aria-live="polite" data-moderation-status>Checking moderation service…</div></section>';
      const status = container.querySelector('[data-moderation-status]');
      Promise.resolve(new window.ApiClient().get('/api/modules/moderation/status')).then((result) => {
        const available = result?.data?.data?.available ?? result?.data?.available;
        status.textContent = result?.ok && available === true ? 'Moderation service ready.' : (result?.error || 'Moderation service unavailable.');
      }).catch(() => { status.textContent = 'Moderation service unavailable.'; });
      return container;
    }
  };
  if (typeof window !== 'undefined') window.NeutralModerationModule = NeutralModerationModule;
  if (typeof module !== 'undefined' && module.exports) module.exports = NeutralModerationModule;
})();
