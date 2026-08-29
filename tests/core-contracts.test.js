const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const load = (context, name) => vm.runInContext(
  fs.readFileSync(path.join(__dirname, '../Web-App/core', name), 'utf8'),
  context,
  { filename: name }
);

test('public core contract is versioned, immutable and separates internal globals', () => {
  const browser = { window: null };
  browser.window = browser;
  const context = vm.createContext(browser);
  load(context, 'core.js');
  load(context, 'core-contracts.js');

  assert.equal(browser.Core.contractVersion, '1.0.0');
  assert.equal(browser.Core.getContract(), browser.CoreContracts);
  assert.equal(Object.isFrozen(browser.CoreContracts), true);
  assert.equal(Object.isFrozen(browser.CoreContracts.events), true);
  assert.equal(browser.Core.events.NETWORK_CHANGED, 'network:changed');
  assert.equal(browser.Core.isPublicFacade('CoreNetwork'), true);
  assert.equal(browser.Core.isPublicFacade('CoreEventBus'), false);
  assert.equal(browser.CoreContracts.internalGlobals.includes('MasterFramework'), true);
});
