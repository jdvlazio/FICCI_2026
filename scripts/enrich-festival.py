#!/usr/bin/env python3
"""
Otrofestiv — TMDB Enricher
Uso: python3 scripts/enrich-festival.py festivals/<id>.json

Enriquece director, género, año, sinopsis para films sin esos datos.
No sobreescribe campos existentes. Requiere TMDB_API_KEY en el entorno
o editar la línea TMDB_KEY abajo.

Requiere: pip install requests
"""
import json, time, requests, sys, os

TMDB_KEY = os.environ.get('TMDB_API_KEY', '')
if not TMDB_KEY:
    print("⚠️  TMDB_API_KEY no definida. Exportala antes de correr:")
    print("   export TMDB_API_KEY=tu_key_de_tmdb")
    print("   Obtené una en: https://www.themoviedb.org/settings/api")
    sys.exit(1)
BASE = 'https://api.themoviedb.org/3'

def tmdb_search(title, year=None):
    params = {'api_key': TMDB_KEY, 'query': title, 'language': 'es-MX'}
    if year:
        params['year'] = year
    r = requests.get(f'{BASE}/search/movie', params=params, timeout=8)
    results = r.json().get('results', [])
    if not results and year:
        del params['year']
        r = requests.get(f'{BASE}/search/movie', params=params, timeout=8)
        results = r.json().get('results', [])
    return results[0] if results else None

def tmdb_details(tmdb_id):
    params = {'api_key': TMDB_KEY, 'language': 'es-MX', 'append_to_response': 'credits'}
    r = requests.get(f'{BASE}/movie/{tmdb_id}', params=params, timeout=8)
    return r.json()

def get_director(credits):
    crew = credits.get('crew', [])
    dirs = [p['name'] for p in crew if p.get('job') == 'Director']
    return dirs[0] if dirs else ''

def get_genres(details):
    genres = details.get('genres', [])
    mapping = {
        'Drama':'Drama','Comedia':'Comedia','Thriller':'Thriller',
        'Terror':'Terror','Acción':'Acción','Romance':'Romance',
        'Documental':'Documental','Animación':'Animación',
        'Ciencia ficción':'Ciencia Ficción','Fantasía':'Fantasía',
        'Misterio':'Misterio','Crimen':'Crimen','Historia':'Historia',
        'Aventura':'Aventura','Familia':'Familia','Música':'Música',
        'Guerra':'Guerra','Western':'Western',
    }
    names = [mapping.get(g['name'], g['name']) for g in genres[:2]]
    return ', '.join(names)

def enrich_film_obj(film):
    """Enriquece un objeto film. Devuelve dict con campos encontrados o None."""
    result = tmdb_search(film.get('title', ''), film.get('year') or None)
    if not result:
        return None
    details = tmdb_details(result['id'])
    director = get_director(details.get('credits', {}))
    genre = get_genres(details)
    year = str(result.get('release_date', '')[:4]) if result.get('release_date') else ''
    synopsis = details.get('overview', '')
    if not synopsis:
        params = {'api_key': TMDB_KEY, 'language': 'en-US', 'append_to_response': 'credits'}
        r2 = requests.get(f'{BASE}/movie/{result["id"]}', params=params, timeout=8)
        synopsis = r2.json().get('overview', '')
    return {'director': director, 'genre': genre, 'year': year, 'synopsis': synopsis}

def apply_enrichment(film, data):
    """Aplica enriquecimiento sin sobreescribir campos existentes."""
    changed = False
    for field in ('director', 'genre', 'year', 'synopsis'):
        if not film.get(field) and data.get(field):
            film[field] = data[field]
            changed = True
    return changed

def enrich_festival(path):
    with open(path, encoding='utf-8') as f:
        data = json.load(f)

    films = data['films']
    enriched = not_found = skipped = 0

    for i, film in enumerate(films):
        if film.get('type') == 'event':
            skipped += 1
            continue

        title = film.get('title', '')
        needs = not all([film.get('director'), film.get('year'), film.get('synopsis')])

        # Check film_list items
        list_needs = any(
            not all([item.get('director'), item.get('year'), item.get('synopsis')])
            for item in film.get('film_list', [])
        )

        if not needs and not list_needs:
            skipped += 1
            continue

        print(f'[{i+1}/{len(films)}] {title[:55]}...', end=' ', flush=True)

        try:
            if needs:
                data_found = enrich_film_obj(film)
                if data_found:
                    apply_enrichment(film, data_found)
                    enriched += 1
                    print(f"✓ {data_found.get('director') or '—'} · {data_found.get('year') or '—'}")
                else:
                    not_found += 1
                    print('✗ no encontrado en TMDB')

            for item in film.get('film_list', []):
                if not all([item.get('director'), item.get('year'), item.get('synopsis')]):
                    try:
                        item_data = enrich_film_obj(item)
                        if item_data:
                            apply_enrichment(item, item_data)
                    except Exception:
                        pass
                    time.sleep(0.2)

        except Exception as e:
            not_found += 1
            print(f'✗ error: {e}')

        time.sleep(0.25)

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f'\n{"─"*50}')
    print(f'✅ Enriquecidos: {enriched}  |  ✗ No encontrados: {not_found}  |  — Saltados: {skipped}')
    print(f'JSON guardado: {path}')

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Uso: python3 scripts/enrich-festival.py festivals/<id>.json')
        sys.exit(1)
    enrich_festival(sys.argv[1])
