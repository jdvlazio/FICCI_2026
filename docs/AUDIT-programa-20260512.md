# AUDIT · Tab Programa
**Versión:** `97d47dd`  
**Fecha:** 2026-05-12  
**Auditor:** —  
**Estado:** `IN PROGRESS`

---

## Metodología

Este documento es un artefacto de release. Se define **antes** de abrir el browser. Cada ítem tiene su resultado final documentado como `PASS`, `FAIL` o `ISSUE` con severidad. Una vez cerrado, el documento es inmutable — los issues se rastrean hacia adelante en commits posteriores.

**Severidades:**
- `critical` — crash / data loss / bloqueo total de flujo
- `high` — comportamiento incorrecto visible, sin workaround
- `medium` — comportamiento incorrecto con workaround o solo en edge case
- `low` — cosmético / inconsistencia menor

---

## 1. Inventario de estados

### 1.1 Variables de estado del tab

| Variable | Valores posibles | Reset en |
|----------|-----------------|----------|
| `activeDay` | `'all'` \| cada `DAY_KEYS[i]` | festival change → `'all'`; filterByVenue → `activeDay` (preserva si no passed) |
| `programaViewMode` | `'grid'` \| `'list'` | festival change → `'grid'`; filterByVenue → `'grid'`; filterBySection → `'grid'`; TODO tab → `'grid'`; day tab → `'list'` |
| `programaSubMode` | `'hoy'` \| `'manana'` | festival change → `'hoy'`; filterByVenue → `'hoy'`; filterBySection → `'hoy'` |
| `activeSec` | `'all'` \| string de sección | day tab click → `'all'`; filterByVenue → `'all'`; setProgramaMode → `'all'` |
| `activeVenue` | `'all'` \| short name de venue | day tab click → `'all'`; filterBySection → `'all'`; setProgramaMode → `'all'` |
| `programaChip` | `'all'` \| chip id | festival change → `'all'`; filterByVenue → `'all'`; setProgramaMode → `'all'` |

### 1.2 Fases temporales (por festival)

| Festival | Período | Fase hoy (2026-05-12) |
|----------|---------|----------------------|
| ficci65 | 2026-04-14 → 2026-04-20 | `terminado` |
| aff2026 | 2026-04-21 → 2026-04-29 | `terminado` |
| tribeca2026 | 2026-06-03 → 2026-06-14 | `pre-festival` |
| cinemancia2025 | 2025-09-11 → 2025-09-20 | `terminado` |

### 1.3 Rutas de render según estado

```
activeDay === 'all'
  programaViewMode === 'grid'  → renderPeliculaView()      [grid de posters]
  programaViewMode === 'list'  → _renderExploreLista()     [lista agrupada por título]

activeDay === <día específico>
  programaViewMode === 'grid'  → renderPeliculaView()      [grid filtrado]
  programaViewMode === 'list'  → renderProgramaList()      [lista cronológica]
```

### 1.4 Tipos de film con render especial

| Tipo | Condición | Render especial |
|------|-----------|----------------|
| Film normal | default | poster + título |
| Evento | `f.type === 'event'` | poster generativo amber |
| Cortos (programa) | `f.is_cortos === true` | poster generativo teal + badge |
| Programa combinado | `f.is_programa && f.film_list.length >= 2` | poster stack (2 imágenes) + badge `+1` |

---

## 2. Inventario de flujos

| ID | Flujo | Descripción |
|----|-------|-------------|
| F-01 | Entrada cold start | App carga → splash → loadFestival → switchMainNav('mnav-cartelera') → showDayView() |
| F-02 | Tab Programa desde otra tab | Click en tab → showDayView() → _renderProgramaContent() |
| F-03 | Click dtab TODO | activeDay='all', programaViewMode='grid', setProgramaView('grid') |
| F-04 | Click dtab día específico | activeDay=day.k, setProgramaView('list'), _renderProgramaContent() |
| F-05 | Toggle grid/list | setProgramaView(opposite), _renderProgramaContent() |
| F-06 | Seleccionar sección | seccionOpen() → click opción → activeSec=sec → _renderProgramaContent() |
| F-07 | Seleccionar venue | lugarOpen() → click opción → filterByVenue() → showDayView() |
| F-08 | Limpiar filtro sección (PAF pill) | _pafClearSec() → activeSec='all' → _renderProgramaContent() |
| F-09 | Limpiar filtro venue (PAF pill) | _pafClearVenue() → activeVenue='all' → _renderProgramaContent() |
| F-10 | openPelSheet desde grid | click .js-open-pel → openPelSheet(title) |
| F-11 | openPelSheet desde lista | click film item → openPelSheet(title) |
| F-12 | Toggle WL desde lista | click corazón → togglePelWL() → re-render |
| F-13 | Cambio de festival | loadFestival(id) → reset completo → showDayView() |
| F-14 | Entrada desde CTA de otra tab | emptyStateHero CTA → switchMainNav('mnav-cartelera') + showDayView() |
| F-15 | filterByDay desde chip en pel-sheet | .pelicula-day click → filterByDay(day) → _renderProgramaContent() |
| F-16 | filterBySection desde pel-sheet | filterBySection(section) → activeDay='all', grid → _renderProgramaContent() |

