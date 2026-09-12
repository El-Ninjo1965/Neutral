'use strict';

class AdminShell {
  constructor(container, options = {}) {
    this.container = container;
    this.groups = Array.isArray(options.groups) ? options.groups : [];
    this.userLabel = options.userLabel || 'Administrator';
    this.onNavigate = typeof options.onNavigate === 'function' ? options.onNavigate : () => {};
    this.onLogout = typeof options.onLogout === 'function' ? options.onLogout : () => {};
    this.boundClick = this.handleClick.bind(this);
    this.boundChange = this.handleChange.bind(this);
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
      <section class="admin-cms-nav-group" ${group.label ? `aria-labelledby="admin-group-${AdminShell.escapeHtml(group.id)}"` : ''}>
        ${group.label ? `<h2 id="admin-group-${AdminShell.escapeHtml(group.id)}">${AdminShell.escapeHtml(group.label)}</h2>` : ''}
        <ul>${group.items.map((item) => {
          const active = item.id === 'dashboard';
          return `<li><button type="button" class="admin-cms-nav-button${active ? ' active' : ''}" data-admin-view="${AdminShell.escapeHtml(item.id)}"${active ? ' aria-current="page"' : ''}>${AdminShell.escapeHtml(item.label)}</button></li>`;
        }).join('')}</ul>
      </section>
    `).join('');

    return `
      <div class="admin-cms-layout">
        <aside id="admin-cms-sidebar" class="admin-cms-sidebar" aria-label="Administration">
          <div class="admin-sidebar-theme"><label for="admin-theme-select">Theme</label><select id="admin-theme-select" data-admin-theme><option value="light">Light</option><option value="dark">Dark</option></select></div>
          <nav aria-label="Administration">${navigation}</nav>
          <button type="button" class="admin-cms-nav-button admin-sidebar-logout" data-admin-logout>Logout</button>
        </aside>
        <button type="button" class="admin-cms-backdrop" data-admin-close aria-label="Close administration menu" hidden></button>
        <section class="admin-cms-content">
          <div class="admin-mobile-toolbar">
            <button id="admin-menu-toggle" class="admin-menu-toggle" type="button" aria-controls="admin-cms-sidebar" aria-expanded="false">Menu</button>
          </div>
          <div id="admin-view-status" class="sr-only" role="status" aria-live="polite"></div>
          <main class="admin-main" id="admin-main"></main>
        </section>
      </div>
    `;
  }

  mount() {
    this.container.innerHTML = AdminShell.render({ groups: this.groups, userLabel: this.userLabel });
    this.container.addEventListener('click', this.boundClick);
    this.container.addEventListener('change', this.boundChange);
    document.addEventListener('keydown', this.boundKeydown);
    this.applyTheme(this.storedTheme());
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

  handleChange(event) {
    const themeSelect = event.target.closest('[data-admin-theme]');
    if (themeSelect && this.container.contains(themeSelect)) this.applyTheme(themeSelect.value);
  }

  storedTheme() {
    try { return window.localStorage.getItem('neutral-admin-theme') === 'dark' ? 'dark' : 'light'; }
    catch { return 'light'; }
  }

  applyTheme(theme) {
    const nextTheme = theme === 'dark' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', nextTheme);
    const select = this.container.querySelector('[data-admin-theme]');
    if (select) select.value = nextTheme;
    try { window.localStorage.setItem('neutral-admin-theme', nextTheme); } catch { /* Storage can be unavailable. */ }
  }

  toggleTheme() {
    this.applyTheme(document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
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
    const statusElement = this.container.querySelector('#admin-view-status');
    if (statusElement) statusElement.textContent = `${title} loaded`;
  }

  focusTitle() {
    const main = this.container.querySelector('#admin-main');
    if (main) main.scrollTop = 0;
    window.scrollTo?.({ top: 0, left: 0, behavior: 'instant' });
    const title = main?.querySelector('h1, h2');
    if (title) { title.setAttribute('tabindex', '-1'); title.focus({ preventScroll: true }); }
  }

  destroy() {
    this.container.removeEventListener('click', this.boundClick);
    this.container.removeEventListener('change', this.boundChange);
    document.removeEventListener('keydown', this.boundKeydown);
    document.body.classList.remove('admin-drawer-open');
  }
}

if (typeof window !== 'undefined') window.AdminShell = AdminShell;
if (typeof module !== 'undefined' && module.exports) module.exports = AdminShell;
