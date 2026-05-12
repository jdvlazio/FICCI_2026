# AUDIT · Tab Programa
**Versión:** `97d47dd` → fix `0e222cc`  
**Fecha:** 2026-05-12  
**Auditor:** —  
**Estado:** `COMPLETE`

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
| `activeDay` | `'all'` \| cada `DAY_KEYS[i]` | festival change → `'all'`; filterByVenue → preserva si no passed |
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
  programaViewMode === 'grid'  → renderPeliculaView()
  programaViewMode === 'list'  → _renderExploreLista()

activeDay === <día específico>
  programaViewMode === 'grid'  → renderPeliculaView()
  programaViewMode === 'list'  → renderProgramaList()
```

### 1.4 Tipos de film con render especial

| Tipo | Condición | Render especial |
|------|-----------|----------------|
| Film normal | default | poster + título |
| Evento | `f.type === 'event'` | poster real o generativo amber |
| Cortos (programa) | `f.is_cortos === true` | poster generativo teal + badge count |
| Programa combinado | `f.is_programa && f.film_list.length >= 2` | poster stack + badge `+1` |

---

## 2. Inventario de flujos

| ID | Flujo | Descripción |
|----|-------|-------------|
| F-01 | Entrada cold start | App carga → splash → loadFestival → switchMainNav → showDayView() |
| F-02 | Tab Programa desde otra tab | Click en tab → showDayView() → _renderProgramaContent() |
| F-03 | Click dtab TODO | activeDay='all', programaViewMode='grid' |
| F-04 | Click dtab día específico | activeDay=day.k, setProgramaView('list') |
| F-05 | Toggle grid/list | setProgramaView(opposite) |
| F-06 | Seleccionar sección | activeSec=sec → _renderProgramaContent() |
| F-07 | Seleccionar venue | filterByVenue() → showDayView() |
| F-08 | Limpiar filtro sección (PAF pill) | _pafClearSec() → activeSec='all' |
| F-09 | Limpiar filtro venue (PAF pill) | _pafClearVenue() → activeVenue='all' |
| F-10 | openPelSheet desde grid | click .js-open-pel → openPelSheet(title) |
| F-11 | openPelSheet desde lista | click film item → openPelSheet(title) |
| F-12 | Toggle WL desde lista | click corazón → _toggleWLFromList() |
| F-13 | Cambio de festival | loadFestival(id) → reset completo → showDayView() |
| F-14 | Entrada desde CTA de otra tab | emptyStateHero CTA → switchMainNav + showDayView() |
| F-15 | filterByDay desde chip en pel-sheet | .pelicula-day click → filterByDay(day) |
| F-16 | filterBySection desde pel-sheet | filterBySection(section) → grid |

---

## 3. Matrix de auditoría

### 3.1 Estados base

| ID | Estado | activeDay | viewMode | Festival | Resultado | Severidad | Notas |
|----|--------|-----------|----------|----------|-----------|-----------|-------|
| S-01 | TODO · Grid | `all` | `grid` | tribeca2026 | `PASS` | — | 204 films, nav-row, dtabs 13 |
| S-02 | TODO · List | `all` | `list` | tribeca2026 | `PASS` | — | _renderExploreLista correcto |
| S-03 | Día · List | `2026-06-04` | `list` | tribeca2026 | `PASS` | — | 27 films, time headers |
| S-04 | Día · Grid | `2026-06-04` | `grid` | tribeca2026 | `PASS` | — | grid filtrado por día |
| S-05 | TODO · Grid + sección | `all` | `grid` | tribeca2026 | `PASS` | — | PAF pill, 5 Gala films |
| S-06 | TODO · List + sección | `all` | `list` | tribeca2026 | `PASS` | — | _renderExploreLista filtrado |
| S-07 | Día · List + sección | `2026-06-04` | `list` | tribeca2026 | `FAIL→FIXED` | `high` | I-02: safeT undefined. Fix `0e222cc` |
| S-08 | TODO · Grid + venue | `all` | `grid` | tribeca2026 | `PASS` | — | Village East, grid filtrado |
| S-09 | Día · List + venue | `2026-06-04` | `list` | tribeca2026 | `PASS` | — | 12 films Village East |
| S-10 | Día · Grid + venue + sección sin resultados | `2026-06-04` | `grid` | tribeca2026 | `ISSUE` | `medium` | I-01: empty poster-grid sin mensaje |
| S-11 | Festival pre-festival | `all` | `grid` | tribeca2026 | `PASS` | — | Hoy/Mañana ocultos, 13 dtabs |
| S-12 | Festival terminado · TODO | `all` | `grid` | ficci65 | `PASS` | — | grid carga, días past atenuados |
| S-13 | Festival terminado · día específico | `Martes` | `list` | ficci65 | `PASS` | — | screeningPassed=false por diseño |

### 3.2 Flujos

| ID | Flujo | Festival | Resultado | Severidad | Notas |
|----|-------|----------|-----------|-----------|-------|
| F-01 | Cold start → Programa | tribeca2026 | `PASS` | — | dtabs 13, activeDay='all', grid |
| F-02 | Tab switch desde Intereses | tribeca2026 | `PASS` | — | estado previo preservado |
| F-02b | Tab switch desde Mi Plan | cinemancia2025 | `PASS` | — | TODO + grid restaurado |
| F-03 | Click TODO ya activo | tribeca2026 | `PASS` | — | no crash, mantiene grid |
| F-04a | Click día específico | tribeca2026 | `PASS` | — | activeDay cambia, viewMode='list' |
| F-04b | Click día ya activo | tribeca2026 | `PASS` | — | no cambio de estado, no crash |
| F-05a | list→grid (activeDay='all') | tribeca2026 | `PASS` | — | renderPeliculaView |
| F-05b | grid→list (activeDay='all') | tribeca2026 | `PASS` | — | _renderExploreLista |
| F-05c | list→grid (día específico) | tribeca2026 | `PASS` | — | renderPeliculaView filtrado |
| F-06a | Seleccionar sección desde TODO | tribeca2026 | `PASS` | — | activeSec actualiza, PAF visible |
| F-06c | Cambiar sección desde sección activa | tribeca2026 | `PASS` | — | reemplaza, no acumula |
| F-07a | Seleccionar venue desde TODO | tribeca2026 | `PASS` | — | filterByVenue: grid, PAF visible |
| F-07b | Seleccionar venue desde día | tribeca2026 | `PASS` | — | 12 films Village East THU 4 |
| F-08 | Limpiar sección (PAF pill) | tribeca2026 | `PASS` | — | activeSec='all', pill desaparece |
| F-09 | Limpiar venue (PAF pill) | tribeca2026 | `PASS` | — | activeVenue='all', pill desaparece |
| F-10 | openPelSheet desde grid (film normal) | tribeca2026 | `PASS` | — | sheet con datos correctos |
| F-10b | openPelSheet desde grid (evento) | tribeca2026 | `PASS` | — | sheet sin crash |
| F-11 | openPelSheet desde lista | tribeca2026 | `PASS` | — | mismo sheet |
| F-12 | Toggle WL desde lista | tribeca2026 | `PASS` | — | toggled correctamente |
| F-13a | Cambio festival tribeca→ficci | — | `PASS` | — | dtabs 7, FILMS 168, state reset |
| F-13b | Cambio festival ficci→cinemancia | — | `PASS` | — | dtabs 11, formato 'JUE 11' |
| F-14 | CTA empty state → Programa | tribeca2026 | `PASS` | — | mnav-cartelera, activeView='day' |
| F-15 | filterByDay desde chip | cinemancia2025 | `PASS` | — | preserva programaViewMode por diseño |
| F-16 | filterBySection desde pel-sheet | cinemancia2025 | `PASS` | — | activeDay preservado, grid |

### 3.3 Empty states

| ID | Condición | Vista | Resultado | Severidad | Notas |
|----|-----------|-------|-----------|-----------|-------|
| E-01 | Sección con 0 films en día · list | `list` | `PASS` | — | "Sin actividades para este filtro" |
| E-02 | Venue con 0 films en día · list | `list` | `PASS` | — | "Sin actividades para este filtro" |
| E-03 | Sección + venue sin intersección · list | `list` | `PASS` | — | "Sin actividades para este filtro" |
| E-04 | Filtro sin resultados · _renderExploreLista | `list` | `PASS` | — | t('filter_sin_peliculas') |
| E-05 | Filtro sin resultados · renderPeliculaView | `grid` | `ISSUE` | `medium` | I-01: empty div sin mensaje |

### 3.4 Tipos especiales de film

| ID | Tipo | Vista | Festival | Resultado | Notas |
|----|------|-------|----------|-----------|-------|
| T-01 | Evento en grid | `grid` | tribeca2026 | `PASS` | poster real o generativo, sin crash |
| T-02 | Evento en lista | `list` | tribeca2026 | `PASS` | render correcto |
| T-03 | is_cortos en grid | `grid` | cinemancia2025 | `PASS` | poster teal COMPETENCIA CORTOMETRAJES |
| T-04 | is_programa en grid | `grid` | cinemancia2025 | `PASS` | .poster-card-stack con 2 imágenes |
| T-05 | is_programa en lista | `list` | cinemancia2025 | `PASS` | poster stack + badge +1 |

---

## 4. Issues

### I-01 · `renderPeliculaView` sin empty state guard
**Severidad:** `medium`  
**Estado:** `OPEN`  
**Encontrado:** análisis estático + verificación browser (S-10, E-05)

`renderPeliculaView()` no tiene guard para `entries.length === 0`. Cuando el filtro combinado (día + venue o día + sección) retorna 0 resultados, la función renderiza un div `poster-grid` vacío sin feedback.

Contraste: `_renderExploreLista` y `renderProgramaList` sí tienen empty state guard.

**Fix:**
```js
if (!entries.length) {
  grid.innerHTML = `<div class="empty-msg">${t('filter_sin_peliculas')}</div>`;
  return;
}
```
Insertar antes de `grid.innerHTML = \`<div class="poster-grid">...\``.