---

## 3. Matrix de auditoría

### 3.1 Estados base

| ID | Estado | activeDay | viewMode | Festival | Resultado | Severidad | Notas |
|----|--------|-----------|----------|----------|-----------|-----------|-------|
| S-01 | TODO · Grid | `all` | `grid` | ficci65 | `TO TEST` | | |
| S-02 | TODO · List | `all` | `list` | ficci65 | `TO TEST` | | |
| S-03 | Día específico · List | `Jueves` | `list` | ficci65 | `TO TEST` | | |
| S-04 | Día específico · Grid | `Jueves` | `grid` | ficci65 | `TO TEST` | | |
| S-05 | TODO · Grid + sección activa | `all` | `grid` | ficci65 | `TO TEST` | | |
| S-06 | TODO · List + sección activa | `all` | `list` | ficci65 | `TO TEST` | | |
| S-07 | Día · List + sección activa | `Jueves` | `list` | ficci65 | `TO TEST` | | |
| S-08 | TODO · Grid + venue activo | `all` | `grid` | ficci65 | `TO TEST` | | |
| S-09 | Día · List + venue activo | `Jueves` | `list` | ficci65 | `TO TEST` | | |
| S-10 | Día · Grid + venue activo + sección activa | `Jueves` | `grid` | ficci65 | `⚠ ISSUE` | `medium` | Ver I-01: renderPeliculaView no tiene empty state guard |
| S-11 | Festival pre-festival (tribeca2026) | `all` | `grid` | tribeca2026 | `TO TEST` | | |
| S-12 | Festival terminado (ficci65) | `all` | `grid` | ficci65 | `TO TEST` | | screening badges y past state |
| S-13 | Festival terminado · día específico | `Martes` | `list` | ficci65 | `TO TEST` | | todos los items como past |

### 3.2 Flujos

| ID | Flujo | Festival | Resultado | Severidad | Notas |
|----|-------|----------|-----------|-----------|-------|
| F-01 | Cold start → Programa | ficci65 | `TO TEST` | | dtabs poblados, activeDay correcto |
| F-02 | Tab switch desde Intereses | ficci65 | `TO TEST` | | estado previo preservado |
| F-02b | Tab switch desde Mi Plan | ficci65 | `TO TEST` | | estado previo preservado |
| F-03 | Click TODO | ficci65 | `TO TEST` | | activeDay='all', viewMode='grid' |
| F-04a | Click día específico | ficci65 | `TO TEST` | | activeDay cambia, viewMode='list' |
| F-04b | Click día ya activo | ficci65 | `TO TEST` | | sin cambio visual |
| F-05a | Toggle list → grid (activeDay='all') | ficci65 | `TO TEST` | | cambia a renderPeliculaView |
| F-05b | Toggle grid → list (activeDay='all') | ficci65 | `TO TEST` | | cambia a _renderExploreLista |
| F-05c | Toggle list → grid (día específico) | ficci65 | `TO TEST` | | cambia a renderPeliculaView |
| F-06a | Seleccionar sección desde TODO | ficci65 | `TO TEST` | | activeSec se actualiza, PAF pill visible |
| F-06b | Seleccionar sección desde día | ficci65 | `TO TEST` | | activeSec se actualiza |
| F-06c | Cambiar sección desde sección activa | ficci65 | `TO TEST` | | reemplaza, no acumula |
| F-07a | Seleccionar venue desde TODO | ficci65 | `TO TEST` | | filterByVenue: activeDay preservado, viewMode='grid' |
| F-07b | Seleccionar venue desde día | ficci65 | `TO TEST` | | activeDay preservado |
| F-08 | Limpiar sección (PAF pill) | ficci65 | `TO TEST` | | PAF pill desaparece, activeSec='all' |
| F-09 | Limpiar venue (PAF pill) | ficci65 | `TO TEST` | | PAF pill desaparece, activeVenue='all' |
| F-10 | openPelSheet desde grid (film normal) | ficci65 | `TO TEST` | | sheet abre con datos correctos |
| F-10b | openPelSheet desde grid (evento) | ficci65 | `TO TEST` | | sheet tipo evento |
| F-10c | openPelSheet desde grid (is_programa) | cinemancia2025 | `TO TEST` | | _openCombinedFilmSheet |
| F-11 | openPelSheet desde lista | ficci65 | `TO TEST` | | mismo sheet |
| F-12 | Toggle WL desde lista | ficci65 | `TO TEST` | | corazón cambia estado, no crash |
| F-13a | Cambio festival: ficci65 → tribeca2026 | — | `TO TEST` | | dtabs se reconstruyen, FILMS nuevo |
| F-13b | Cambio festival: tribeca2026 → cinemancia2025 | — | `TO TEST` | | dtabs con formato diferente (JUE 11) |
| F-15 | filterByDay desde chip en pel-sheet | ficci65 | `TO TEST` | | cierra sheet, filtra por ese día |
| F-16 | filterBySection desde pel-sheet | ficci65 | `TO TEST` | | activeDay='all', grid, sección activa |

