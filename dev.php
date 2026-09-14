<?php
declare(strict_types=1);

header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow, noarchive');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('X-Frame-Options: DENY');

if (($_GET['probe'] ?? '') === 'api-get') {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(200);
    echo json_encode(['ok' => true, 'method' => 'GET', 'runtime' => 'PHP'], JSON_UNESCAPED_SLASHES);
    exit;
}
if (($_GET['probe'] ?? '') === 'api-post') {
    header('Content-Type: application/json; charset=utf-8');
    $payload = json_decode((string)file_get_contents('php://input'), true);
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST' || !is_array($payload) || ($payload['probe'] ?? '') !== 'neutral-dev') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'invalid probe']);
        exit;
    }
    http_response_code(201);
    echo json_encode(['ok' => true, 'method' => 'POST', 'json' => true], JSON_UNESCAPED_SLASHES);
    exit;
}

header('Content-Type: text/html; charset=utf-8');
session_start();
if (!isset($_SESSION['neutral_dev_csrf'])) {
    $_SESSION['neutral_dev_csrf'] = bin2hex(random_bytes(24));
}
if (!isset($_SESSION['neutral_dev_results']) || !is_array($_SESSION['neutral_dev_results'])) {
    $_SESSION['neutral_dev_results'] = [];
}

