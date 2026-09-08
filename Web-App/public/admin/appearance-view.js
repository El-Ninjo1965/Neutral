'use strict';

const escapeHtmlAppearance = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

class AdminAppearanceView {
  constructor(apiClient) {
    this.api = apiClient;
    this.settings = { settings: {}, homepage: { mode: 'html', content: '', moduleId: '' } };
    this.modules = [];
  }

  async init(container) {
    this.container = container;
    await this.load();
    this.render();
  }

  async load() {
    const [settingsResult, modulesResult] = await Promise.all([
      this.api.getSettings(),
      this.api.getAdminModules()
    ]);
    if (settingsResult.ok) {
      this.settings = AdminCommon.unwrapData(settingsResult, 'settings', this.settings);
    } else {
      AdminCommon.showAlert(`Failed to load appearance: ${settingsResult.error}`, 'error');
    }
    const modules = AdminCommon.unwrapData(modulesResult, 'modules', []);
    this.modules = modulesResult.ok && Array.isArray(modules) ? modules : [];
  }

  getStartableModules() {
    return this.modules.filter((module) => {
      if (!module || !module.id || !module.entry) return false;
      return module.active === true || module.lifecycleState === 'ACTIVE' || module.status === 'active' || module.status === 'enabled';
    });
  }

  normalizeHomepage(value) {
    const candidate = value && typeof value === 'object' ? value : {};
    const mode = candidate.mode === 'module' ? 'module' : 'html';
    const moduleId = typeof candidate.moduleId === 'string' ? candidate.moduleId.trim() : '';
    const validModuleId = this.getStartableModules().some((module) => module.id === moduleId) ? moduleId : '';
    return {
      mode,
      content: typeof candidate.content === 'string' ? candidate.content : '',
      moduleId: mode === 'module' ? validModuleId : moduleId
    };
  }

  getHomepage() {
    return this.normalizeHomepage(this.settings.homepage || this.settings.settings?.homepage);
  }

  render() {
    const homepage = this.getHomepage();
    const ui = this.settings.settings || {};
    const startableModules = this.getStartableModules();
    this.container.innerHTML = `
      <div class="admin-appearance-view">
        <div class="section-header"><h2>Appearance</h2></div>
        <form id="appearanceForm" class="admin-form settings-form">
          <fieldset>
            <legend>Theme &amp; Layout</legend>
            <div class="form-group">
              <label for="theme">Theme</label>
              <select id="theme" name="theme">
                <option value="">System Default</option>
                <option value="light" ${ui.theme === 'light' ? 'selected' : ''}>Light</option>
                <option value="dark" ${ui.theme === 'dark' ? 'selected' : ''}>Dark</option>
              </select>
            </div>
            <div class="form-group">
              <label for="layout">Layout</label>
              <select id="layout" name="layout">
                <option value="default" ${ui.layout !== 'compact' ? 'selected' : ''}>Default</option>
                <option value="compact" ${ui.layout === 'compact' ? 'selected' : ''}>Compact</option>
              </select>
            </div>
          </fieldset>
          <fieldset>
            <legend>Global Start Page</legend>
            <div class="form-group">
              <label for="homepageMode">Mode</label>
              <select id="homepageMode" name="homepageMode">
                <option value="module" ${homepage.mode === 'module' ? 'selected' : ''}>Module</option>
                <option value="html" ${homepage.mode === 'html' ? 'selected' : ''}>Text / HTML</option>
              </select>
            </div>
            <div class="form-group" data-homepage-module>
              <label for="homepageModuleId">Start module</label>
              <select id="homepageModuleId" name="homepageModuleId">
                <option value="">Select an active module</option>
                ${startableModules.map((module) => `<option value="${escapeHtmlAppearance(module.id)}" ${module.id === homepage.moduleId ? 'selected' : ''}>${escapeHtmlAppearance(module.displayName || module.name || module.id)}</option>`).join('')}
              </select>
              ${startableModules.length ? '' : '<small>No active startable modules are available.</small>'}
            </div>
            <div class="form-group" data-homepage-html>
              <label for="homepageContent">Text / HTML</label>
              <textarea id="homepageContent" name="homepageContent" rows="12">${escapeHtmlAppearance(homepage.content)}</textarea>
              <small>Trusted administrator content is stored unchanged. Full HTML, inline styles, links, images and JavaScript are supported.</small>
            </div>
            <div class="form-group" data-homepage-preview>
              <label>Preview</label>
              <iframe id="homepagePreview" title="Start page preview" sandbox="allow-scripts allow-forms allow-popups"></iframe>
            </div>
          </fieldset>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Save Appearance</button>
            <button type="button" class="btn btn-secondary" data-appearance-reload>Reload</button>
          </div>
        </form>
      </div>`;
    this.bind();
  }

  bind() {
    const form = this.container.querySelector('#appearanceForm');
    const mode = this.container.querySelector('#homepageMode');
    const content = this.container.querySelector('#homepageContent');
    const preview = this.container.querySelector('#homepagePreview');
    const refresh = () => {
      const isHtml = mode.value === 'html';
      this.container.querySelector('[data-homepage-module]').hidden = isHtml;
      this.container.querySelector('[data-homepage-html]').hidden = !isHtml;
      this.container.querySelector('[data-homepage-preview]').hidden = !isHtml;
      if (isHtml) preview.srcdoc = content.value;
    };
    mode.addEventListener('change', refresh);
    content.addEventListener('input', refresh);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.save(form);
    });
    this.container.querySelector('[data-appearance-reload]').addEventListener('click', async () => {
      await this.load();
      this.render();
      AdminCommon.showAlert('Appearance reloaded', 'info');
    });
    refresh();
  }

  async save(form) {
    const data = new FormData(form);
    const homepage = {
      mode: data.get('homepageMode') === 'module' ? 'module' : 'html',
      moduleId: String(data.get('homepageModuleId') || '').trim(),
      content: String(data.get('homepageContent') || '')
    };
    if (homepage.mode === 'module' && !this.getStartableModules().some((module) => module.id === homepage.moduleId)) {
      AdminCommon.showAlert('Select an active startable module.', 'error');
      return;
    }
    const result = await this.api.updateSettings({
      appName: this.settings.appName,
      appId: this.settings.appId,
      homepage,
      settings: {
        ...(this.settings.settings || {}),
        theme: data.get('theme'),
        layout: data.get('layout'),
        homepage
      }
    });
    if (!result.ok) {
      AdminCommon.showAlert(`Failed to save appearance: ${result.error}`, 'error');
      return;
    }
    this.settings = AdminCommon.unwrapData(result, 'settings', this.settings);
    AdminCommon.showAlert('Appearance saved successfully', 'success');
    this.render();
  }
}

if (typeof window !== 'undefined') window.AdminAppearanceView = AdminAppearanceView;
if (typeof module !== 'undefined' && module.exports) module.exports = AdminAppearanceView;
