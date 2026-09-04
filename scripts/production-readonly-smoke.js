'use strict';

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_TIMEOUT_MS = 20_000;

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeBaseUrl(value) {
  const raw = String(value || '');
  requireCondition(raw.trim() !== '', 'Die öffentliche Ziel-URL fehlt.');
  const url = new URL(raw);
  requireCondition(url.protocol === 'https:', 'Die öffentliche Basis muss HTTPS verwenden.');
  requireCondition(!url.username && !url.password && !url.search && !url.hash, 'Die öffentliche Basis enthält unzulässige Bestandteile.');
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/`;
  return url;
}

function normalizeBasePath(value) {
  const raw = String(value || '');
  if (raw === '' || raw === '/') return '';
  requireCondition(/^\/[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~-]+)*\/?$/.test(raw), 'Der erwartete Basispfad ist ungültig.');
  return raw.replace(/\/$/, '');
}

function validateDeploymentTarget(publicUrl, basePath) {
  const publicBase = normalizeBaseUrl(publicUrl);
  const normalizedBasePath = normalizeBasePath(basePath);
  const expectedPathname = normalizedBasePath === '' ? '/' : `${normalizedBasePath}/`;
  requireCondition(publicBase.pathname === expectedPathname, 'Öffentliche Ziel-URL und gebauter Basispfad stimmen nicht überein.');
  return { publicBase, basePath: normalizedBasePath };
}

function endpoint(baseUrl, route) {
  return new URL(route.replace(/^\//, ''), baseUrl).toString();
}

function assertFinalUrl(responseUrl, requestedUrl, baseUrl) {
  const finalUrl = new URL(String(responseUrl || ''));
  const expectedUrl = new URL(requestedUrl);
  requireCondition(
    finalUrl.protocol === 'https:'
      && finalUrl.origin === baseUrl.origin
      && finalUrl.pathname === expectedUrl.pathname
      && finalUrl.search === expectedUrl.search
      && finalUrl.hash === '',
    'HTTP-Prüfung endete an einem unerwarteten Ziel.'
  );
}

async function readResponse(fetchImpl, baseUrl, route) {
  const requestedUrl = endpoint(baseUrl, route);
  const response = await fetchImpl(requestedUrl, {
    method: 'GET',
    redirect: 'follow',
    cache: 'no-store',
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    headers: { Accept: 'text/html,application/json,text/javascript;q=0.9,*/*;q=0.1' },
  });
  assertFinalUrl(response.url, requestedUrl, baseUrl);
  return { status: response.status, body: await response.text() };
}

function parseJson(body, label) {
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`${label} liefert kein gültiges JSON.`);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function runSmoke({
  baseUrl,
  expectedBasePath = '',
  expectedTitle,
  expectedSourceCommit,
  expectedViewerModules = [],
  expectedModules = [],
  fetchImpl = fetch,
  write = console.log,
}) {
  const target = validateDeploymentTarget(baseUrl, expectedBasePath);
  const publicBase = target.publicBase;
  requireCondition(String(expectedTitle || '').trim() !== '', 'Der erwartete App-Titel fehlt.');
  requireCondition(/^[0-9a-f]{6,64}$/i.test(String(expectedSourceCommit || '')), 'Die erwartete Deploymentrevision fehlt oder ist ungültig.');
  const results = {};

  results.root = await readResponse(fetchImpl, publicBase, '/');
  results.rewrite = await readResponse(fetchImpl, publicBase, '/app/');
  results.admin = await readResponse(fetchImpl, publicBase, '/admin.php');
  results.status = await readResponse(fetchImpl, publicBase, '/api/v1/status');
  results.modules = await readResponse(fetchImpl, publicBase, '/api/v1/modules');
  results.internal = await readResponse(fetchImpl, publicBase, '/Server/php/bootstrap.php');
  results.manifest = await readResponse(fetchImpl, publicBase, '/manifest.json');

  requireCondition(results.root.status === 200, 'Öffentlicher Root ist nicht erreichbar.');
  requireCondition(results.rewrite.status === 200, 'SPA-Rewrite ist nicht erreichbar.');
  const titlePattern = new RegExp(`<title[^>]*data-app-title[^>]*>\\s*${escapeRegExp(expectedTitle)}\\s*</title>`, 'i');
  requireCondition(titlePattern.test(results.root.body), 'Öffentlicher Root besitzt nicht den erwarteten App-Titel.');
  requireCondition(!/FRAMEWORK DASHBOARD/i.test(results.root.body + results.rewrite.body), 'Alte Dashboard-Oberfläche ist öffentlich sichtbar.');

  requireCondition(results.admin.status === 401, 'Admin-Einstieg ist ohne Sitzung nicht geschützt.');
  const usernameInput = results.admin.body.match(/<input\b[^>]*\bid=["']loginUsername["'][^>]*>/i)?.[0] || '';
  requireCondition(usernameInput !== '', 'Admin-Loginformular wurde nicht erkannt.');
  requireCondition(!/\bvalue\s*=/i.test(usernameInput), 'Admin-Kennung ist vorbelegt.');

  requireCondition(results.status.status === 200, 'Status-API ist nicht erreichbar.');
  const statusPayload = parseJson(results.status.body, 'Status-API');
  requireCondition(statusPayload && statusPayload.ok === true && statusPayload.data, 'Status-API besitzt nicht den erwarteten Vertrag.');

  requireCondition(results.modules.status === 200, 'Öffentlicher Modulkatalog ist nicht erreichbar.');
  const modulePayload = parseJson(results.modules.body, 'Modulkatalog');
  const moduleData = modulePayload && modulePayload.data;
  requireCondition(modulePayload && modulePayload.ok === true && Array.isArray(moduleData?.modules), 'Modulkatalog besitzt nicht den erwarteten Vertrag.');
  requireCondition(moduleData.accessContext?.mode === 'anonymous', 'Modulkatalog ist nicht im anonymen Kontext.');
  for (const moduleId of expectedViewerModules) {
    const visibleModule = moduleData.modules.find((entry) => entry && entry.id === moduleId);
    requireCondition(visibleModule && visibleModule.clientAccess?.canView === true, `Erwartetes Viewer-Modul ${moduleId} ist nicht sichtbar.`);
    requireCondition(visibleModule.clientAccess?.canUse === true, `Erwartetes Viewer-Modul ${moduleId} ist nicht nutzbar.`);
  }

  requireCondition([403, 404].includes(results.internal.status), 'Interner PHP-Core ist öffentlich erreichbar.');

  requireCondition(results.manifest.status === 200, 'Deploymentmanifest ist nicht erreichbar.');
  const deploymentManifest = parseJson(results.manifest.body, 'Deploymentmanifest');
  requireCondition(deploymentManifest.sourceDirty === false, 'Deploymentmanifest stammt nicht aus einem sauberen Commit.');
  requireCondition(deploymentManifest.sourceCommit === expectedSourceCommit, 'Öffentliche Installation entspricht nicht der deployten Revision.');
  requireCondition(deploymentManifest.basePath === target.basePath, 'Deploymentmanifest und gebauter Basispfad stimmen nicht überein.');

  for (const expectedModule of expectedModules) {
    requireCondition(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(expectedModule.id), 'Lokaler Modulkatalog enthält eine ungültige Kennung.');
    const route = `/Web-App/app/modules/${expectedModule.id}/module.json`;
    const deployed = await readResponse(fetchImpl, publicBase, route);
    requireCondition(deployed.status === 200, `Modulmanifest ${expectedModule.id} ist nicht ausgeliefert.`);
    const manifest = parseJson(deployed.body, `Modulmanifest ${expectedModule.id}`);
    requireCondition(manifest.id === expectedModule.id, `Modulmanifest ${expectedModule.id} besitzt eine unerwartete Kennung.`);
    requireCondition(manifest.compatibility?.api === expectedModule.compatibility?.api, `Modulmanifest ${expectedModule.id} besitzt nicht den erwarteten API-Vertrag.`);
    requireCondition(manifest.server?.entry === expectedModule.server?.entry, `Modulmanifest ${expectedModule.id} besitzt nicht den erwarteten Serververtrag.`);
  }

  const summary = {
    root: results.root.status,
    rewrite: results.rewrite.status,
    adminProtected: results.admin.status,
    statusApi: results.status.status,
    moduleCatalog: results.modules.status,
    internalCoreProtected: results.internal.status,
    deploymentRevision: true,
    moduleContracts: expectedModules.length,
    viewerGps: expectedViewerModules.includes('gps'),
  };
  write(JSON.stringify(summary));
  return summary;
}

function loadLocalExpectations(projectRoot) {
  const indexHtml = fs.readFileSync(path.join(projectRoot, 'Web-App/public/index.html'), 'utf8');
  const title = indexHtml.match(/<title[^>]*data-app-title[^>]*>\s*([^<]+?)\s*<\/title>/i)?.[1];
  const modules = JSON.parse(fs.readFileSync(path.join(projectRoot, 'Web-App/app/modules/index.json'), 'utf8'));
  requireCondition(Array.isArray(modules), 'Lokaler Modulkatalog ist ungültig.');
  return { title, modules };
}

if (require.main === module) {
  const projectRoot = path.resolve(__dirname, '..');
  const local = loadLocalExpectations(projectRoot);
  const viewerModules = String(process.env.NEUTRAL_SMOKE_VIEWER_MODULES || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  runSmoke({
    baseUrl: process.env.NEUTRAL_PUBLIC_URL,
    expectedBasePath: process.env.NEUTRAL_BASE_PATH,
    expectedTitle: local.title,
    expectedSourceCommit: process.env.GITHUB_SHA,
    expectedViewerModules: viewerModules,
    expectedModules: local.modules,
  }).catch((error) => {
    console.error(`Production smoke failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { normalizeBaseUrl, runSmoke, validateDeploymentTarget };
