#!/usr/bin/env zx

import 'zx/globals';

import pacote from 'pacote';
import open, { apps } from 'open';
import consola from 'consola';

import { purifyArgvInput } from './shared.mjs';

const packages2Open = purifyArgvInput(argv);

if (!packages2Open.length) {
  consola.error('No package to open.');
  process.exit(1);
}

/** @type {(pkg: string) => Promise<void>} */
async function handleOpenPkg(pkg) {
  if (pkg.includes('+')) {
    await open(`https://www.npmjs.com/search?q=${pkg.replace(/\+/g, '%20')}`, {
      app: { name: apps.chrome },
    });
    return;
  }

  try {
    await pacote.manifest(pkg);

    await open(`https://www.npmjs.com/package/${pkg}`, {
      app: { name: apps.chrome },
    });
  } catch (error) {
    consola.info(
      `Failed to fetch package info for ${chalk.yellow(
        pkg
      )}, opening search page instead.`
    );

    await open(`https://www.npmjs.com/search?q=${pkg}`, {
      app: { name: apps.chrome },
    });
  }
}

for (const pkg of packages2Open) {
  await handleOpenPkg(pkg);
}
