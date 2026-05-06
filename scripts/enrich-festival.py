#!/usr/bin/env python3
"""
Otrofestiv — TMDB + Letterboxd Enricher
Uso: python3 scripts/enrich-festival.py festivals/<id>.json

Enriquece todos los campos de cada film en dos fases:

  Fase 1 — TMDB (requiere TMDB_API_KEY en el entorno):
    director, genre, year, synopsis, poster

  Fase 2 — Letterboxd (sin API key, vía letterboxd.com/tmdb/{id}/):
    lbSlug → slug canónico del film en Letterboxd

Comportamiento:
  - No sobreescribe campos que ya tienen valor.
  - Enriquece también los items de film_list (cortos y programas combinados).
  - Films con type:'event' se saltan siempre.
  - lbSlug no resuelto se marca con ⚠️ LB PENDIENTE para revisión manual.

Requiere: pip install requests
"""
import json, time, re, requests, sys, os

# ── TMDB ──────────────────────────────────────────────────────────────────────
TMDB_KEY = os.environ.get('TMDB_API_KEY', '')
if not TMDB_KEY:
    print('⚠️  TMDB_API_KEY no definida. Exportala antes de correr:')
    print('   export TMDB_API_KEY=tu_key_de_tmdb')
    print('   Obtené una en: https://www.themoviedb.org/settings/api')
    sys.exit(1)

TMDB_BASE = 'https://api.themoviedb.org/3'
TMDB_IMG  = 'https://image.tmdb.org/t/p/w185'

LB_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'en-US,en;q=0.9',
}

# ── TMDB functions ─────────────────────────────────────────────────────────────
def tmdb_search(title, year=None):
    params = {'api_key': TMDB_KEY, 'query': title, 'language': 'es-MX'}
    if year:
        params['year'] = year
    r = requests.get(f'{TMDB_BASE}/search/movie', params=params, timeout=8)
    results = r.json().get('results', [])
    if not results and year:
        del params['year']
        r = requests.get(f'{TMDB_BASE}/search/movie', params=params, timeout=8)
        results = r.json().get('results', [])
    return results[0] if results else None

def tmdb_details(tmdb_id):
    params = {'api_key': TMDB_KEY, 'language': 'es-MX', 'append_to_response': 'credits'}
    r = requests.get(f'{TMDB_BASE}/movie/{tmdb_id}', params=params, timeout=8)
    return r.json()

def get_director(credits):
    crew = credits.get('crew', [])
    dirs = [p['name'] for p in crew if p.get('job') == 'Director']
    return dirs[0] if dirs else ''

def get_genres(details):
    genres = details.get('genres', [])
    mapping = {
        'Drama': 'Drama', 'Comedia': 'Comedia', 'Thriller': 'Thriller',
        'Terror': 'Terror', 'Acción': 'Acción', 'Romance': 'Romance',
        'Documental': 'Documental', 'Animación': 'Animación',
        'Ciencia ficción': 'Ciencia Ficción', 'Fantasía': 'Fantasía',
        'Misterio': 'Misterio', 'Crimen': 'Crimen', 'Historia': 'Historia',
        'Aventura': 'Aventura', 'Familia': 'Familia', 'Música': 'Música',
        'Guerra': 'Guerra', 'Western': 'Western',
    }
    names = [mapping.get(g['name'], g['name']) for g in genres[:2]]
    return ', '.join(names)

def is_likely_english(text):
    if not text:
        return False
    t = text.lower()
    en = sum(t.count(m) for m in [' the ',' and ',' of the ',' in the ',' is ',' are ',' was ',' were ',' his ',' her '])
    es = sum(t.count(m) for m in [' la ',' el ',' los ',' las ',' una ',' que ',' de ',' en ',' se ',' del '])
    return en > es + 2

# ── Letterboxd slug resolution ─────────────────────────────────────────────────
def get_lb_slug(tmdb_id):
    """
    Resuelve el slug de Letterboxd a partir del TMDB ID.
    Fetcha letterboxd.com/tmdb/{id}/ y extrae el slug del og:url en el HTML.
    Devuelve el slug (str) o None si el film no está en Letterboxd.
    """
    if not tmdb_id:
        return None
    url = f'https://letterboxd.com/tmdb/{tmdb_id}/'
    try:
        r = requests.get(url, headers=LB_HEADERS, timeout=10, allow_redirects=True)
        if r.status_code != 200:
            return None
        # og:url es la fuente canónica — siempre presente en páginas de film
        m = re.search(
            r'<meta\s+property="og:url"\s+content="https://letterboxd\.com/film/([^/"]+)/"',
            r.text
        )
        if m:
            return m.group(1)
        # Fallback: canonical link
        m = re.search(
            r'<link\s+rel="canonical"\s+href="https://letterboxd\.com/film/([^/"]+)/"',
            r.text
        )
        if m:
            return m.group(1)
        return None
    except Exception:
        return None

# ── Film enrichment ────────────────────────────────────────────────────────────
def enrich_film_obj(film):
    """Fase 1: TMDB. Devuelve dict con campos + _tmdb_id, o None si no se encuentra."""
    title_en = film.get('title_en') or film.get('title', '')
    result = tmdb_search(title_en, film.get('year') or None)
    if not result:
        return None
    tmdb_id = result['id']
    details = tmdb_details(tmdb_id)
    director = get_director(details.get('credits', {}))
    genre = get_genres(details)
    year = result.get('release_date', '')[:4] or ''
    synopsis = details.get('overview', '')
    if not synopsis:
        params = {'api_key': TMDB_KEY, 'language': 'en-US', 'append_to_response': 'credits'}
        r2 = requests.get(f'{TMDB_BASE}/movie/{tmdb_id}', params=params, timeout=8)
        synopsis = r2.json().get('overview', '')
    poster_path = result.get('poster_path', '')
    poster = (TMDB_IMG + poster_path) if poster_path else ''
    return {
        'director': director, 'genre': genre, 'year': year,
        'synopsis': synopsis, 'poster': poster, '_tmdb_id': tmdb_id,
    }

