'use strict';

class AdminShell {
  constructor(container, options = {}) {
    this.container = container;
    this.groups = Array.isArray(options.groups) ? options.groups : [];
    this.userLabel = options.userLabel || 'Administrator';
    this.onNavigate = typeof options.onNavigate === 'function' ? options.onNavigate : () => {};
    this.onLogout = typeof options.onLogout === 'function' ? options.onLogout : () => {};
    this.boundClick = this.handleClick.bind(this);
    this.boundKeydown = this.handleKeydown.bind(this);
  }

  static escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  static render({ groups = [], userLabel = 'Administrator' } = {}) {
    const navigation = groups.map((group) => `
      <section class="admin-cms-nav-group" aria-labelledby="admin-group-${AdminShell.escapeHtml(group.id)}">
        <h2 id="admin-group-${AdminShell.escapeHtml(group.id)}">${AdminShell.escapeHtml(group.label)}</h2>
        <ul>${group.items.map((item) => {
          const active = item.id === 'dashboard';
          return `<li><button type="button" class="admin-cms-nav-button${active ? ' active' : ''}" data-admin-view="${AdminShell.escapeHtml(item.id)}"${active ? ' aria-current="page"' : ''}>${AdminShell.escapeHtml(item.label)}</button></li>`;
        }).join('')}</ul>
      </section>
    `).join('');

    return `
      <div class="admin-cms-layout">
        <aside id="admin-cms-sidebar" class="admin-cms-sidebar" aria-label="Administration">
          <div class="admin-cms-brand"><span aria-hidden="true">N</span><div><strong>Neutral</strong><small>Administration</small></div></div>
          <nav aria-label="Administration">${navigation}</nav>
        </aside>
        <button type="button" class="admin-cms-backdrop" data-admin-close aria-label="Close administration menu" hidden></button>
        <section class="admin-cms-content">
          <header class="admin-cms-header">
            <button id="admin-menu-toggle" class="admin-menu-toggle" type="button" aria-controls="admin-cms-sidebar" aria-expanded="false">Menu</button>
            <div class="admin-cms-heading"><span id="admin-breadcrumb">Overview</span><h1 id="admin-page-title" tabindex="-1">Dashboard</h1></div>
            <div class="admin-cms-tools"><span class="admin-user-info">${AdminShell.escapeHtml(userLabel)}</span><button type="button" class="btn btn-sm btn-secondary" data-admin-logout>Logout</button></div>
          </header>
          <div id="admin-view-status" class="sr-only" role="status" aria-live="polite"></div>
          <main class="admin-main" id="admin-main"></main>
        </section>
      </div>
    `;
  }

  mount() {
    this.container.innerHTML = AdminShell.render({ groups: this.groups, userLabel: this.userLabel });
    this.container.addEventListener('click', this.boundClick);
    document.addEventListener('keydown', this.boundKeydown);
    return this;
  }

  handleClick(event) {
    const viewButton = event.target.closest('[data-admin-view]');
    if (viewButton && this.container.contains(viewButton)) {
      this.closeDrawer();
      this.onNavigate(viewButton.dataset.adminView);
      return;
    }
    if (event.target.closest('#admin-menu-toggle')) {
      const expanded = this.menuToggle()?.getAttribute('aria-expanded') === 'true';
      if (expanded) this.closeDrawer();
      else this.openDrawer();
      return;
    }
    if (event.target.closest('[data-admin-close]')) this.closeDrawer();
    if (event.target.closest('[data-admin-logout]')) this.onLogout();
  }

  handleKeydown(event) {
    if (event.key === 'Escape') this.closeDrawer();
  }

  menuToggle() {
    return this.container.querySelector('#admin-menu-toggle');
  }

  backdrop() {
    return this.container.querySelector('[data-admin-close]');
  }

  openDrawer() {
    document.body.classList.add('admin-drawer-open');
    this.menuToggle()?.setAttribute('aria-expanded', 'true');
    if (this.backdrop()) this.backdrop().hidden = false;
  }

  closeDrawer() {
    document.body.classList.remove('admin-drawer-open');
    this.menuToggle()?.setAttribute('aria-expanded', 'false');
    if (this.backdrop()) this.backdrop().hidden = true;
  }

  setActive(viewId) {
    this.container.querySelectorAll('[data-admin-view]').forEach((button) => {
      const active = button.dataset.adminView === viewId;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
  }

  setTitle(title) {
    const titleElement = this.container.querySelector('#admin-page-title');
    const statusElement = this.container.querySelector('#admin-view-status');
    if (titleElement) titleElement.textContent = title;
    if (statusElement) statusElement.textContent = `${title} loaded`;
  }

  focusTitle() {
    this.container.querySelector('#admin-page-title')?.focus();
  }

  destroy() {
    this.container.removeEventListener('click', this.boundClick);
    document.removeEventListener('keydown', this.boundKeydown);
    document.body.classList.remove('admin-drawer-open');
  }
}

if (typeof window !== 'undefined') window.AdminShell = AdminShell;
if (typeof module !== 'undefined' && module.exports) module.exports = AdminShell;
