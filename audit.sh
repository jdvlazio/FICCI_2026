#!/bin/bash
# ── Otrofestiv Design Token Audit ──────────────────────────────────────────
# Detecta valores hardcodeados que deberían usar var(--) del sistema de tokens.
# Uso: ./audit.sh
# Excepciones válidas documentadas en :root de index.html.
# ───────────────────────────────────────────────────────────────────────────

FILE="index.html"
PASS=true

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Otrofestiv — Design Token Audit        ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Font sizes ──────────────────────────────────────────────────────────────
# Excepciones: 16px (iOS input), 28px/32px (íconos decorativos)
echo "▸ Font sizes hardcodeados (excluye 16/28/32px):"
RESULT=$(grep -oP 'font-size:\d+px' "$FILE" | grep -v "var(" | grep -vP 'font-size:(16|28|32)px')
if [ -z "$RESULT" ]; then
  echo "  ✓ Sin issues"
else
  echo "$RESULT" | sort | uniq -c | sort -rn | sed 's/^/  ✗ /'
  PASS=false
fi
echo ""

# ── Padding hardcodeado (>6px, excluye micro-paddings de badges) ────────────
echo "▸ Padding hardcodeado (>6px):"
RESULT=$(grep -oP 'padding:[0-9]+px' "$FILE" | grep -v "var(" | grep -vP 'padding:[1-6]px')
if [ -z "$RESULT" ]; then
  echo "  ✓ Sin issues"
else
  echo "$RESULT" | sort | uniq -c | sort -rn | sed 's/^/  ✗ /'
  PASS=false
fi
echo ""

# ── Gap hardcodeado (>3px, excluye micro-separadores) ──────────────────────
echo "▸ Gap hardcodeado (>3px, excluye poster-grid):"
RESULT=$(grep -oP 'gap:\d+px' "$FILE" | grep -v "var(" | grep -vP 'gap:[1-3]px')
if [ -z "$RESULT" ]; then
  echo "  ✓ Sin issues"
else
  echo "$RESULT" | sort | uniq -c | sort -rn | sed 's/^/  ✗ /'
  PASS=false
fi
echo ""

# ── Margin hardcodeado (>3px, excluye ajustes ópticos) ─────────────────────
echo "▸ Margin hardcodeado (>3px):"
RESULT=$(grep -oP 'margin[^:]*:\d+px' "$FILE" | grep -v "var(\|calc(\|env(" | grep -vP 'margin[^:]*:[1-3]px')
if [ -z "$RESULT" ]; then
  echo "  ✓ Sin issues"
else
  echo "$RESULT" | sort | uniq -c | sort -rn | sed 's/^/  ✗ /'
  PASS=false
fi
echo ""

# ── Border-radius hardcodeado ───────────────────────────────────────────────
echo "▸ Border-radius hardcodeado:"
RESULT=$(grep -oP 'border-radius:[0-9]+px' "$FILE" | grep -v "var(\|50%")
if [ -z "$RESULT" ]; then
  echo "  ✓ Sin issues"
else
  echo "$RESULT" | sort | uniq -c | sort -rn | sed 's/^/  ✗ /'
  PASS=false
fi
echo ""

# ── Resultado final ─────────────────────────────────────────────────────────
if [ "$PASS" = true ]; then
  echo "✅ Todo OK — sistema de tokens consistente."
else
  echo "⚠️  Hay valores fuera del sistema. Revisar o documentar como excepción en :root."
fi
echo ""
