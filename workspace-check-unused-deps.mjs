#!/usr/bin/env zx

import 'zx/globals';

/** @import { PackageJson } from "type-fest" */

import consola from 'consola';
import TSMorph from 'ts-morph';
import { isBuiltin } from 'module';

import { traverse, sourceFileGlobOptions } from './workspace-shared.mjs';

const project = new TSMorph.Project();

/** @type {Record<string, string[]>} */
const result = {};

/** @type {string[]} */
const allowedUnusedList =
  fs.readJSONSync(path.resolve(process.cwd(), 'package.json'))
    ?.allowedUnusedDeps ?? [];

/** @type {string[]} */
const triggerredAllowList = [];

echo('[CHECK_UNUSED_DEPS]\n');

await traverse(async ({ resolvedPackageDir, packageMeta }) => {
  const { name: packageId } = packageMeta;

  const dependencies = Object.keys(packageMeta.dependencies ?? {}) ?? [];

  const files = await glob(
    [
      '{src,source}/**/{*.ts,*.tsx,*.mts,*.js,*.jsx,*.mjs}',
      '!{src,source}/__tests__/**/*',
      '__tests__/**/*',
    ],
    {
      ...sourceFileGlobOptions,
      cwd: resolvedPackageDir,
    }
  );

  consola.info(`Checking Package ${chalk.cyanBright(packageId)}`);

  if (!files.length) {
    consola.warn(`No matched files found in ${chalk.cyanBright(packageId)}`);
    return;
  }

  echo('');

  /** @type {Set<string>} */
  const usedDeps = new Set();

  for (const file of files) {
    console.log(
      `Checking [${chalk.bold(chalk.green(packageId))}] ${chalk.white(file)}`
    );

    const filePath = path.resolve(resolvedPackageDir, file);
    const sourceFile = project.addSourceFileAtPath(filePath);

    const imports = sourceFile.getImportDeclarations();
    const exports = sourceFile.getExportDeclarations();

    /** @type {string[]} */
    const redirectsExports = exports
      .map((exp) => {
        const moduleSpecifier = exp.getModuleSpecifierValue();

        if (!moduleSpecifier || moduleSpecifier.startsWith('.')) return null;

        return moduleSpecifier;
      })
      .filter(Boolean);

    const depImports = imports
      .filter((imp) => !imp.isTypeOnly())
      .map((imp) => {
        const _moduleSpecifier = imp.getModuleSpecifierValue();

        const moduleSpecifier = _moduleSpecifier.includes('/')
          ? _moduleSpecifier.includes('@')
            ? _moduleSpecifier.split('/').slice(0, 2).join('/')
            : _moduleSpecifier.split('/')[0]
          : _moduleSpecifier;

        return moduleSpecifier;
      })
      .filter((moduleSpecifier) => {
        return !isBuiltin(moduleSpecifier) && !moduleSpecifier.startsWith('.');
      });

    for (const dep of [...depImports, ...redirectsExports]) {
      usedDeps.add(dep);
    }
  }

  const unusedDeps = dependencies.filter(
    (dep) => !usedDeps.has(dep) && !allowedUnusedList.includes(dep)
  );

  dependencies.forEach((dep) => {
    if (usedDeps.has(dep)) return;

    if (!allowedUnusedList.includes(dep)) return;

    triggerredAllowList.push(dep);
  });

  if (unusedDeps.length > 0) {
    result[packageId] = unusedDeps;
  }

  echo('');
});

if (Object.keys(result).length > 0) {
  consola.warn('UNUSED deps detected:');

  for (const [packageId, deps] of Object.entries(result)) {
    consola.error(`Package ${chalk.white(packageId)} contains UNUSED deps:
${deps.map((dep) => `  ${chalk.red(dep)}`).join('\n')}

Run ${chalk.green(
      `pnpm remove ${deps.join(' ')} --filter ${packageId}`
    )} to remove them.`);
  }

  process.exit(1);
} else {
  echo('');
  consola.success(
    `No UNUSED Deps!${
      triggerredAllowList.length
        ? ` (Under allowed unused deps: ${triggerredAllowList
            .map((t) => chalk.yellow(t))
            .join(', ')})`
        : ''
    }`
  );
}
