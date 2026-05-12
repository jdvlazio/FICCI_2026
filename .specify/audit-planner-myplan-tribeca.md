# Audit Matrix — Planner + My Plan / Tribeca 2026
**Commit:** 1cd347f | **Build:** 202605121640
**Festival:** tribeca2026 | **Idioma:** EN + ES

Severidad: 🔴 CRÍTICO (bloquea release) | 🟡 MAYOR (degradación UX) | 🟢 MENOR (cosmético)

---

## TAB: PLANNER

### P1 — Estado vacío (watchlist=0, prioritized=0)
- [ ] P1.1 Empty state visible — "No plan yet" + CTA "Add titles"
- [ ] P1.2 Stepper 1→2→3 visible y en estado correcto
- [ ] P1.3 CTA "Add titles" redirige a Interests

### P2 — Estado con watchlist, sin prioridades
- [ ] P2.1 Priorities strip vacío / placeholder correcto
- [ ] P2.2 "Generate plan" activo y ejecutable
- [ ] P2.3 Plan generado sin prioridades — 0 conflictos en schedule
- [ ] P2.4 Variaciones 1-8 navegables
- [ ] P2.5 Score badge correcto (N/total, M not included)

### P3 — Con prioridades (incluyendo títulos con apostrophe)
- [ ] P3.1 Priority chips muestran poster (incl. Opening Night, Finnegan's)
- [ ] P3.2 Límite 6/6 respetado — no permite añadir más
- [ ] P3.3 Quitar prioridad desde chip funciona
- [ ] P3.4 Plan incluye todas las prioridades en Best option
- [ ] P3.5 Conflict warning si prioridades se solapan

### P4 — Disponibilidad
- [ ] P4.1 Sheet "Not available" abre correctamente
- [ ] P4.2 Bloque añadido aparece en lista
- [ ] P4.3 Plan regenerado respeta bloque — 0 films en ese slot
- [ ] P4.4 Quitar bloque → plan se resetea

### P5 — Generación y resultados
- [ ] P5.1 "Generate plan" produce resultado en < 8 segundos
- [ ] P5.2 Variación ★ "Best option" es la primera
- [ ] P5.3 "not included" badge en gris (no rojo)
- [ ] P5.4 Click en item del plan → scheduleado / alternativas
- [ ] P5.5 forceInclude en excluidos funciona
- [ ] P5.6 "Save plan" → transición a My Plan

---

## TAB: MY PLAN

### M1 — Estado vacío (sin plan guardado)
- [ ] M1.1 Empty state correcto — no crash, no error

### M2 — Header pre-festival
- [ ] M2.1 "Festival starts in N days" — EN correcto, sin mezcla ES
- [ ] M2.2 Ciudad y fechas correctas
- [ ] M2.3 Un solo chip de prioridad visible (primer compromiso)
- [ ] M2.4 Chip de prioridad con poster (incl. apostrophe titles)
- [ ] M2.5 "See day THU X" contextual — muestra día activo

### M3 — Calendario semanal
- [ ] M3.1 Vista calendario renderiza sin error
- [ ] M3.2 Navegación prev/next entre días funciona
- [ ] M3.3 Films en calendario en color correcto (prioridad = ★)
- [ ] M3.4 Click en bloque calendario → selecciona día

### M4 — Lista por día (mplan-row)
- [ ] M4.1 Items del día visibles con poster, hora, venue
- [ ] M4.2 Click en poster → abre pel-sheet (incl. apostrophe titles)
- [ ] M4.3 Remove (×) quita del plan, lista actualiza
- [ ] M4.4 Warning "Not enough time" en rojo cuando gap ≤ 5 min
- [ ] M4.5 Warning "~N min between venues" en ámbar — sin "by car"
- [ ] M4.6 "See day THU X" scrollea a la lista del día

### M5 — Sugerencias
- [ ] M5.1 Suggestions aparecen cuando hay huecos viables
- [ ] M5.2 Ninguna sugerencia conflictúa con el plan (screensConflict)
- [ ] M5.3 WL titles antes que discovery en orden
- [ ] M5.4 "+ Add" añade al plan y actualiza sugerencias
- [ ] M5.5 "Your plan is well covered" cuando no hay huecos — EN
- [ ] M5.6 "Suggestions" label en EN, "Sugerencias" en ES

### M6 — Internacionalización
- [ ] M6.1 Todos los strings en EN en modo EN
- [ ] M6.2 Todos los strings en ES en modo ES
- [ ] M6.3 Switch de idioma actualiza Mi Plan sin reload

### M7 — Pel-sheet desde My Plan
- [ ] M7.1 Sheet abre con título correcto
- [ ] M7.2 CTAs funcionales: In Interests, Prioritize, Seen
- [ ] M7.3 "Remove from plan" visible y funcional
- [ ] M7.4 Rating sheet abre desde Seen

---

## INVARIANTES (nunca pueden fallar — 🔴 si fallan)
- [ ] I1. Plan generado: 0 conflictos horarios
- [ ] I2. Sugerencias: 0 conflictos con plan (screensConflict)
- [ ] I3. Todas las prioridades en al menos un escenario
- [ ] I4. FILMS sin comillas tipográficas (validate.py)
- [ ] I5. Mi Plan no crashea con ningún título del festival

---

**RESULTADO FINAL**
- PASS: 
- FAIL 🔴: 
- FAIL 🟡: 
- FAIL 🟢: 
- Bloqueante para release: 
