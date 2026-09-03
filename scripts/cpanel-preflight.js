#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const {
  normalizeBasePath,
  readPublicPathMarkup,
  redactSensitiveText,
  scanProductionPackage,
  verifyProductionPackage
} = require('./lib/portable-install.js');

const STATUS = Object.freeze({
  PASS: 'PASS',
  BLOCKED: 'BLOCKED',
  NOT_CHECKED: 'NICHT_GEPRUEFT'
});

const ENTRYPOINTS = Object.freeze([
  '.htaccess',
  'Web-App/public/index.html',
  'Web-App/public/public-path.js',
  'Server/php/bootstrap.php',
  'Server/php/src/PublicPath.php',
  'Server/public/admin.php',
  'Server/public/setup.php',
  'Server/public/api/.htaccess',
  'Server/public/api/index.php'
]);

function parseArguments(args) {
  const optionKeys = {
    '--package': 'packagePath',
    '--public-url': 'publicUrl',
    '--base-path': 'basePath'
  };
  const options = {};
  const seen = new Set();

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const separatorIndex = argument.indexOf('=');
    const optionName = separatorIndex === -1 ? argument : argument.slice(0, separatorIndex);
    const key = optionKeys[optionName];
    if (!key || seen.has(optionName)) {
      throw new Error('Ungültige oder doppelte CLI-Option.');
    }
    seen.add(optionName);

    let value;
    if (separatorIndex === -1) {
      if (index + 1 >= args.length || args[index + 1].startsWith('--')) {
        throw new Error('Ein erforderlicher CLI-Wert fehlt.');
      }
      value = args[index + 1];
      index += 1;
    } else {
      value = argument.slice(separatorIndex + 1);
    }

    if (key !== 'basePath' && value.trim() === '') {
      throw new Error('Ein erforderlicher CLI-Wert ist leer.');
    }
    if (/\p{Cc}/u.test(value)) {
      throw new Error('Ein CLI-Wert enthält unzulässige Steuerzeichen.');
    }
    options[key] = value;
  }

  if (options.packagePath === undefined || options.publicUrl === undefined) {
    throw new Error('--package und --public-url sind erforderlich.');
  }
  return options;
}

function check(name, status, message) {
  return { name, status, message };
}

function pendingChecks() {
  return [
    check('package', STATUS.NOT_CHECKED, 'Paketinventar und Prüfsummen wurden noch nicht geprüft.'),
    check('publicBase', STATUS.NOT_CHECKED, 'Öffentliche HTTPS-Basis wurde noch nicht geprüft.'),
    check('entrypoints', STATUS.NOT_CHECKED, 'Einstiegspunkte wurden noch nicht geprüft.'),
    check('secrets', STATUS.NOT_CHECKED, 'Secretprüfung wurde noch nicht ausgeführt.'),
    check('php', STATUS.NOT_CHECKED, 'Lokale PHP-Anforderungen wurden noch nicht geprüft.'),
    check('rewrite', STATUS.NOT_CHECKED, 'Apache-Rewrite muss im Zielhosting per HTTP-Smoke-Test geprüft werden.')
  ];
}

function setCheck(checks, name, status, message) {
  const item = checks.find((candidate) => candidate.name === name);
  item.status = status;
  item.message = message;
}

function overallStatus(checks) {
  if (checks.some((item) => item.status === STATUS.BLOCKED)) {
    return STATUS.BLOCKED;
  }
  if (checks.some((item) => item.status === STATUS.NOT_CHECKED)) {
    return STATUS.NOT_CHECKED;
  }
  return STATUS.PASS;
}

function isExactPublicPath(pathname, basePath) {
  if (basePath === '') {
    return pathname === '/';
  }
  return pathname === basePath || pathname === `${basePath}/`;
}

