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
- [x] 2a. togglePriority → L5882 usa data-title ✓ | L5787 usa data-prio-title (correcto, distinto key)
- [x] 2b. togglePelPrio → L8740, L9046 ya usan data-title ✓
- [x] 2c. toggleWatched → L5909, L6856, L6871, L8735, L8741 ya usan dataset ✓
- [x] 2d. openRatingSheet → data-title: L8686, L8736, L9047 corregidos
      bonus: L8743 removeFromAgenda(f.title) → data-title (mismo bug, mismo fix)
- [ ] 2e. QA secundario

## Fase 3 — Limpieza
- [ ] 3a. Eliminar construcciones safeT huérfanas
- [ ] 3b. validate.py 10/10
- [ ] 3c. Commit único con descripción completa
