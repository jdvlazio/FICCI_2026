# Audit Matrix — Planner + My Plan / Tribeca 2026
**Commit:** 1cd347f | **Build:** 202605121640
**Ejecutado:** 2026-05-12 | **Estado:** EN PROGRESO

Severidad: 🔴 CRÍTICO (bloquea release) | 🟡 MAYOR (degradación UX) | 🟢 MENOR (cosmético)

---

## TAB: PLANNER

### P1 — Estado vacío (watchlist=0, prioritized=0)
- [x] P1.1 ✅ Empty state visible — "No plan yet" + CTA "Add titles"
- [x] P1.2 ✅ Stepper 1→2→3 visible y en estado correcto
- [x] P1.3 ✅ CTA "Add titles" redirige a Interests

### P2 — Estado con watchlist, sin prioridades
- [x] P2.1 ✅ Sin priorities strip cuando prioritized=0
- [x] P2.2 ✅ "Generate plan" activo y ejecutable
- [x] P2.3 ✅ Plan generado sin prioridades — 0 conflictos (I1 PASS)
- [x] P2.4 ✅ 8 variaciones navegables con dots ★ 1-7
- [x] P2.5 ✅ Badge correcto (14/15, "not included" en gris)

### P3 — Con prioridades (incluyendo títulos con apostrophe U+2019)
- [x] P3.1 🔴 FAIL — Chips sin poster cuando título tiene U+2019 en Set
       Causa: normTitle normaliza FILMS pero NO los Sets al escribir.
       FILMS.find(fi => fi.title === t) falla: FILMS tiene U+0027,
       prioritized/watchlist tienen U+2019.
       Afecta: Opening Night, Finnegan's Foursome, Closing Night.
- [ ] P3.2 — NO EJECUTADO (bloqueado por P3.1)
- [ ] P3.3 — NO EJECUTADO
- [ ] P3.4 — NO EJECUTADO
- [ ] P3.5 — NO EJECUTADO

### P4 — Disponibilidad
- [ ] NO EJECUTADO

### P5 — Generación con prioridades apostrophe
- [x] P5.1 🔴 FAIL — "Finding options..." no termina (>26 seg) cuando
       alguna prioridad tiene U+2019. El algoritmo no encuentra las
       prioridades en FILMS → comportamiento indefinido / cuelgue.
       BLOQUEANTE PARA RELEASE.
- [ ] P5.2-P5.6 — NO EJECUTADOS

---

## TAB: MY PLAN
- [ ] M1-M7 — NO EJECUTADOS (pendiente fix P3.1/P5.1)

---

## INVARIANTES
- [x] I1 ✅ Plan generado sin prioridades: 0 conflictos
- [ ] I2 — NO VERIFICADO
- [ ] I3 — NO VERIFICADO (bloqueado por P5.1)
- [x] I4 ✅ FILMS sin comillas tipográficas post-normTitle (validate.py)
- [ ] I5 — NO VERIFICADO

---

## HALLAZGOS CRÍTICOS

### [CRIT-01] normTitle incompleto — 🔴 BLOQUEANTE
**Descripción:** normTitle normaliza FILMS en loadFestival pero NO
normaliza los títulos cuando entran a Sets (watchlist, prioritized,
watched) ni al buscarse en FILMS desde los Sets.

**Manifestaciones:**
1. P3.1: chips de prioridad sin poster
2. P5.1: algoritmo cuelga con prioridades apostrophe

**Fix requerido:** normTitle debe aplicarse en los puntos de escritura
de todos los Sets: togglePelWL, togglePriority, addSuggestion,
openPelSheet, y en cualquier FILMS.find que reciba string del UI.

**Impacto:** cualquier festival con títulos que tengan apostrophe
tipográfico en prioridades rompe el Planner completamente.

---

## RESULTADO PARCIAL
- PASS: P1.1 P1.2 P1.3 P2.1 P2.2 P2.3 P2.4 P2.5 I1 I4 (10 checks)
- FAIL 🔴: P3.1 P5.1 (2 checks — 1 root cause)
- Pendientes: 23 checks
- Bloqueante para release: SÍ — [CRIT-01]
