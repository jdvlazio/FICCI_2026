#!/usr/bin/env python3
"""
validate.py — Otrofestiv pre-deploy validator
Ejecutar antes de cada git push. Falla con exit(1) si algún check falla.

Checks implementados:
  1. Shadow variable t=  — const t= + t() en mismo scope de función
  2. _SCHED_PURE_FNS     — todas las funciones referenciadas existen en main thread
  3. Worker-local overlap — worker-local fns no duplican _SCHED_PURE_FNS
  4. JSON festival fields — cada festivals/*.json tiene los campos requeridos
  5. FESTIVAL_CONFIG      — cada entrada tiene los campos pre-fetch requeridos
  6. Critical HTML divs   — los 8 divs estructurales existen en el HTML
  7. DOCTYPE position     — el archivo empieza con <!DOCTYPE (sin texto previo)
  8. Dead code            — no hay _CALC_WORKER_SRC en el archivo

Uso:
  python3 validate.py           # valida index.html y festivals/*.json
  python3 validate.py --strict  # falla si hay warnings además de errors
"""

import re, json, os, sys

# ── Config ────────────────────────────────────────────────────────────────────
INDEX_HTML   = 'index.html'
FESTIVALS_DIR = 'festivals/'

# Campos requeridos en cada festivals/*.json (fuente de verdad del festival)
REQUIRED_JSON_FIELDS = [
    'name', 'storageKey', 'festivalEndStr',
    'festivalDates', 'days', 'dayKeys', 'timezoneOffset'
]

# Campos requeridos en FESTIVAL_CONFIG del HTML (bootstrap pre-fetch)
REQUIRED_BOOTSTRAP_FIELDS = [
    'name', 'city', 'dates', 'dates_en', 'year', 'storageKey', 'festivalEndStr'
]

# Divs estructurales críticos
CRITICAL_DIVS = [
    'id="ag-view"',
    'id="hdr-programa"',
    'id="nav-row"',
    'id="hdr-ag"',
    'id="main-nav"',
    'class="topbar"',
    'id="otrofestiv-splash"',
    'id="ag-result"',
]

# ── Helpers ───────────────────────────────────────────────────────────────────
errors   = []
warnings = []
passed   = []

def fail(check, msg):
    errors.append(f'  ✗ [{check}] {msg}')

def warn(check, msg):
    warnings.append(f'  ⚠ [{check}] {msg}')

def ok(check, msg):
    passed.append(f'  ✓ [{check}] {msg}')

# ── Load files ────────────────────────────────────────────────────────────────
if not os.path.exists(INDEX_HTML):
    print(f'ERROR: {INDEX_HTML} not found')
    sys.exit(1)

content = open(INDEX_HTML, encoding='utf-8').read()
script_start = content.find('<script>')
script_end   = content.rfind('</script>')
if script_start == -1 or script_end == -1:
    print('ERROR: could not find <script> tags in index.html')
    sys.exit(1)
script = content[script_start:script_end]

# ── CHECK 1: Shadow variable t= ───────────────────────────────────────────────
# Detecta funciones donde una variable local llamada `t` (o arrow param `t=>`)
# pisa la función global t() de i18n — causó 3 bugs esta semana.
check = 'shadow-t'
func_matches = list(re.finditer(r'\nfunction (\w+)\s*\(', script))
shadow_found = []

