<?php
declare(strict_types=1);

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Robots-Tag: noindex, nofollow');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('X-Frame-Options: DENY');

$nonce = base64_encode(random_bytes(18));
header("Content-Security-Policy: default-src 'none'; style-src 'nonce-{$nonce}'; script-src 'nonce-{$nonce}'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");

$expectedKeyHash = '5d7782b3cb6df86556c442b26923af75b254847e4b5165f00cef6cfc90f637cc';
$providedKey = isset($_GET['key']) && is_string($_GET['key']) ? $_GET['key'] : '';

if ($providedKey === '' || !hash_equals($expectedKeyHash, hash('sha256', $providedKey))) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Not found';
    exit;
}

function available(string $extension): bool
{
    return extension_loaded($extension);
}

function safeIni(string $name): string
{
    $value = ini_get($name);
    return $value === false || $value === '' ? 'nicht gesetzt' : (string) $value;
}

function outboundHttpsTest(): array
{
    if (!function_exists('curl_init')) {
        return ['verfügbar' => false, 'details' => 'cURL fehlt'];
    }

    $handle = curl_init('https://example.com/');
    curl_setopt_array($handle, [
        CURLOPT_NOBODY => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 4,
        CURLOPT_TIMEOUT => 7,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ]);
    $result = curl_exec($handle);
    $status = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
    $errorCode = curl_errno($handle);
    curl_close($handle);

    return [
        'verfügbar' => $result !== false && $status >= 200 && $status < 500,
        'http_status' => $status,
        'fehlercode' => $errorCode,
    ];
}

function temporaryFileTest(): array
{
    $name = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'neutral-host-check-' . bin2hex(random_bytes(6)) . '.tmp';
    $payload = random_bytes(24);
    $written = @file_put_contents($name, $payload, LOCK_EX);
    $readBack = $written !== false ? @file_get_contents($name) : false;
    $deleted = is_file($name) ? @unlink($name) : true;

    return [
        'schreiben' => $written === strlen($payload),
        'lesen' => $readBack !== false && hash_equals($payload, $readBack),
        'löschen' => $deleted && !is_file($name),
    ];
}

$extensionNames = [
    'curl', 'dom', 'fileinfo', 'ftp', 'gd', 'imagick', 'intl', 'json',
    'mbstring', 'mysqli', 'openssl', 'pdo', 'pdo_mysql', 'session',
    'simplexml', 'soap', 'sockets', 'xml', 'zip',
];
$extensions = [];
foreach ($extensionNames as $extensionName) {
    $extensions[$extensionName] = available($extensionName);
}

$pdoDrivers = class_exists('PDO') ? PDO::getAvailableDrivers() : [];
$serverSoftware = isset($_SERVER['SERVER_SOFTWARE']) && is_string($_SERVER['SERVER_SOFTWARE'])
    ? preg_replace('/[^A-Za-z0-9._\/-].*/', '', $_SERVER['SERVER_SOFTWARE'])
    : 'unbekannt';

$dnsResolved = false;
if (function_exists('gethostbyname')) {
    $resolved = gethostbyname('example.com');
    $dnsResolved = $resolved !== 'example.com';
}

$report = [
    'erstellt_utc' => gmdate('c'),
    'laufzeit' => [
        'php_version' => PHP_VERSION,
        'sapi' => PHP_SAPI,
        'architektur_bit' => PHP_INT_SIZE * 8,
        'webserver' => $serverSoftware,
        'https' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        'zeitzone' => date_default_timezone_get(),
    ],
    'grenzen' => [
        'memory_limit' => safeIni('memory_limit'),
        'max_execution_time' => safeIni('max_execution_time'),
        'max_input_time' => safeIni('max_input_time'),
        'post_max_size' => safeIni('post_max_size'),
        'upload_max_filesize' => safeIni('upload_max_filesize'),
        'max_file_uploads' => safeIni('max_file_uploads'),
        'allow_url_fopen' => safeIni('allow_url_fopen'),
        'session_save_handler' => safeIni('session.save_handler'),
    ],
    'erweiterungen' => $extensions,
    'pdo_treiber' => $pdoDrivers,
    'funktionen' => [
        'mail_verfügbar_ohne_versandtest' => function_exists('mail'),
        'dns_auflösung' => $dnsResolved,
        'ausgehendes_https' => outboundHttpsTest(),
        'temporäre_datei' => temporaryFileTest(),
    ],
    'hinweis' => 'Temporäre Diagnose. Nach der Auswertung vom Server entfernen.',
];

if (isset($_GET['format']) && $_GET['format'] === 'json') {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

$copyText = json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
?>
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Hosting-Fähigkeiten</title>
  <style nonce="<?= htmlspecialchars($nonce, ENT_QUOTES, 'UTF-8') ?>">
    :root{color-scheme:dark;--bg:#0b1020;--card:#151d33;--line:#2b385a;--text:#eef3ff;--muted:#aab7d6;--ok:#45d483;--no:#ff6978}
    *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.5 system-ui,sans-serif}
    main{width:min(1050px,calc(100% - 28px));margin:32px auto}.head,.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px;margin-bottom:16px}
    h1,h2{margin-top:0}.muted{color:var(--muted)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}
    table{width:100%;border-collapse:collapse}td{padding:8px;border-bottom:1px solid var(--line);vertical-align:top}td:first-child{color:var(--muted)}
    .yes{color:var(--ok)}.no{color:var(--no)}button{border:0;border-radius:10px;padding:11px 16px;background:#5b8cff;color:white;font-weight:700;cursor:pointer}
    pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#090d18;padding:16px;border-radius:12px;max-height:420px;overflow:auto}
  </style>
</head>
<body>
<main>
  <section class="head">
    <h1>Hosting-Fähigkeiten</h1>
    <p class="muted">Sicherer, temporärer Überblick ohne Passwörter oder vollständige Serverkonfiguration.</p>
    <button id="copy" type="button">Alles kopieren</button> <span id="copyStatus" role="status"></span>
  </section>
  <div class="grid">
    <?php foreach (['laufzeit' => 'Laufzeit', 'grenzen' => 'PHP-Grenzen', 'erweiterungen' => 'Erweiterungen', 'funktionen' => 'Funktionen'] as $key => $title): ?>
      <section class="card"><h2><?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?></h2><table>
        <?php foreach ($report[$key] as $name => $value): ?>
          <tr><td><?= htmlspecialchars((string) $name, ENT_QUOTES, 'UTF-8') ?></td><td><?php
            if (is_bool($value)) echo '<span class="' . ($value ? 'yes' : 'no') . '">' . ($value ? 'Ja' : 'Nein') . '</span>';
            elseif (is_array($value)) echo htmlspecialchars(json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), ENT_QUOTES, 'UTF-8');
            else echo htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
          ?></td></tr>
        <?php endforeach; ?>
      </table></section>
    <?php endforeach; ?>
  </div>
  <section class="card"><h2>Kopierbare Daten</h2><pre id="report"><?= htmlspecialchars($copyText, ENT_QUOTES, 'UTF-8') ?></pre></section>
  <p class="muted">Diese Datei nach abgeschlossener Auswertung wieder entfernen. Der FTPS-Zugang bleibt davon unberührt.</p>
</main>
<script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES, 'UTF-8') ?>">
document.getElementById('copy').addEventListener('click',async()=>{const text=document.getElementById('report').textContent;const status=document.getElementById('copyStatus');try{await navigator.clipboard.writeText(text);status.textContent='Kopiert.'}catch(e){status.textContent='Kopieren nicht möglich – Text bitte markieren.'}});
</script>
</body>
</html>

