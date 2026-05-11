# Tasks — Separadores de sección en Grid TODO

- [ ] 1. Añadir `.poster-grid-sep` al CSS, junto al bloque de `.poster-grid`
- [ ] 2. En `renderPeliculaView()`, añadir lógica de separador antes del `entries.map()`:
  - Variable `_prevSec = null` externa al map
  - En cada iteración: si `activeDay==='all'` y sección cambió → emitir `<div class="poster-grid-sep">`
  - Usar `reduce` en lugar de `map` para poder trackear estado
- [ ] 3. Validar: `python3 validate.py`
- [ ] 4. QA en browser: TODO → separadores visibles. Día específico → sin separadores. Filtro de sección activo → sin separadores (solo hay una sección). Lista → intacta.