function execute(array $command, int $timeoutMs = 5000): array
{
    if (!function_exists('proc_open')) {
        return ['ok' => false, 'exit' => null, 'out' => '', 'err' => '', 'state' => 'proc_open unavailable'];
    }
    $pipes = [];
    $process = @proc_open($command, [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, __DIR__);
    if (!is_resource($process)) {
        return ['ok' => false, 'exit' => null, 'out' => '', 'err' => '', 'state' => 'start rejected'];
    }
    fclose($pipes[0]);
    stream_set_blocking($pipes[1], false);
    stream_set_blocking($pipes[2], false);
    $stdout = '';
    $stderr = '';
    $started = microtime(true);
    $exit = null;
    $timedOut = false;
    while (true) {
        $stdout .= (string)stream_get_contents($pipes[1]);
        $stderr .= (string)stream_get_contents($pipes[2]);
        $status = proc_get_status($process);
        if (!$status['running']) {
            $exit = $status['exitcode'];
            break;
        }
        if ((microtime(true) - $started) * 1000 >= $timeoutMs) {
            $timedOut = true;
            @proc_terminate($process, 15);
            usleep(100000);
            if (proc_get_status($process)['running']) {
                @proc_terminate($process, 9);
            }
            break;
        }
        usleep(20000);
    }
    $stdout .= (string)stream_get_contents($pipes[1]);
    $stderr .= (string)stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $closed = @proc_close($process);
    if ($exit === -1 && is_int($closed) && $closed >= 0) {
        $exit = $closed;
    }
    return [
        'ok' => !$timedOut && $exit === 0,
        'exit' => $exit,
        'out' => trim(substr(str_replace("\r", '', $stdout), 0, 3000)),
        'err' => trim(substr(str_replace("\r", '', $stderr), 0, 1200)),
        'state' => $timedOut ? 'timeout; terminated' : 'completed',
    ];
}

function addCandidate(array &$paths, string $path): void
{
    if ($path !== '' && is_file($path) && !isset($paths[$path])) {
        $paths[$path] = is_executable($path);
    }
}

function commandPath(string $name): ?string
{
    $result = execute(['/bin/sh', '-c', 'command -v ' . escapeshellarg($name)], 2000);
    $path = strtok($result['out'], "\n");
    return $result['ok'] && is_string($path) && str_starts_with($path, '/') ? $path : null;
}

function findNode24(): array
{
    $paths = [];
    foreach ([
        '/opt/alt/alt-nodejs24/root/usr/bin/node',
        '/opt/alt/alt-nodejs24/usr/bin/node',
        '/opt/cpanel/ea-nodejs24/bin/node',
        '/opt/cpanel/ea-nodejs24/root/usr/bin/node',
        '/opt/cloudlinux/alt-nodejs24/root/usr/bin/node',
        '/opt/plesk/node/24/bin/node',
        '/usr/local/nodejs24/bin/node',
        '/usr/local/node24/bin/node',
    ] as $path) {
        addCandidate($paths, $path);
    }
    foreach ([
        '/opt/alt/alt-nodejs24*/root/usr/bin/node',
        '/opt/cpanel/ea-nodejs24*/bin/node',
        '/opt/cpanel/ea-nodejs24*/root/usr/bin/node',
        '/opt/cloudlinux/alt-nodejs24*/root/usr/bin/node',
        '/opt/plesk/node/24*/bin/node',
    ] as $pattern) {
        foreach ((array)@glob($pattern, GLOB_NOSORT) as $path) {
            addCandidate($paths, $path);
        }
    }
    foreach (['node', 'nodejs'] as $name) {
        $path = commandPath($name);
        if ($path !== null) {
            addCandidate($paths, $path);
        }
    }
    ksort($paths);
    $valid = [];
    $attempts = [];
    foreach ($paths as $path => $executable) {
        $version = $executable ? execute([$path, '--version']) : ['ok' => false, 'out' => '', 'err' => 'not executable'];
        $is24 = $version['ok'] && preg_match('/^v24\./', $version['out']) === 1;
        $attempts[] = $path . ' => ' . ($version['ok'] ? $version['out'] : 'TEST FEHLGESCHLAGEN: ' . ($version['err'] ?: 'not executable'));
        if ($is24) {
            $valid[$path] = $version['out'];
        }
    }
    return ['valid' => $valid, 'attempts' => $attempts];
}

function stateFile(): string
{
    return rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'neutral-dev-node24-' . hash('sha256', __FILE__) . '.json';
}

function readNodeState(): array
{
    $file = stateFile();
    if (!is_file($file) || !is_readable($file)) {
        return ['status' => 'stopped'];
    }
    $state = json_decode((string)@file_get_contents($file), true);
    return is_array($state) && ($state['owner'] ?? '') === 'neutral-dev-node24' ? $state : ['status' => 'failed', 'error' => 'invalid state'];
}

function ownsNodeProcess(array $state): bool
{
    $pid = (int)($state['pid'] ?? 0);
    $token = (string)($state['token'] ?? '');
    if ($pid < 2 || !preg_match('/^[a-f0-9]{48}$/', $token)) {
        return false;
    }
    $command = @file_get_contents('/proc/' . $pid . '/cmdline');
    if (!is_string($command) || $command === '') {
        $probe = execute(['/bin/sh', '-c', 'ps -p ' . (string)$pid . ' -o args='], 2000);
        $command = $probe['ok'] ? $probe['out'] : '';
    }
    return $command !== '' && str_contains($command, 'neutral-dev-node24') && str_contains($command, $token);
}

function stopNode(array $state): bool
{
    if (!ownsNodeProcess($state)) {
        return false;
    }
    $pid = (int)$state['pid'];
    if (function_exists('posix_kill')) {
        return @posix_kill($pid, 15);
    }
    return execute(['/bin/kill', '-TERM', (string)$pid], 2000)['ok'];
}

function nodeStatusText(array $state, string $message = ''): string
{
    $status = strtoupper((string)($state['status'] ?? 'stopped'));
    $lines = ['STATUS: ' . $status];
    if ($message !== '') $lines[] = 'Meldung: ' . $message;
    foreach ([
        'version' => 'Node-Version', 'binary' => 'Binary', 'pid' => 'PID', 'host' => 'Host', 'port' => 'Port',
        'startedAt' => 'Startzeit', 'timeoutSeconds' => 'Sicherheits-Timeout (Sekunden)',
        'stoppedAt' => 'Stoppzeit', 'stopReason' => 'Stoppgrund', 'error' => 'Fehler',
    ] as $key => $label) {
        if (isset($state[$key]) && $state[$key] !== '') $lines[] = $label . ': ' . (string)$state[$key];
    }
    return implode("\n", $lines);
}

function testNode24(): string
{
    $found = findNode24();
    if (!$found['valid']) {
        return "NICHT GEFUNDEN\nNode 24 wurde an den gezielt geprüften Pfaden nicht erfolgreich ausgeführt.\n" . implode("\n", $found['attempts']);
    }
    $path = array_key_first($found['valid']);
    $version = $found['valid'][$path];
    $script = execute([$path, '-e', 'process.stdout.write(JSON.stringify({ok:true,version:process.version,execPath:process.execPath}))']);
    $httpCode = <<<'JS'
const http=require('http');const server=http.createServer((q,s)=>s.end('OK'));const guard=setTimeout(()=>process.exit(4),2500);server.listen(0,'127.0.0.1',()=>{const a=server.address();http.get({host:'127.0.0.1',port:a.port},r=>{r.resume();r.on('end',()=>server.close(()=>{clearTimeout(guard);process.stdout.write(JSON.stringify({pid:process.pid,host:a.address,port:a.port,status:r.statusCode,closed:true}))}))}).on('error',()=>process.exit(3))});
JS;
    $http = execute([$path, '-e', $httpCode], 4000);
    $tools = [];
    foreach (['npm', 'npx'] as $name) {
        $tool = dirname($path) . '/' . $name;
        if (is_file($tool)) {
            $result = execute([$path, $tool, '--version'], 6000);
            $tools[] = strtoupper($name) . ': ' . ($result['ok'] ? $result['out'] . ' (' . $tool . ')' : 'TEST FEHLGESCHLAGEN');
        } else {
            $tools[] = strtoupper($name) . ': NICHT GEFUNDEN';
        }
    }
    return implode("\n", [
        'FUNKTIONIERT', 'Node-Version: ' . $version, 'Binary: ' . $path,
        'Einfaches Skript: ' . ($script['ok'] ? 'FUNKTIONIERT ' . $script['out'] : 'TEST FEHLGESCHLAGEN ' . $script['err']),
        ...$tools,
        '127.0.0.1 HTTP-Selbsttest: ' . ($http['ok'] ? 'FUNKTIONIERT ' . $http['out'] : 'TEST FEHLGESCHLAGEN ' . $http['err']),
    ]);
}

function httpProbe(string $url, string $method = 'GET', ?string $body = null): array
{
    $headers = "Accept: application/json\r\n";
    if ($body !== null) $headers .= "Content-Type: application/json\r\n";
    $context = stream_context_create(['http' => ['method' => $method, 'header' => $headers, 'content' => $body ?? '', 'ignore_errors' => true, 'timeout' => 8]]);
    $response = @file_get_contents($url, false, $context);
    $status = 0;
    foreach (($http_response_header ?? []) as $header) {
        if (preg_match('/^HTTP\/\S+\s+(\d{3})/', $header, $match)) $status = (int)$match[1];
    }
    return ['status' => $status, 'body' => is_string($response) ? substr($response, 0, 1000) : ''];
}

function testApi(): string
{
    $host = (string)($_SERVER['HTTP_HOST'] ?? '');
    if ($host === '' || !preg_match('/^[a-z0-9.-]+(?::\d+)?$/i', $host)) return 'TEST FEHLGESCHLAGEN\nKein sicherer Hostname verfügbar.';
    $script = (string)($_SERVER['SCRIPT_NAME'] ?? '/dev.php');
    $base = 'https://' . $host . $script;
    $get = httpProbe($base . '?probe=api-get');
    $post = httpProbe($base . '?probe=api-post', 'POST', json_encode(['probe' => 'neutral-dev']));
    $rewrite = httpProbe('https://' . $host . '/api/v1/status');
    $getJson = json_decode($get['body'], true);
    $postJson = json_decode($post['body'], true);
    $ok = $get['status'] === 200 && ($getJson['ok'] ?? false) === true && $post['status'] === 201 && ($postJson['ok'] ?? false) === true;
    return implode("\n", [
        $ok ? 'FUNKTIONIERT' : 'TEST FEHLGESCHLAGEN',
        'PHP-basierte API: ' . ($ok ? 'FUNKTIONIERT' : 'TEST FEHLGESCHLAGEN'),
        'HTTPS GET JSON: HTTP ' . $get['status'],
        'HTTPS POST JSON: HTTP ' . $post['status'],
        'Produktions-API-Rewrite GET /api/v1/status: HTTP ' . $rewrite['status'],
        'PHP: ' . PHP_VERSION . ' | SAPI: ' . PHP_SAPI,
        'Server: ' . substr((string)($_SERVER['SERVER_SOFTWARE'] ?? 'nicht gemeldet'), 0, 160),
        'Einschränkung: POST wurde nur gegen den isolierten Diagnose-Endpunkt ausgeführt; keine Produktions-API wurde verändert.',
    ]);
}

function testSsh(): string
{
    $lines = [];
    foreach (['ssh', 'ssh-keygen', 'scp', 'sftp'] as $name) {
        $path = commandPath($name);
        if ($path === null) {
            $lines[] = $name . ': NICHT GEFUNDEN';
            continue;
        }
        $version = execute([$path, '-V'], 3000);
        $text = trim($version['err'] . ' ' . $version['out']);
        $lines[] = $name . ': FUNKTIONIERT | ' . $path . ' | ' . substr($text, 0, 240);
    }
    $available = count(array_filter($lines, fn($line) => str_contains($line, 'FUNKTIONIERT')));
    array_unshift($lines, $available ? 'EINGESCHRÄNKT' : 'NICHT GEFUNDEN');
    $lines[] = 'Account-Unterstützung: Aus vorhandenen Client-Binaries allein nicht beweisbar.';
    $lines[] = 'Keine externe Verbindung und keine Authentifizierung wurde versucht.';
    return implode("\n", $lines);
}

function testPassenger(): string
{
    $paths = [];
    foreach (['passenger', 'passenger-config', 'passenger-status'] as $name) {
        $path = commandPath($name);
        if ($path !== null) addCandidate($paths, $path);
    }
    foreach ([
        '/usr/bin/passenger*', '/usr/local/bin/passenger*', '/opt/cpanel/*/bin/passenger*',
        '/opt/alt/*/bin/passenger*', '/opt/passenger/bin/passenger*', '/usr/lib*/passenger/bin/passenger*',
    ] as $pattern) {
        foreach ((array)@glob($pattern, GLOB_NOSORT) as $path) addCandidate($paths, $path);
    }
    if (!$paths) return "NICHT GEFUNDEN\nKein Passenger-Binary in PATH oder typischen Hostingpfaden gefunden.";
    $lines = ['EINGESCHRÄNKT'];
    foreach ($paths as $path => $executable) {
        $version = $executable ? execute([$path, '--version'], 4000) : ['ok' => false, 'out' => '', 'err' => 'not executable'];
        $lines[] = $path . ' => ' . ($version['ok'] ? $version['out'] : 'TEST FEHLGESCHLAGEN ' . $version['err']);
    }
    $lines[] = 'Eine nutzbare Account-/Application-Zuordnung ist durch installierte Binaries allein nicht bewiesen.';
    $lines[] = 'Keine Passenger-Konfiguration wurde verändert.';
    return implode("\n", $lines);
}

function startNode24(): string
{
    $state = readNodeState();
    if (($state['status'] ?? '') === 'running' && ownsNodeProcess($state)) return nodeStatusText($state, 'Mehrfachstart verhindert.');
    $found = findNode24();
    if (!$found['valid']) return "STATUS: FAILED\nNode 24: NICHT GEFUNDEN";
    $binary = array_key_first($found['valid']);
    $token = bin2hex(random_bytes(24));
    $file = stateFile();
    $runner = <<<'JS'
const fs=require('fs'),http=require('http');const token=process.argv[2],file=process.argv[3],startedAt=new Date().toISOString();let stopping=false;function write(status,extra={}){const tmp=file+'.'+process.pid+'.tmp';fs.writeFileSync(tmp,JSON.stringify(Object.assign({owner:'neutral-dev-node24',token,status,pid:process.pid,version:process.version,binary:process.execPath,host:'127.0.0.1',startedAt,timeoutSeconds:120},extra),null,2),{mode:0o600});fs.renameSync(tmp,file)}const server=http.createServer((q,s)=>s.end('NODE24_RUNNING'));function stop(reason){if(stopping)return;stopping=true;server.close(()=>{write('stopped',{stoppedAt:new Date().toISOString(),stopReason:reason});process.exit(0)});setTimeout(()=>process.exit(1),1500).unref()}server.on('error',e=>{write('failed',{stoppedAt:new Date().toISOString(),error:String(e.code||e.message).slice(0,160)});process.exit(3)});server.listen(0,'127.0.0.1',()=>write('running',{port:server.address().port}));process.on('SIGTERM',()=>stop('manual-stop'));process.on('SIGINT',()=>stop('manual-stop'));setTimeout(()=>stop('automatic-timeout'),120000).unref();
JS;
    $command = 'nohup ' . escapeshellarg($binary) . ' -e ' . escapeshellarg($runner) . ' neutral-dev-node24 ' . escapeshellarg($token) . ' ' . escapeshellarg($file) . ' >/dev/null 2>&1 </dev/null & echo $!';
    $launch = execute(['/bin/sh', '-c', $command], 3000);
    $pid = (int)trim($launch['out']);
    for ($attempt = 0; $attempt < 30; $attempt++) {
        usleep(50000);
        $state = readNodeState();
        if (($state['token'] ?? '') === $token && in_array($state['status'] ?? '', ['running', 'failed'], true)) break;
    }
    if (($state['status'] ?? '') === 'running' && ownsNodeProcess($state)) return nodeStatusText($state, 'Node 24 wurde gestartet.');
    if ($pid > 1) stopNode(['pid' => $pid, 'token' => $token]);
    return nodeStatusText($state, 'Start fehlgeschlagen; kein fremder Prozess wurde beendet.');
}

$message = '';
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $csrf = is_string($_POST['csrf'] ?? null) ? $_POST['csrf'] : '';
    if (!hash_equals((string)$_SESSION['neutral_dev_csrf'], $csrf)) {
        $message = 'TEST FEHLGESCHLAGEN: ungültiger Anfragekontext';
    } else {
        $action = (string)($_POST['action'] ?? '');
        if ($action === 'node-test') $_SESSION['neutral_dev_results']['NODE.JS 24'] = testNode24();
        elseif ($action === 'node-start') $_SESSION['neutral_dev_results']['NODE.JS 24 STATUS'] = startNode24();
        elseif ($action === 'node-stop') {
            $state = readNodeState();
            if (($state['status'] ?? '') === 'running' && stopNode($state)) {
                for ($attempt = 0; $attempt < 30; $attempt++) { usleep(50000); $state = readNodeState(); if (($state['status'] ?? '') === 'stopped') break; }
                $_SESSION['neutral_dev_results']['NODE.JS 24 STATUS'] = nodeStatusText($state, 'Node 24 wurde gestoppt.');
            } else $_SESSION['neutral_dev_results']['NODE.JS 24 STATUS'] = nodeStatusText($state, 'Kein eindeutig eigener laufender Prozess wurde signalisiert.');
        } elseif ($action === 'node-status') {
            $state = readNodeState();
            if (($state['status'] ?? '') === 'running' && !ownsNodeProcess($state)) {
                $state['status'] = 'stopped'; $state['stoppedAt'] = gmdate('c'); $state['stopReason'] = 'process no longer present';
                @file_put_contents(stateFile(), json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX);
            }
            $_SESSION['neutral_dev_results']['NODE.JS 24 STATUS'] = nodeStatusText($state, 'Status aktualisiert.');
        } elseif ($action === 'api') $_SESSION['neutral_dev_results']['API'] = testApi();
        elseif ($action === 'ssh') $_SESSION['neutral_dev_results']['SSH'] = testSsh();
        elseif ($action === 'passenger') $_SESSION['neutral_dev_results']['PASSENGER'] = testPassenger();
        elseif ($action === 'all') {
            $_SESSION['neutral_dev_results']['NODE.JS 24'] = testNode24();
            $_SESSION['neutral_dev_results']['NODE.JS 24 STATUS'] = nodeStatusText(readNodeState(), 'Status gelesen; kein Prozess gestartet.');
            $_SESSION['neutral_dev_results']['API'] = testApi();
            $_SESSION['neutral_dev_results']['SSH'] = testSsh();
            $_SESSION['neutral_dev_results']['PASSENGER'] = testPassenger();
        }
    }
}