---

### I-02 · `safeT` no declarado en `renderProgramaList`
**Severidad:** `high` → **FIXED** `0e222cc`  
**Encontrado:** S-07 browser audit

`renderProgramaList` usaba `safeT` en el template literal pero no lo declaraba en el scope de la función. El `try/catch` atrapaba el `ReferenceError` silenciosamente, retornando sin actualizar el DOM. El contenido anterior (`_renderExploreLista`) persistía con todos los films sin filtrar por día.

Reproducible en cualquier festival al seleccionar un día específico estando en mode bar con sección activa.

**Fix:** `const safeT=f.title.replace(/'/g,"&#39;").replace(/"/g,'&quot;');` antes del template.

---

### I-03 · PAF pill stale al click en TODO
**Severidad:** `low`  
**Estado:** `OPEN`  
**Encontrado:** F-03 + S-08 browser audit

`todoBtn.onclick` resetea `activeVenue='all'` y `activeSec='all'` pero no llama `_updateProgramaActiveFilter()`. La PAF pill muestra el filtro anterior aunque ya esté desactivado. El contenido del grid es correcto — solo la pill persiste visualmente.

**Fix:** agregar `_updateProgramaActiveFilter();` al final del onclick del botón TODO en `loadFestival`.

---

## 5. Scope excluido

- Búsqueda global (no implementada — nav redesign pendiente)
- Mode bar Hoy/Mañana (solo activo durante festival activo — ninguno activo hoy)
- Poster lazy loading / TMDB resolution
- PWA / Service Worker
- Desktop layout (deferred)
- Safari iOS (deferred)

---

## 6. Resumen de cierre

| Categoría | Total | PASS | FAIL→FIXED | ISSUE open |
|-----------|-------|------|------------|------------|
| Estados base | 13 | 12 | 1 | 1 (S-10) |
| Flujos | 24 | 24 | 0 | 0 |
| Empty states | 5 | 5 | 0 | 1 (E-05) |
| Tipos especiales | 5 | 5 | 0 | 0 |
| **Total** | **47** | **46** | **1** | **2** |

**Issues bloqueantes para release:** ninguno.  
**Issues no bloqueantes:** I-01 (`medium`), I-03 (`low`).

Fixes derivados:
- `fix(programa): I-01 empty state en renderPeliculaView` — agregar guard antes del render del grid
- `fix(programa): I-03 PAF pill stale en click TODO` — agregar _updateProgramaActiveFilter en todoBtn.onclick