for i, m in enumerate(func_matches):
    fn_name = m.group(1)
    start   = m.start()
    end     = func_matches[i+1].start() if i+1 < len(func_matches) else len(script)
    body    = script[start:end]

    # Arrow callback con t como param + t() llamado dentro del mismo bloque
    for arrow_m in re.finditer(r'(?:[.(,\s])\bt\b\s*=>\s*\{', body):
        # Extraer solo el cuerpo del bloque { } del callback
        brace_start = body.find('{', arrow_m.end()-1)
        if brace_start == -1: continue
        depth, i = 1, brace_start + 1
        while i < len(body) and depth > 0:
            if body[i] == '{': depth += 1
            elif body[i] == '}': depth -= 1
            i += 1
        cb_text = body[brace_start:i]
        if re.search(r"\bt\s*\('[^']*'\)", cb_text):
            shadow_found.append(f'{fn_name}() — arrow param t=> con t() en callback')

    # Destructuring ({t,...})=> en callbacks de array — {t,f} sombrea t()
    # Solo detecta cuando es parámetro de arrow function: ({t,...})=>
    for destr_m in re.finditer(r'\(\{([^}]{1,40})\}\s*(?:,[^)]*)?\)\s*=>', body):
        params = destr_m.group(1)
        if re.search(r'(?<![:\w])t(?![:\w])', params):
            cb_text = body[destr_m.end():destr_m.end()+500]
            if re.search(r"\bt\('[^']*'\)", cb_text):
                shadow_found.append(f'{fn_name}() — destructuring {{t}} en arrow fn sombrea t() — usar {{t:title}}')

    # const t = ... + t() llamado después
    for decl_m in re.finditer(r'\bconst\s+t\s*=(?!\s*t\()', body):
        if re.search(r"\bt\('[^']*'\)", body[decl_m.end():]):
            shadow_found.append(f'{fn_name}() — const t= con t() en mismo scope')

if shadow_found:
    for s in shadow_found:
        fail(check, s)
    fail(check, 'Convención: usar titleStr como param de callbacks, nunca t=')
else:
    ok(check, '0 shadow variable t= risks en todas las funciones')

# ── CHECK 2: _SCHED_PURE_FNS existen en main thread ──────────────────────────
# Si una función se renombra o elimina del main thread pero sigue en la lista,
# el Worker se construye con un fragmento undefined.
check = 'sched-pure-fns'
sched_start = content.find('const _SCHED_PURE_FNS = [')
if sched_start == -1:
    fail(check, '_SCHED_PURE_FNS no encontrado en index.html')
else:
    sched_end = content.find('];', sched_start)
    sched_block = content[sched_start:sched_end]
    fn_names = re.findall(r"'(\w+)'", sched_block)
    missing_fns = [f for f in fn_names if f'function {f}(' not in content]
    if missing_fns:
        for f in missing_fns:
            fail(check, f"'{f}' en _SCHED_PURE_FNS pero no definida en main thread")
    else:
        ok(check, f'todas las {len(fn_names)} funciones de _SCHED_PURE_FNS existen en main')

# ── CHECK 3: Worker-local no duplica _SCHED_PURE_FNS ─────────────────────────
# Si una función está en ambos lados, el worker-local gana y el main thread
# queda ignorado — exactamente el bug que Sprint 3 resolvió.
check = 'worker-overlap'
mk_pos = content.find('function _mkCalcWorker()')
if mk_pos == -1:
    fail(check, '_mkCalcWorker() no encontrado en index.html')
else:
    mk_end_search = content.find('\n// Worker activo', mk_pos)
    if mk_end_search == -1:
        mk_end_search = mk_pos + 4000
    mk_body = content[mk_pos:mk_end_search]
    worker_local_fns = set(re.findall(r'function (\w+)\s*\(', mk_body))
    if sched_start != -1:
        overlap = worker_local_fns & set(fn_names)
        if overlap:
            for f in overlap:
                fail(check, f"'{f}' definida como worker-local Y en _SCHED_PURE_FNS — ambigüedad")
        else:
            ok(check, f'sin overlap entre worker-local ({len(worker_local_fns)} fns) y _SCHED_PURE_FNS')

# ── CHECK 4: JSON festival fields ─────────────────────────────────────────────
# Cada festivals/*.json debe tener todos los campos de config.
# Añadir festival nuevo sin estos campos rompe el tab de días y el cálculo.
check = 'json-fields'
json_errors = 0
json_ok     = 0
if os.path.isdir(FESTIVALS_DIR):
    for fname in sorted(os.listdir(FESTIVALS_DIR)):
        if not fname.endswith('.json'):
            continue
        fpath = os.path.join(FESTIVALS_DIR, fname)
        try:
            data = json.load(open(fpath, encoding='utf-8'))
        except json.JSONDecodeError as e:
            fail(check, f'{fname}: JSON inválido — {e}')
            json_errors += 1
            continue
        missing = [k for k in REQUIRED_JSON_FIELDS if k not in data]
        if missing:
            fail(check, f'{fname}: faltan campos {missing}')
            json_errors += 1
        else:
            json_ok += 1
    if json_errors == 0:
        ok(check, f'todos los {json_ok} JSONs tienen los campos requeridos')
