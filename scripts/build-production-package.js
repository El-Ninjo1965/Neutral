#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { buildProductionPackage } = require('./lib/portable-install.js');

function parseArguments(args) {
  const options = { basePath: undefined, output: undefined };
  const optionKeys = {
    '--base-path': 'basePath',
    '--output': 'output'
  };
  const seen = new Set();

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const separatorIndex = argument.indexOf('=');
    const optionName = separatorIndex === -1 ? argument : argument.slice(0, separatorIndex);
    const key = optionKeys[optionName];
    if (!key) {
      throw new Error(`Unknown option: ${argument}`);
    }
    if (seen.has(optionName)) {
      throw new Error(`Duplicate option: ${optionName}`);
    }
    seen.add(optionName);

    let value;
    if (separatorIndex !== -1) {
      value = argument.slice(separatorIndex + 1);
    } else {
      if (index + 1 >= args.length || args[index + 1].startsWith('--')) {
        throw new Error(`Missing value for ${optionName}`);
      }
      value = args[index + 1];
      index += 1;
    }

    if (key === 'output' && (value.trim() === '' || /\p{Cc}/u.test(value))) {
      throw new Error('Invalid --output value');
    }
    options[key] = value;
  }

  return options;
}

function printHelp() {
  console.log('Usage: npm run package:production -- [--base-path=/my-app] [--output=dist/neutral-production]');
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  const options = parseArguments(args);
  const sourceRoot = path.resolve(__dirname, '..');
  const result = buildProductionPackage({
    sourceRoot,
    outputDir: options.output === undefined ? undefined : path.resolve(process.cwd(), options.output),
    basePath: options.basePath ?? process.env.NEUTRAL_BASE_PATH ?? ''
  });

  console.log(JSON.stringify({
    status: 'OK',
    outputDir: result.outputDir,
    basePath: result.manifest.basePath,
    files: result.manifest.files.length
  }, null, 2));
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(JSON.stringify({ status: 'ERROR', message: error.message }, null, 2));
    process.exitCode = 1;
  }
}

module.exports = { main, parseArguments };
