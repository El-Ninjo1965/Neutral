'use strict';

/**
 * Admin Settings View
 * System settings management UI
 */

// Utility function to escape HTML
const escapeHtmlSettings = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

class AdminSettingsView {
  constructor(apiClient) {
    this.api = apiClient;
    this.settings = null;
  }

  // Initialize the view
  async init(container) {
    this.container = container;
    await this.loadSettings();
    this.render();
  }

  // Load settings from API
  async loadSettings() {
    const result = await this.api.getSettings();
    if (result.ok) {
      this.settings = AdminCommon.unwrapData(result, 'settings', {});
    } else {
      AdminCommon.showAlert(`Failed to load settings: ${result.error}`, 'error');
      this.settings = {
        appName: 'Neutral App',
        appId: 'neutral-app',
        settings: {}
      };
    }
  }

  // Render the view
  render() {
    this.container.innerHTML = `
      <div class="admin-settings-view">
        <div class="section-header">
          <h2>System Settings</h2>
        </div>

        <div class="settings-container" id="settings-form"></div>
      </div>
    `;

    this.renderSettingsForm();
  }

  // Render settings form
  renderSettingsForm() {
    const formDiv = document.getElementById('settings-form');
    if (!formDiv) return;

    const form = document.createElement('form');
    form.className = 'admin-form settings-form';
    form.innerHTML = `
      <fieldset>
        <legend>Application Identity</legend>
        
        <div class="form-group">
          <label for="appName">Application Name *</label>
          <input type="text" id="appName" name="appName" required value="${escapeHtmlSettings(this.settings.appName || 'Neutral App')}" />
        </div>

        <div class="form-group">
          <label for="appId">Application ID *</label>
          <input type="text" id="appId" name="appId" required value="${escapeHtmlSettings(this.settings.appId || 'neutral-app')}" />
          <small>Lowercase, no spaces (for system use)</small>
        </div>
      </fieldset>

      <fieldset>
        <legend>User Interface</legend>
        
        <div class="form-group">
          <label for="theme">Theme</label>
          <select id="theme" name="theme">
            <option value="">System Default</option>
            <option value="light" ${this.getSetting('theme') === 'light' ? 'selected' : ''}>Light</option>
            <option value="dark" ${this.getSetting('theme') === 'dark' ? 'selected' : ''}>Dark</option>
          </select>
        </div>

        <div class="form-group">
          <label for="language">Language</label>
          <select id="language" name="language">
            <option value="en" ${this.getSetting('language') === 'en' ? 'selected' : ''}>English</option>
            <option value="de" ${this.getSetting('language') === 'de' ? 'selected' : ''}>Deutsch</option>
            <option value="es" ${this.getSetting('language') === 'es' ? 'selected' : ''}>Español</option>
          </select>
        </div>

        <div class="form-group">
          <label for="timezone">Timezone</label>
          <select id="timezone" name="timezone">
            <option value="UTC" ${this.getSetting('timezone') === 'UTC' ? 'selected' : ''}>UTC</option>
            <option value="Europe/Berlin" ${this.getSetting('timezone') === 'Europe/Berlin' ? 'selected' : ''}>Europe/Berlin (CET)</option>
            <option value="Europe/London" ${this.getSetting('timezone') === 'Europe/London' ? 'selected' : ''}>Europe/London (GMT)</option>
            <option value="America/New_York" ${this.getSetting('timezone') === 'America/New_York' ? 'selected' : ''}>America/New_York (EST)</option>
          </select>
        </div>
      </fieldset>

      <fieldset>
        <legend>System Settings</legend>
        
        <div class="form-group">
          <label for="logLevel">Log Level</label>
          <select id="logLevel" name="logLevel">
            <option value="debug" ${this.getSetting('logLevel') === 'debug' ? 'selected' : ''}>Debug</option>
            <option value="info" ${this.getSetting('logLevel') === 'info' ? 'selected' : ''}>Info</option>
            <option value="warn" ${this.getSetting('logLevel') === 'warn' ? 'selected' : ''}>Warning</option>
            <option value="error" ${this.getSetting('logLevel') === 'error' ? 'selected' : ''}>Error</option>
          </select>
        </div>

        <div class="form-group">
          <label for="backupEnabled">
            <input type="checkbox" id="backupEnabled" name="backupEnabled" 
              ${this.getSetting('backupEnabled', true) ? 'checked' : ''} />
            Enable Automatic Backups
          </label>
        </div>

        <div class="form-group">
          <label for="backupInterval">Backup Interval</label>
          <select id="backupInterval" name="backupInterval">
            <option value="daily" ${this.getSetting('backupInterval') === 'daily' ? 'selected' : ''}>Daily</option>
            <option value="weekly" ${this.getSetting('backupInterval') === 'weekly' ? 'selected' : ''}>Weekly</option>
            <option value="monthly" ${this.getSetting('backupInterval') === 'monthly' ? 'selected' : ''}>Monthly</option>
          </select>
        </div>
      </fieldset>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Save Settings</button>
        <button type="button" class="btn btn-secondary" onclick="adminSettings.reloadSettings()">Reload</button>
      </div>
    `;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveSettings(form);
    });

    formDiv.innerHTML = '';
    formDiv.appendChild(form);
  }

  // Get a setting value
  getSetting(key, defaultValue = null) {
    if (!this.settings?.settings) return defaultValue;
    return this.settings.settings[key] !== undefined ? this.settings.settings[key] : defaultValue;
  }

  // Save settings
  async saveSettings(form) {
    const formData = new FormData(form);
    const data = {
      appName: formData.get('appName'),
      appId: formData.get('appId'),
      settings: {
        theme: formData.get('theme'),
        language: formData.get('language'),
        timezone: formData.get('timezone'),
        logLevel: formData.get('logLevel'),
        backupEnabled: formData.get('backupEnabled') === 'on',
        backupInterval: formData.get('backupInterval')
      }
    };

    const result = await this.api.updateSettings(data);
    if (result.ok) {
      AdminCommon.showAlert('Settings saved successfully', 'success');
      this.settings = AdminCommon.unwrapData(result, 'settings', this.settings || {});
    } else {
      AdminCommon.showAlert(`Failed to save settings: ${result.error}`, 'error');
    }
  }

  // Reload settings
  async reloadSettings() {
    await this.loadSettings();
    this.renderSettingsForm();
    AdminCommon.showAlert('Settings reloaded', 'info');
  }
}

// Export for browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminSettingsView;
}
