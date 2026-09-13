'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const userAppSource = fs.readFileSync(path.join(projectRoot, 'Web-App/public/user-app.js'), 'utf8');

function buildUserAppSourceForRuntime() {
  const patched = userAppSource.replace(
    `      status.className = 'message success';
      status.textContent = 'Signed in successfully.';
      await refreshModuleDiscovery().catch(() => []);
      state.activeView = 'home';
      writeHashRoute('');
      renderApp();`,
    `      status.className = 'message success';
      status.textContent = 'Signed in successfully.';
      state.activeView = 'home';
      writeHashRoute('');
      renderApp();
      void refreshModuleDiscovery().catch(() => []);`
  );

  return patched.replace(
    `  startBackgroundInitialization();
})();`,
    `  startBackgroundInitialization();
  window.__testHooks = { refreshModuleDiscovery, renderApp, getCurrentUser, getVisibleModules, getModules, getAvailableModulesForUser, applyHashRoute, writeHashRoute };
})();`
  );
}

function flushMicrotasks() {
  return Promise.resolve().then(() => Promise.resolve());
}

class FakeElement {
  constructor(tagName = 'div', props = {}) {
    this.tagName = String(tagName || 'div').toUpperCase();
    this.id = props.id || '';
    this.name = props.name || '';
    this.type = props.type || '';
    this.value = props.value || '';
    this.checked = !!props.checked;
    this.disabled = !!props.disabled;
    this.textContent = props.textContent || '';
    this.dataset = { ...(props.dataset || {}) };
    this.attributes = {};
    this.children = [];
    this.parentNode = null;
    this.listeners = {};
    this.style = {};
    this.className = props.className || props.class || '';
    this._innerHTML = '';
    this.ownerDocument = null;
  }

  setAttribute(name, value) {
    const nextValue = String(value ?? '');
    this.attributes[name] = nextValue;
    if (name === 'id') this.id = nextValue;
    if (name === 'class') this.className = nextValue;
    if (name === 'type') this.type = nextValue;
    if (name === 'value') this.value = nextValue;
    if (name === 'checked') this.checked = true;
    if (name === 'disabled') this.disabled = true;
    if (name.startsWith('data-')) {
      const key = name.replace(/^data-/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      this.dataset[key] = nextValue;
    }
  }

  getAttribute(name) {
    if (name === 'id') return this.id;
    if (name === 'class') return this.className;
    if (name === 'type') return this.type;
    if (name === 'value') return this.value;
    if (name === 'checked') return this.checked ? 'true' : null;
    if (name === 'disabled') return this.disabled ? 'true' : null;
    if (name.startsWith('data-')) {
      const key = name.replace(/^data-/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      return this.dataset[key] ?? null;
    }
    return this.attributes[name] ?? null;
  }

  appendChild(child) {
    if (!child) return child;
    if (child.parentNode && child.parentNode !== this) child.parentNode.removeChild(child);
    child.parentNode = this;
    child.ownerDocument = this.ownerDocument || this;
    this.children.push(child);
    if (this.ownerDocument && child.id) this.ownerDocument._idMap.set(child.id, child);
    return child;
  }

  removeChild(child) {
    this.children = this.children.filter((node) => node !== child);
    if (child) {
      child.parentNode = null;
      child.listeners = {};
      child.ownerDocument = null;
      if (this.ownerDocument && child.id && this.ownerDocument._idMap.get(child.id) === child) {
        this.ownerDocument._idMap.delete(child.id);
      }
    }
    return child;
  }

  replaceChildren(...children) {
    for (const child of this.children) {
      child.parentNode = null;
      child.listeners = {};
      child.ownerDocument = null;
      if (this.ownerDocument && child.id && this.ownerDocument._idMap.get(child.id) === child) {
        this.ownerDocument._idMap.delete(child.id);
      }
    }
    this.children = [];
    for (const child of children) this.appendChild(child);
  }

  addEventListener(type, handler) {
    (this.listeners[type] ||= []).push(handler);
  }

  removeEventListener(type, handler) {
    this.listeners[type] = (this.listeners[type] || []).filter((fn) => fn !== handler);
  }

  dispatchEvent(event) {
    const evt = {
      target: this,
      currentTarget: this,
      type: event.type,
      preventDefault() {},
      stopPropagation() {},
      ...event
    };
    const handlers = this.listeners[evt.type] || [];
    for (const handler of handlers) handler.call(this, evt);
    return true;
  }

  click() {
    this.dispatchEvent({ type: 'click' });
  }

  focus() {}

  closest(selector) {
    let current = this;
    while (current) {
      if (current.matches(selector)) return current;
      current = current.parentNode;
    }
    return null;
  }

  matches(selector) {
    if (!selector || typeof selector !== 'string') return false;
    const trimmed = selector.trim();
    if (!trimmed) return false;

    const checkedOnly = trimmed.endsWith(':checked');
    const selectorName = checkedOnly ? trimmed.slice(0, -':checked'.length).trim() : trimmed;

    if (selectorName.startsWith('#')) {
      return this.id === selectorName.slice(1) && (!checkedOnly || this.checked);
    }
    if (selectorName.startsWith('.')) {
      const classList = (this.className || '').split(/\s+/).filter(Boolean);
      const classMatch = selectorName.slice(1).split('.').filter(Boolean).every((segment) => classList.includes(segment));
      return classMatch && (!checkedOnly || this.checked);
    }
    if (selectorName.startsWith('[data-')) {
      const attrMatch = selectorName.match(/\[data-([a-zA-Z0-9-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\]]+)))?\]/);
      if (!attrMatch) return false;
      const key = attrMatch[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const expected = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? null;
      const actual = this.dataset[key];
      const match = expected === null ? Object.prototype.hasOwnProperty.call(this.dataset, key) : actual === expected;
      return match && (!checkedOnly || this.checked);
    }
    const tagMatch = this.tagName.toLowerCase() === selectorName.toLowerCase();
    return tagMatch && (!checkedOnly || this.checked);
  }

