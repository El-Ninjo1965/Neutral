'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const PACKAGE_PRODUCER = 'neutral-web-platform';
const PACKAGE_FORMAT = 'neutral-production';

const REQUIRED_ENTRIES = [
  '.env.example',
  '.htaccess',
  'Server/php',
  'Server/public',
  'Web-App'
];
const REQUIRED_PRODUCTION_ENTRYPOINTS = [
  'Web-App/public/public-path.js',
  'Server/php/src/PublicPath.php'
];

const SECRET_RULES = [
  {
    name: 'GitHub access token',
    pattern: /\b(?:gh[pousr]_[A-Za-z0-9]{20,255}|github_pat_[A-Za-z0-9_]{20,255})\b/
  },
  {
    name: 'AWS access key',
    pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/
  },
  {
    name: 'Private key',
    pattern: /-----BEGIN (?:ENCRYPTED |EC |RSA |DSA |OPENSSH )?PRIVATE KEY-----/
  }
];

function normalizeBasePath(value = '') {
  if (typeof value !== 'string') {
    throw new Error('Invalid base path.');
  }

  let normalized = value;
  if (normalized === '' || normalized === '/') {
    return '';
  }

  if (
    normalized.includes('\0') ||
    normalized.includes('\\') ||
    normalized.includes('?') ||
    normalized.includes('#') ||
    normalized.includes('%') ||
    /:\/\//.test(normalized)
  ) {
    throw new Error('Invalid base path.');
  }

  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }
  if (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  const segments = normalized.slice(1).split('/');
  if (
    segments.some((segment) => segment === '' || segment === '.' || segment === '..') ||
    segments.some((segment) => !/^[A-Za-z0-9._~-]+$/.test(segment))
  ) {
    throw new Error('Invalid base path.');
  }

  return normalized;
}

function toPackagePath(filePath) {
  return filePath.split(path.sep).join('/');
}

function normalizePackagePath(filePath) {
  if (
    typeof filePath !== 'string' ||
    filePath === '' ||
    /[\u0000-\u001f\u007f]/.test(filePath) ||
    filePath.includes('\\') ||
    filePath.startsWith('/') ||
    /^[A-Za-z]:/.test(filePath)
  ) {
    throw new Error(`Unsafe package path: ${JSON.stringify(filePath)}`);
  }

  const segments = filePath.split('/');
  if (
    segments.some((segment) => segment === '' || segment === '.' || segment === '..') ||
    segments.some((segment) => !/^[A-Za-z0-9._~-]+$/.test(segment))
  ) {
    throw new Error(`Unsafe package path: ${JSON.stringify(filePath)}`);
  }

  return filePath;
}

function forbiddenRule(relativePath) {
  const normalized = toPackagePath(relativePath);
  const parts = normalized.split('/');
  const name = parts.at(-1);

  if (normalized !== '.env.example' && /^\.env(?:\.|$)/i.test(name)) {
    return 'environment file';
  }
  if (parts.some((part) => ['.git', '.svn', 'node_modules'].includes(part))) {
    return 'repository or dependency metadata';
  }
  if (parts.some((part) => ['runtime', 'logs', 'backups'].includes(part.toLowerCase()))) {
    return 'local runtime data';
  }
  if (/\.log$/i.test(name)) {
    return 'log file';
  }
  if (/(?:~|\.(?:bak|backup|old|orig|tmp|temp))$/i.test(name)) {
    return 'backup or temporary file';
  }
  if (/\.(?:key|pem|p12|pfx|jks)$/i.test(name) || /^(?:id_rsa|id_dsa|id_ecdsa|id_ed25519)$/i.test(name)) {
    return 'secret or key file';
  }
  if (/^(?:credentials|secrets?)(?:\.|$)/i.test(name)) {
    return 'credential file';
  }

  return null;
}

