#!/usr/bin/env zx

import 'zx/globals';

/**
 *
 * @typedef SearchOptions
 *
 * @property {boolean} gh
 * @property {boolean} npm
 * @property {boolean} google
 *
 * @typedef {(keyword: string) => string} SearchURLBuilder
 */

import open, { apps } from 'open';
import consola from 'consola';

import { purifyArgvInput } from './shared.mjs';

/** @type {string} */
const keyword = purifyArgvInput(argv)[0];

/** @type {SearchOptions} */
const options = {
  google: true,
  npm: false,
  gh: false,
  ...argv,
};

if (!keyword) {
  consola.error('No search keyword');
  process.exit(1);
}

/** @type {SearchURLBuilder} */
function buildGoogleSearchURL(keyword) {
  return `https://www.google.com.hk/search?q=${keyword}`;
}

/** @type {SearchURLBuilder} */
function buildNPMSearchURL(keyword) {
  return `https://www.npmjs.com/search?q=${keyword.replace(/\+/g, '%20')}`;
}

/** @type {SearchURLBuilder} */
function buildGitHubSearchURL(keyword) {
  return `https://github.com/search?q=${keyword}&type=repositories`;
}

/** @type {string[]} */
const urls = [];

if (options.google) {
  urls.push(buildGoogleSearchURL(keyword));
}

if (options.npm) {
  urls.push(buildNPMSearchURL(keyword));
}

if (options.gh) {
  urls.push(buildGitHubSearchURL(keyword));
}

for (const url of urls) {
  await open(url, {
    app: { name: apps.chrome },
  });
}
