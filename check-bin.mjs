#!/usr/bin/env zx

import 'zx/globals';

/**
 * @import { PackageJson } from "type-fest"
 */

import consola from 'consola';

/** @type {PackageJson} */
const pkgJsonContent = fs.readJSONSync(path.resolve('package.json'));

const bin = pkgJsonContent.bin ?? {};

if (typeof bin === 'string') {
  const resolvedBinFile = path.resolve(bin);

  if (!fs.existsSync(resolvedBinFile)) {
    consola.error('Bin file not found: ' + resolvedBinFile);
    process.exit(1);
  }

  process.exit(0);
}

if (!Object.keys(bin).length) {
  consola.info('Empty bin field, exit.');
  process.exit(0);
}

/** @type {Record<string, { cmdFile: string; resolvedCmdFile: string; }>} */
const invalidBinPair = {};

Object.entries(bin).forEach(([cmd, cmdFile]) => {
  const resolvedCmdFile = path.resolve(cmdFile);

  if (!fs.existsSync(resolvedCmdFile)) {
    invalidBinPair[cmd] = {
      cmdFile,
      resolvedCmdFile,
    };
  }
});

if (Object.keys(invalidBinPair).length) {
  consola.error('Invalid bin file found:');
  consola.log(
    `${Object.keys(invalidBinPair)
      .map(
        (cmd) =>
          `- Bin: ${chalk.yellow(cmd)}, File: ${chalk.white(
            invalidBinPair[cmd].cmdFile
          )} (→ ${chalk.white(invalidBinPair[cmd].resolvedCmdFile)})`
      )
      .join('\n')}`
  );
  process.exit(1);
} else {
  consola.success('Bin file check passed.');
}
