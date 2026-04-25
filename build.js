#!/usr/bin/env node
// build.js — Otrofestiv build system
// Uso: node build.js → produce dist/index.html

const fs   = require('fs');
const path = require('path');

const ROOT  = __dirname;
const SRC   = path.join(ROOT, 'src');
const DIST  = path.join(ROOT, 'dist');
const INDEX = path.join(ROOT, 'index.html');

// ── Fases completadas ──────────────────────────────────────────────
// Fase 1: src/config.js  — UI, ICONS, FESTIVAL_CONFIG, VENUES, NOTICES
// Fase 2: src/styles.css — todo el CSS (~1,842 líneas)
// Fase 3: src/algo.js    — algoritmo + squeezeExcluded + getSuggestions
// Fases 4-5: pendientes

function build() {
  console.log('Building Otrofestiv...\n');
  if (!fs.existsSync(DIST)) fs.mkdirSync(DIST);

  let html = fs.readFileSync(INDEX, 'utf8');

  // Fase 2: inline CSS from src/styles.css
  const cssFile = path.join(SRC, 'styles.css');
  if (fs.existsSync(cssFile)) {
    const css = fs.readFileSync(cssFile, 'utf8');
    html = html.replace(
      /<style>[\s\S]*?<\/style>\s*<style>[\s\S]*?<\/style>/,
      '<style>\n' + css + '\n</style>'
    );
    console.log('  ✓ styles.css (' + css.length + ' chars)');
  }

  fs.writeFileSync(path.join(DIST, 'index.html'), html);
  console.log('\n✓ dist/index.html (' + html.length + ' chars)');
  console.log('\nSrc files ready:');
  ['config.js', 'styles.css', 'algo.js'].forEach(f => {
    const p = path.join(SRC, f);
    if (fs.existsSync(p)) {
      const size = fs.statSync(p).size;
      console.log('  ✓ src/' + f + ' (' + size + ' bytes)');
    }
  });
}

build();