function assertRegularFileOrDirectory(fullPath, relativePath, expectedType) {
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required production path: ${relativePath}`);
  }

  const stat = fs.lstatSync(fullPath);
  if (stat.isSymbolicLink()) {
    throw new Error(`Symlink is forbidden in production package: ${relativePath}`);
  }
  if (expectedType === 'file' && !stat.isFile()) {
    throw new Error(`Required production file is not a regular file: ${relativePath}`);
  }
  if (expectedType === 'directory' && !stat.isDirectory()) {
    throw new Error(`Required production directory is not a directory: ${relativePath}`);
  }
}

function collectProductionFiles(sourceRoot) {
  const resolvedSourceRoot = path.resolve(sourceRoot);
  assertRegularFileOrDirectory(resolvedSourceRoot, '.', 'directory');

  const files = [];

  function walk(relativeDirectory) {
    const fullDirectory = path.join(resolvedSourceRoot, relativeDirectory);
    const entries = fs.readdirSync(fullDirectory, { withFileTypes: true }).sort((left, right) => (
      left.name < right.name ? -1 : left.name > right.name ? 1 : 0
    ));

    for (const entry of entries) {
      const relativePath = normalizePackagePath(toPackagePath(path.join(relativeDirectory, entry.name)));
      const fullPath = path.join(resolvedSourceRoot, relativePath);

      if (entry.isSymbolicLink()) {
        throw new Error(`Symlink is forbidden in production package: ${relativePath}`);
      }

      const rule = forbiddenRule(relativePath);
      if (rule) {
        throw new Error(`${relativePath} is forbidden in the production package (${rule})`);
      }

      if (entry.isDirectory()) {
        walk(relativePath);
      } else if (entry.isFile()) {
        files.push(relativePath);
      } else {
        throw new Error(`Unsupported production path type: ${relativePath}`);
      }
    }
  }

  for (const entry of REQUIRED_ENTRIES) {
    normalizePackagePath(entry);
    const fullPath = path.join(resolvedSourceRoot, entry);
    const isFile = entry.startsWith('.');
    assertRegularFileOrDirectory(fullPath, entry, isFile ? 'file' : 'directory');
    const rule = forbiddenRule(entry);
    if (rule) {
      throw new Error(`${entry} is forbidden in the production package (${rule})`);
    }
    if (isFile) {
      files.push(entry);
    } else {
      walk(entry);
    }
  }

  return files.sort();
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function scanFile(filePath, relativePath = path.basename(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rule of SECRET_RULES) {
    if (rule.pattern.test(content)) {
      throw new Error(`${redactSensitiveText(toPackagePath(relativePath))} | ${rule.name} | [MASKIERT]`);
    }
  }
}

function redactSensitiveText(value) {
  let redacted = String(value);
  for (const rule of SECRET_RULES) {
    const flags = rule.pattern.flags.includes('g')
      ? rule.pattern.flags
      : `${rule.pattern.flags}g`;
    redacted = redacted.replace(new RegExp(rule.pattern.source, flags), '[MASKIERT]');
  }
  return redacted;
}

function parseMetaAttributes(tag) {
  const attributes = [];
  let index = tag.search(/\s/);
  if (index === -1) {
    return attributes;
  }

  while (index < tag.length) {
    while (/\s/.test(tag[index])) {
      index += 1;
    }
    if (tag[index] === '/' || tag[index] === '>' || index >= tag.length) {
      break;
    }

    const nameStart = index;
    while (index < tag.length && !/[\s=/>]/.test(tag[index])) {
      index += 1;
    }
    const name = tag.slice(nameStart, index).toLowerCase();
    while (/\s/.test(tag[index])) {
      index += 1;
    }
    if (tag[index] !== '=') {
      continue;
    }
    index += 1;
    while (/\s/.test(tag[index])) {
      index += 1;
    }

    const quote = tag[index];
    if (quote !== '"' && quote !== "'") {
      while (index < tag.length && !/[\s>]/.test(tag[index])) {
        index += 1;
      }
      continue;
    }

    const valueStart = index + 1;
    const valueEnd = tag.indexOf(quote, valueStart);
    if (valueEnd === -1) {
      break;
    }
    attributes.push({ name, value: tag.slice(valueStart, valueEnd), valueStart, valueEnd });
    index = valueEnd + 1;
  }

  return attributes;
}

function injectBasePath(indexPath, basePath) {
  let html = fs.readFileSync(indexPath, 'utf8');
  const metaTags = [...html.matchAll(/<meta(?=\s|\/?>)[^>]*>/gi)];
  const candidates = metaTags.filter((match) => {
    const names = parseMetaAttributes(match[0]).filter((attribute) => attribute.name === 'name');
    return names.length === 1 && names[0].value.toLowerCase() === 'neutral-base-path';
  });

  if (candidates.length !== 1) {
    throw new Error('Web-App/public/index.html must contain exactly one neutral-base-path meta tag');
  }

  const tag = candidates[0][0];
  const contentAttributes = parseMetaAttributes(tag).filter((attribute) => attribute.name === 'content');
  if (contentAttributes.length !== 1) {
    throw new Error('The neutral-base-path meta tag must contain exactly one content attribute');
  }

  const contentAttribute = contentAttributes[0];
  const updatedTag = tag.slice(0, contentAttribute.valueStart) +
    basePath +
    tag.slice(contentAttribute.valueEnd);
  const offset = candidates[0].index;
  html = html.slice(0, offset) + updatedTag + html.slice(offset + tag.length);

  const baseTags = [...html.matchAll(/<base(?=\s|\/?>)[^>]*>/gi)];
  if (baseTags.length !== 1) {
    throw new Error('Web-App/public/index.html must contain exactly one base tag');
  }
  const baseTag = baseTags[0][0];
  const hrefAttributes = parseMetaAttributes(baseTag).filter((attribute) => attribute.name === 'href');
  if (hrefAttributes.length !== 1) {
    throw new Error('The base tag must contain exactly one href attribute');
  }
  const hrefAttribute = hrefAttributes[0];
  const baseHref = `${basePath}/`;
  const updatedBaseTag = baseTag.slice(0, hrefAttribute.valueStart) +
    baseHref +
    baseTag.slice(hrefAttribute.valueEnd);
  const baseOffset = baseTags[0].index;
  html = html.slice(0, baseOffset) + updatedBaseTag + html.slice(baseOffset + baseTag.length);
  fs.writeFileSync(indexPath, html);
}

function readPublicPathMarkup(indexPath) {
  const html = fs.readFileSync(indexPath, 'utf8');
  const metaTags = [...html.matchAll(/<meta(?=\s|\/?>)[^>]*>/gi)].filter((match) => {
    const names = parseMetaAttributes(match[0]).filter((attribute) => attribute.name === 'name');
    return names.length === 1 && names[0].value.toLowerCase() === 'neutral-base-path';
  });
  const baseTags = [...html.matchAll(/<base(?=\s|\/?>)[^>]*>/gi)];
  if (metaTags.length !== 1 || baseTags.length !== 1) {
    throw new Error('Invalid packaged public path markup');
  }
  const content = parseMetaAttributes(metaTags[0][0]).filter((attribute) => attribute.name === 'content');
  const href = parseMetaAttributes(baseTags[0][0]).filter((attribute) => attribute.name === 'href');
  if (content.length !== 1 || href.length !== 1) {
    throw new Error('Invalid packaged public path markup');
  }
  return { basePath: content[0].value, baseHref: href[0].value };
}

function readVersion(sourceRoot) {
  const packageFile = path.join(sourceRoot, 'package.json');
  if (!fs.existsSync(packageFile)) {
    throw new Error('Missing package.json required for production package metadata');
  }

  const packageData = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
  if (typeof packageData.version !== 'string' || packageData.version.trim() === '') {
    throw new Error('package.json must define a non-empty version');
  }
  return packageData.version;
}

function discoverSourceCommit(sourceRoot) {
  const result = spawnSync('git', ['rev-parse', '--verify', 'HEAD'], {
    cwd: sourceRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  });
  return result.status === 0 ? result.stdout.trim() : null;
}

function discoverSourceDirty(sourceRoot) {
  const result = spawnSync('git', ['status', '--porcelain', '--untracked-files=all'], {
    cwd: sourceRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  });
  return result.status !== 0 || result.stdout !== '';
}

function removeDirectoryIfPresent(directory) {
  if (fs.existsSync(directory)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

function isInside(candidatePath, parentPath) {
  const relativePath = path.relative(parentPath, candidatePath);
  return relativePath === '' || (
    relativePath !== '..' &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath)
  );
}

function canonicalizePlannedPath(filePath) {
  let currentPath = path.resolve(filePath);
  const missingSegments = [];

  while (true) {
    try {
      fs.lstatSync(currentPath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      const parentPath = path.dirname(currentPath);
      if (parentPath === currentPath) {
        throw error;
      }
      missingSegments.push(path.basename(currentPath));
      currentPath = parentPath;
      continue;
    }

    return path.join(fs.realpathSync(currentPath), ...missingSegments.reverse());
  }
}

function invalidExistingPackage(reason) {
  throw new Error(`Invalid existing production package: ${reason}`);
}

function collectExistingPackageFiles(outputDir) {
  const files = [];

  function walk(relativeDirectory) {
    const directory = path.join(outputDir, relativeDirectory);
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const relativePath = normalizePackagePath(toPackagePath(path.join(relativeDirectory, entry.name)));
      if (entry.isSymbolicLink()) {
        invalidExistingPackage(`symlink at ${relativePath}`);
      }
      if (entry.isDirectory()) {
        walk(relativePath);
      } else if (entry.isFile()) {
        files.push(relativePath);
      } else {
        invalidExistingPackage(`unsupported path type at ${relativePath}`);
      }
    }
  }

  walk('');
  return files.sort();
}

function verifyExistingProductionPackage(outputDir) {
  try {
    const stat = fs.lstatSync(outputDir);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      invalidExistingPackage('output is not a regular directory');
    }

    const manifestPath = path.join(outputDir, 'manifest.json');
    const sumsPath = path.join(outputDir, 'SHA256SUMS');
    for (const metadataPath of [manifestPath, sumsPath]) {
      const metadataStat = fs.lstatSync(metadataPath);
      if (metadataStat.isSymbolicLink() || !metadataStat.isFile()) {
        invalidExistingPackage(`invalid metadata file ${path.basename(metadataPath)}`);
      }
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (!manifest || manifest.schemaVersion !== 1 || !Array.isArray(manifest.files)) {
      invalidExistingPackage('unsupported manifest schema or files');
    }
    if (manifest.producer !== PACKAGE_PRODUCER || manifest.packageFormat !== PACKAGE_FORMAT) {
      invalidExistingPackage('producer or package format does not match Neutral production');
    }
    if (
      typeof manifest.appVersion !== 'string' || manifest.appVersion.trim() === '' ||
      typeof manifest.frameworkVersion !== 'string' || manifest.frameworkVersion.trim() === '' ||
      (manifest.sourceCommit !== null && typeof manifest.sourceCommit !== 'string') ||
      typeof manifest.generatedAt !== 'string' || manifest.generatedAt.trim() === '' ||
      typeof manifest.sourceDirty !== 'boolean' ||
      typeof manifest.basePath !== 'string' || normalizeBasePath(manifest.basePath) !== manifest.basePath
    ) {
      invalidExistingPackage('manifest metadata is invalid');
    }

    const seenPaths = new Set();
    const paths = [];
    for (const file of manifest.files) {
      if (!file || typeof file !== 'object') {
        invalidExistingPackage('invalid manifest file entry');
      }
      const relativePath = normalizePackagePath(file.path);
      if (relativePath === 'manifest.json' || relativePath === 'SHA256SUMS' || seenPaths.has(relativePath)) {
        invalidExistingPackage(`duplicate or self-referential path ${relativePath}`);
      }
      if (!Number.isSafeInteger(file.size) || file.size < 0 || !/^[0-9a-f]{64}$/.test(file.sha256)) {
        invalidExistingPackage(`invalid size or SHA-256 for ${relativePath}`);
      }
      seenPaths.add(relativePath);
      paths.push(relativePath);
    }

    const sortedPaths = [...paths].sort();
    if (paths.some((relativePath, index) => relativePath !== sortedPaths[index])) {
      invalidExistingPackage('manifest files are not uniquely sorted');
    }

    const expectedSums = manifest.files
      .map((file) => `${file.sha256}  ${file.path}`)
      .join('\n') + '\n';
    if (fs.readFileSync(sumsPath, 'utf8') !== expectedSums) {
      invalidExistingPackage('SHA256SUMS does not match the manifest');
    }

    const expectedFiles = [...paths, 'SHA256SUMS', 'manifest.json'].sort();
    const actualFiles = collectExistingPackageFiles(outputDir);
    if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) {
      invalidExistingPackage('file inventory does not match the manifest');
    }

    for (const file of manifest.files) {
      const fullPath = path.join(outputDir, file.path);
      const fileStat = fs.lstatSync(fullPath);
      if (!fileStat.isFile() || fileStat.size !== file.size || sha256File(fullPath) !== file.sha256) {
        invalidExistingPackage(`payload verification failed for ${file.path}`);
      }
    }

    return manifest;
  } catch (error) {
    if (/^Invalid existing production package:/.test(error.message)) {
      throw error;
    }
    invalidExistingPackage(error.message);
  }
}

function verifyProductionPackage(packageRoot) {
  try {
    const resolvedPackageRoot = path.resolve(packageRoot);
    const manifest = verifyExistingProductionPackage(resolvedPackageRoot);
    const allowedFiles = collectProductionFiles(resolvedPackageRoot);
    const manifestFiles = manifest.files.map((file) => file.path);

    if (JSON.stringify(allowedFiles) !== JSON.stringify(manifestFiles)) {
      invalidExistingPackage('payload inventory is outside the production allowlist');
    }

    return manifest;
  } catch (error) {
    if (/^Invalid existing production package:/.test(error.message)) {
      throw error;
    }
    invalidExistingPackage(error.message);
  }
}

function scanProductionPackage(packageRoot, manifest) {
  const resolvedPackageRoot = path.resolve(packageRoot);
  assertRegularFileOrDirectory(resolvedPackageRoot, '.', 'directory');
  for (const file of manifest.files) {
    const relativePath = normalizePackagePath(file.path);
    const fullPath = path.join(resolvedPackageRoot, relativePath);
    assertRegularFileOrDirectory(fullPath, relativePath, 'file');
    scanFile(fullPath, relativePath);
  }
  for (const relativePath of ['manifest.json', 'SHA256SUMS']) {
    const fullPath = path.join(resolvedPackageRoot, relativePath);
    assertRegularFileOrDirectory(fullPath, relativePath, 'file');
    scanFile(fullPath, relativePath);
  }
}

function installCompletedPackage(temporaryDirectory, outputDir) {
  let backupDirectory = null;

  if (fs.existsSync(outputDir)) {
    verifyProductionPackage(outputDir);
    backupDirectory = `${outputDir}.previous-${process.pid}-${crypto.randomUUID()}`;
    // Portable Node APIs cannot exchange non-empty directories in one step.
    // Keep the verified old tree as a rollback backup during the brief name gap.
    fs.renameSync(outputDir, backupDirectory);
  }

  try {
    fs.renameSync(temporaryDirectory, outputDir);
  } catch (error) {
    if (backupDirectory && !fs.existsSync(outputDir)) {
      fs.renameSync(backupDirectory, outputDir);
    }
    throw error;
  }

  if (backupDirectory) {
    removeDirectoryIfPresent(backupDirectory);
  }
}

function buildProductionPackage(options = {}) {
  const sourceRoot = fs.realpathSync(path.resolve(options.sourceRoot || path.resolve(__dirname, '../..')));
  const outputDir = path.resolve(options.outputDir || path.join(sourceRoot, 'dist', 'neutral-production'));
  const canonicalOutputDir = canonicalizePlannedPath(outputDir);
  const basePath = normalizeBasePath(options.basePath ?? '');

  if (isInside(sourceRoot, canonicalOutputDir)) {
    throw new Error('Production package output must not contain or replace the source root');
  }
  for (const entry of REQUIRED_ENTRIES) {
    const requiredPath = path.join(sourceRoot, entry);
    if (isInside(canonicalOutputDir, requiredPath) || isInside(requiredPath, canonicalOutputDir)) {
      throw new Error(`Production package output overlaps required source path: ${entry}`);
    }
  }
  for (const entrypoint of REQUIRED_PRODUCTION_ENTRYPOINTS) {
    assertRegularFileOrDirectory(path.join(sourceRoot, entrypoint), entrypoint, 'file');
  }

  const inventory = collectProductionFiles(sourceRoot);
  const version = readVersion(sourceRoot);
  const sourceDirty = discoverSourceDirty(sourceRoot);
  const outputParent = path.dirname(outputDir);
  fs.mkdirSync(outputParent, { recursive: true });
  const temporaryDirectory = fs.mkdtempSync(path.join(outputParent, `.${path.basename(outputDir)}-building-`));

  try {
    for (const relativePath of inventory) {
      const sourcePath = path.join(sourceRoot, relativePath);
      const destinationPath = path.join(temporaryDirectory, relativePath);
      fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
      fs.copyFileSync(sourcePath, destinationPath);
    }

    injectBasePath(path.join(temporaryDirectory, 'Web-App/public/index.html'), basePath);

    for (const relativePath of inventory) {
      scanFile(path.join(temporaryDirectory, relativePath), relativePath);
    }

    const files = inventory.map((relativePath) => {
      const packageFile = path.join(temporaryDirectory, relativePath);
      return {
        path: relativePath,
        size: fs.statSync(packageFile).size,
        sha256: sha256File(packageFile)
      };
    });

    const manifest = {
      schemaVersion: 1,
      producer: PACKAGE_PRODUCER,
      packageFormat: PACKAGE_FORMAT,
      appVersion: version,
      frameworkVersion: version,
      sourceCommit: options.sourceCommit === undefined
        ? discoverSourceCommit(sourceRoot)
        : options.sourceCommit,
      generatedAt: options.generatedAt || new Date().toISOString(),
      basePath,
      sourceDirty,
      files
    };

    fs.writeFileSync(
      path.join(temporaryDirectory, 'manifest.json'),
      `${JSON.stringify(manifest, null, 2)}\n`
    );
    fs.writeFileSync(
      path.join(temporaryDirectory, 'SHA256SUMS'),
      files.map((file) => `${file.sha256}  ${file.path}`).join('\n') + '\n'
    );

    scanFile(path.join(temporaryDirectory, 'manifest.json'), 'manifest.json');
    scanFile(path.join(temporaryDirectory, 'SHA256SUMS'), 'SHA256SUMS');
    installCompletedPackage(temporaryDirectory, outputDir);

    return { outputDir, manifest };
  } catch (error) {
    removeDirectoryIfPresent(temporaryDirectory);
    throw error;
  }
}

module.exports = {
  PACKAGE_FORMAT,
  PACKAGE_PRODUCER,
  REQUIRED_ENTRIES,
  REQUIRED_PRODUCTION_ENTRYPOINTS,
  buildProductionPackage,
  collectProductionFiles,
  normalizePackagePath,
  normalizeBasePath,
  readPublicPathMarkup,
  redactSensitiveText,
  scanFile,
  scanProductionPackage,
  sha256File,
  verifyProductionPackage
};
