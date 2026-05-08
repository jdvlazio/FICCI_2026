#!/bin/sh
# Instala los git hooks de Otrofestiv.
# Correr una vez después de clonar: sh scripts/install-hooks.sh

HOOKS_DIR="$(git rev-parse --git-dir)/hooks"

cat > "$HOOKS_DIR/pre-commit" << 'HOOK'
#!/bin/sh
if git diff --cached --name-only | grep -q "index.html"; then
  echo "→ Verificando sintaxis JS en index.html..."
  node -e "
    const h = require('fs').readFileSync('index.html', 'utf8');
    const scripts = [...h.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    let failed = false;
    scripts.forEach((m, i) => {
      try { new Function(m[1]); }
      catch(e) {
        console.error('\n✗ ERROR DE SINTAXIS JS (script bloque ' + i + '): ' + e.message);
        console.error('  Commit bloqueado.\n');
        failed = true;
      }
    });
    if (!failed) console.log('✓ Sintaxis JS OK');
    process.exit(failed ? 1 : 0);
  " 2>&1 || exit 1
fi
if git diff --cached --name-only | grep -q "festivals/.*\.json"; then
  echo "→ Validando festivales..."
  node scripts/validate-festivals.js 2>&1 | grep -E "ERROR|Festivales|fallida|exitosa"
  node scripts/validate-festivals.js 2>&1 | grep -q "Errores: [^0]" && echo "\n✗ Validator falló.\n" && exit 1
  echo "✓ Festivales OK"
fi
exit 0
HOOK

chmod +x "$HOOKS_DIR/pre-commit"
echo "✓ Hook pre-commit instalado en $HOOKS_DIR"
