# OTROFESTIV — Documento de Arquitectura
> Referencia canónica para implementación. Leer antes de tocar código.
> Última actualización: MAY 2026 · `index.html` @ commit `6a4d9be` · ~10.150 líneas

---

## 1. ESTRUCTURA DE ARCHIVOS

```
/
├── index.html                  ← App completa (~10.150 líneas, single-file, fuente única)
├── sw.js                       ← Service Worker (actualizar con bump-version.js antes de deploy)
├── manifest.json               ← PWA manifest
├── version.json                ← Build timestamp — sincronizado por bump-version.js
├── tools/enricher.html         ← Herramienta de enriquecimiento TMDB
├── docs/ARQUITECTURA.md        ← Este documento
├── i18n/
│   ├── es.json                 ← Strings en español (fuente de verdad)
│   ├── en.json                 ← Strings en inglés
│   └── strings-reference.json ← Inventario completo con contexto
├── festivals/
│   ├── ficci-65.json           ← FICCI 65 (archivado)
│   ├── aff-2026.json           ← AFF 2026 (archivado)
│   ├── cinemancia-2025.json    ← Cinemancia 2025 (test)
│   └── tribeca-2026.json       ← Tribeca 2026 (draft — no en FESTIVAL_CONFIG aún)
├── pipeline/
│   ├── PROTOCOLO.md            ← Proceso completo para montar un festival
│   ├── festival-template.json  ← Plantilla JSON para festival nuevo
│   └── csv-template.csv        ← Template para organizadores
├── scripts/
│   ├── bump-version.js         ← Actualiza sw.js y version.json — correr antes de cada deploy
│   ├── generate-config.js      ← Genera entrada FESTIVAL_CONFIG
│   ├── validate-festivals.js   ← Validador (corre en CI)
│   ├── enrich-festival.py      ← Enricher TMDB (CLI)
│   └── geocode-venues.py       ← Geocodifica venues via Nominatim
└── assets/
    └── proyeccion-sorpresa.svg ← Poster especial Cinemancia
```

Los datos de cada festival viven en su propio JSON, **no** en `index.html`. Se cargan en `loadFestival(id)` la primera vez y se cachean en `FESTIVAL_CONFIG[id].films`.

---

## 2. DESIGN TOKENS

### Superficies (oscuro, siempre)
| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#0A0A0A` | Fondo de página |
| `--surf` | `#141414` | Superficie principal (headers, navs) |
| `--surf-2` | `#1A1A1A` | Hover, estados activos |
| `--surf-3` | `#1F1F1F` | Placeholder de pósters |
| `--card-a` | `#1E1E1E` | Cards principales |
| `--card-b` | `#232323` | Cards secundarias |
| `--card-p` | `#141414` | Cards en panel |

### Bordes
| Token | Valor | Uso |
|---|---|---|
| `--bdr` | `#2A2A2A` | Chrome estructural (navs, headers) |
| `--bdr-l` | `#1E1E1E` | Separación de contenido (ítems de lista) |

### Color
| Token | Valor | Uso |
|---|---|---|
| `--amber` | `#F59E0B` | CTA primario, badges, acentos |
| `--amber-d` | `#D97706` | Hover de amber |
| `--green` | `#3AAA6E` | Confirmación, "en curso", nueva fecha |
| `--red` | `#E05252` | Error, conflicto |
| `--yellow` | `#E5A020` | Advertencia |
| `--white` | `#F0EDE8` | Texto principal |
| `--gray` | `#888888` | Texto secundario |
| `--gray2` | `#555555` | Texto terciario / deshabilitado |
| `--black` | `#000000` | Texto sobre fondo amber |

### Tipografía
| Token | Valor |
|---|---|
| `--font` | `'Plus Jakarta Sans', sans-serif` |
| `--t-badge` | `8px` |
| `--t-xs` | `9px` |
| `--t-label` | `10px` |
| `--t-sm` | `11px` |
| `--t-caption` | `12px` |
| `--t-base` | `13px` ← body estándar |
| `--t-md` | `16px` |
| `--t-lg` | `20px` |
| `--t-display` | `30px` |
| `--t-icon` | `15px` |

