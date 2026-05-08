# Otrofestiv — Festival Data Schema

Documento normativo. Toda discrepancia entre este archivo y el código es un bug.
Última actualización: 2026-05-07 — commit 1f6f290

---

## Estructura raíz del JSON

```json
{
  "_status": "string — descripción del estado del archivo",
  "_source": "string — URL o descripción de la fuente",
  "_extracted": "string — fecha de extracción ISO",
  "_total": "number — total de films",
  "config": null,
  "transport": "string — 'transit' | 'driving' | 'walking'",
  "venues": { ... },
  "posters": { ... },
  "customPosters": { ... },
  "lbSlugs": { ... },
  "prioLimit": 5,
  "films": [ ... ]
}
```

**Nota formato:** Los festivales desde Jardín 2026 no incluyen `config{}` en el JSON — la configuración vive en `FESTIVAL_CONFIG` de `index.html`. Los festivales legacy (FICCI 65, Cinemancia 2025) sí incluyen `config{}`.

---

## Venues

```json
"venues": {
  "Nombre completo del venue": {
    "short": "Nombre corto para el card (≤ 20 chars)",
    "address": "Dirección completa",
    "lat": 0.0,
    "lng": 0.0
  }
}
```

**Reglas:**
- La clave ES el nombre completo — sin abreviaciones
- `short` es lo que ve el usuario en el card
- Coordenadas requeridas para la vista de mapa
- Los nombres de venue en `film.venue` y `film.screenings[].venue` deben ser claves exactas de este objeto

---

## Films

```json
{
  "title": "string — requerido",
  "slug": "string — requerido para Tribeca/festivales con URL propia",
  "section": "string — requerido",
  "type": "string — 'film' | 'event' | 'short'",
  "filmType": "string — descripción textual del tipo (de la fuente)",
  "director": "string",
  "duration": "number — minutos",
  "country": "string",
  "language": "string",
  "premiere": "string — 'World Premiere' | 'International Premiere' | ...",
  "synopsis": "string",
  "poster": "string — URL completa (https://...) o path TMDB (/path.jpg)",
  "posterPosition": "string — 'center' | 'top' | 'bottom' (default: 'center')",
  "genre": "string",
  "year": "number",
  "flags": "string — emojis de banderas de países",
  "day": "string — KEY del dayKeys del festival (REQUERIDO para filtrado)",
  "date": "string — ISO date '2026-06-03' (requerido si screenings[] existe)",
  "time": "string — '10:30 AM' formato 12h",
  "venue": "string — debe ser clave exacta de venues{}",
  "screenings": [ ... ]
}
```

### Campo `day` — regla crítica

`day` debe ser una clave exacta de `FESTIVAL_CONFIG[id].dayKeys`.

- **Formato legacy** (FICCI, AFF): `day` = key legible, e.g. `"MAR 21"`, `"VIE 24"`
- **Formato ISO** (Tribeca, Jardín): `day` = ISO date, e.g. `"2026-06-03"`

Cuando el film tiene `screenings[]`, el campo `day` del film raíz se toma del primer screening.

**El validator falla si `day` no está en `dayKeys`.**

---

## Screenings (array por función)

Usado cuando un film tiene múltiples funciones en días/horarios/venues distintos.

```json
"screenings": [
  {
    "date": "string — ISO date '2026-06-03' (requerido)",
    "day": "string — KEY del dayKeys (opcional, se deriva de date si falta)",
    "time": "string — '10:30 AM'",
    "venue": "string — clave exacta de venues{}"
  }
]
```

**Regla de explosión:** el sistema convierte `screenings[]` en objetos film planos usando:
```javascript
day: s.day || s.date   // ← CRÍTICO: siempre usar ambos por compatibilidad
date: s.date || s.day
```

**Si solo existe `date` (sin `day`), el sistema lo normaliza automáticamente.**
El validator debe advertir si ninguno de los dos existe.

---

## FESTIVAL_CONFIG en index.html

Campos requeridos por festival:

```javascript
{
  name: 'Nombre completo',
  shortName: 'ABREVIACIÓN',
  city: 'Ciudad',
  dates: 'FEB 3–14',        // ES
  dates_en: 'FEB 3–14',     // EN
  year: 2026,
  timezoneOffset: '-05:00',
  storageKey: 'id_',
  festivalEndStr: '2026-02-14T23:59:00',
  festivalDates: { dayKey: isoDate },
  days: [{ k: dayKey, d: dayNumber, lbl: 'LUN' }],
  dayKeys: ['key1', 'key2', ...],
  dayShort: { dayKey: 'LUN 3' },
  dayShort_en: { dayKey: 'MON 3' },
  dayLong: { dayKey: 'Lunes 3 de febrero' },
  eventPosterLabel: ['LABEL1', 'LABEL2'],
  films: null,
  posters: null,
  lbSlugs: {}
}
```

**`dayKeys` deben coincidir exactamente con los valores de `film.day` en el JSON.**

---

## i18n — Reglas

- Toda string visible al usuario debe usar `t('key')`
- **Prohibido:** strings hardcodeadas en ES o EN dentro de templates HTML en `index.html`
- Excepción: nombres propios, nombres de festival, títulos de film
- Toda clave nueva debe añadirse a AMBOS archivos (`es.json` y `en.json`) en el mismo commit
- El validator compara keys de `en.json` vs `es.json` — deben ser idénticas

---

## Pre-push checklist (obligatorio para cambios en index.html)

```
[ ] node scripts/validate-festivals.js → 0 errores
[ ] Diff review completo — no solo el fragmento modificado
[ ] Smoke test en browser:
    [ ] Splash carga con festival correcto como default
    [ ] Grilla Programa muestra films y posters
    [ ] Sheet de un film: día visible (no UNDEFINED), venue, hora
    [ ] Tab Intereses: carga sin error de consola
    [ ] Consola: 0 errores nuevos
[ ] str_replace verificado: leer las líneas modificadas con sed antes de commitear
```

---

## Errores conocidos y su causa raíz

| Error | Causa | Fix |
|---|---|---|
| `SyntaxError: Unexpected token '?'` | `str_replace` eliminó código adyacente | Verificar diff post-reemplazo |
| `renderSbar is not defined` | Función eliminada en refactor, llamada no eliminada | Inventario de funciones antes de borrar |
| `UNDEFINED` en día del sheet | `s.day` undefined en screenings con formato ISO | `s.day \|\| s.date` en la explosión |
| Strings hardcodeadas ES en festival EN | Templates con strings literales en vez de `t()` | Toda string de UI pasa por `t()` |
