#!/usr/bin/env zx

import 'zx/globals';

/**
 *
 * @typedef {'rgb'|'hex'|'unknown'} InputColorType
 * @typedef {(input: string) => string} ColorTransformer
 *
 */

import consola from 'consola';

import { purifyArgvInput } from './shared.mjs';

const inputColors = purifyArgvInput(argv);

/**
 *
 * @param {string} color
 * @returns {InputColorType}
 */
function detectColorFormat(color) {
  if (color.startsWith('#')) {
    return 'hex';
  } else if (color.toLowerCase().startsWith('rgb')) {
    return 'rgb';
  } else {
    return 'unknown'; // 未知格式
  }
}

/** @type {ColorTransformer} */
function rgbToHex(rgb) {
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

  if (!match) {
    return rgb;
  }

  let hex = '#';
  for (let i = 1; i <= 3; i++) {
    let component = parseInt(match[i], 10).toString(16);
    hex += component.length == 1 ? '0' + component : component;
  }

  return hex;
}

/** @type {ColorTransformer} */
function hexToRgb(hex) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;

  hex = hex.replace(shorthandRegex, (m, r, g, b) => {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  return result
    ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
        result[3],
        16
      )})`
    : hex;
}

/** @type {ColorTransformer} */
function unknownFallback(input) {
  return '';
}

/** @type {Record<InputColorType, ColorTransformer>} */
const colorTransformerMap = {
  hex: hexToRgb,
  rgb: rgbToHex,
  unknown: unknownFallback,
};

/**
 *
 * @param {string} color
 * @param {InputColorType} [forcedInputType]
 * @returns
 */
function convertColor(color, forcedInputType) {
  return colorTransformerMap[forcedInputType ?? detectColorFormat(color)](
    color
  );
}

if (!inputColors.length) {
  consola.error('No colors provided.');
  process.exit(1);
}

for (const color of inputColors) {
  const converted = convertColor(color);

  if (converted) {
    const hex = convertColor(color, 'rgb');

    /** @type {(val: string) => string} */
    const colorLogger = (val) => chalk.underline(chalk.hex(hex)(val));

    consola.info(
      `Input color ${colorLogger(color)} converted to ${colorLogger(
        converted
      )}.`
    );
  } else {
    consola.error(`Failed to convert color ${color}.`);
  }
}
