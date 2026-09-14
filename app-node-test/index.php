<?php
declare(strict_types=1);
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow, noarchive');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('X-Frame-Options: DENY');
session_start();
if (!isset($_SESSION['node_diagnostic_csrf'])) $_SESSION['node_diagnostic_csrf']=bin2hex(random_bytes(24));

function run(array $command, int $timeoutMs = 5000): array {
    if (!function_exists('proc_open')) return ['ok'=>false,'exit'=>null,'out'=>'','err'=>'','state'=>'proc_open unavailable'];
    $pipes=[];$process=@proc_open($command,[0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']],$pipes,__DIR__);
    if (!is_resource($process)) return ['ok'=>false,'exit'=>null,'out'=>'','err'=>'','state'=>'start rejected'];
    fclose($pipes[0]);stream_set_blocking($pipes[1],false);stream_set_blocking($pipes[2],false);
    $out='';$err='';$start=microtime(true);$exit=null;$timedOut=false;
    while (true) {
        $out.=(string)stream_get_contents($pipes[1]);$err.=(string)stream_get_contents($pipes[2]);
        $status=proc_get_status($process);
        if (!$status['running']) {$exit=$status['exitcode'];break;}
        if ((microtime(true)-$start)*1000 >= $timeoutMs) {$timedOut=true;@proc_terminate($process,15);usleep(100000);if (proc_get_status($process)['running']) @proc_terminate($process,9);break;}
        usleep(20000);
    }
    $out.=(string)stream_get_contents($pipes[1]);$err.=(string)stream_get_contents($pipes[2]);fclose($pipes[1]);fclose($pipes[2]);
    $closed=@proc_close($process);if ($exit===-1 && is_int($closed) && $closed>=0) $exit=$closed;
    return ['ok'=>!$timedOut&&$exit===0,'exit'=>$exit,'out'=>trim(substr(str_replace("\r",'', $out),0,4000)),'err'=>trim(substr(str_replace("\r",'', $err),0,2000)),'state'=>$timedOut?'timeout; terminated':'completed'];
}
function commandPath(string $name): ?string {
    $r=run(['/bin/sh','-c','command -v '.escapeshellarg($name)],2000);$p=strtok($r['out'],"\n");
    return $r['ok']&&is_string($p)&&str_starts_with($p,'/')?$p:null;
}
function add(array &$set,string $path,string $source): void {
    if ($path!==''&&!isset($set[$path])&&is_file($path)) $set[$path]=['source'=>$source,'executable'=>is_executable($path)];
}
function sec(string $title,array|string $values): string {
    $values=is_array($values)?$values:[$values];return $title.":\n".implode("\n",array_map(fn($v)=>'- '.($v===''?'(leer)':$v),$values))."\n";
}
function readManualState(string $file): array {
    if (!is_file($file) || !is_readable($file)) return ['status'=>'stopped'];
    $decoded=json_decode((string)@file_get_contents($file),true);
    return is_array($decoded)&&($decoded['owner']??'')==='neutral-node-diagnostic'?$decoded:['status'=>'failed','error'=>'invalid state file'];
}
function ownsProcess(array $state,string $runner): bool {
    $pid=(int)($state['pid']??0);$token=(string)($state['token']??'');
    if ($pid<2||!preg_match('/^[a-f0-9]{32,128}$/',$token)) return false;
    $cmdline=@file_get_contents('/proc/'.$pid.'/cmdline');
    if (!is_string($cmdline) || $cmdline==='') {
        $probe=run(['/bin/sh','-c','ps -p '.(string)$pid.' -o args='],2000);
        $cmdline=$probe['ok']?$probe['out']:'';
    }
    return $cmdline!==''&&str_contains($cmdline,$runner)&&str_contains($cmdline,$token);
}
function signalOwnedProcess(array $state,string $runner): bool {
    if (!ownsProcess($state,$runner)) return false;
    $pid=(int)$state['pid'];
    if (function_exists('posix_kill')) return @posix_kill($pid,15);
    $result=run(['/bin/kill','-TERM',(string)$pid],2000);
    return $result['ok'];
}

$nodes=[];
foreach (['node','nodejs'] as $name) if ($p=commandPath($name)) add($nodes,$p,'PHP PATH');
foreach (['/usr/bin/node','/usr/bin/nodejs','/usr/local/bin/node','/usr/local/bin/nodejs','/bin/node','/bin/nodejs'] as $p) add($nodes,$p,'standard path');
$patterns=['/opt/alt/alt-nodejs24/root/usr/bin/node','/opt/alt/alt-nodejs24/usr/bin/node','/opt/cpanel/ea-nodejs24/bin/node','/opt/cpanel/ea-nodejs24/root/usr/bin/node','/opt/cloudlinux/alt-nodejs24/root/usr/bin/node','/opt/plesk/node/24/bin/node','/opt/cpanel/ea-nodejs*/bin/node','/opt/cpanel/ea-nodejs*/root/usr/bin/node','/opt/alt/alt-nodejs*/root/usr/bin/node','/opt/alt/alt-nodejs*/usr/bin/node','/opt/cloudlinux/alt-nodejs*/root/usr/bin/node','/opt/plesk/node/*/bin/node','/usr/local/nodejs*/bin/node','/usr/local/node*/bin/node'];
foreach ($patterns as $pattern) foreach ((array)@glob($pattern,GLOB_NOSORT) as $p) add($nodes,$p,'hosting path');
ksort($nodes);
$manualNodes=[];
foreach($nodes as $path=>$meta){$v=run([$path,'--version']);$s=run([$path,'-e','process.stdout.write(process.version)']);if($v['ok']&&$s['ok'])$manualNodes[$path]=['version'=>$v['out'],'source'=>$meta['source']];}

$manualStateFile=__DIR__.'/.node-diagnostic-state.json';
$manualLogFile=__DIR__.'/.node-diagnostic-process.log';
$manualRunner=__DIR__.'/manual-node-server.js';
$manualMessage='';
$manualState=readManualState($manualStateFile);
if (($manualState['status']??'')==='running'&&!ownsProcess($manualState,$manualRunner)) {
    $manualState['status']='stopped';$manualState['stopReason']='process no longer present';
    @file_put_contents($manualStateFile,json_encode($manualState,JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES),LOCK_EX);
}
if (($_SERVER['REQUEST_METHOD']??'GET')==='POST') {
    $csrf=is_string($_POST['csrf']??null)?$_POST['csrf']:'';
    if (!hash_equals((string)$_SESSION['node_diagnostic_csrf'],$csrf)) {
        $manualMessage='fehlgeschlagen: ungültiger Anfragekontext';
    } elseif (($_POST['action']??'')==='start') {
        $manualState=readManualState($manualStateFile);
        if (($manualState['status']??'')==='running'&&ownsProcess($manualState,$manualRunner)) {
            $manualMessage='läuft bereits; kein zweiter Prozess gestartet';
        } else {
            $selected=is_string($_POST['node_binary']??null)?$_POST['node_binary']:'';
            if (!isset($manualNodes[$selected])) {
                $manualMessage='fehlgeschlagen: kein erlaubtes ausführbares Node-Binary ausgewählt';
            } elseif (!is_file($manualRunner)) {
                $manualMessage='fehlgeschlagen: isolierter Runner fehlt';
            } else {
                $token=bin2hex(random_bytes(24));
                @unlink($manualLogFile);
                $command='nohup '.escapeshellarg($selected).' '.escapeshellarg($manualRunner).' '.escapeshellarg($token).' '.escapeshellarg($manualStateFile).' 120 >>'.escapeshellarg($manualLogFile).' 2>&1 </dev/null & echo $!';
                $launch=run(['/bin/sh','-c',$command],3000);
                $pid=(int)trim($launch['out']);
                for($attempt=0;$attempt<20;$attempt++){usleep(50000);$manualState=readManualState($manualStateFile);if(($manualState['token']??'')===$token&&in_array($manualState['status']??'',['running','failed'],true))break;}
                if (($manualState['token']??'')===$token&&($manualState['status']??'')==='running'&&ownsProcess($manualState,$manualRunner)) $manualMessage='gestartet und läuft';
                else {$manualMessage='fehlgeschlagen: Prozess meldete keinen laufenden Zustand';if($pid>1){$candidate=['pid'=>$pid,'token'=>$token];signalOwnedProcess($candidate,$manualRunner);}}
            }
        }
    } elseif (($_POST['action']??'')==='stop') {
        $manualState=readManualState($manualStateFile);
        if (($manualState['status']??'')!=='running') $manualMessage='gestoppt: kein laufender Diagnoseprozess';
        elseif (signalOwnedProcess($manualState,$manualRunner)) {
            for($attempt=0;$attempt<20;$attempt++){usleep(50000);$manualState=readManualState($manualStateFile);if(($manualState['status']??'')==='stopped')break;}
            $manualMessage='gestoppt';
        } else $manualMessage='fehlgeschlagen: Prozess gehört nicht eindeutig zu dieser Diagnose; kein Signal gesendet';
    }
    $manualState=readManualState($manualStateFile);
}

$http=<<<'JS'
const http=require('http'),start=Date.now();
const server=http.createServer((q,s)=>s.end('NODE_LOCAL_OK'));
const guard=setTimeout(()=>{console.error('guard-timeout');process.exit(4)},2500);
server.on('error',e=>{clearTimeout(guard);console.error(e.code||e.message);process.exit(3)});
server.listen(0,'127.0.0.1',()=>{const a=server.address();setTimeout(()=>http.get({host:'127.0.0.1',port:a.port},r=>{let b='';r.on('data',c=>b+=c);r.on('end',()=>server.close(()=>{clearTimeout(guard);process.stdout.write(JSON.stringify({bound:a.address,ephemeralPort:true,status:r.statusCode,bodyOk:b==='NODE_LOCAL_OK',aliveMs:Date.now()-start,closed:true}))}))}).on('error',e=>{clearTimeout(guard);console.error(e.code||e.message);process.exit(2)}),500)});
JS;
$results=[];$versions=[];$scriptOk=[];$httpOk=[];$works=[];$fails=[];
foreach ($nodes as $path=>$meta) {
    $v=run([$path,'--version']);
    $s=run([$path,'-e','process.stdout.write(JSON.stringify({ok:true,version:process.version,execPath:process.execPath,platform:process.platform,arch:process.arch,uid:typeof process.getuid==="function"?process.getuid():null}))']);
    $h=run([$path,'-e',$http]);$results[$path]=compact('meta','v','s','h');
    if ($v['ok']) {$versions[$v['out']][]=$path;$works[]='node --version: '.$path;} else $fails[]='node --version: '.$path;
    if ($s['ok']) {$scriptOk[]=$path;$works[]='einfaches Skript: '.$path;} else $fails[]='einfaches Skript: '.$path;
    if ($h['ok']) {$httpOk[]=$path;$works[]='begrenzter HTTP-Selbsttest: '.$path;} else $fails[]='HTTP-Selbsttest: '.$path;
}
$tools=[];
foreach (['npm','npx'] as $tool) {
    $paths=[];if ($p=commandPath($tool))$paths[$p]='PHP PATH';
    foreach(array_keys($nodes) as $n){$p=dirname($n).'/'.$tool;if(is_file($p))$paths[$p]='beside node';}
    foreach(["/usr/bin/$tool","/usr/local/bin/$tool","/bin/$tool"] as $p)if(is_file($p))$paths[$p]='standard path';
    foreach($patterns as $pattern)foreach((array)@glob((string)preg_replace('~/node$~','/'.$tool,$pattern),GLOB_NOSORT) as $p)if(is_file($p))$paths[$p]='hosting path';
    foreach($paths as $p=>$source)$tools[$tool][$p]=['source'=>$source,'executable'=>is_executable($p),'result'=>run([$p,'--version'],6000)];
}
$managers=[];foreach(['passenger','supervisord','supervisorctl','pm2'] as $name){if($p=commandPath($name))$managers[]=$name.' '.$p.' => '.json_encode(run([$p,'--version']),JSON_UNESCAPED_SLASHES);}
if(!$managers)$managers[]='kein Passenger/supervisord/supervisorctl/pm2 im PHP PATH';
$nodeLines=[];foreach($results as $p=>$r)$nodeLines[]=$p.' | executable='.($r['meta']['executable']?'yes':'no').' | version='.($r['v']['ok']?$r['v']['out']:'FAIL '.$r['v']['state'].' '.$r['v']['err']);if(!$nodeLines)$nodeLines[]='keine Kandidaten gefunden';
$toolLines=[];foreach($tools as $name=>$items)foreach($items as $p=>$r)$toolLines[]=strtoupper($name).' '.$p.' | executable='.($r['executable']?'yes':'no').' | version='.($r['result']['ok']?$r['result']['out']:'FAIL '.$r['result']['state'].' '.$r['result']['err']);if(!$toolLines)$toolLines[]='npm/npx nicht gefunden';
$versionLines=[];foreach($versions as $v=>$paths)$versionLines[]=$v.' => '.implode(', ',$paths);if(!$versionLines)$versionLines[]='keine Version erfolgreich ausgeführt';
$major=[];foreach(['20','21','24'] as $m){$major[$m]=false;foreach($versions as $v=>$unused)if(preg_match('/v?'.$m.'\./',$v))$major[$m]=true;}
$choice=count($versions)>1?'mehrere unterschiedliche Versionen direkt ausführbar; freie cPanel-Auswahl damit noch nicht bewiesen':(count($versions)===1?'nur eine ausführbare Version gefunden; freie Auswahl nicht belegt':'nicht testbar');
$persistence=$httpOk?'begrenzt: Prozess blieb mindestens 500 ms aktiv, beantwortete lokal einen Request und wurde kontrolliert beendet; Dauerbetrieb/Restart nicht getestet':'nicht nachgewiesen';
$manualStatus=[
 'Status: '.strtoupper((string)($manualState['status']??'stopped')),
 'message='.($manualMessage!==''?$manualMessage:'keine neue manuelle Aktion'),
 'pid='.(isset($manualState['pid'])?(string)(int)$manualState['pid']:'nicht verfügbar'),
 'nodeBinary='.(string)($manualState['nodeBinary']??'nicht verfügbar'),
 'nodeVersion='.(string)($manualState['nodeVersion']??'nicht verfügbar'),
 'host='.(string)($manualState['host']??'127.0.0.1'),
 'port='.(isset($manualState['port'])?(string)(int)$manualState['port']:'nicht verfügbar'),
 'startedAt='.(string)($manualState['startedAt']??'nicht verfügbar'),
 'stoppedAt='.(string)($manualState['stoppedAt']??'nicht verfügbar'),
 'stopReason='.(string)($manualState['stopReason']??'nicht verfügbar'),
 'automaticTimeoutSeconds='.(string)($manualState['timeoutSeconds']??120),
];
$manualDisplay=implode("\n",$manualStatus);
$raw=[];foreach($results as $p=>$r){$raw[]='TEST '.$p.' --version => '.json_encode($r['v'],JSON_UNESCAPED_SLASHES);$raw[]='TEST '.$p.' -e <simple> => '.json_encode($r['s'],JSON_UNESCAPED_SLASHES);$raw[]='TEST '.$p.' -e <bounded-http> => '.json_encode($r['h'],JSON_UNESCAPED_SLASHES);}foreach($tools as $name=>$items)foreach($items as $p=>$r)$raw[]='TEST '.$p.' --version => '.json_encode($r['result'],JSON_UNESCAPED_SLASHES);if(!$raw)$raw[]='keine ausführbaren Kandidaten';
$report=implode("\n",[
 sec('NODE VORHANDEN',$nodes?'JA: '.count($nodes).' Binärkandidat(en)':'NEIN: kein Kandidat in PATH oder bekannten Hosting-Pfaden'),sec('NODE-VERSIONEN',$versionLines),sec('NODE-PFADE',$nodeLines),sec('NPM/NPX',$toolLines),sec('NODE-SKRIPT AUSFÜHRBAR',$scriptOk?:'NEIN'),sec('HTTP-PROZESS',$httpOk?:'NEIN/NICHT MÖGLICH'),sec('LOCALHOST',$httpOk?'127.0.0.1 mit zufälligem freien Port erfolgreich':'nicht erfolgreich nachgewiesen'),sec('PROZESS-PERSISTENZ',$persistence),sec('MANUELLER START-/STOPP-TEST',$manualStatus),sec('PASSENGER/PROZESSMANAGER',$managers),sec('VERSION FREI KONFIGURIERBAR',$choice.'; Node 20='.($major['20']?'ja':'nein').', Node 21='.($major['21']?'ja':'nein').', Node 24='.($major['24']?'ja':'nein')),sec('FÜR WEBSPACE-BENUTZER KONFIGURIERBAR',$scriptOk?'Binary direkt ausführbar; Änderung globaler/cPanel-Einstellungen absichtlich nicht versucht':'nicht belegt'),sec('FUNKTIONIERT',$works?:'keiner der Node-Tests'),sec('FUNKTIONIERT NICHT',$fails?:'keine Fehlschläge'),sec('HOSTING-EINSCHRÄNKUNGEN',['PHP SAPI: '.PHP_SAPI,'proc_open: '.(function_exists('proc_open')?'verfügbar':'nicht verfügbar'),'shell_exec: '.(function_exists('shell_exec')?'verfügbar':'nicht verfügbar'),'open_basedir: '.((string)ini_get('open_basedir')?:'nicht gesetzt'),'Dauerbetrieb, öffentliche Erreichbarkeit und cPanel-Versionsänderung sind mit diesem begrenzten Test nicht beweisbar']),sec('ROHDATEN / AUSGEFÜHRTE TESTS',$raw)
]);
$nonce=base64_encode(random_bytes(18));header("Content-Security-Policy: default-src 'none'; style-src 'nonce-$nonce'; script-src 'nonce-$nonce'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
?>
<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Node Live-Server Diagnose</title><style nonce="<?=htmlspecialchars($nonce,ENT_QUOTES,'UTF-8')?>">:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#101827;color:#eef4ff;font:16px/1.5 system-ui,-apple-system,sans-serif}main{width:min(1050px,calc(100% - 24px));margin:24px auto}.card{background:#17233a;border:1px solid #354766;border-radius:16px;padding:18px;margin:14px 0}h1{font-size:clamp(1.45rem,5vw,2.1rem)}p{color:#bdc9dc}.controls{display:flex;flex-wrap:wrap;gap:10px;align-items:end;margin:16px 0}.controls label{display:grid;gap:5px;flex:1 1 280px}.controls select{min-height:48px;padding:8px;max-width:100%}button{min-height:48px;padding:12px 18px;border:0;border-radius:12px;background:#4d83ff;color:white;font:inherit;font-weight:750;touch-action:manipulation}.stop{background:#bd3f53}#manualMessage,#copyStatus{display:block;margin-top:10px;color:#7ee2a8;font-weight:700}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#0b1220;border-radius:12px;padding:16px;font:13px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace}</style></head><body><main><section class="card"><h1>Node Live-Server Diagnose</h1><p>Der HTTP-Test bindet ausschließlich an 127.0.0.1. Ein manuell gestarteter Prozess beendet sich spätestens nach 120 Sekunden automatisch.</p><form method="post" class="controls"><input type="hidden" name="csrf" value="<?=htmlspecialchars((string)$_SESSION['node_diagnostic_csrf'],ENT_QUOTES,'UTF-8')?>"><label>Node-Binary<select name="node_binary"><?php foreach($manualNodes as $path=>$node):?><option value="<?=htmlspecialchars($path,ENT_QUOTES,'UTF-8')?>"><?=htmlspecialchars($node['version'].' — '.$path,ENT_QUOTES,'UTF-8')?></option><?php endforeach?></select></label><button name="action" value="start" type="submit"<?=$manualNodes?'':' disabled'?>>Node starten</button><button name="action" value="stop" type="submit" class="stop">Node stoppen</button></form><span id="manualMessage" role="status" aria-live="polite"><?=htmlspecialchars($manualMessage,ENT_QUOTES,'UTF-8')?></span><pre id="manualStatus"><?=htmlspecialchars($manualDisplay,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8')?></pre><button id="copy" type="button">Ergebnisse kopieren</button><span id="copyStatus" role="status" aria-live="polite"></span></section><section class="card"><pre id="results"><?=htmlspecialchars($report,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8')?></pre></section></main><script nonce="<?=htmlspecialchars($nonce,ENT_QUOTES,'UTF-8')?>">(()=>{const b=document.getElementById('copy'),s=document.getElementById('copyStatus'),r=document.getElementById('results');b.addEventListener('click',async()=>{const t=r.textContent||'';try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(t);else{const a=document.createElement('textarea');a.value=t;a.readOnly=true;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();a.setSelectionRange(0,a.value.length);if(!document.execCommand('copy'))throw 0;a.remove()}s.textContent='Ergebnisse kopiert.'}catch(e){s.textContent='Kopieren nicht möglich – Ausgabe bitte markieren.'}})})();</script></body></html>