function validatePublicBase(rawUrl, basePath) {
  if (
    typeof rawUrl !== 'string' ||
    rawUrl.trim() !== rawUrl ||
    !/^https:\/\/[^/?#\\\s]+(?=[/?#\\]|$)/i.test(rawUrl)
  ) {
    throw new Error('Die öffentliche Basis-URL ist ungültig.');
  }

  let publicUrl;
  try {
    publicUrl = new URL(rawUrl);
  } catch {
    throw new Error('Die öffentliche Basis-URL ist ungültig.');
  }

  const authorityStart = rawUrl.indexOf('://') + 3;
  const pathStart = rawUrl.indexOf('/', authorityStart);
  const rawAuthority = pathStart === -1
    ? rawUrl.slice(authorityStart)
    : rawUrl.slice(authorityStart, pathStart);
  const rawPath = pathStart === -1 ? '/' : rawUrl.slice(pathStart);

  if (
    publicUrl.protocol !== 'https:' ||
    publicUrl.hostname === '' ||
    publicUrl.username !== '' ||
    publicUrl.password !== '' ||
    rawAuthority.includes('@') ||
    rawUrl.includes('?') ||
    rawUrl.includes('#') ||
    rawUrl.includes('\\') ||
    !isExactPublicPath(publicUrl.pathname, basePath) ||
    !isExactPublicPath(rawPath, basePath)
  ) {
    throw new Error('Die öffentliche Basis muss eine credential-, query- und fragmentfreie HTTPS-URL am exakten Basispfad sein.');
  }
}

function verifyEntrypoints(packageRoot, manifest, expectedBasePath) {
  const inventory = new Set(manifest.files.map((file) => file.path));
  for (const relativePath of ENTRYPOINTS) {
    if (!inventory.has(relativePath)) {
      throw new Error('Ein erforderlicher Produktions-Einstiegspunkt fehlt.');
    }
    const stat = fs.lstatSync(path.join(packageRoot, relativePath));
    if (!stat.isFile() || stat.isSymbolicLink()) {
      throw new Error('Ein Produktions-Einstiegspunkt ist keine reguläre Paketdatei.');
    }
  }

  const markup = readPublicPathMarkup(path.join(packageRoot, 'Web-App/public/index.html'));
  if (markup.basePath !== expectedBasePath || markup.baseHref !== `${expectedBasePath}/`) {
    throw new Error('Die paketierte öffentliche Pfadkonfiguration ist inkonsistent.');
  }
}

function checkPhpRuntime() {
  const probe = [
    '$extensions = ["pdo", "pdo_mysql", "json", "session", "openssl"];',
    '$loaded = [];',
    'foreach ($extensions as $extension) { $loaded[$extension] = extension_loaded($extension); }',
    'echo json_encode(["versionId" => PHP_VERSION_ID, "extensions" => $loaded]);'
  ].join(' ');
  const result = spawnSync('php', ['-r', probe], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 10000
  });

  if (result.error && result.error.code === 'ENOENT') {
    return check('php', STATUS.NOT_CHECKED, 'PHP-Binary ist lokal nicht verfügbar; PHP 8.x und Erweiterungen sind im Zielhosting zu prüfen.');
  }
  if (result.error || result.status !== 0) {
    return check('php', STATUS.BLOCKED, 'Die vorhandene PHP-Binary konnte nicht sicher geprüft werden.');
  }

  let data;
  try {
    data = JSON.parse(result.stdout);
  } catch {
    return check('php', STATUS.BLOCKED, 'Die vorhandene PHP-Binary lieferte kein prüfbares Ergebnis.');
  }

  const extensions = data && data.extensions;
  const versionIsSupported = Number.isInteger(data && data.versionId) && data.versionId >= 80000 && data.versionId < 90000;
  const extensionsArePresent = extensions && Object.values(extensions).length === 5 && Object.values(extensions).every(Boolean);
  if (!versionIsSupported || !extensionsArePresent) {
    return check('php', STATUS.BLOCKED, 'PHP 8.x oder eine erforderliche PHP-Erweiterung fehlt.');
  }

  return check('php', STATUS.PASS, 'Lokale PHP-8.x-Binary und erforderliche Erweiterungen sind vorhanden.');
}

function runPreflight(options) {
  const checks = pendingChecks();
  const packageRoot = path.resolve(process.cwd(), options.packagePath);
  let manifest;
  let requestedBasePath = null;

  try {
    manifest = verifyProductionPackage(packageRoot);
    setCheck(checks, 'package', STATUS.PASS, 'Manifest, Inventar, Größen und SHA-256-Prüfsummen stimmen überein.');
  } catch {
    setCheck(checks, 'package', STATUS.BLOCKED, 'Paketmanifest, Inventar oder SHA-256-Prüfsummen sind ungültig.');
    return { status: overallStatus(checks), checks };
  }

  try {
    const manifestBasePath = normalizeBasePath(manifest.basePath);
    if (manifest.basePath !== manifestBasePath) {
      throw new Error('Der Manifest-Basispfad ist nicht kanonisch.');
    }
    requestedBasePath = options.basePath === undefined
      ? manifestBasePath
      : normalizeBasePath(options.basePath);
    if (requestedBasePath !== manifestBasePath) {
      throw new Error('Basispfade stimmen nicht überein.');
    }
    validatePublicBase(options.publicUrl, requestedBasePath);
    setCheck(checks, 'publicBase', STATUS.PASS, 'Manifest, CLI-Basispfad und exakter HTTPS-URL-Pfad stimmen überein.');
  } catch {
    setCheck(checks, 'publicBase', STATUS.BLOCKED, 'Manifest, CLI-Basispfad oder öffentliche HTTPS-Basis sind inkonsistent.');
  }

  try {
    verifyEntrypoints(packageRoot, manifest, requestedBasePath);
    setCheck(checks, 'entrypoints', STATUS.PASS, 'Rewrite-, PHP-, Public- und Web-App-Einstiegspunkte sind Paketdateien.');
  } catch {
    setCheck(checks, 'entrypoints', STATUS.BLOCKED, 'Mindestens ein erforderlicher Produktions-Einstiegspunkt fehlt oder ist ungültig.');
  }

  try {
    scanProductionPackage(packageRoot, manifest);
    setCheck(checks, 'secrets', STATUS.PASS, 'Der gemeinsame Paket-Secret-Scanner meldet keinen Befund.');
  } catch (error) {
    setCheck(checks, 'secrets', STATUS.BLOCKED, redactSensitiveText(error.message));
  }

  const php = checkPhpRuntime();
  setCheck(checks, php.name, php.status, php.message);

  return { status: overallStatus(checks), checks };
}

function printPayload(payload) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

function main(args = process.argv.slice(2)) {
  let payload;
  try {
    payload = runPreflight(parseArguments(args));
  } catch {
    payload = {
      status: STATUS.BLOCKED,
      checks: [check('arguments', STATUS.BLOCKED, 'Ungültige oder unvollständige Preflight-Argumente.')]
    };
  }

  printPayload(payload);
  if (payload.status === STATUS.BLOCKED) {
    process.exitCode = 1;
  }
  return payload;
}

if (require.main === module) {
  main();
}

module.exports = {
  STATUS,
  isExactPublicPath,
  main,
  overallStatus,
  parseArguments,
  runPreflight,
  validatePublicBase
};