### Pesos
| Token | Valor | Uso |
|---|---|---|
| `--w-thin` | `400` | Raramente usado |
| `--w-regular` | `500` | Body normal |
| `--w-semi` | `600` | Énfasis suave |
| `--w-bold` | `700` | Títulos, labels |
| `--w-display` | `800` | Display, badges |

### Espaciado
| Token | px | Uso |
|---|---|---|
| `--sp-1` | `4px` | Micro-gaps |
| `--sp-2` | `8px` | Gaps entre elementos |
| `--sp-3` | `12px` | Padding componentes pequeños |
| `--sp-4` | `16px` | Padding componentes medianos |
| `--sp-5` | `24px` | Padding secciones |
| `--sp-6` | `32px` | Separación entre secciones |
| `--sp-btn` | `14px` | Padding vertical botones |

### Radios
| Token | Valor | Uso |
|---|---|---|
| `--r-sm` | `4px` | Pósters, chips pequeños |
| `--r-md` | `8px` | Badges, botones |
| `--r` | `11px` | Cards |
| `--r-sheet` | `20px` | Bottom sheets |
| `--r-pill` | `999px` | Pills |

### Transiciones
| Token | Valor | Uso |
|---|---|---|
| `--tr-fast` | `100ms ease` | Feedback inmediato: hover color |
| `--tr-base` | `150ms ease` | Micro-interacción: botones, badges |
| `--tr-smooth` | `200ms ease` | Overlays, opacidades, estados |
| `--tr-enter` | `300ms ease-out` | Entradas al DOM: paneles, drawers |

### Pósters (ratio 2:3)
| Token | Dimensiones | Uso |
|---|---|---|
| `--poster-xs` | `40×60px` | Lista Mi Plan, Planear, Sugerencias |
| `--poster-md` | `72×108px` | Prio strip |
| `--poster-lg` | `96×144px` | Cards de descubrimiento, sheet |

---

## 3. ESTRUCTURA DE DATOS

### Film object (en `films[]` del JSON de festival)
```json
{
  "title": "Belén",
  "title_en": "Belén",
  "country": "Argentina",
  "flags": "🇦🇷",
  "duration": "108 min",
  "day": "MAR 21",
  "date": 21,
  "time": "18:00",
  "venue": "MAMM",
  "section": "🏆 Competencia de Largometrajes",
  "day_order": 0,
  "is_cortos": false,
  "film_list": [],
  "director": "Dolores Fonzi",
  "year": 2025,
  "genre": "Drama",
  "synopsis": "..."
}
```
> `day_order`: índice del día (0 = primer día del festival). `is_cortos`: true si es programa de cortos. `type: 'event'`: talleres/industry days.

### Festival JSON (estructura completa)

> **Formato nuevo (desde Jardín 2026):** `poster` y `lbSlug` van dentro de cada objeto film.
> No crear `posters{}` ni `lbSlugs{}` al nivel raíz — eso es formato legado (FICCI, Cinemancia).

```json
{
  "config": { ... },
  "venues": { "Sala - Ciudad": { "short": "...", "lat": 0, "lng": 0, "city": "..." } },
  "customPosters": { "Título": "url-override" },
  "films": [...],
  "transport": "transit"
}
```

La configuración del festival (nombre, fechas, días, storageKey, etc.) vive en:
- `FESTIVAL_CONFIG` en `index.html` — para carga inicial antes del fetch del JSON
- `config{}` dentro del JSON del festival — generado por `generate-config.js`

Ambas fuentes deben estar sincronizadas. Usar `generate-config.js` para producir la entrada de `FESTIVAL_CONFIG`. **No editar ninguna de las dos a mano.**

### NOTICES (en `index.html`, editable directamente)
```js
const NOTICES = [
  { title: 'Un mundo frágil y maravilloso', festival: 'aff2026', type: 'cancelled' },
  // type: 'rescheduled' → añadir: newDay, newTime, newVenue
];
```

