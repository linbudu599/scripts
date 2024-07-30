#!/usr/bin/env zx

import 'zx/globals';

await $`git reset --hard HEAD~1 --verbose`.nothrow().verbose();
echo('');

await $`git push origin HEAD --progress --force --verbose`.nothrow().verbose();
