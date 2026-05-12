#!/usr/bin/env node
/**
 * bump-version.js — Actualiza sw.js y version.json con timestamp de build.
 *
 * Uso: node scripts/bump-version.js
 * Correr ANTES de cada git push a producción.
 *
 * Formato: YYYYMMDDHHmm (ej: 202609101430)
 */

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const now = new Date();
const build = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0'),
  String(now.getHours()).padStart(2, '0'),
  String(now.getMinutes()).padStart(2, '0'),
].join('');

// sw.js — dos campos: CACHE_NAME y BUILD
const swPath = path.join(ROOT, 'sw.js');
let sw = fs.readFileSync(swPath, 'utf8');
const swBefore = sw;
sw = sw.replace(/otrofestiv-v\d{12}/, `otrofestiv-v${build}`);
sw = sw.replace(/BUILD = '\d{12}'/, `BUILD = '${build}'`);
if (sw === swBefore) {
  console.error('✗ sw.js: no se encontraron los patrones esperados. Verificar formato.');
  process.exit(1);
}
fs.writeFileSync(swPath, sw);

// index.html — BUILD_VERSION para auto-reload por versión
const htmlPath = path.join(ROOT, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace(/BUILD_VERSION='\d{12}'/, `BUILD_VERSION='${build}'`);
fs.writeFileSync(htmlPath, html);

// version.json
const vPath = path.join(ROOT, 'version.json');
fs.writeFileSync(vPath, JSON.stringify({ build }, null, 2) + '\n');

console.log(`✅ Build: ${build}`);
console.log(`   sw.js y version.json actualizados.`);

// Regenerar CLAUDE.md con estado actual del repo
require('./generate-claude-md');