### Globals en runtime (swapeados por `loadFestival()`)
```
FILMS[]              ← array activo de funciones
POSTERS{}            ← title → URL de poster (formato legado)
LB_SLUGS{}           ← title → slug de Letterboxd
FESTIVAL_DATES       ← { "DÍA KEY": "YYYY-MM-DD" }
FESTIVAL_END         ← Date object
FESTIVAL_STORAGE_KEY ← prefijo para localStorage
DAY_KEYS[]           ← orden canónico de días (ej: ["MAR 21", "MIÉ 22"])
DAY_SHORT{}          ← { "MAR 21": "MAR 21" } — label corto para chips de día
DAY_LONG{}           ← { "MAR 21": "Martes 21" } — label largo para headers
TZ_OFFSET            ← offset de timezone del festival (ej: "-05:00", "-04:00")
FESTIVAL_TRANSPORT   ← modo de transporte: "walking" | "transit" | "mixed"
```

---

## 4. SISTEMA i18n

La app soporta español (ES) e inglés (EN). El idioma activo se persiste en `localStorage('otrofestiv_lang')`.

### Funciones principales
```js
t('key')           // devuelve el string en el idioma activo; fallback a ES si no existe EN
setLang('en')      // cambia idioma in-place — muta _lang, actualiza DOM, re-renderiza vista activa
_applyI18nDOM()    // parchea elementos del DOM estático (nav labels, filtros, etc.)
```

### Archivos de strings
```
i18n/es.json                ← fuente de verdad para español
i18n/en.json                ← strings en inglés
i18n/strings-reference.json ← inventario completo con contexto — leer antes de wiring
```

### Cómo conectar un string nuevo
1. Verificar que la key existe en `es.json` y `en.json`
2. Si es en un **template JS** (backtick): reemplazar con `t('key')`
3. Si es en **HTML estático con ID**: añadir a los `ids{}` en `_applyI18nDOM()`
4. Si es en **HTML estático sin ID**: añadir `data-i18n="key"` al elemento
5. **Nunca** añadir `data-i18n` a elementos `<script>` o `<style>` — `_applyI18nDOM` tiene guard, pero la regla es no hacerlo en primer lugar

### Regla de proceso — inamovible
**Toda decisión de traducción** (nueva key, corrección, ajuste de copy EN o ES) requiere discusión semántica y sintáctica con **Content Designer y UX Writer** antes de entrar al código. Sin excepción.

---

## 5. COMPONENTES CSS

### Badges (inline en texto o título)
| Clase | Descripción | Estilo |
|---|---|---|
| `.apertura-badge` | Evento especial / apertura | Fondo amber sólido, texto white, `--t-xs`, `--r-md` |
| `.past-badge` | Función pasada | Solo texto `--gray2` |
| `.notice-badge` | Cancelada / reprogramada | Fondo amber sólido, texto `#0A0A0A`, `--w-display` |
| `.poster-past-badge` | Sobre póster en grid | Overlay oscuro, texto gray |

> **Regla:** Todo badge nuevo → extender este sistema. Nunca estilos inline ad-hoc.

### Bottom Sheet
```
.sheet-overlay          ← overlay oscuro (overlay-60)
.sheet / .av-sheet      ← panel blanco desde abajo, r-sheet arriba
.sheet-handle           ← handle drag (r-handle)
```
Abierta con `openXxxSheet()`, cerrada con `closeXxxSheet()`. El overlay llama al close si se toca fuera.

### Toast
```js
showToast(msg, type='info', duration=2800)  // type: info | warn | error
showActionToast(msg, label, fn, duration)   // con botón de acción
```

### Modales de confirmación
```js
showDestructiveModal(title, body, label, cb)
showActionModal(title, body, label, cb, cancelLabel)
showConflictModal(conflicts, onConfirm)
```

---

## 6. MAPA DE FUNCIONES DE RENDER

