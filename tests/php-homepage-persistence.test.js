'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

test('PHP settings persistence round-trips module and exact trusted HTML modes', () => {
  const bootstrap = path.resolve(__dirname, '../Server/php/bootstrap.php');
  const script = String.raw`
require getenv('NEUTRAL_BOOTSTRAP');
$root = sys_get_temp_dir() . '/neutral-homepage-' . bin2hex(random_bytes(8));
$service = new \Neutral\Core\Phase4SettingsService(new \Neutral\Core\Phase4JsonStore($root));
$module = $service->update(['homepage' => ['mode' => 'module', 'moduleId' => 'gps', 'title' => 'GPS', 'content' => '']]);
$htmlValue = "  <section data-live=\"yes\">Start</section>\n";
$html = $service->update(['homepage' => ['mode' => 'html', 'moduleId' => '', 'title' => 'Home', 'content' => $htmlValue]]);
$read = $service->getAll();
echo json_encode(['module' => $module['homepage'], 'html' => $html['homepage'], 'read' => $read['homepage'], 'expected' => $htmlValue]);
`;
  const result = spawnSync('php', ['-r', script], {
    env: { ...process.env, NEUTRAL_BOOTSTRAP: bootstrap },
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.deepEqual(payload.module, { mode: 'module', title: 'GPS', content: '', moduleId: 'gps' });
  assert.equal(payload.html.mode, 'html');
  assert.equal(payload.html.content, payload.expected);
  assert.deepEqual(payload.read, payload.html);
});