$sections = ['NODE.JS 24', 'NODE.JS 24 STATUS', 'API', 'SSH', 'PASSENGER'];
$report = "NEUTRAL SERVER-DIAGNOSE\nZeit: " . gmdate('c') . "\n";
foreach ($sections as $section) $report .= "\n=== $section ===\n" . ($_SESSION['neutral_dev_results'][$section] ?? 'NOCH NICHT GETESTET') . "\n";
$nonce = base64_encode(random_bytes(18));
header("Content-Security-Policy: default-src 'none'; style-src 'nonce-$nonce'; script-src 'nonce-$nonce'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
?>
<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Server-Diagnose</title>
<style nonce="<?=htmlspecialchars($nonce, ENT_QUOTES, 'UTF-8')?>">:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#0e1625;color:#edf4ff;font:16px/1.5 system-ui,-apple-system,sans-serif}main{width:min(1050px,calc(100% - 24px));margin:20px auto}h1{font-size:clamp(1.5rem,5vw,2.2rem)}.card{background:#17243a;border:1px solid #354968;border-radius:15px;padding:17px;margin:14px 0}.buttons{display:flex;flex-wrap:wrap;gap:10px}button{min-height:48px;padding:12px 17px;border:0;border-radius:11px;background:#4c82ff;color:#fff;font:inherit;font-weight:750;touch-action:manipulation}.stop{background:#bd4054}.all{background:#17825f}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#09111e;border-radius:10px;padding:14px;font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace}.message,#copy-status{color:#80e5ad;font-weight:700}</style></head>
<body><main><h1>Zentrale Server-Diagnose</h1><p>Alle Tests sind isoliert und verändern weder Datenbank noch Serverkonfiguration. Node bindet ausschließlich an 127.0.0.1 und endet automatisch nach 120 Sekunden.</p>
<form method="post"><input type="hidden" name="csrf" value="<?=htmlspecialchars((string)$_SESSION['neutral_dev_csrf'], ENT_QUOTES, 'UTF-8')?>"><div class="buttons"><button class="all" name="action" value="all">Alle Tests ausführen</button></div>
<?php foreach (['NODE.JS 24' => [['node-test','Node 24 testen'],['node-start','Node 24 starten'],['node-stop','Node 24 stoppen'],['node-status','Status prüfen']], 'API' => [['api','API testen']], 'SSH' => [['ssh','SSH testen']], 'PASSENGER' => [['passenger','Passenger testen']]] as $title => $buttons): ?>
<section class="card"><h2><?=htmlspecialchars($title, ENT_QUOTES, 'UTF-8')?></h2><div class="buttons"><?php foreach ($buttons as [$value,$label]): ?><button<?=$value==='node-stop'?' class="stop"':''?> name="action" value="<?=htmlspecialchars($value, ENT_QUOTES, 'UTF-8')?>"><?=htmlspecialchars($label, ENT_QUOTES, 'UTF-8')?></button><?php endforeach ?></div><pre><?=htmlspecialchars((string)($_SESSION['neutral_dev_results'][$title] ?? 'NOCH NICHT GETESTET'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')?><?php if ($title==='NODE.JS 24'): ?>

<?=htmlspecialchars((string)($_SESSION['neutral_dev_results']['NODE.JS 24 STATUS'] ?? nodeStatusText(readNodeState())), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')?><?php endif ?></pre></section>
<?php endforeach ?></form><?php if ($message !== ''): ?><p class="message"><?=htmlspecialchars($message, ENT_QUOTES, 'UTF-8')?></p><?php endif ?><button id="copy" type="button">Ergebnisse kopieren</button><span id="copy-status" role="status" aria-live="polite"></span><pre id="all-results"><?=htmlspecialchars($report, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')?></pre></main>
<script nonce="<?=htmlspecialchars($nonce, ENT_QUOTES, 'UTF-8')?>">(()=>{const b=document.getElementById('copy'),s=document.getElementById('copy-status'),r=document.getElementById('all-results');b.addEventListener('click',async()=>{const t=r.textContent||'';try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(t);else{const a=document.createElement('textarea');a.value=t;a.readOnly=true;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();a.setSelectionRange(0,a.value.length);if(!document.execCommand('copy'))throw new Error('copy');a.remove()}s.textContent='Ergebnisse kopiert.'}catch(e){s.textContent='Kopieren nicht möglich – Ausgabe bitte markieren.'}})})();</script></body></html>
