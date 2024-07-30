#!/usr/bin/env zx

import 'zx/globals';

await $`git add -A --verbose`.nothrow().verbose();
echo('');

await $`git commit -m 'feat: sync local changes' --verbose`.nothrow().verbose();
echo('');

await $`git push --progress --verbose`.nothrow().verbose();
