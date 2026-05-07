#!/usr/bin/env python3
"""
sync-i18n.py — Sincroniza i18n/es.json + i18n/en.json → _I18N inline en index.html

Los JSON son la ÚNICA fuente de verdad para traducciones.
Este script regenera el bloque _I18N en index.html desde los JSON.
Ejecutar después de cualquier cambio en i18n/*.json antes de commit.

Uso: python3 scripts/sync-i18n.py
"""
import json, re, sys, os

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

es = json.load(open('i18n/es.json', encoding='utf-8'))
en = json.load(open('i18n/en.json', encoding='utf-8'))

if set(es) != set(en):
    missing_en = sorted(set(es) - set(en))
    missing_es = sorted(set(en) - set(es))
    if missing_en: print(f'⚠ Keys en ES sin EN: {missing_en}')
    if missing_es: print(f'⚠ Keys en EN sin ES: {missing_es}')

with open('index.html', encoding='utf-8') as f:
    content = f.read()

# Locate existing _I18N block
i18n_start = content.find('const _I18N')
if i18n_start < 0:
    print('✗ _I18N not found in index.html'); sys.exit(1)
i18n_end = content.find('\n};\n', i18n_start) + 4

es_lines = '\n'.join(f'    "{k}": {json.dumps(v, ensure_ascii=False)},' for k,v in es.items())
en_lines = '\n'.join(f'    "{k}": {json.dumps(v, ensure_ascii=False)},' for k,v in en.items())

new_block = f"""const _I18N = {{
  es: {{
{es_lines}
  }},
  en: {{
{en_lines}
  }}
}};
"""

content = content[:i18n_start] + new_block + content[i18n_end:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print(f'✓ _I18N sincronizado: {len(es)} ES / {len(en)} EN keys')
print(f'  Fuente de verdad: i18n/es.json + i18n/en.json')
