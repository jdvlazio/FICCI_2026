#!/bin/bash
# ── Otrofestiv Design Token Audit ──────────────────────────────────────────
# Detecta valores hardcodeados que deberían usar var(--).
# Solo marca propiedades con valor ÚNICO hardcodeado (no shorthands mixtos).
# Excepciones documentadas en el bloque REGLA DE SISTEMA del :root.
# Uso: ./audit.sh desde la raíz del repo.
# ───────────────────────────────────────────────────────────────────────────

FILE="index.html"
PASS=true

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Otrofestiv — Design Token Audit        ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Lookahead: valor termina en ; } " o ' (no espacio — excluye shorthands mixtos)
TERM='(?=[;}"'\''])'

# ── Font sizes ──────────────────────────────────────────────────────────────
# Excepciones: 16px (iOS input), 28/32px (íconos emoji)
echo "▸ Font sizes:"
RESULT=$(grep -oP "font-size:[0-9]+px$TERM" "$FILE" \
  | grep -vP 'font-size:(16|28|32)px')
if [ -z "$RESULT" ]; then
  echo "  ✓ Sin issues"
else
  echo "$RESULT" | sort | uniq -c | sort -rn | sed 's/^/  ✗ /'
  PASS=false
fi
echo ""

# ── Padding single-value ─────────────────────────────────────────────────────
# Excepciones: ≤6px (micro), 10px (cancel buttons + poster-grid), 20px (overlays)
echo "▸ Padding single-value:"
RESULT=$(grep -oP "padding:[0-9]+px$TERM" "$FILE" \
  | grep -vP 'padding:(1|2|3|4|5|6|10|20)px')
if [ -z "$RESULT" ]; then
  echo "  ✓ Sin issues"
else
  echo "$RESULT" | sort | uniq -c | sort -rn | sed 's/^/  ✗ /'
  PASS=false
fi
echo ""

# ── Gap single-value ─────────────────────────────────────────────────────────
# Excepciones: ≤3px (micro), 5px, 6px, 10px (entre tokens documentados)
echo "▸ Gap single-value:"
RESULT=$(grep -oP "gap:[0-9]+px$TERM" "$FILE" \
  | grep -vP 'gap:(1|2|3|4|5|6|10)px')
if [ -z "$RESULT" ]; then
  echo "  ✓ Sin issues"
else
  echo "$RESULT" | sort | uniq -c | sort -rn | sed 's/^/  ✗ /'
  PASS=false
fi
echo ""

# ── Margin single-value ──────────────────────────────────────────────────────
# Excepciones: ≤3px (micro), 5px, 6px, 10px, 18px, 20px (entre tokens)
echo "▸ Margin single-value:"
RESULT=$(grep -oP "margin[-a-z]*:[0-9]+px$TERM" "$FILE" \
  | grep -vP 'margin[-a-z]*:(1|2|3|4|5|6|10|18|20)px' \
  | grep -vP 'margin[-a-z]*:-')
if [ -z "$RESULT" ]; then
  echo "  ✓ Sin issues"
else
  echo "$RESULT" | sort | uniq -c | sort -rn | sed 's/^/  ✗ /'
  PASS=false
fi
echo ""

# ── Border-radius ────────────────────────────────────────────────────────────
# Excepción: 2px (ajustes ópticos de micro-elementos)
echo "▸ Border-radius:"
RESULT=$(grep -oP "border-radius:[0-9]+px$TERM" "$FILE" \
  | grep -vP 'border-radius:[12]px')
if [ -z "$RESULT" ]; then
  echo "  ✓ Sin issues"
else
  echo "$RESULT" | sort | uniq -c | sort -rn | sed 's/^/  ✗ /'
  PASS=false
fi
echo ""


# ── Patrones prohibidos — reglas canónicas de imagen ──────────────────────────
echo "▸ onerror (debe ser this.remove(), nunca this.style.opacity=0):"
RESULT=$(grep -n 'onerror="this.style.opacity=0"' "$FILE")
if [ -z "$RESULT" ]; then
  echo "  ✓ Sin issues"
else
  echo "$RESULT" | sed 's/^/  ✗ /'
  PASS=false
fi
echo ""

echo "▸ loading=\"lazy\" (toda <img> debe tenerlo):"
RESULT=$(grep -oP '<img(?![^>]*loading=)[^>]*>' "$FILE" | head -5)
if [ -z "$RESULT" ]; then
  echo "  ✓ Sin issues"
else
  echo "$RESULT" | sed 's/^/  ✗ /'
  PASS=false
fi
echo ""

# ── programa-list: no overflow-y sin height constraint ────────────────────────
# Si overflow-y:auto aparece en .programa-list sin height/max-height,
# el scroll en lista mode queda roto en iOS Safari.
echo "▸ programa-list scroll (no overflow-y:auto sin height):"
RESULT=$(grep -oP "\.programa-list\{[^}]*overflow-y:auto[^}]*\}" "$FILE" | grep -v "height:")
if [ -z "$RESULT" ]; then
  echo "  ✓ Sin issues"
else
  echo "  ✗ .programa-list tiene overflow-y:auto — verificar que tiene height constraint"
  echo "$RESULT" | sed 's/^/  /'
  PASS=false
fi
echo ""

# ── Resultado ────────────────────────────────────────────────────────────────
if [ "$PASS" = true ]; then
  echo "✅ Todo OK — sistema de tokens consistente."
else
  echo "⚠️  Nuevos issues. Revisar o documentar como excepción en :root."
fi
echo ""