### Mi Plan (tab)
| Función | Qué hace |
|---|---|
| `renderAgenda()` | Orquestador principal |
| `renderContextualHeader()` | Panel de fase (próxima función, etc.) |
| `renderNextStrip(schedule)` | Tira de próxima función con countdown |
| `renderUnconfirmed(schedule)` | Check-ins pendientes |
| `renderMiPlanList(schedule)` | Vista lista compacta |
| `renderMiPlanCalendar()` | Vista calendario |

### Programa / Cartelera (tab)
| Función | Qué hace |
|---|---|
| `_renderProgramaContent()` | Orquestador |
| `renderProgramaList()` | Lista cronológica Hoy/Mañana |
| `_renderExploreLista()` | Lista catálogo completo |
| `renderPeliculaView()` | Grid por película |
| `render()` | Grid por horario |
| `renderProgramaChips()` | Chips de categoría |
| `renderNoticesBanner()` | Banner de avisos |

### Planear (tab)
| Función | Qué hace |
|---|---|
| `renderSimPanel()` | Panel de escenarios calculados |
| `renderGapOptions()` | Sugerencias para huecos |
| `renderFilmAlternatives()` | Alternativas para una función |

---

## 7. FLUJO DE DATOS

```
PDF del festival
      ↓
Enrichment via script (director, año, género, sinopsis, poster TMDB, lbSlug Letterboxd)
      ↓
festivals/[id].json  (films[] con poster y lbSlug inline)
      ↓
loadFestival(id)  →  swapea globals FILMS, POSTERS, LB_SLUGS, DAY_KEYS, DAY_SHORT, etc.
      ↓
render functions  →  DOM
```

### Posters — cadena de prioridad
```js
getFilmPoster(f)          // para cualquier film completo
getCortoItemPoster(item)  // para cortos individuales en film_list
```
Nunca llamar `getPosterSrc()`, `makeProgramPoster()` o `makeEventPoster()` directamente.

Prioridad interna:
1. `CUSTOM_POSTERS[title]`
2. `f.poster` (nuevo formato)
3. `POSTERS[title]` (legado)
4. Poster generativo (solo si `is_cortos` o `type === 'event'`)
5. `null` → no render (nunca fondo negro, usar `--surf-2`)

---

## 8. STATE & STORAGE

### Claves de localStorage (prefijadas por festival)
```
{key}_wl        ← watchlist
{key}_watched   ← películas vistas
{key}_av3       ← bloques de no-disponibilidad
{key}_saved     ← agenda guardada { schedule: [...] }
{key}_prio      ← set de priorizadas
{key}_lastslot  ← últimos slots removidos (hasta 5)
```

### Claves de localStorage (globales)
```
otrofestiv_festival   ← ID del festival activo
otrofestiv_lang       ← idioma activo: 'es' | 'en'
otrofestiv_build      ← build version (para invalidación de cache)
```

---

## 9. CONFLICTOS DE HORARIO

Siempre usar `screensConflict(a, b)`. Nunca comparaciones de minutos directas.

---

## 10. REGLAS DE DISEÑO (no negociables)

1. **CTA primario**: fondo amber sólido (`--amber`), texto negro.
2. **Imágenes**: toda `<img>` lleva `loading="lazy"` y `onerror="this.remove()"`.
3. **Inline styles**: prohibidos en templates nuevos. Crear token antes de usar valor raw.
4. **Badges**: clases existentes. Nunca inline ad-hoc.
5. **Nuevo componente**: reutilizar tokens y clases antes de crear nuevos.
6. **Tipografía**: verificar escala de tokens antes de aplicar `font-size`.
7. **Iconografía**: solo Lucide pack. Flags de países y emojis de categoría son la única excepción.
8. **Conflictos**: siempre `screensConflict()`.
9. **Pósters**: siempre `getFilmPoster()` o `getCortoItemPoster()`. `onerror` → `this.remove()`.
10. **Tap targets iOS**: todo elemento interactivo ≥ 44×44pt. Para elementos pequeños usar:
    ```css
    .elemento { position: relative; }
    .elemento::after { content: ''; position: absolute; inset: -Xpx; }
    /* X = (44 - tamaño_visual) / 2   |   Ejemplo: emoji 22px → inset: -11px */
    ```
