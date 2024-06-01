#!/usr/bin/env node

import ts from '../index.js';
const tapSpec = ts();

process.stdin
  .pipe(tapSpec)
  .pipe(process.stdout);

process.on('exit', function (status) {

  if (status === 1) {
    process.exit(1);
  }

  if (tapSpec.failed) {
    process.exit(1);
  }
});
