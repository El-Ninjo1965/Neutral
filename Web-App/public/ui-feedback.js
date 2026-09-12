'use strict';

/** Shared User/Admin feedback and password-field accessibility helpers. */
const NeutralUiFeedback = (() => {
  let dialog = null;
  let returnFocus = null;
  const boundInputs = new WeakMap();
  let delegationInstalled = false;
  const closeSuccess = () => {
    if (!dialog) return;
    dialog.remove(); dialog = null;
    const target = returnFocus; returnFocus = null;
    if (target && target.isConnected && typeof target.focus === 'function') target.focus();
  };
  const showSuccess = (message, options = {}) => {
    if (typeof document === 'undefined') return;
    closeSuccess();
    returnFocus = options.returnFocus || document.activeElement;
    dialog = document.createElement('div');
    dialog.className = 'neutral-success-dialog-backdrop';
    dialog.innerHTML = '<section class="neutral-success-dialog" role="dialog" aria-modal="true" aria-labelledby="neutral-success-title" aria-describedby="neutral-success-message"><div class="neutral-success-icon" aria-hidden="true">✓</div><h2 id="neutral-success-title"></h2><p id="neutral-success-message"></p><button type="button" class="ui-button ui-button--primary" data-success-close>OK</button></section>';
    dialog.querySelector('#neutral-success-title').textContent = options.title || 'Saved';
    dialog.querySelector('#neutral-success-message').textContent = String(message || 'Changes saved successfully.');
    const closeButton = dialog.querySelector('[data-success-close]');
    closeButton.addEventListener('click', closeSuccess);
    dialog.addEventListener('click', (event) => { if (event.target === dialog) closeSuccess(); });
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') { event.preventDefault(); closeSuccess(); }
      if (event.key === 'Tab') { event.preventDefault(); closeButton.focus(); }
    });
    document.body.appendChild(dialog);
    closeButton.focus();
  };
  const showError = (message, options = {}) => showSuccess(message, { ...options, title: options.title || 'Error' });
  const confirmAction = (message, options = {}) => new Promise((resolve) => {
    if (typeof document === 'undefined') { resolve(false); return; }
    closeSuccess();
    returnFocus = options.returnFocus || document.activeElement;
    dialog = document.createElement('div');
    dialog.className = 'neutral-success-dialog-backdrop';
    dialog.innerHTML = '<section class="neutral-success-dialog" role="dialog" aria-modal="true" aria-labelledby="neutral-confirm-title" aria-describedby="neutral-confirm-message"><h2 id="neutral-confirm-title"></h2><p id="neutral-confirm-message"></p><div class="form-actions"><button type="button" class="ui-button ui-button--primary" data-confirm-accept>Confirm</button><button type="button" class="ui-button ui-button--secondary" data-confirm-cancel>Cancel</button></div></section>';
    dialog.querySelector('#neutral-confirm-title').textContent = options.title || 'Please confirm';
    dialog.querySelector('#neutral-confirm-message').textContent = String(message || 'Continue?');
    const accept = dialog.querySelector('[data-confirm-accept]');
    const cancel = dialog.querySelector('[data-confirm-cancel]');
    const finish = (answer) => { closeSuccess(); resolve(answer); };
    accept.addEventListener('click', () => finish(true));
    cancel.addEventListener('click', () => finish(false));
    dialog.addEventListener('keydown', (event) => { if (event.key === 'Escape') finish(false); });
    document.body.appendChild(dialog);
    cancel.focus();
  });
  const eyeOpen = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>';
  const eyeClosed = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3 21 21M10.6 6.1A10.8 10.8 0 0 1 12 6c6 0 9.5 6 9.5 6a16.6 16.6 0 0 1-2.3 3M6.2 6.2C3.8 8 2.5 12 2.5 12s3.5 6 9.5 6c1.4 0 2.7-.3 3.8-.8M9.8 9.8a3.1 3.1 0 0 0 4.4 4.4"/></svg>';
  const syncPasswordToggle = (input, button) => {
    const visible = input.type === 'text';
    button.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
    button.setAttribute('aria-pressed', visible ? 'true' : 'false');
    button.innerHTML = visible ? eyeOpen : eyeClosed;
  };
  const togglePassword = (input, button) => {
    const nextType = input.type === 'text' ? 'password' : 'text';
    input.setAttribute?.('type', nextType);
    if (input.type !== nextType) input.type = nextType;
    syncPasswordToggle(input, button);
    input.focus({ preventScroll: true });
  };
  const bindPasswordToggle = (input, button) => {
    if (!input || !button) return null;
    button.type = 'button';
    button.classList?.add('password-visibility-toggle');
    button.dataset.neutralPasswordToggle = 'true';
    boundInputs.set(button, input);
    if (button.dataset.passwordDirectBound !== 'true') {
      button.addEventListener('click', (event) => {
        if (event.__neutralPasswordHandled === true) return;
        event.preventDefault?.();
        togglePassword(boundInputs.get(button) || input, button);
      });
      button.dataset.passwordDirectBound = 'true';
    }
    button.dataset.passwordToggleBound = 'true';
    syncPasswordToggle(input, button);
    input.dataset.passwordToggleReady = 'true';
    return button;
  };
  const installPasswordDelegation = () => {
    if (delegationInstalled || typeof document === 'undefined') return;
    document.addEventListener('click', (event) => {
      const button = event.target?.closest?.('[data-neutral-password-toggle="true"], .password-visibility-toggle');
      if (!button) return;
      const wrapper = button.closest?.('.password-input-wrap');
      const input = boundInputs.get(button) || wrapper?.querySelector?.('input[data-password-toggle-ready="true"], input[type="password"], input[type="text"]');
      if (!input) return;
      event.preventDefault();
      event.__neutralPasswordHandled = true;
      togglePassword(input, button);
    }, true);
    delegationInstalled = true;
  };
  const enhancePasswordField = (input) => {
    if (!input || !input.parentNode) return null;
    const existing = input.closest?.('.password-input-wrap');
    const existingButton = existing?.querySelector?.('.password-visibility-toggle');
    if (existingButton) return bindPasswordToggle(input, existingButton);
    input.dataset.passwordToggleReady = 'false';
    const wrapper = existing || document.createElement('span'); wrapper.className = 'password-input-wrap';
    if (!existing) { input.parentNode.insertBefore(wrapper, input); wrapper.appendChild(input); }
    const button = document.createElement('button');
    button.className = 'password-visibility-toggle';
    wrapper.appendChild(button);
    return bindPasswordToggle(input, button);
  };
  const enhancePasswordFields = (root = document) => {
    if (!root || typeof root.querySelectorAll !== 'function') return;
    root.querySelectorAll('input[type="password"], input[data-password-toggle-ready="true"]').forEach(enhancePasswordField);
  };
  const start = () => {
    installPasswordDelegation();
    enhancePasswordFields(document);
    if (typeof MutationObserver !== 'undefined') new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
      if (node.nodeType === 1) enhancePasswordFields(node.matches?.('input[type="password"]') ? node.parentNode : node);
    }))).observe(document.body, { childList: true, subtree: true });
  };
  if (typeof document !== 'undefined') {
    installPasswordDelegation();
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start, { once: true }) : start();
  }
  return { showSuccess, showError, confirmAction, closeSuccess, enhancePasswordFields, bindPasswordToggle, togglePassword };
})();

if (typeof window !== 'undefined') window.NeutralUiFeedback = NeutralUiFeedback;
if (typeof module !== 'undefined' && module.exports) module.exports = NeutralUiFeedback;