### 3.3 Empty states

| ID | Condición | Vista | Resultado | Severidad | Notas |
|----|-----------|-------|-----------|-----------|-------|
| E-01 | Sección con 0 films en día · List | `list` | `TO TEST` | | debe mostrar "Sin actividades..." |
| E-02 | Venue con 0 films en día · List | `list` | `TO TEST` | | debe mostrar "Sin actividades..." |
| E-03 | Sección + venue sin intersección · List | `list` | `TO TEST` | | debe mostrar "Sin actividades..." |
| E-04 | Sección con 0 films · _renderExploreLista | `list` | `PASS` | — | código: `if(!entries.length)` → `t('filter_sin_peliculas')` ✓ |
| E-05 | Filtro sin resultados · renderPeliculaView | `grid` | `⚠ ISSUE` | `medium` | Ver I-01 |

### 3.4 Tipos especiales de film

| ID | Tipo | Vista | Festival | Resultado | Severidad | Notas |
|----|------|-------|----------|-----------|-----------|-------|
| T-01 | Evento en grid | `grid` | ficci65 | `TO TEST` | | poster generativo amber |
| T-02 | Evento en lista | `list` | ficci65 | `TO TEST` | | render sin crash |
| T-03 | is_cortos en grid | `grid` | cinemancia2025 | `TO TEST` | | poster teal |
| T-04 | is_programa (combinado) en grid | `grid` | cinemancia2025 | `TO TEST` | | poster stack visible |
| T-05 | is_programa en lista | `list` | cinemancia2025 | `TO TEST` | | badge +1, sin crash |

---

## 4. Issues encontrados en análisis de código

### I-01 · `renderPeliculaView` sin empty state guard
**Severidad:** `medium`  
**Estado:** `OPEN`  
**Encontrado:** análisis estático (no requiere browser)

`renderPeliculaView()` no tiene guard para `entries.length === 0`. Cuando el filtro combinado (día + venue, o día + sección) retorna 0 resultados, la función renderiza un div `poster-grid` vacío en lugar de mostrar un mensaje de estado vacío.

Contraste:
- `_renderExploreLista()` — **tiene** guard: `if(!entries.length){ el.innerHTML = t('filter_sin_peliculas') }`
- `renderProgramaList()` — **tiene** guard: `if(!films.length){ el.innerHTML = 'Sin actividades...' }`
- `renderPeliculaView()` — **no tiene** guard → render vacío silencioso

**Condición para reproducir:** festival activo → día específico → filtrar por venue que no tiene films ese día (o sección sin films ese día) → viewMode='grid'.

**Fix:** agregar antes de `grid.innerHTML=...`:
```js
if (!entries.length) {
  grid.innerHTML = `<div class="empty-msg">${t('filter_sin_peliculas')}</div>`;
  return;
}
```

---

## 5. Scope excluido

Los siguientes items están fuera de este audit por scope o por depender de infraestructura externa:

- Búsqueda global (no implementada aún — nav redesign pendiente)
- Mode bar Hoy/Mañana (solo activo durante el festival — ningún festival activo hoy)
- Poster lazy loading / TMDB resolution
- PWA / Service Worker behavior
- Desktop layout (deferred)
- Safari iOS input bugs (deferred)

---

## 6. Cierre

**Criterio de cierre:** todos los ítems `TO TEST` convertidos a `PASS`, `FAIL` o `ISSUE`.  
**Issues bloqueantes para release:** cualquier `critical` o `high` abierto.  
**Issues no bloqueantes:** `medium` y `low` — se documentan y se abren como trabajo futuro.

Una vez cerrado, este archivo no se modifica. Los fixes derivados se rastrean en commits referenciando el ID del issue (e.g., `fix(programa): I-01 empty state en renderPeliculaView`).
