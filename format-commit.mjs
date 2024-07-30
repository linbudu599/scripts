#!/usr/bin/env zx

import 'zx/globals';

await $`git add -A --verbose`.nothrow().verbose();
echo('');

await $`git commit -m 'style: format code styles' --verbose`
  .nothrow()
  .verbose();
echo('');

await $`git push --progress --verbose`.nothrow().verbose();
