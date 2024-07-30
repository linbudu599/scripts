#!/usr/bin/env zx

import 'zx/globals';

await $`git add -A --verbose`.nothrow().verbose();
echo('');

await $`git commit -m 'fix: fixup merge conflicts' --verbose`
  .nothrow()
  .verbose();
echo('');

await $`git push --progress --verbose`.nothrow().verbose();
