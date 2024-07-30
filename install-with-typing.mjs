#!/usr/bin/env zx

import 'zx/globals';

/**
 *
 * @typedef {'npm' | 'pnpm' | 'yarn' | 'bun'} PM
 *
 */

import whichPM from 'which-pm';
import consola from 'consola';
import patoce from 'pacote';
import validatePkgName from 'validate-npm-package-name';

import { purifyArgvInput } from './shared.mjs';

const pkgs = purifyArgvInput(argv);

/** @type {boolean} */
const dev = argv['dev'] ?? false;

/** @type {string} */
const args = argv['args'] ?? '';

/** @type {PM} */
const pm = argv['pm'] ?? '';

const SCOPE_REGEX = '@[a-z\\d][\\w-.]+/[a-z\\d][\\w-.]*';

/** @type {(pkg: string) => boolean} */
function isScopedPkg(pkg) {
  return new RegExp(`^${SCOPE_REGEX}$`, 'i').test(pkg);
}

/** @type {(pkg: string) => string} */
function buildTypingPkg(pkg) {
  // @babel/generator -> @types/babel__generator
  // react → @types/react
  if (pkg.startsWith('@')) {
    const [scope, subPkg] = pkg.split('/');

    return `@types/${scope?.slice(1)}__${subPkg}`;
    // Replace the first slash only
    // return `@types/${pkg.replace('/', '__')}`;
  } else {
    return `@types/${pkg}`;
  }
}

/** @type {(packument: Awaited<ReturnType<typeof patoce.packument>>) => boolean } */
function isDeprecatedTypingPkg(pakument) {
  try {
    const latestTag = pakument['dist-tags'].latest;
    const latestVersion = pakument.versions[latestTag];

    return latestVersion.deprecated;
  } catch (error) {
    return true;
  }
}

/** @type {(pkg: string) => Promise<{ typingPkg: string; valid: boolean; }>} */
async function searchTypingPkg(typingPkg) {
  try {
    const [pkgManifest, pakument] = await Promise.all([
      patoce.manifest(typingPkg),
      patoce.packument(typingPkg),
    ]);

    if (isDeprecatedTypingPkg(pakument)) return { typingPkg: '', valid: false };

    return {
      // typingPkg: `${typingPkg}@${pkgManifest.version}`,
      typingPkg: `${typingPkg}`,
      valid: true,
    };
  } catch (error) {
    return { typingPkg: '', valid: false };
  }
}

/** @type {string[]} */
const deps = [];

/** @type {string[]} */
const devDeps = [];

/** @type {(pkg: string) => Promise<void>} */
async function handle(pkg) {
  if (!validatePkgName(pkg).validForOldPackages) return;

  const targetTypingPkg = buildTypingPkg(pkg);

  const searchRes = await searchTypingPkg(targetTypingPkg);

  if (searchRes.valid === false) {
    consola.info(
      `Typing package for ${chalk.green(pkg)} not found or deprecated.`
    );
    return;
  }

  consola.info(
    `Typing package found: ${chalk.green(pkg)} → ${chalk.green(
      searchRes.typingPkg
    )}`
  );

  (dev ? devDeps : deps).push(pkg);

  devDeps.push(searchRes.typingPkg);
}

async function install() {
  const installPM = pm || (await whichPM(process.cwd())).name;

  const pmInstallCommand = installPM === 'npm' ? 'install' : 'add';

  if (deps.length) {
    echo('');

    await $`${installPM} ${pmInstallCommand} ${deps}  ${args}`.verbose();
  }

  if (devDeps.length) {
    echo('');

    await $`${installPM} ${pmInstallCommand} ${devDeps} --save-dev ${args}`.verbose();
  }

  process.exit(0);
}

await Promise.all(pkgs.map(handle));

await install();
