#!/usr/bin/env zx

import 'zx/globals';

/**
 * @import { PackageJson } from "type-fest"
 */

/**
 *
 * @typedef TraverseInput
 *
 * @property {string} packageDir
 * @property {string} resolvedPackageDir
 * @property {string} resolvedPackageJsonPath
 * @property {PackageJson} packageMeta
 *
 *
 * @typedef {Required<Parameters<glob>>[1]} GlobOptions;
 */

export const sourceFileMatchPattern = [
  '{src,source}/**/{*.ts,*.tsx,*.mts,*.js,*.jsx,*.mjs}',
  '!{src,source}/__tests__/**/*',
  '__tests__/**/*',
];

/** @type {GlobOptions} */
export const sourceFileGlobOptions = {
  onlyFiles: true,
  absolute: false,
  dot: true,
  globstar: true,
};

export const resolvedWorkspacePackageDirRoot = path.resolve(
  __dirname,
  './packages'
);

export const resolvedWorkspacePackageDirs = fs
  .readdirSync(resolvedWorkspacePackageDirRoot)
  .map((p) => path.resolve(resolvedWorkspacePackageDirRoot, p));

/**
 *
 * @param {(data: TraverseInput) => void | Promise<void>} executor
 * @param {(packageId: string) => boolean} [filter]
 */
export async function traverse(executor, filter) {
  /** @type {TraverseInput[]} */
  const packageDataList = resolvedWorkspacePackageDirs
    .reduce((prev, curr) => {
      const pkgJsonPath = path.resolve(curr, 'package.json');

      if (!fs.existsSync(pkgJsonPath)) {
        return prev;
      }

      /** @type {TraverseInput} */
      const packageData = {
        resolvedPackageDir: curr,
        packageDir: path.basename(curr),
        packageMeta: fs.readJSONSync(pkgJsonPath),
        resolvedPackageJsonPath: pkgJsonPath,
      };

      prev.push(packageData);

      return prev;
    }, [])
    .filter((p) => filter?.(p.package) ?? true);

  for (const packageData of packageDataList) {
    await executor(packageData);
  }
}
