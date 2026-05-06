#!/usr/bin/env python3
"""
Otrofestiv — Enriquecedor completo desde TMDB
==============================================
Uso: python3 enrich-posters.py festivals/nombre-festival.json [--dry-run]

Reutilizable para cualquier festival. Lee el JSON, busca en TMDB y actualiza:
  - posters (URL imagen)
  - director (primer director acreditado)
  - genre    (primer género en español)
  - year     (año de estreno)
  - synopsis (español primero, inglés fallback)
  - flags    (banderas del país de producción, si el campo country existe)

SISTEMA DE BÚSQUEDA (6 estrategias en cascada):
  1. title + year, es-MX
  2. title + year, en-US
  3. title_en + year, en-US
  4. title (sin año), es-MX
  5. title_en (sin año), en-US
  6. title_en + year, búsqueda en TV (para documentales)

CONFIANZA: verifica coincidencia de año ±2 y similitud de título.
Umbral mínimo de 15 puntos.

REGLAS (no-destructivo):
  - Nunca sobreescribe campos que ya existen en el JSON del film
  - Salta eventos (type='event')
  - Enriquece films regulares Y cortos individuales dentro de film_list
  - customPosters tienen prioridad sobre posters encontrados

PARA FESTIVALES FUTUROS:
  Añadir title_en en el JSON mejora drásticamente el match.
  Películas en idiomas no latinos: title_en es OBLIGATORIO.
"""

import json, sys, time, urllib.request, urllib.parse, re

TMDB_KEY  = '38f24e78b2f13970af3430eb0732f0ac'
TMDB_BASE = 'https://api.themoviedb.org/3'
TMDB_IMG  = 'https://image.tmdb.org/t/p/w342'
DELAY     = 0.25

FLAGS_MAP = {
    'Colombia':'🇨🇴','UK':'🇬🇧','Reino Unido':'🇬🇧','Inglaterra':'🇬🇧',
    'Chile':'🇨🇱','Brasil':'🇧🇷','Bolivia':'🇧🇴','México':'🇲🇽',
    'Guatemala':'🇬🇹','Francia':'🇫🇷','EEUU':'🇺🇸','Estados Unidos':'🇺🇸','USA':'🇺🇸','US':'🇺🇸',
    'Panamá':'🇵🇦','Venezuela':'🇻🇪','Haití':'🇭🇹','España':'🇪🇸',
    'Argentina':'🇦🇷','Uruguay':'🇺🇾','Perú':'🇵🇪','Ecuador':'🇪🇨',
    'Cuba':'🇨🇺','Paraguay':'🇵🇾','Costa Rica':'🇨🇷','Honduras':'🇭🇳',
    'El Salvador':'🇸🇻','Nicaragua':'🇳🇮','Puerto Rico':'🇵🇷','Jamaica':'🇯🇲',
    'Rep. Dominicana':'🇩🇴','Alemania':'🇩🇪','Italia':'🇮🇹','Portugal':'🇵🇹',
    'Suiza':'🇨🇭','Bélgica':'🇧🇪','Países Bajos':'🇳🇱','Suecia':'🇸🇪',
    'Noruega':'🇳🇴','Dinamarca':'🇩🇰','Polonia':'🇵🇱','Austria':'🇦🇹',
    'Grecia':'🇬🇷','Turquía':'🇹🇷','Israel':'🇮🇱','Irán':'🇮🇷',
    'Corea del Sur':'🇰🇷','Japón':'🇯🇵','China':'🇨🇳','Taiwán':'🇹🇼',
    'India':'🇮🇳','Australia':'🇦🇺','Nueva Zelanda':'🇳🇿','Canadá':'🇨🇦',
    'Senegal':'🇸🇳','Palestina':'🇵🇸','Marruecos':'🇲🇦','Nigeria':'🇳🇬',
    'Namibia':'🇳🇦','Sudáfrica':'🇿🇦','Rumania':'🇷🇴','Hungría':'🇭🇺',
    'Finlandia':'🇫🇮','Estonia':'🇪🇪','Eslovaquia':'🇸🇰','Vietnam':'🇻🇳',
    'Kazajistán':'🇰🇿','Kirguistán':'🇰🇬','Georgia':'🇬🇪','Líbano':'🇱🇧',
    'Malasia':'🇲🇾','Indonesia':'🇮🇩','Tailandia':'🇹🇭','Qatar':'🇶🇦',
}

