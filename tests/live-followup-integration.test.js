'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('PHP device sessions replace the previous login for one installation and identify iPad Chrome', () => {
  const php = String.raw`
require '${root}/Server/php/bootstrap.php';
class FollowupStatement extends PDOStatement {
  public string $sql = ''; public array $executions = [];
  public function execute(?array $params = null): bool { $this->executions[] = $params ?? []; return true; }
  public function fetchAll(int $mode = PDO::FETCH_DEFAULT, mixed ...$args): array { return [['session_id'=>session_id(),'user_id'=>1,'username'=>'admin','display_name'=>'Admin','status'=>'active','issued_at'=>'2026-09-09','last_seen_at'=>'2026-09-09','expires_at'=>'2026-10-09','device_id'=>str_repeat('a',32),'device_label'=>'iPad Chrome','user_agent'=>'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Mobile/15E148 CriOS/128.0.0.0 Safari/604.1','role_keys'=>'admin']]; }
}
class FollowupPdo extends PDO { public array $prepared=[]; public function __construct() {} public function prepare(string $query, array $options=[]): PDOStatement|false { $s=new FollowupStatement(); $s->sql=$query; $this->prepared[]=$s; return $s; } public function query(string $query, ?int $fetchMode=null, mixed ...$args): PDOStatement|false { $s=new FollowupStatement(); $s->sql=$query; return $s; }}
$config=new Neutral\Core\AppConfig(['APP_ENV'=>'test','DB_TYPE'=>'mysql','DB_HOST'=>'localhost','DB_NAME'=>'neutral','DB_USER'=>'neutral'],'${root}'); $db=new Neutral\Core\Database($config); $pdo=new FollowupPdo(); $p=new ReflectionProperty($db,'pdo'); $p->setAccessible(true); $p->setValue($db,$pdo); session_id('current-login'); $registry=new Neutral\Core\Phase4SessionRegistry(new Neutral\Core\Phase4JsonStore(sys_get_temp_dir()),$db); $registry->replaceActiveInstallation(1,str_repeat('a',32),'current-login'); $rows=$registry->listPublic(); echo json_encode(['sql'=>$pdo->prepared[0]->sql,'platform'=>$rows[0]['platform']]);`;
  const result = spawnSync('php', ['-r', php], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const value = JSON.parse(result.stdout);
  assert.match(value.sql, /device_id = :device_id/);
  assert.match(value.sql, /session_id <> :session_id/);
  assert.equal(value.platform, 'iPadOS · Chrome');
});

test('admin router commits navigation immediately and isolates a failed view', async () => {
  global.AdminCommon = { clearRouteAlerts() {}, formatValue(value) { return String(value); } };
  global.document = { createElement: () => ({ innerHTML: '', setAttribute() {} }), getElementById: () => main };
  const main = { children: [], replaceChildren(node) { this.children = [node]; } };
  const Router = require('../Web-App/public/admin/index.js');
  const router = Object.create(Router.prototype);
  router.views = { broken: { async init() { throw new Error('offline'); } }, good: { async init(host) { host.innerHTML = 'ready'; } } };
  router.shell = { setActive() {}, setTitle() {}, focusTitle() {} };
  router.formatViewName = (name) => name;
  await router.showView('broken');
  await router.showView('good');
  assert.equal(router.currentView, 'good');
  assert.equal(main.children[0].innerHTML, 'ready');
  delete global.document; delete global.AdminCommon;
});

test('GPS location contract offers Google, OpenStreetMap and explicit system share', async () => {
  const gps = require('../Web-App/app/modules/gps/index.js');
  const links = gps.locationLinks({ latitude: 52.52, longitude: 13.405 });
  assert.match(links.googleMaps, /^https:\/\/www\.google\.com\/maps/);
  assert.match(links.openStreetMap, /^https:\/\/www\.openstreetmap\.org/);
  assert.match(links.embedMap, /^https:\/\/www\.openstreetmap\.org\/export\/embed/);
});

test('dashboard renders authoritative device count and readable nested database state', () => {
  global.AdminCommon = { formatValue: String };
  const Router = require('../Web-App/public/admin/index.js');
  const view = new Router.AdminDashboardView({});
  view.container = { innerHTML: '' };
  view.snapshot = {
    runtime: { database: { status: 'ready' }, timestamp: '2026-09-09T12:00:00Z' }, health: { status: 'healthy' }, users: [],
    sessions: [{ status: 'active', deviceLabel: 'iPadOS · Chrome', platform: 'iPadOS · Chrome', username: 'admin', current: true }],
    modules: [{ id: 'gps', active: true }, { id: 'reference-notes', active: false }], settings: {}, backupReadiness: { keyConfigured: false }
  };
  view.render();
  assert.match(view.container.innerHTML, /Active sessions[\s\S]*>1</);
  assert.match(view.container.innerHTML, /Backup action required/);
  assert.doesNotMatch(view.container.innerHTML, /\[object Object\]|<pre[^>]*>\s*\{\s*\}<\/pre>/);
  delete global.AdminCommon;
});
