#!/usr/bin/env node
// build.js — Otrofestiv build system
// Uso: node build.js
// Ensambla src/ → index.html (deploy target)
//
// Fuentes canónicas:
//   src/shell.html     — HTML puro sin CSS ni JS
//   src/styles.css     — todo el CSS
//   src/config.js      — UI, ICONS, FESTIVAL_CONFIG, VENUES, NOTICES
//   src/algo.js        — algoritmo + getSuggestions + squeezeExcluded
//   src/renders/*.js   — renders por tab
//
// Output: index.html (GitHub Pages deploy)

const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC  = path.join(ROOT, 'src');
const OUT  = path.join(ROOT, 'index.html');

// ── JS build order ──────────────────────────────────────────────
const JS_ORDER = [
  'config.js',
  'algo.js',
  'renders/helpers.js',
  'renders/mi-lista.js',
  'renders/mi-plan.js',
  'renders/planear.js',
  'renders/cartelera.js',
  'renders/sheets.js',
  'renders/programa.js',
  'renders/init.js',
];

function build() {
  const t0 = Date.now();
  console.log('Building Otrofestiv...\n');

  // 1. Read shell
  const shellPath = path.join(SRC, 'shell.html');
  if (!fs.existsSync(shellPath)) {
    console.error('ERROR: src/shell.html not found');
    process.exit(1);
  }
  let html = fs.readFileSync(shellPath, 'utf8');

  // 2. Inline CSS
  const cssPath = path.join(SRC, 'styles.css');
  if (!fs.existsSync(cssPath)) {
    console.error('ERROR: src/styles.css not found');
    process.exit(1);
  }
  const css = fs.readFileSync(cssPath, 'utf8');
  html = html.replace('<style>/* __STYLES__ */</style>', '<style>\n' + css + '\n</style>');
  console.log(`  ✓ styles.css       (${css.length.toLocaleString()} chars)`);

  // 3. Concatenate JS
  const missing = JS_ORDER.filter(f => !fs.existsSync(path.join(SRC, f)));
  if (missing.length) {
    console.error('ERROR: Missing src files:', missing.join(', '));
    process.exit(1);
  }

  const js = JS_ORDER.map(f => {
    const code = fs.readFileSync(path.join(SRC, f), 'utf8');
    console.log(`  ✓ src/${f.padEnd(28)} (${code.length.toLocaleString()} chars)`);
    return `\n// ════ ${f} ════\n${code}`;
  }).join('\n');

  html = html.replace('<script>/* __SCRIPTS__ */</script>', '<script>' + js + '\n</script>');

  // 4. Write output
  fs.writeFileSync(OUT, html);
  const elapsed = Date.now() - t0;
  console.log(`\n✓ index.html (${html.length.toLocaleString()} chars) — ${elapsed}ms`);

  // 5. Validate JS
  try {
    const scriptBlocks = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi)]
      .filter(m => !m[0].includes('ld+json'))
      .map(m => m[1]);
    scriptBlocks.forEach((block, i) => new Function(block));
    console.log(`✓ JS validation: ${scriptBlocks.length} blocks OK`);
  } catch(e) {
    console.error('✗ JS validation error:', e.message.slice(0, 100));
    process.exit(1);
  }
}

build();