GENRE_MAP = {
    'Action':'Acción','Adventure':'Aventura','Animation':'Animación',
    'Comedy':'Comedia','Crime':'Crimen','Documentary':'Documental',
    'Drama':'Drama','Family':'Familia','Fantasy':'Fantasía',
    'History':'Historia','Horror':'Terror','Music':'Música',
    'Mystery':'Misterio','Romance':'Romance','Science Fiction':'Ciencia ficción',
    'Thriller':'Thriller','War':'Guerra','Western':'Western',
    'Short':'Cortometraje','TV Movie':'Película TV',
}

def normalize(s):
    return re.sub(r'[^a-z0-9]', '', str(s).lower())

def year_close(found, target, tol=2):
    if not target or not found: return True
    try: return abs(int(found) - int(target)) <= tol
    except: return True

def confidence(result, title, year):
    score = 0
    ft = result.get('title') or result.get('name', '')
    fy = (result.get('release_date') or result.get('first_air_date') or '')[:4]
    if normalize(ft) == normalize(title):    score += 40
    elif normalize(title) in normalize(ft) or normalize(ft) in normalize(title): score += 20
    if year and fy == str(year):             score += 30
    elif year_close(fy, year, 2):            score += 10
    if result.get('poster_path'):            score += 10
    if result.get('popularity', 0) > 5:     score += 5
    return score

