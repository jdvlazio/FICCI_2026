# Otrofestiv — Constitution
> El *por qué* de las decisiones de arquitectura. El *qué* y el *cómo* viven en `ARQUITECTURA.md`.
> Actualizar cada vez que se tome una decisión de arquitectura significativa.

---

## Principios fundacionales

### Single-file architecture
`index.html` contiene CSS + JS + HTML de la app. No hay build step, no hay bundler, no hay dependencias externas. Esto es una decisión consciente: el costo de mantenimiento de un toolchain supera el beneficio para un proyecto de un solo desarrollador con deployment manual. La restricción genera disciplina de diseño (tokens, componentes reutilizables) en lugar de depender de librerías.

### Vanilla JS sin frameworks
Sin React, Vue, ni Svelte. La app no tiene suficiente complejidad de estado para justificar un framework completo. El DOM es la fuente de verdad de la UI; el estado vive en `localStorage` y en variables globales swapeadas por `loadFestival()`.

### Festival data como JSON externo
Los datos de cada festival no viven en `index.html` — viven en `festivals/<id>.json` cargados async. Esto permite actualizar datos de un festival sin redeploy del app shell, y mantiene `index.html` ligero.

### Mobile-first, PWA
El 100% de los usuarios accede desde móvil. Desktop es nice-to-have, no requisito. La app es instalable como PWA (Service Worker + manifest), lo que mejora la experiencia offline y el acceso rápido.

---

## Decisiones de diseño

### Sistema de tokens (CSS custom properties)
Todo valor de spacing, tipografía y color usa `var(--)`. Esto no es preferencia estética — es la única forma de mantener consistencia a escala en un archivo de ~10k líneas sin un preprocessor. La regla se audita con `audit.sh`.

### Amber como color de acción
`--amber` (#F59E0B) es el único CTA primario. Verde (`--green`) es confirmación/estado activo. Rojo (`--red`) es error/conflicto. Ningún otro color tiene semántica de acción. Esta restricción previene proliferación de colores de acción que degradan la jerarquía visual.

### Lucide como sistema de iconos
Un solo pack, inline SVG, sin dependencias. Los emojis de país (flags) y emojis de categoría de sección son la única excepción — no hay equivalente de alta calidad en Lucide para iconografía cultural/geográfica.

### Pósters: cadena de prioridad unificada
La función `getFilmPoster(f)` encapsula toda la lógica de resolución de poster (custom override → inline → legado → generativo → null). Llamar directamente a `getPosterSrc()` o `makeProgramPoster()` desde templates está prohibido porque rompe la cadena y crea inconsistencias silenciosas.

---

## Decisiones de proceso

### Copy como artefacto de diseño
Las strings de la UI no son "texto que se puede cambiar después". Cada string es una micro-decisión de UX que afecta la percepción del producto. Las decisiones de copy se toman con el mismo rigor que las decisiones de diseño visual — siempre con Juan actuando como Content Designer + UX Writer.

### i18n desde el principio
La app soporta ES + EN. Esto no es una feature opcional — es parte del modelo de producto (festivales internacionales como Tribeca requieren interfaz en inglés). Toda string nueva entra simultáneamente en `es.json` y `en.json`.

### validate.py como gate obligatorio
El validador chequea JS syntax, divs críticos, CSS corruption y patrones prohibidos. Es la única forma de detectar regresiones en un archivo de ~10k líneas sin test suite formal. Correr antes de cada commit no es opcional.

### Timezone Colombia (UTC-5)
Los festivales colombianos operan en hora local. `toISOString()` devuelve UTC, lo que produce diferencias de fecha silenciosas en lógica de "hoy". Toda comparación de fechas usa offset `-05:00` explícito.

---

## Decisiones pendientes

| Decisión | Opciones | Bloqueante para |
|---|---|---|
| Festival selector en nav | Center tap (wordmark) vs. fila explícita | Nav redesign |
| Desktop layout | Tabs en fila propia vs. en topbar | Desktop layout |

---

## Log de decisiones

| Fecha | Decisión | Rationale |
|---|---|---|
| May 2026 | Eliminar `--orange` como alias de `--amber` | Un solo token para el color primario evita ambigüedad |
| May 2026 | `poster` y `lbSlug` inline en cada film (no en raíz del JSON) | Formato Jardín 2026 en adelante — la fuente de verdad es el objeto film, no lookup tables separadas |
| May 2026 | `config{}` del festival NO va en el JSON | La config vive en `FESTIVAL_CONFIG` de `index.html` — generada por `generate-config.js`, no editada a mano |
| May 2026 | Supabase para auth + cloud sync | Permite sincronización de watchlist entre dispositivos sin backend propio |
| May 2026 | `day` en formato ISO (`YYYY-MM-DD`) desde Tribeca 2026 | Elimina ambigüedad de formato localizado; el validator lo enforcea |
| May 2026 | Grid/TODO ordena por sección (cronológico dentro de cada sección) | Grid es modo de descubrimiento, no de planificación. Ordenar por sección crea clusters visuales coherentes con la identidad editorial del festival. Cronológico ya está cubierto por Lista. |
