#!/usr/bin/env python3
"""
translate-synopsis.py — Traduce sinopsis faltantes via Claude API
Uso: python3 scripts/translate-synopsis.py festivals/aff-2026.json
      python3 scripts/translate-synopsis.py festivals/ficci-65.json
      python3 scripts/translate-synopsis.py festivals/cinemancia-2025.json
Requiere: ANTHROPIC_API_KEY en entorno o argumento --key
"""
import json, sys, time, urllib.request, urllib.parse, argparse, os

ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
MODEL         = 'claude-haiku-4-5-20251001'  # rápido y económico para traducción

SYSTEM = """You are a film synopsis translator specializing in Latin American and world cinema. 
Translate the given Spanish film synopsis to natural, engaging English. 
Rules:
- Preserve proper nouns, character names, and place names as-is
- Keep the same tone (dramatic, poetic, factual) as the original
- Do not add or remove information
- Output only the translated text, no preamble or explanation
- Keep it concise — same length as the original"""

def translate(synopsis_es, api_key, festival_name=''):
    payload = {
        'model': MODEL,
        'max_tokens': 400,
        'system': SYSTEM,
        'messages': [{'role': 'user', 'content': f'Translate this film synopsis to English:\n\n{synopsis_es}'}]
    }
    req = urllib.request.Request(
        ANTHROPIC_URL,
        data=json.dumps(payload).encode(),
        headers={
            'Content-Type':       'application/json',
            'x-api-key':          api_key,
            'anthropic-version':  '2023-06-01',
        },
        method='POST'
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.loads(r.read())
    return data['content'][0]['text'].strip()

def run(fest_path, api_key, dry_run=False):
    data  = json.load(open(fest_path, encoding='utf-8'))
    films = data.get('films', [])

    to_translate = [
        f for f in films
        if f.get('synopsis')
        and not f.get('synopsis_en')
        and f.get('type') != 'event'
        and not f.get('is_cortos')
    ]

    print(f"Festival: {fest_path}")
    print(f"Films con synopsis: {sum(1 for f in films if f.get('synopsis'))}")
    print(f"Sin synopsis_en:    {len(to_translate)}")
    print(f"Modo:               {'DRY RUN' if dry_run else 'LIVE'}\n")

    ok = 0; errors = []
    for f in to_translate:
        title = f.get('title', '?')
        try:
            if dry_run:
                print(f"  [DRY] {title[:50]}")
                continue
            synopsis_en = translate(f['synopsis'], api_key)
            f['synopsis_en'] = synopsis_en
            ok += 1
            print(f"  ✓ {title[:45]:45} → {synopsis_en[:70]}…")
            time.sleep(0.3)
        except Exception as e:
            errors.append(title)
            print(f"  ✗ {title[:50]} — {e}")

    if not dry_run and ok > 0:
        with open(fest_path, 'w', encoding='utf-8') as out:
            json.dump(data, out, ensure_ascii=False, indent=2)
        print(f"\n✓ {ok} sinopsis traducidas | {len(errors)} errores")
        print(f"Guardado: {fest_path}")
    elif dry_run:
        print(f"\n[DRY RUN] Habría traducido {len(to_translate)} sinopsis")

    return ok

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('festival', help='Ruta al JSON del festival')
    parser.add_argument('--key',     help='Anthropic API key (o usa env ANTHROPIC_API_KEY)')
    parser.add_argument('--dry-run', action='store_true', help='Solo lista sin traducir')
    args = parser.parse_args()

    api_key = args.key or os.environ.get('ANTHROPIC_API_KEY')
    if not api_key and not args.dry_run:
        print("ERROR: Falta API key. Usa --key o ANTHROPIC_API_KEY env var"); sys.exit(1)

    run(args.festival, api_key, dry_run=args.dry_run)

# ─── FLUJO RECOMENDADO PARA FUTURAS CORRIDAS ────────────────────────
#
# 1. TMDB (automático, para películas con distribución internacional):
#    python3 scripts/enrich-festival.py festivals/jardin-2026.json
#    → Añade synopsis_en donde TMDB tiene overview en inglés
#
# 2. Claude API (para el resto):
#    ANTHROPIC_API_KEY=sk-... python3 scripts/translate-synopsis.py festivals/jardin-2026.json
#    → Traduce sinopsis_es→en via Claude Haiku (rápido y económico)
#
# 3. Manual (para casos especiales o corrección de calidad):
#    Editar directamente el JSON del festival
#
# NOTA: El engine en index.html ya está listo:
#    _lang==='en' && f.synopsis_en ? f.synopsis_en : f.synopsis
#    Fallback silencioso a español si synopsis_en está vacío.
