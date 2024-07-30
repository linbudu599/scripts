#!/usr/bin/env zx

import 'zx/globals';

export const workspaceScriptFiles = fs
  .readdirSync(__dirname)
  .filter((p) => p.endsWith('mjs'));

/** @type {(argv: minimist.ParsedArgs) => string[]} */
export function purifyArgvInput(argv) {
  return argv['_'].filter((a) => !workspaceScriptFiles.includes(a));
}