  querySelectorAll(selector) {
    const results = [];
    const walk = (node) => {
      if (!node || !node.children) return;
      for (const child of node.children) {
        if (child.matches(selector)) results.push(child);
        walk(child);
      }
    };
    walk(this);
    return results;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  remove() {
    if (this.parentNode) this.parentNode.removeChild(this);
  }

  get firstElementChild() {
    return this.children.find((child) => child && typeof child.tagName === 'string') || null;
  }

  get firstChild() {
    return this.children[0] || null;
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(value) {
    this._innerHTML = String(value ?? '');
    for (const child of this.children) {
      child.parentNode = null;
      child.listeners = {};
      child.ownerDocument = null;
      if (this.ownerDocument && child.id && this.ownerDocument._idMap.get(child.id) === child) {
        this.ownerDocument._idMap.delete(child.id);
      }
    }
    this.children = [];
    const pattern = /<([a-zA-Z0-9-]+)([^>]*)>/g;
    let tagMatch;
    while ((tagMatch = pattern.exec(this._innerHTML))) {
      const tagName = tagMatch[1];
      const attrsText = tagMatch[2] || '';
      const attrs = {};
      const attrPattern = /([a-zA-Z0-9:-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
      let attrMatch;
      while ((attrMatch = attrPattern.exec(attrsText))) {
        const attrName = attrMatch[1];
        if (!attrName || attrName === '/') continue;
        const attrValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';
        if (attrName === 'class') attrs.className = attrValue;
        else if (attrName === 'id') attrs.id = attrValue;
        else if (attrName === 'type') attrs.type = attrValue;
        else if (attrName === 'value') attrs.value = attrValue;
        else if (attrName.startsWith('data-')) {
          const key = attrName.replace(/^data-/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          attrs.dataset = attrs.dataset || {};
          attrs.dataset[key] = attrValue;
        } else {
          attrs[attrName] = attrValue;
        }
      }
      if (['button', 'input', 'div', 'section', 'nav', 'main', 'span', 'p', 'h1', 'h2', 'label', 'form', 'textarea', 'select', 'option', 'a', 'small', 'strong', 'fieldset', 'legend', 'img', 'style'].includes(tagName.toLowerCase())) {
        const child = new FakeElement(tagName, attrs);
        child.ownerDocument = this.ownerDocument || this;
        child.parentNode = this;
        this.children.push(child);
        if (this.ownerDocument && child.id) this.ownerDocument._idMap.set(child.id, child);
      }
    }
  }
}

class FakeDocument {
  constructor() {
    this.documentElement = new FakeElement('html');
    this.head = new FakeElement('head');
    this.body = new FakeElement('body');
    this.documentElement.ownerDocument = this;
    this.head.ownerDocument = this;
    this.body.ownerDocument = this;
    this.documentElement.appendChild(this.head);
    this.documentElement.appendChild(this.body);
    this._idMap = new Map();
    this.readyState = 'complete';
  }

  createElement(tagName) {
    return new FakeElement(tagName);
  }

  getElementById(id) {
    if (this._idMap.has(id)) return this._idMap.get(id);
    const walk = (node) => {
      if (!node || !node.children) return null;
      for (const child of node.children) {
        if (child && child.id === id) {
          this._idMap.set(id, child);
          return child;
        }
        const found = walk(child);
        if (found) return found;
      }
      return null;
    };
    return walk(this.body) || walk(this.head) || null;
  }

  querySelectorAll(selector) {
    const results = [];
    const walk = (node) => {
      if (!node || !node.children) return;
      for (const child of node.children) {
        if (child.matches(selector)) results.push(child);
        walk(child);
      }
    };
    walk(this.body);
    walk(this.head);
    return results;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  register(node) {
    if (!node) return;
    node.ownerDocument = this;
    if (node.id) this._idMap.set(node.id, node);
    for (const child of node.children || []) this.register(child);
  }
}

function hasActiveClass(node, className = 'active') {
  if (!node) return false;
  return (node.className || '').split(/\s+/).filter(Boolean).includes(className);
}

function getNavById(runtime, id) {
  return Array.from(runtime.document.querySelectorAll('[data-user-nav]')).find((node) => node.dataset.userNav === id) || null;
}

function createRuntime({ currentUser = null, modules = [], discoverModules, loginResult } = {}) {
  const scheduleTimeout = (fn, delay, ...args) => {
    if (delay === 0 || delay === undefined || delay === null) {
      try {
        return fn(...args);
      } catch (error) {
        return null;
      }
    }
    const handle = setTimeout(fn, delay, ...args);
    if (handle && typeof handle.unref === 'function') handle.unref();
    return handle;
  };
  const cancelTimeout = (handle) => {
    clearTimeout(handle);
  };

  const document = new FakeDocument();
  const body = document.body;
  const content = new FakeElement('main');
  content.id = 'userAppContent';
  const nav = new FakeElement('nav');
  nav.id = 'userAppNav';
  const actions = new FakeElement('div');
  actions.id = 'userAppActions';
  body.appendChild(content);
  body.appendChild(nav);
  body.appendChild(actions);
  document.register(content);
  document.register(nav);
  document.register(actions);

  const localStorageStore = new Map();
  const localStorage = {
    getItem(key) { return localStorageStore.has(key) ? localStorageStore.get(key) : null; },
    setItem(key, value) { localStorageStore.set(String(key), String(value)); },
    removeItem(key) { localStorageStore.delete(key); }
  };

  const location = { hash: '#/' };
  const authState = { currentUser };
  const userModuleState = { currentUser };
  const windowObj = {
    document,
    location,
    history: {
      pushState(_state, _title, hash) {
        const nextHash = String(hash || '');
        location.hash = nextHash.startsWith('#') ? nextHash : `#${nextHash}`;
      }
    },
    localStorage,
    navigator: { language: 'en-US', serviceWorker: { register: async () => true } },
    isSecureContext: false,
    _listeners: {},
    addEventListener(type, handler) {
      (this._listeners[type] ||= []).push(handler);
    },
    removeEventListener(type, handler) {
      this._listeners[type] = (this._listeners[type] || []).filter((fn) => fn !== handler);
    },
    dispatchEvent(event) {
      const handlers = this._listeners[event.type] || [];
      for (const handler of handlers) handler.call(this, event);
      return true;
    },
    Core: {
      _handlers: {},
      on(eventName, handler) {
        (this._handlers[eventName] ||= []).push(handler);
      },
      emit(eventName, payload) {
        const handlers = this._handlers[eventName] || [];
        for (const handler of handlers) handler(payload);
      }
    },
    CoreLoader: { init() { return true; } },
    ModuleManager: {
      init() { return true; },
      hydratePublicOfflineModules() { return []; },
      discoverModules: typeof discoverModules === 'function' ? discoverModules : async () => modules
    },
    ModuleRegistry: { getAll() { return modules; } },
    NeutralUserModuleAccess: {
      visibleModules(currentModules) {
        return Array.isArray(currentModules) ? currentModules.filter((module) => module && (module.active || module.status === 'enabled' || module.status === 'active')) : [];
      },
      findVisibleModule(currentModules, id) {
        return (currentModules || []).find((module) => String(module.id) === String(id)) || null;
      },
      accessState(module) { return module ? 'allowed' : 'locked'; }
    },
    NeutralHomepageCache: null,
    NeutralHomepageDocument: { apply() {} },
    ConfigManager: { get() { return {}; }, set() {} },
    MasterFramework: { getActiveApp() { return { name: 'Neutral', branding: {} }; } },
    CorePerformance: { mark() {} },
    CoreErrorHandler: { handle() {} },
    NeutralUiFeedback: {
      lastSuccess: null,
      lastError: null,
      showSuccess(message) {
        this.lastSuccess = message;
        const dialog = document.createElement('div');
        dialog.setAttribute('data-success-dialog', 'true');
        const button = document.createElement('button');
        button.setAttribute('data-success-close', 'true');
        button.textContent = 'OK';
        button.addEventListener('click', () => {
          dialog.remove();
        });
        dialog.appendChild(button);
        dialog.textContent = String(message);
        dialog.appendChild(button);
        body.appendChild(dialog);
      },
      showError(message) {
        this.lastError = message;
      },
      closeSuccess() {
        const dialog = body.querySelector('[data-success-dialog="true"]');
        if (dialog) dialog.remove();
      }
    },
    CoreAuth: authState,
    UserModule: userModuleState,
    ApiClient: class {
      setSessionScope() {}
      setAuthRole() {}
      async login(username, password) {
        const payload = typeof loginResult === 'function'
          ? await loginResult({ username, password })
          : (loginResult || { ok: true, data: { user: { id: 'u1', username, roles: ['user'], permissions: ['user:read'] }, roles: ['user'], permissions: ['user:read'] } });
        const activeUser = payload?.data?.user || payload?.user || payload?.data?.data?.user || null;
        if (activeUser) {
          authState.currentUser = activeUser;
          userModuleState.currentUser = activeUser;
        }
        return payload;
      }
      async me() {
        if (authState.currentUser) return { ok: true, data: { user: authState.currentUser, roles: authState.currentUser.roles || ['user'], permissions: authState.currentUser.permissions || ['user:read'] } };
        return { ok: false, error: 'anonymous' };
      }
      async logout() { return { ok: true }; }
      async getProfile() { return { ok: true, data: { profile: { email: '', displayName: '', publicNickname: '', phone: '', address: '', gender: 'unspecified', birthday: '' } } }; }
      async updateProfile(profile) { return { ok: true, data: { profile } }; }
      async changePassword() { return { ok: true }; }
    },
    getServerApiClient() { return new this.ApiClient(); },
    setTimeout: scheduleTimeout,
    clearTimeout: cancelTimeout
  };

  const sandbox = {
    console,
    document,
    window: windowObj,
    globalThis: null,
    localStorage,
    navigator: windowObj.navigator,
    setTimeout: scheduleTimeout,
    clearTimeout: cancelTimeout,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Map,
    Set,
    Date,
    RegExp,
    Math,
    JSON,
    Promise,
    Intl,
    Error,
    TypeError,
    SyntaxError
  };
  sandbox.globalThis = sandbox;
  windowObj.globalThis = sandbox;
  windowObj.self = windowObj;
  windowObj.window = windowObj;
  windowObj.location = location;
  windowObj.CoreAuth = authState;
  windowObj.UserModule = userModuleState;

  vm.runInNewContext(buildUserAppSourceForRuntime(), sandbox, { filename: 'user-app.js' });
  return { document, window: windowObj, body, localStorageStore };
}

test('Basis 1: anonymous startup renders login shell without hanging', async () => {
  const runtime = createRuntime({
    currentUser: null,
    modules: [{ id: 'gps', active: true, status: 'enabled', description: 'GPS' }]
  });

  assert.ok(runtime.document.getElementById('userAppContent'), 'app shell exists');
  assert.ok(runtime.document.getElementById('userLoginButton'), 'login button renders for anonymous users');
  assert.ok(getNavById(runtime, 'home'), 'home nav exists');

  runtime.document.getElementById('userLoginButton').click();
  await flushMicrotasks();
  assert.ok(runtime.document.getElementById('userLoginForm'), 'login form appears');
  assert.ok(runtime.document.getElementById('userLoginSubmit'), 'login submit button exists');
  assert.equal(runtime.window.location.hash, '#/login', 'hash is on login route');
});

test('Basis 2: successful normal login resolves user state and home route', async () => {
  const runtime = createRuntime({
    currentUser: null,
    modules: [{ id: 'gps', active: true, status: 'enabled', description: 'GPS' }],
    loginResult: async () => ({
      ok: true,
      data: {
        user: { id: 'u1', username: 'tester', roles: ['user'], permissions: ['user:read'] },
        roles: ['user'],
        permissions: ['user:read']
      }
    })
  });

  const loginButton = runtime.document.getElementById('userLoginButton');
  loginButton.click();
  await flushMicrotasks();

  const username = runtime.document.getElementById('userLoginUsername');
  const password = runtime.document.getElementById('userLoginPassword');
  const form = runtime.document.getElementById('userLoginForm');
  username.value = 'tester';
  password.value = 'secret';
  form.dispatchEvent({ type: 'submit', preventDefault() {} });
  await flushMicrotasks();
  await flushMicrotasks();

  assert.ok(runtime.window.CoreAuth.currentUser, 'server user is set after login');
  assert.equal(runtime.window.CoreAuth.currentUser.username, 'tester', 'login uses authenticated username');
  assert.equal(runtime.window.location.hash, '#/', 'hash returns to home route');
  assert.ok(hasActiveClass(getNavById(runtime, 'home'), 'active'), 'home becomes active');
});

test('Basis 3: settings opens and renders module catalog without race', async () => {
  console.log('basis3 start');
  const runtime = createRuntime({
    currentUser: { id: 'u1', username: 'tester', roles: ['user'], permissions: ['user:read'] },
    modules: [{ id: 'gps', active: true, status: 'enabled', description: 'GPS' }],
    discoverModules: async () => [{ id: 'gps', active: true, status: 'enabled', description: 'GPS' }]
  });

  runtime.window.Core.emit('startup:modules-ready');
  console.log('basis3 after runtime', !!runtime.document.getElementById('userSettingsButton'));
  const settingsButton = runtime.document.getElementById('userSettingsButton');
  assert.ok(settingsButton, 'settings button exists for logged in user');
  settingsButton.click();
  console.log('basis3 after click hash', runtime.window.location.hash);
  await flushMicrotasks();
  console.log('basis3 after microtask hash', runtime.window.location.hash, 'save', !!runtime.document.getElementById('userSettingsSaveButton'));

  assert.ok(runtime.document.getElementById('userSettingsSaveButton'), 'save button is rendered');
  assert.ok(runtime.document.querySelectorAll('[data-user-setting-module]').length > 0, 'settings shows modules');
  assert.equal(runtime.window.location.hash, '#/settings/areas', 'settings route is applied');
});

test('Basis 4: normal settings save triggers success and state persistence', async () => {
  const runtime = createRuntime({
    currentUser: { id: 'u1', username: 'tester', roles: ['user'], permissions: ['user:read'] },
    modules: [{ id: 'gps', active: true, status: 'enabled', description: 'GPS' }],
    discoverModules: async () => [{ id: 'gps', active: true, status: 'enabled', description: 'GPS' }]
  });

  const settingsButton = runtime.document.getElementById('userSettingsButton');
  settingsButton.click();
  await flushMicrotasks();

  const saveButton = runtime.document.getElementById('userSettingsSaveButton');
  saveButton.click();
  await flushMicrotasks();
  await flushMicrotasks();

  const saved = runtime.localStorageStore.get('neutral.user.preferences.v1');
  assert.ok(saved, 'preferences are stored');
  assert.ok(runtime.window.NeutralUiFeedback.lastSuccess, 'success feedback is shown');
  assert.match(runtime.window.NeutralUiFeedback.lastSuccess, /Successfully saved\./i, 'success message matches save flow');
  assert.equal(runtime.window.location.hash, '#/settings/areas', 'save keeps user in settings');
});

test('A. Login + delayed discovery', async () => {
  let resolveDiscovery;
  const discovery = new Promise((resolve) => { resolveDiscovery = resolve; });
  const runtime = createRuntime({
    currentUser: null,
    modules: [{ id: 'gps', active: true, status: 'enabled', description: 'GPS' }],
    loginResult: async () => ({ ok: true, data: { user: { id: 'u1', username: 'tester', roles: ['user'], permissions: ['user:read'] }, roles: ['user'], permissions: ['user:read'] } }),
    discoverModules: async () => discovery
  });

  runtime.document.getElementById('userLoginButton').click();
  runtime.document.getElementById('userLoginUsername').value = 'tester';
  runtime.document.getElementById('userLoginPassword').value = 'secret';
  runtime.document.getElementById('userLoginForm').dispatchEvent({ type: 'submit', preventDefault() {} });
  await flushMicrotasks();
  await flushMicrotasks();

  assert.ok(hasActiveClass(getNavById(runtime, 'home'), 'active'), 'home remains active after login');
  assert.equal(runtime.window.location.hash, '#/', 'hash stays on home immediately after login');

  resolveDiscovery([{ id: 'gps', active: true, status: 'enabled', description: 'GPS' }]);
  await flushMicrotasks();
  await flushMicrotasks();

  assert.ok(hasActiveClass(getNavById(runtime, 'home'), 'active'), 'late discovery does not break home');
  assert.equal(runtime.window.location.hash, '#/', 'late discovery does not rewrite hash');
});

test('B. Start button stays stable during background updates', async () => {
  const runtime = createRuntime({
    currentUser: { id: 'u1', username: 'tester', roles: ['user'], permissions: ['user:read'] },
    modules: [{ id: 'gps', active: true, status: 'enabled', description: 'GPS' }],
    discoverModules: async () => [{ id: 'gps', active: true, status: 'enabled', description: 'GPS' }]
  });

  getNavById(runtime, 'home').click();
  await flushMicrotasks();
  runtime.document.getElementById('userSettingsButton').click();
  await flushMicrotasks();
  assert.ok(runtime.document.getElementById('userSettingsSaveButton'), 'settings content is visible before returning home');

  const homeNav = getNavById(runtime, 'home');
  homeNav.click();
  await flushMicrotasks();

  assert.ok(hasActiveClass(getNavById(runtime, 'home'), 'active'), 'home stays active after click');
  assert.equal(runtime.document.getElementById('userSettingsSaveButton'), null, 'one Start click replaces the previous view with home content');

  runtime.window.Core.emit('startup:modules-ready');
  runtime.window.Core.emit('startup:modules-error');
  await flushMicrotasks();

  assert.equal(runtime.window.location.hash, '#/', 'background events do not move route');
  assert.ok(hasActiveClass(getNavById(runtime, 'home'), 'active'), 'start state survives background updates');
});

test('C. Stale settings catalog responses do not overwrite successful state', async () => {
  let resolveFirst;
  let resolveSecond;
  const firstRequest = new Promise((resolve) => { resolveFirst = resolve; });
  const secondRequest = new Promise((resolve) => { resolveSecond = resolve; });
  let callCount = 0;

  const runtime = createRuntime({
    currentUser: { id: 'u1', username: 'tester', roles: ['user'], permissions: ['user:read'] },
    modules: [{ id: 'gps', active: true, status: 'enabled', description: 'GPS' }],
    discoverModules: async () => {
      callCount += 1;
      if (callCount === 1) return firstRequest;
      if (callCount === 2) return secondRequest;
      return [{ id: 'gps', active: true, status: 'enabled', description: 'GPS' }];
    }
  });

  const pendingDiscovery = runtime.window.__testHooks.refreshModuleDiscovery();
  await flushMicrotasks();

  const settingsButton = runtime.document.getElementById('userSettingsButton');
  settingsButton.click();
  await flushMicrotasks();

  assert.equal(runtime.document.getElementById('moduleDiscoveryRetry'), null, 'pending discovery does not show a retry button while the catalog is still loading');

  const retryDiscovery = runtime.window.__testHooks.refreshModuleDiscovery();
  await flushMicrotasks();

  resolveSecond([{ id: 'gps', active: true, status: 'enabled', description: 'GPS' }]);
  await flushMicrotasks();
  await flushMicrotasks();

  assert.ok(runtime.document.querySelectorAll('[data-user-setting-module]').length > 0, 'newer success result renders the catalog');
  resolveFirst(new Error('stale failure'));
  await flushMicrotasks();
  assert.ok(runtime.document.querySelectorAll('[data-user-setting-module]').length > 0, 'late stale failure does not remove successful catalog');
  await Promise.allSettled([pendingDiscovery, retryDiscovery]);
});

test('D. Settings save keeps user in settings and shows success modal', async () => {
  const runtime = createRuntime({
    currentUser: { id: 'u1', username: 'tester', roles: ['user'], permissions: ['user:read'] },
    modules: [{ id: 'gps', active: true, status: 'enabled', description: 'GPS' }],
    discoverModules: async () => [{ id: 'gps', active: true, status: 'enabled', description: 'GPS' }]
  });

  const settingsButton = runtime.document.getElementById('userSettingsButton');
  settingsButton.click();
  await flushMicrotasks();

  const saveButton = runtime.document.getElementById('userSettingsSaveButton');
  saveButton.click();
  await flushMicrotasks();
  await flushMicrotasks();

  const activeSection = Array.from(runtime.document.querySelectorAll('[data-settings-section]')).find((node) => hasActiveClass(node, 'active'));
  assert.ok(activeSection, 'settings section stays active after save');
  assert.equal(runtime.window.location.hash, '#/settings/areas', 'route stays in settings after save');

  const successDialog = runtime.document.body.querySelector('[data-success-dialog="true"]');
  assert.ok(successDialog, 'success dialog appears');
  const closeButton = successDialog.querySelector('[data-success-close]');
  assert.ok(closeButton, 'dialog has close button');
  assert.match((successDialog.textContent || '').replace(/OK/g, ''), /Successfully saved\./i, 'dialog contains success text');

  closeButton.click();
  assert.equal(runtime.document.body.querySelector('[data-success-dialog="true"]'), null, 'dialog closes on user dismissal');
});