else:
    warn(check, f'directorio {FESTIVALS_DIR} no encontrado — skip')

# ── CHECK 5: FESTIVAL_CONFIG bootstrap ───────────────────────────────────────
# Cada entrada en FESTIVAL_CONFIG debe tener los campos que el splash necesita
# antes del fetch (name, city, dates, dates_en, year, storageKey, festivalEndStr).
check = 'fc-bootstrap'
fc_start = content.find('const FESTIVAL_CONFIG={')
if fc_start == -1:
    fail(check, 'FESTIVAL_CONFIG no encontrado en index.html')
else:
    fc_end = content.find('};', fc_start) + 2
    fc_block = content[fc_start:fc_end]
    # Extract festival IDs
    fest_ids = re.findall(r"'([a-z0-9]+)':\s*\{", fc_block)
    fc_errors = 0
    for fest_id in fest_ids:
        entry_start = fc_block.find(f"'{fest_id}':")
        entry       = fc_block[entry_start:entry_start+400]
        missing = [k for k in REQUIRED_BOOTSTRAP_FIELDS
                   if k+':' not in entry and k+' :' not in entry]
        if missing:
            fail(check, f"FESTIVAL_CONFIG['{fest_id}']: faltan campos {missing}")
            fc_errors += 1
    if fc_errors == 0:
        ok(check, f'todos los {len(fest_ids)} festivales tienen bootstrap completo')

# ── CHECK 6: Critical HTML divs ───────────────────────────────────────────────
# Si alguno de estos divs desaparece (por un str_replace mal ejecutado),
# la app rompe silenciosamente en iOS Safari.
check = 'html-divs'
div_errors = 0
for div in CRITICAL_DIVS:
    if div not in content:
        fail(check, f'div faltante: {div}')
        div_errors += 1
if div_errors == 0:
    ok(check, f'todos los {len(CRITICAL_DIVS)} divs críticos presentes')

# ── CHECK 7: DOCTYPE position ─────────────────────────────────────────────────
# El archivo debe empezar con <!DOCTYPE. Si hay texto antes, el browser
# lo renderiza como contenido visible — empujó el topbar 115px en producción.
check = 'doctype'
if not content.startswith('<!DOCTYPE'):
    first = repr(content[:80])
    fail(check, f'index.html no empieza con <!DOCTYPE — primeros chars: {first}')
else:
    ok(check, 'archivo empieza correctamente con <!DOCTYPE html>')

# ── CHECK 8: Dead code ────────────────────────────────────────────────────────
# _CALC_WORKER_SRC fue reemplazado en Sprint 3.
# wl-add-sheet y openWLAdd fueron reemplazados por showActionToast.
check = 'dead-code'
dead_items = []
if '_CALC_WORKER_SRC' in content:
    dead_items.append('_CALC_WORKER_SRC (Sprint 3: reemplazado por _mkCalcWorker dinámico)')
if 'id="wl-add-sheet"' in content:
    dead_items.append('id="wl-add-sheet" (reemplazado por showActionToast)')
if 'function openWLAdd' in content:
    dead_items.append('function openWLAdd() (reemplazada por showActionToast)')
if dead_items:
    for item in dead_items:
        warn(check, f'código muerto detectado: {item}')
else:
    ok(check, 'sin código muerto conocido')

