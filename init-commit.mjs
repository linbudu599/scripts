#!/usr/bin/env zx

import 'zx/globals';

await $`git add -A --verbose`.nothrow().verbose();
echo('');

await $`git commit -m 'init: initialize project --- where magic starts' --verbose`
  .nothrow()
  .verbose();
echo('');

await $`git push --progress --verbose`.nothrow().verbose();
