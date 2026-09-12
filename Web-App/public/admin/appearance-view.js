'use strict';

const escapeHtmlAppearance = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');
const userUiDesignContract = typeof window !== 'undefined' && window.NeutralUserUiDesign
  ? window.NeutralUserUiDesign
  : (typeof require === 'function' ? require('../user-ui-design') : null);

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

  getDesign() {
    return userUiDesignContract.normalize(this.settings.appearance || this.settings.settings?.appearance);
  }

  render() {
    const homepage = this.getHomepage();
    const startableModules = this.getStartableModules();
    const design = this.getDesign();
    const colorGroups = [
      ['Base Colors', [['background', 'App / page background'], ['surface', 'Surface / card'], ['primary', 'Accent'], ['text', 'Primary text'], ['muted', 'Muted text'], ['border', 'Border']]],
      ['Actions & Buttons', [['primaryBackground', 'Primary background'], ['primaryText', 'Primary text'], ['primaryIcon', 'Primary icon'], ['primaryBorder', 'Primary border'], ['secondaryBackground', 'Secondary background'], ['secondaryText', 'Secondary text'], ['secondaryIcon', 'Secondary icon'], ['secondaryBorder', 'Secondary border']]],
      ['Navigation', [['navActiveBackground', 'Active background'], ['navActiveText', 'Active text'], ['navActiveIcon', 'Active icon'], ['navActiveBorder', 'Active border'], ['navInactiveBackground', 'Inactive background'], ['navInactiveText', 'Inactive text'], ['navInactiveIcon', 'Inactive icon'], ['navInactiveBorder', 'Inactive border']]],
      ['Forms', [['inputBackground', 'Input background'], ['inputText', 'Input text'], ['inputBorder', 'Input border'], ['inputFocus', 'Input focus border / ring']]]
    ];
    const colorControl = (mode, key, label) => `<div class="form-group appearance-color-control"><label for="design-${mode}-${key}">${label}</label><span class="appearance-color-picker"><input type="color" id="design-${mode}-${key}" name="design.${mode}.${key}" value="${design[mode][key]}" aria-describedby="design-${mode}-${key}-value"><output id="design-${mode}-${key}-value" data-color-value="design.${mode}.${key}">${design[mode][key].toUpperCase()}</output></span></div>`;
    const palette = (mode) => colorGroups.map(([title, fields], index) => `<details class="appearance-token-group" ${index === 0 ? 'open' : ''}><summary>${title}</summary><div class="appearance-color-grid">${fields.map(([key, label]) => colorControl(mode, key, label)).join('')}</div></details>`).join('');
    this.container.innerHTML = `
      <div class="admin-appearance-view">
        <div class="section-header"><h2>Appearance</h2></div>
        <form id="appearanceForm" class="admin-form settings-form">
          <section class="appearance-section" aria-labelledby="appearance-homepage-title">
            <h3 id="appearance-homepage-title">Global Start Page</h3>
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
          </section>
          <section class="appearance-section" aria-labelledby="appearance-design-title">
            <h3 id="appearance-design-title">User UI Design</h3>
            <p>Defines how the User-App looks. Each user's Light/Dark selection remains independent.</p>
            <section class="appearance-palette" aria-labelledby="appearance-light-title"><h4 id="appearance-light-title">Light</h4>${palette('light')}</section>
            <section class="appearance-palette" aria-labelledby="appearance-dark-title"><h4 id="appearance-dark-title">Dark</h4>${palette('dark')}</section>
            <details class="appearance-token-group"><summary>Geometry &amp; Typography</summary><div class="appearance-design-grid">
              <div class="form-group"><label for="design-control-radius">Button / control radius (px)</label><input type="number" min="0" max="32" id="design-control-radius" name="design.geometry.controlRadius" value="${design.geometry.controlRadius}"></div>
              <div class="form-group"><label for="design-surface-radius">Card / surface radius (px)</label><input type="number" min="0" max="48" id="design-surface-radius" name="design.geometry.surfaceRadius" value="${design.geometry.surfaceRadius}"></div>
              <div class="form-group"><label for="design-content-width">Content max width (px)</label><input type="number" min="320" max="1920" id="design-content-width" name="design.geometry.contentMaxWidth" value="${design.geometry.contentMaxWidth}"></div>
              <div class="form-group"><label for="design-font-size">Base font size (px)</label><input type="number" min="12" max="24" id="design-font-size" name="design.typography.baseFontSize" value="${design.typography.baseFontSize}"></div>
            </div></details>
            <div class="form-actions"><button type="button" class="btn btn-secondary" data-design-reset>Reset to Defaults</button></div>
            <section class="appearance-preview" aria-labelledby="appearance-preview-title"><h4 id="appearance-preview-title">Preview Theme</h4><div class="form-group"><label for="designPreviewMode">Theme</label><select id="designPreviewMode"><option value="light">Light</option><option value="dark">Dark</option></select></div>
            <div id="userUiDesignPreview" class="user-ui-design-preview" aria-label="User UI design preview"><header>App header <button type="button" class="preview-secondary"><span class="preview-icon"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="2"/></svg></span> Header action</button></header><nav><button type="button" class="preview-nav-active"><span class="preview-icon"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="2"/></svg></span> Active</button><button type="button" class="preview-nav-inactive"><span class="preview-icon"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="2"/></svg></span> Inactive</button></nav><article><h3>Example card</h3><p>Primary text</p><small>Muted supporting text</small><label>Input <input value="Normal input"></label><label>Focus sample <input class="preview-input-focus" value="Focused input"></label><div><button type="button" class="preview-primary"><span class="preview-icon"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="2"/></svg></span> Primary</button><button type="button" class="preview-secondary"><span class="preview-icon"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="2"/></svg></span> Secondary</button></div></article></div></section>
          </section>
          <details class="appearance-advanced"><summary>Advanced Custom CSS <span>Expert</span></summary>
            <p>Use this optional expert override only when the structured design options are not sufficient.</p>
            <details><summary>Technical limits</summary><p>Applies only to the User-App. Maximum ${userUiDesignContract.MAX_CUSTOM_CSS} characters; HTML, JavaScript and remote imports are rejected.</p></details>
            <div class="form-group"><label for="customCss">Custom CSS</label><textarea id="customCss" name="design.customCss" rows="8" maxlength="${userUiDesignContract.MAX_CUSTOM_CSS}">${escapeHtmlAppearance(design.customCss)}</textarea></div>
            <button type="button" class="btn btn-secondary" data-css-clear>Clear Custom CSS</button>
          </details>
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
    const designPreview = this.container.querySelector('#userUiDesignPreview');
    const previewMode = this.container.querySelector('#designPreviewMode');
    const designFromForm = () => this.readDesign(new FormData(form));
    const refreshDesign = () => {
      try {
        form.querySelectorAll('input[type="color"]').forEach((input) => {
          const output = form.querySelector(`[data-color-value="${input.name}"]`);
          if (output) output.textContent = input.value.toUpperCase();
        });
        const values = userUiDesignContract.variables(designFromForm(), previewMode.value);
        for (const [name, value] of Object.entries(values)) designPreview.style.setProperty(name, value);
        designPreview.dataset.theme = previewMode.value;
      } catch (_) { /* Native constraints and save feedback handle incomplete edits. */ }
    };
    const refresh = () => {
      const isHtml = mode.value === 'html';
      this.container.querySelector('[data-homepage-module]').hidden = isHtml;
      this.container.querySelector('[data-homepage-html]').hidden = !isHtml;
      this.container.querySelector('[data-homepage-preview]').hidden = !isHtml;
      if (isHtml) preview.srcdoc = content.value;
    };
    mode.addEventListener('change', refresh);
    content.addEventListener('input', refresh);
    form.addEventListener('input', refreshDesign);
    form.querySelectorAll('input[type="color"]').forEach((input) => input.addEventListener('input', () => {
      const output = form.querySelector(`[data-color-value="${input.name}"]`);
      if (output) output.textContent = input.value.toUpperCase();
    }));
    previewMode.addEventListener('change', refreshDesign);
    this.container.querySelector('[data-design-reset]').addEventListener('click', async () => {
      if (!await AdminCommon.confirmAction('Reset structured User UI Design values to framework defaults?')) return;
      const defaults = userUiDesignContract.defaults();
      for (const mode of ['light', 'dark']) for (const [key, value] of Object.entries(defaults[mode])) form.elements.namedItem(`design.${mode}.${key}`).value = value;
      for (const [key, value] of Object.entries(defaults.geometry)) form.elements.namedItem(`design.geometry.${key}`).value = value;
      for (const [key, value] of Object.entries(defaults.typography)) form.elements.namedItem(`design.typography.${key}`).value = value;
      refreshDesign();
    });
    this.container.querySelector('[data-css-clear]').addEventListener('click', () => { form.elements.namedItem('design.customCss').value = ''; refreshDesign(); });
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
    refreshDesign();
  }

  readDesign(data) {
    const value = { schemaVersion: userUiDesignContract.SCHEMA_VERSION, light: {}, dark: {}, geometry: {}, typography: {}, customCss: String(data.get('design.customCss') || '') };
    const keys = ['background', 'surface', 'primary', 'text', 'muted', 'border', 'primaryBackground', 'primaryText', 'primaryIcon', 'primaryBorder', 'secondaryBackground', 'secondaryText', 'secondaryIcon', 'secondaryBorder', 'navActiveBackground', 'navActiveText', 'navActiveIcon', 'navActiveBorder', 'navInactiveBackground', 'navInactiveText', 'navInactiveIcon', 'navInactiveBorder', 'inputBackground', 'inputText', 'inputBorder', 'inputFocus'];
    for (const mode of ['light', 'dark']) for (const key of keys) value[mode][key] = data.get(`design.${mode}.${key}`);
    for (const key of ['controlRadius', 'surfaceRadius', 'contentMaxWidth']) value.geometry[key] = Number(data.get(`design.geometry.${key}`));
    value.typography.baseFontSize = Number(data.get('design.typography.baseFontSize'));
    return userUiDesignContract.normalize(value, { strict: true });
  }

  async save(form) {
    const data = new FormData(form);
    const homepage = {
      mode: data.get('homepageMode') === 'module' ? 'module' : 'html',
      moduleId: String(data.get('homepageModuleId') || '').trim(),
      content: String(data.get('homepageContent') || '')
    };
    let appearance;
    try { appearance = this.readDesign(data); } catch (error) {
      AdminCommon.showAlert(`Invalid User UI Design: ${error.message}`, 'error');
      return;
    }
    if (homepage.mode === 'module' && !this.getStartableModules().some((module) => module.id === homepage.moduleId)) {
      AdminCommon.showAlert('Select an active startable module.', 'error');
      return;
    }
    const result = await this.api.updateSettings({
      appName: this.settings.appName,
      appId: this.settings.appId,
      homepage,
      appearance,
      settings: {
        ...(this.settings.settings || {}),
        homepage,
        appearance
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