def apply_enrichment(film, data):
    """Aplica campos TMDB sin sobreescribir los existentes."""
    changed = False
    for field in ('director', 'genre', 'year', 'synopsis', 'poster'):
        if not film.get(field) and data.get(field):
            film[field] = data[field]
            changed = True
    return changed

def resolve_lb(film, tmdb_id, stats):
    """Fase 2: Letterboxd. Actualiza film['lbSlug'] en el lugar."""
    if film.get('lbSlug') and film['lbSlug'] != '⚠️ LB PENDIENTE':
        return  # ya resuelto
    time.sleep(0.3)
    slug = get_lb_slug(tmdb_id)
    if slug:
        film['lbSlug'] = slug
        stats['lb'] += 1
        print(f'✓LB:{slug}', end=' ', flush=True)
    else:
        film['lbSlug'] = '⚠️ LB PENDIENTE'
        stats['lb_pending'] += 1
        print('⚠️LB', end=' ', flush=True)

# ── Main ───────────────────────────────────────────────────────────────────────
def enrich_festival(path):
    with open(path, encoding='utf-8') as f:
        data = json.load(f)

    films = data['films']
    stats = {'tmdb': 0, 'lb': 0, 'lb_pending': 0, 'not_found': 0, 'skipped': 0}

    for i, film in enumerate(films):
        if film.get('type') == 'event':
            stats['skipped'] += 1
            continue

        title = film.get('title', '')
        needs_tmdb = not all([film.get('director'), film.get('year'), film.get('synopsis')])
        needs_lb   = not film.get('lbSlug') or film.get('lbSlug') == '⚠️ LB PENDIENTE'
        list_items = [item for item in film.get('film_list', [])
                      if not all([item.get('director'), item.get('year'), item.get('synopsis')])
                      or not item.get('lbSlug') or item.get('lbSlug') == '⚠️ LB PENDIENTE']

        if not needs_tmdb and not needs_lb and not list_items:
            stats['skipped'] += 1
            continue

        print(f'[{i+1}/{len(films)}] {title[:48]}', end=' ', flush=True)

        tmdb_id = None

        # Fase 1 — TMDB
        if needs_tmdb:
            try:
                found = enrich_film_obj(film)
                if found:
                    tmdb_id = found.pop('_tmdb_id', None)
                    apply_enrichment(film, found)
                    stats['tmdb'] += 1
                    lang = ' ⚠️INGLÉS' if is_likely_english(found.get('synopsis', '')) else ''
                    print(f'✓TMDB:{found.get("director","—")}·{found.get("year","—")}{lang}', end=' ', flush=True)
                else:
                    stats['not_found'] += 1
                    print('✗TMDB', end=' ', flush=True)
            except Exception as e:
                stats['not_found'] += 1
                print(f'✗TMDB({e})', end=' ', flush=True)
        elif needs_lb:
            # Necesita LB pero ya tiene TMDB — buscar solo el ID
            try:
                result = tmdb_search(
                    film.get('title_en') or film.get('title', ''),
                    film.get('year') or None
                )
                if result:
                    tmdb_id = result['id']
            except Exception:
                pass

        # Fase 2 — Letterboxd
        if needs_lb:
            resolve_lb(film, tmdb_id, stats)

        # film_list items
        for item in film.get('film_list', []):
            item_needs_tmdb = not all([item.get('director'), item.get('year'), item.get('synopsis')])
            item_needs_lb   = not item.get('lbSlug') or item.get('lbSlug') == '⚠️ LB PENDIENTE'
            if not item_needs_tmdb and not item_needs_lb:
                continue
            item_tmdb_id = None
            try:
                item_data = enrich_film_obj(item)
                if item_data:
                    item_tmdb_id = item_data.pop('_tmdb_id', None)
                    apply_enrichment(item, item_data)
            except Exception:
                pass
            if item_needs_lb:
                resolve_lb(item, item_tmdb_id, stats)
            time.sleep(0.2)

        print()
        time.sleep(0.25)

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f'\n{"─"*55}')
    print(f'✓ TMDB: {stats["tmdb"]}  |  ✓ LB: {stats["lb"]}  |  ⚠️ LB pendiente: {stats["lb_pending"]}  |  ✗ No encontrados: {stats["not_found"]}  |  — Saltados: {stats["skipped"]}')
    if stats['lb_pending']:
        pending = []
        for f in films:
            if f.get('lbSlug') == '⚠️ LB PENDIENTE':
                pending.append(f['title'])
            for item in f.get('film_list', []):
                if item.get('lbSlug') == '⚠️ LB PENDIENTE':
                    pending.append(f'  {item["title"]} (en {f["title"]})')
        print(f'\nFilms sin slug LB — completar manualmente en el JSON:')
        for t in pending:
            print(f'  · {t}')
    print(f'\nJSON guardado: {path}')

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Uso: python3 scripts/enrich-festival.py festivals/<id>.json')
        sys.exit(1)
    enrich_festival(sys.argv[1])
