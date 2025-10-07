#!/usr/bin/env node
/**
 * Lightweight runner for Lighthouse (manual CI).
 * Requires: npm i -D lighthouse
 * Usage: BASE_URL=http://localhost:3000 node scripts/lighthouse-ci.mjs
 */
import { spawn } from 'node:child_process';

const url = process.env.BASE_URL || 'http://localhost:3000/';
const args = [
  'lighthouse',
  url,
  '--quiet',
  '--output=json',
  '--only-categories=performance,accessibility,best-practices,seo',
  '--throttling-method=simulate',
  '--screenEmulation.disabled=false',
];

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(npx, args, { stdio: 'inherit' });
child.on('exit', (code) => {
  process.exit(code ?? 1);
});