def tmdb_request(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Otrofestiv/1.0'})
        return json.loads(urllib.request.urlopen(req, timeout=8).read())
    except: return {}

def tmdb_search(query, year=None, lang='es-MX', media='movie'):
    q = urllib.parse.quote(query)
    url = f'{TMDB_BASE}/search/{media}?api_key={TMDB_KEY}&query={q}&language={lang}'
    if year:
        url += f'&year={year}' if media == 'movie' else f'&first_air_date_year={year}'
    return tmdb_request(url).get('results', [])

def tmdb_details(tmdb_id, media='movie', lang='es-MX'):
    url = f'{TMDB_BASE}/{media}/{tmdb_id}?api_key={TMDB_KEY}&language={lang}&append_to_response=credits'
    return tmdb_request(url)

def country_to_flag(country_str):
    """Convierte 'Colombia/Francia/Brasil' → '🇨🇴🇫🇷🇧🇷'"""
    flags = []
    for c in country_str.split('/'):
        c = c.strip()
        if c in FLAGS_MAP and FLAGS_MAP[c] not in flags:
            flags.append(FLAGS_MAP[c])
    return ''.join(flags)

def enrich_film(title, title_en=None, year=None, existing=None):
    """
    Busca el film en TMDB y retorna un dict con los campos enriquecidos.
    Solo incluye campos que no existen en `existing`.
    Retorna (result_dict, tmdb_match_title, tmdb_match_year, score)
    """
    existing = existing or {}
    need_poster   = 'poster' not in existing and title not in (existing.get('_posters_ref') or {})
    need_director = not existing.get('director')
    need_genre    = not existing.get('genre')
    need_year     = not existing.get('year')
    need_synopsis = not existing.get('synopsis')
    need_flags    = not existing.get('flags') and existing.get('country')

    if not any([need_poster, need_director, need_genre, need_year, need_synopsis, need_flags]):
        return None, None, None, 0  # nothing to do

    strategies = [
        (title,    year, 'es-MX', 'movie'),
        (title,    year, 'en-US', 'movie'),
        (title,    None, 'es-MX', 'movie'),
    ]
    if title_en and normalize(title_en) != normalize(title):
        strategies += [
            (title_en, year, 'en-US', 'movie'),
            (title_en, None, 'en-US', 'movie'),
        ]
    strategies.append((title_en or title, year, 'en-US', 'tv'))

    candidates = []
    for query, yr, lang, media in strategies:
        results = tmdb_search(query, yr, lang, media)
        time.sleep(DELAY)
        for r in results:
            score = confidence(r, query, year)
            if score >= 15:
                candidates.append((score, r, media))
        if candidates and max(c[0] for c in candidates) >= 70:
            break

    if not candidates: return None, None, None, 0
    best_score, best, media = max(candidates, key=lambda x: x[0])
    if best_score < 15: return None, None, None, 0

    ft = best.get('title') or best.get('name', '')
    fy = (best.get('release_date') or best.get('first_air_date') or '')[:4]

    enriched = {}

    # Poster
    if need_poster and best.get('poster_path'):
        enriched['poster_url'] = TMDB_IMG + best['poster_path']

    # Year
    if need_year and fy:
        enriched['year'] = fy

    # Flags from country field
    if need_flags:
        flags = country_to_flag(existing.get('country', ''))
        if flags: enriched['flags'] = flags

    # Details (director, genre, synopsis) — one more API call
    if any([need_director, need_genre, need_synopsis]):
        time.sleep(DELAY)
        details_es = tmdb_details(best['id'], media, 'es-MX')

        # Director
        if need_director:
            credits = details_es.get('credits', {})
            crew = credits.get('crew', [])
            directors = [p['name'] for p in crew if p.get('job') == 'Director']
            if directors: enriched['director'] = directors[0]

        # Genre (Spanish)
        if need_genre:
            genres = details_es.get('genres', [])
            if genres:
                g_name = genres[0].get('name', '')
                enriched['genre'] = GENRE_MAP.get(g_name, g_name)

        # Synopsis — Spanish first, English fallback
        if need_synopsis:
            syn_es = details_es.get('overview', '').strip()
            if syn_es:
                enriched['synopsis'] = syn_es
            else:
                time.sleep(DELAY)
                details_en = tmdb_details(best['id'], media, 'en-US')
                syn_en = details_en.get('overview', '').strip()
                if syn_en: enriched['synopsis'] = syn_en

    return enriched, ft, fy, best_score


def main(filepath, dry_run=False):
    print(f"\n{'═'*56}")
    print(f"  Otrofestiv — Enriquecedor TMDB (posters + metadata)")
    print(f"{'═'*56}")

    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    films   = data.get('films', [])
    posters = data.get('posters', {})
    custom  = data.get('customPosters', {})

    # Collect unique films to process (regular + film_list items)
    to_process = []
    seen = set()
    for film in films:
        if film.get('type') == 'event': continue
        if film.get('title') not in seen:
            seen.add(film.get('title'))
            to_process.append(('film', film))
        # Cortos individuales dentro de film_list
        if film.get('film_list'):
            for item in film['film_list']:
                if item.get('title') and item['title'] not in seen:
                    seen.add(item['title'])
                    to_process.append(('corto', item))

    fest_name = data.get('config', {}).get('name', filepath)
    print(f"\n  Festival : {fest_name}")
    print(f"  Títulos  : {len(to_process)} únicos a evaluar")
    print(f"  Dry-run  : {'SÍ' if dry_run else 'NO'}")
    print(f"{'─'*56}\n")

    updated_films, updated_cortos, not_found = 0, 0, []

    for kind, film in to_process:
        title    = film.get('title', '')
        title_en = film.get('title_en') or ''
        year     = film.get('year') or None

        # Pass existing data so we don't overwrite
        existing = {k: film.get(k) for k in ['director','genre','year','synopsis','flags','country']}
        existing['_posters_ref'] = {**posters, **custom}

        # Check if poster already covered
        has_poster = title in posters or title in custom
        if has_poster:
            existing['poster'] = True

        enriched, ft, fy, score = enrich_film(title, title_en, year, existing)

        if not enriched:
            if not has_poster and kind == 'film':
                not_found.append(film)
                print(f"  ✗  {title[:52]}")
            continue

        note_parts = []
        if ft and normalize(ft) != normalize(title): note_parts.append(f"→ '{ft}'")
        if fy and str(fy) != str(year or ''): note_parts.append(fy)
        fields = list(enriched.keys())
        note = f"  [{', '.join(fields)}]" + (f"  {' '.join(note_parts)}" if note_parts else '')
        print(f"  ✓  {title[:42]}{note}")

        if not dry_run:
            # Write poster to top-level posters dict
            if 'poster_url' in enriched:
                posters[title] = enriched.pop('poster_url')
            else:
                enriched.pop('poster_url', None)
            # Write metadata directly onto film object (non-destructive)
            for k, v in enriched.items():
                if v and not film.get(k):
                    film[k] = v

        if kind == 'film': updated_films += 1
        else: updated_cortos += 1

    if not dry_run:
        data['posters'] = posters
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    total = len([x for k,x in to_process if k=='film'])
    covered = sum(1 for _,f in to_process if _.startswith('f') and (f['title'] in posters or f['title'] in custom))

    print(f"\n{'─'*56}")
    print(f"  Films actualizados  : {updated_films}")
    print(f"  Cortos actualizados : {updated_cortos}")
    print(f"  Cobertura posters   : {covered}/{total} ({100*covered//total if total else 0}%)")
    print(f"  Archivo             : {filepath}")
    if not_found:
        print(f"\n  Sin resultado — añadir manualmente o mejorar title_en:")
        for f in not_found:
            en = f' (en: {f["title_en"]})' if f.get('title_en') and f['title_en'] != f['title'] else ''
            print(f"    · {f['title'][:52]}{en}")
    print(f"\n{'═'*56}\n")


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    dry  = '--dry-run' in sys.argv
    if not args:
        print("Uso: python3 enrich-posters.py festivals/nombre-festival.json [--dry-run]")
        sys.exit(1)
    main(args[0], dry_run=dry)