# ── CHECK 9: i18n completeness ────────────────────────────────────────────────
# Verifica que todas las keys usadas en t('key') existan en AMBOS diccionarios ES y EN.
check = 'i18n-complete'
try:
    # Extract _I18N block
    i18n_start = content.find('const _I18N = {')
    depth = 0
    end = i18n_start
    for i, ch in enumerate(content[i18n_start:]):
        if ch == '{': depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                end = i18n_start + i + 1
                break
    i18n_block = content[i18n_start:end]

    def _parse_i18n(block):
        import re as _re
        return set(_re.findall(r'"([^"]+)":', block))

    es_m = re.search(r'es:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}', i18n_block, re.DOTALL)
    en_m = re.search(r'en:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}', i18n_block, re.DOTALL)
    es_keys = _parse_i18n(es_m.group(1) if es_m else '')
    en_keys = _parse_i18n(en_m.group(1) if en_m else '')

    # All t('key') calls in the script
    script_part = content[content.find('<script>'):content.rfind('</script>')]
    all_t_calls = set(re.findall(r"t\('([a-z][a-z0-9_]+)'\)", script_part))
    # Filter out non-i18n false positives (CSS selectors, HTML tags, etc.)
    NON_KEYS = {'div','span','button','img','input','p','a','svg','ul','li','err','ok'}
    real_keys = {k for k in all_t_calls if k not in NON_KEYS and len(k) > 3 and '_' in k}

    missing_es = sorted(real_keys - es_keys)
    missing_en = sorted(real_keys - en_keys)
    es_not_en = sorted(es_keys - en_keys)

    if missing_es:
        for k in missing_es:
            fail(check, f"t('{k}') usado en código pero falta en diccionario ES")
    if missing_en:
        for k in missing_en:
            fail(check, f"t('{k}') usado en código pero falta en diccionario EN")
    if es_not_en:
        for k in es_not_en:
            warn(check, f"key '{k}' en ES pero no en EN")
    if not missing_es and not missing_en:
        ok(check, f'todos los t() calls tienen key en ES y EN ({len(real_keys)} keys verificadas)')
except Exception as e:
    warn(check, f'no se pudo verificar i18n: {e}')

# ── JS Syntax (Node.js) ───────────────────────────────────────────────────────
check = 'js-syntax'
try:
    import subprocess, tempfile
    # Extract main script (largest <script> block)
    scripts = re.findall(r'<script[^>]*>(.*?)</script>', content, re.DOTALL)
    main_js = max(scripts, key=len) if scripts else ''
    if main_js:
        with tempfile.NamedTemporaryFile(suffix='.js', mode='w', delete=False, encoding='utf-8') as f:
            f.write(main_js)
            tmppath = f.name
        result = subprocess.run(['node', '--check', tmppath], capture_output=True)
        os.unlink(tmppath)
        if result.returncode != 0:
            err = result.stderr.decode()[:200]
            fail(check, f'error de sintaxis JS: {err}')
        else:
            ok(check, 'sintaxis JS válida (Node.js --check)')
    else:
        warn(check, 'no se encontró bloque <script> para validar')
except FileNotFoundError:
    warn(check, 'Node.js no disponible — skip sintaxis JS')

# ── Report ────────────────────────────────────────────────────────────────────
print()
print('═' * 60)
print('  OTROFESTIV — validate.py')
print('═' * 60)

if passed:
    print(f'\n✓ PASSED ({len(passed)}):')
    for p in passed:
        print(p)

if warnings:
    print(f'\n⚠ WARNINGS ({len(warnings)}):')
    for w in warnings:
        print(w)

if errors:
    print(f'\n✗ ERRORS ({len(errors)}):')
    for e in errors:
        print(e)

print()
print('═' * 60)
total = len(passed) + len(warnings) + len(errors)
print(f'  {len(passed)}/{total} checks passed'
      + (f' · {len(warnings)} warnings' if warnings else '')
      + (f' · {len(errors)} errors' if errors else ''))
print('═' * 60)
print()

strict = '--strict' in sys.argv
if errors or (strict and warnings):
    print('  → PUSH BLOQUEADO\n')
    sys.exit(1)
else:
    print('  → OK para push\n')
    sys.exit(0)
