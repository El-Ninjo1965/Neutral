'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const loadScript = (context, filePath) => {
  const source = fs.readFileSync(filePath, 'utf8');
  vm.runInContext(source, context, { filename: filePath });
};

test('core loader uses moduleUrl and entryUrl from server catalog', async () => {
  const fetched = [];

  const sandbox = {
    window: null,
    document: { readyState: 'complete', addEventListener() {} },
    location: {
      origin: 'https://www.turbolikes.com',
      pathname: '/index/app/neutral/webroot/',
      protocol: 'https:',
      hostname: 'www.turbolikes.com',
      port: ''
    },
    ConfigManager: {
      get(key) {
        if (key === 'api') {
          return { baseUrl: '/index/app/neutral/webroot/api' };
        }
        return {};
      }
    },
    CoreErrorHandler: { handle() {} },
    fetch: async (url) => {
      fetched.push(url);
      if (url === '/index/app/neutral/webroot/api/modules') {
        return {
          ok: true,
          async json() {
            return {
              modules: [
                {
                  id: 'gps',
                  name: 'GPS',
                  displayName: 'GPS',
                  version: '1.0.0',
                  type: 'module',
                  entry: 'index.js',
                  globalName: 'GpsModule',
                  modulePath: 'app/modules/gps',
                  moduleUrl: '/index/app/neutral/app/modules/gps',
                  entryUrl: '/index/app/neutral/app/modules/gps/index.js',
                  permissions: [],
                  dependencies: [],
                  capabilities: []
                }
              ]
            };
          }
        };
      }

      if (url === '/index/app/neutral/app/modules/gps/index.js') {
        return {
          ok: true,
          async text() {
            return `
              window.GpsModule = {
                id: 'gps',
                name: 'GPS',
                version: '1.0.0',
                active: true,
                status: 'active'
              };
            `;
          }
        };
      }

      return {
        ok: false,
        async text() { return ''; },
        async json() { return {}; }
      };
    },
    console,
    URL
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  const root = path.resolve(__dirname, '..');
  loadScript(sandbox, path.join(root, 'platform/module-interface.js'));
  loadScript(sandbox, path.join(root, 'platform/core-loader.js'));

  const discovered = await sandbox.CoreLoader.discoverExternalModules('app/modules');
  assert.equal(discovered.length, 1);
  assert.equal(discovered[0].id, 'gps');
  assert.ok(fetched.includes('/index/app/neutral/app/modules/gps/index.js'));
  assert.ok(!fetched.includes('/index/app/neutral/webroot/app/modules/gps/index.js'));
});
