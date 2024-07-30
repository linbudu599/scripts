#!/usr/bin/env zx

import 'zx/globals';

/** @import { PackageJson } from "type-fest" */

import consola from 'consola';
import TSMorph from 'ts-morph';
import { isBuiltin } from 'module';

import { traverse } from './workspace-shared.mjs';

const project = new TSMorph.Project();

/** @type {Record<string, [file: string, specifier: string][]>} */
const result = {};

/** @type {string[]} */
const allowedGhostDeps =
  fs.readJSONSync(path.resolve(process.cwd(), 'package.json'))
    ?.allowedGhostDeps ?? [];

/** @type {string[]} */
const triggerredAllowList = [];

echo('[CHECK_GHOST_DEPS]\n');

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
      onlyFiles: true,
      cwd: resolvedPackageDir,
    }
  );

  consola.info(`Checking Package ${chalk.cyanBright(packageId)}`);

  if (!files.length) {
    consola.warn(`No matched files found in ${chalk.cyanBright(packageId)}`);
    return;
  }

  echo('');

  for (const file of files) {
    console.log(
      `Checking [${chalk.bold(chalk.green(packageId))}] ${chalk.white(file)}`
    );

    const filePath = path.resolve(resolvedPackageDir, file);
    const sourceFile = project.addSourceFileAtPath(filePath);

    const imports = sourceFile.getImportDeclarations();

    for (const imp of imports) {
      const _moduleSpecifier = imp.getModuleSpecifierValue();

      // handle @babel/ddd/fd
      const moduleSpecifier = _moduleSpecifier.includes('/')
        ? _moduleSpecifier.includes('@')
          ? _moduleSpecifier.split('/').slice(0, 2).join('/')
          : _moduleSpecifier.split('/')[0]
        : _moduleSpecifier;

      if (
        isBuiltin(moduleSpecifier) ||
        dependencies.includes(moduleSpecifier) ||
        moduleSpecifier.startsWith('.') ||
        imp.isTypeOnly()
      )
        continue;

      if (dependencies.includes(moduleSpecifier)) continue;

      if (allowedGhostDeps.includes(moduleSpecifier)) {
        triggerredAllowList.push(moduleSpecifier);
        continue;
      }

      result[packageId] ??= [];
      result[packageId].push([
        path.resolve(resolvedPackageDir, file),
        moduleSpecifier,
      ]);
    }
  }

  echo('');
});

if (Object.keys(result).length > 0) {
  consola.warn('GHOST deps detected:');

  for (const [packageId, packageResult] of Object.entries(result)) {
    consola.error(`Package ${chalk.white(packageId)} contains GHOST deps:
${packageResult
  .map(([file, dep]) => `  ${chalk.red(dep)} in ${chalk.white(file)}`)
  .join('\n')}
      `);
  }

  process.exit(1);
} else {
  echo('');
  consola.success(
    `No GHOST deps!${
      triggerredAllowList.length
        ? ` (Under allowed deps list: ${triggerredAllowList
            .map((t) => chalk.yellow(t))
            .join(', ')})`
        : ''
    }`
  );
}
