# Tasks — data-title refactor

## Fase 1 — openPelSheet (crítico)
- [x] 1a. renderPeliculaView: poster-card → data-title, eliminar safeT onclick
- [x] 1b. renderProgramaList (lista por día): items → data-title
- [x] 1c. _renderExploreLista (lista TODO): items → data-title
- [x] 1d. renderAgenda (Mi Plan): items → data-title
- [x] 1e. renderPrioStrip (Planner chips): chips → data-title
- [x] 1f. renderIntereses / renderWatched: items → data-title
- [x] 1g. Planner gap suggestions: items → data-title
- [x] 1h. Event listener delegado único en document para js-open-pel
- [x] 1i. QA: Hell's Kitchen, Mare's Nest, That's the Weight abre sheet

## Fase 2 — Funciones secundarias
- [x] 2a. togglePriority → data-title (L5882 ✓; L5787 usa data-prio-title, correcto)
- [x] 2b. togglePelPrio → data-title (L8740, L9046 ya usaban data-title ✓)
- [x] 2c. toggleWatched → data-title (L5909, L6856, L6871, L8735, L8741 ✓)
- [x] 2d. openRatingSheet + removeFromAgenda → data-title (L8686, L8736, L8743, L9047)
- [x] 2e. QA: La Suprema → Vista → Calificar → rating sheet abre ✓

## Fase 3 — Limpieza
- [x] 3a. Eliminar orphans: safeTitle (L9022), safeParent (L9025) en openCortoSheet
      Pendiente futura (funciones multi-arg): safeCorto, safeLast, safeTNew,
      safeRem, safeSwap, safeNew, safeT (confirmReplace, swapPriority, checkin)
- [x] 3b. validate.py 13/13 ✓
- [x] 3c. Commit con descripción completa