11. **Vista por modo de navegación** — regla global inamovible:
    - `activeDay === 'all'` (Explorar/TODO) → `programaViewMode = 'grid'`
    - `activeDay !== 'all'` (día específico) → `programaViewMode = 'list'`
    - Se aplica en `loadFestival()`, `filterByVenue()` y `filterBySection()`. El usuario puede cambiar manualmente después; esta regla aplica solo al estado inicial/reset.
12. **Cards** — 4 tipos canónicos (no agregar campos sin pasar por arquitectura):
    - Película: poster + flags + título + dur + sección, funciones + dir + sinopsis + Letterboxd, CTAs
    - Programa de cortos: igual + lista de cortos, sin Letterboxd
    - Corto individual (`openCortoSheet`): igual, solo Intereses + Calificar
    - Evento/taller: sin flags, horario + descripción, sin Letterboxd

---

## 11. AGREGAR UN FESTIVAL NUEVO

Ver protocolo completo en `pipeline/PROTOCOLO.md`.

1. Crear `festivals/[id].json`
2. Correr enrichment: `python3 scripts/enrich-festival.py festivals/[id].json`
3. Generar config: `node scripts/generate-config.js --id [id] ...`
4. Pegar bloque generado en `FESTIVAL_CONFIG` en `index.html`
5. Validar: `node scripts/validate-festivals.js [id]`
6. QA visual P1–P7
7. `node scripts/bump-version.js` → push

---

## 12. TIPOS DE FUNCIÓN — REFERENCIA CANÓNICA

Ver sección completa arriba. Cinco tipos: largometraje individual, largometraje multi-función (recomendado), programa de cortos, programa combinado, evento/taller.

---

## 13. METADATA ESPECIAL DE FUNCIONES

### `has_qa: true`
- Algoritmo suma +30 min para conflictos
- Usar `effectiveDuration(f)` en `screensConflict`, nunca `f.duration` directamente

### `requires_registration: true`
- Badge informativo. No afecta algoritmo.

---

## 14. SISTEMA GLOBAL DE SEDES (VENUES)

Formato de nombre: `"[Nombre sala] - [Ciudad]"` — siempre igual.

### Modo de transporte
```json
{ "transport": "walking" }   // Festival compacto
{ "transport": "transit" }   // Festival en ciudad (default)
```

### Resolución de venue (_resolveVenue)
1. Búsqueda exacta → 2. Búsqueda parcial → 3. Fallback estático → 4. Primer segmento del string

---

## 15. REGLAS TÉCNICAS

### Columnas tiempo/día en listas
Todo label de día/hora que ancle una columna flex debe tener `width` o `min-width` fijo. Validar con `MIÉ` (el día más ancho en Plus Jakarta Sans).

### Transformaciones masivas de código
Nunca regex sobre index.html completo para patrones estructurales. Usar parser para transformaciones de >10 ocurrencias que toquen atributos HTML.

### iOS Safari — propiedades críticas
Verificar en dispositivo físico antes de commitear cambios con: `overflow`, `position:sticky`, `touch-action`, `overscroll-behavior`, `-webkit-*`.

| Propiedad | Comportamiento en iOS Safari |
|---|---|
| `overscroll-behavior:contain` sin height | consume scroll events |
| `position:sticky` dentro de `overflow:auto` sin height | no stickea |
| `AbortSignal.timeout()` | no disponible en Safari < 16 |
| `100vh` | incluye chrome del browser en < 15 (usar `100dvh`) |
| Modificar `aria-label` en `role="dialog"` activo | puede triggear reposicionamiento de foco |
| `data-i18n` en `<script>` o `<style>` | nunca — `_applyI18nDOM` tiene guard pero la regla es no hacerlo |
