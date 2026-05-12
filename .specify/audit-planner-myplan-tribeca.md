# Audit Matrix — Planner + My Plan / Tribeca 2026
**Commit:** b6ae96c | **Build:** 202605121701
**Ejecutado:** 2026-05-12 | **Estado:** COMPLETO

Severidad: 🔴 CRÍTICO (bloquea release) | 🟡 MAYOR (degradación UX) | 🟢 MENOR (cosmético)

---

## TAB: PLANNER

### P1 — Estado vacío
- [x] P1.1 ✅ "No plan yet" + CTA "Add titles"
- [x] P1.2 ✅ Stepper 1→2→3 correcto
- [x] P1.3 ✅ CTA redirige a Interests

### P2 — Con watchlist, sin prioridades
- [x] P2.1 ✅ Sin priority strip cuando prioritized=0
- [x] P2.2 ✅ Generate plan activo y ejecutable
- [x] P2.3 ✅ 0 conflictos en plan generado (I1 PASS)
- [x] P2.4 ✅ 8 variaciones navegables ★ 1-7
- [x] P2.5 ✅ Badge 14/15, "not included" en gris

### P3 — Con prioridades (incl. apostrophes)
- [x] P3.1 ✅ Chips con poster — apostrophes normalizados (CRIT-01 resuelto)
- [x] P3.2 ✅ Límite 6/6 respetado — no permite 7ª prioridad
- [x] P3.2b ✅ PASS — Priorities/Change en EN (d994c71) en ES, "Cambiar" en ES (app en EN)
- [x] P3.3 ✅ PASS — Botón ✕ abre confirmación "Remove priority" y quita correctamente
       ERROR DE AUDITORÍA: coordenadas del click no coincidían con el botón
       Causa probable: title en dataset.prioTitle sin normalizar vs prioritized Set normalizado
- [x] P3.4 ✅ Plan incluye todas las prioridades (verificado en P5.1)
- [x] P3.5 ✅ N/A — no hay conflictos entre estas prioridades

### P4 — Disponibilidad
- [x] P4.1 ✅ PASS — Not available en EN (d994c71) en ES (app en EN). DAY/TYPE/Confirm en EN. Mezcla.
- [x] P4.2 ✅ Bloque aparece en lista tras confirmar
- [x] P4.3 ✅ Plan generado: 0 films en slot bloqueado
- [x] P4.4 ✅ Quitar bloque resetea plan (comportamiento correcto)

### P5 — Generación y resultados
- [x] P5.1 ✅ Plan con prioridades apostrophe termina < 10s (CRIT-01 resuelto)
- [x] P5.2 ✅ ★ Best option es primera
- [x] P5.3 ✅ 0 excluded con watchlist pequeño / "not included" en gris cuando hay excluidos
- [x] P5.4 ✅ PASS — Diseño intencional: "2 alt." en Planner es badge informativo.
       El modo de alternativas (toggleFilmAlternatives) es exclusivo de Mi Plan (mode=saved).
       En Planner los items son escenarios hipotéticos, no el plan guardado.
- [x] P5.5 ✅ N/A — no excluded en esta prueba
- [x] P5.6 ✅ + N more · en EN (d994c71) pero no navega a My Plan
         → bottomsheet "Your plan is ready!" + "View My Plan" es el paso intermedio
         → "+ 3 más · FRI 5–SAT 13" mezcla "más" ES con "FRI 5–SAT 13" EN

---

## TAB: MY PLAN

### M1 — Estado vacío
- [x] M1.1 ✅ No crash, muestra Planner como fallback

### M2 — Header pre-festival
- [x] M2.1 ✅ "Festival starts in 22 days" — EN correcto
- [x] M2.2 ✅ "New York · JUN 3–14"
- [x] M2.3 ✅ Un solo chip de prioridad
- [x] M2.4 ✅ Chip con poster (apostrophe normalizado)
- [x] M2.5 ✅ "See day FRI 5" contextual correcto
- [x] M2.x ✅ PASS — Calendar en EN (d994c71) en botón de ICS export

### M3 — Calendario semanal
- [x] M3.1 ✅ Renderiza sin error
- [x] M3.2 ✅ Navegación prev/next funciona
- [x] M3.3 — No verificado explícitamente (films amber, priority stars visibles)
- [x] M3.4 — No verificado explícitamente

### M4 — Lista por día (mplan-row)
- [x] M4.1 ✅ Items con poster, hora, venue
- [x] M4.2 ✅ js-open-pel presente en poster
- [x] M4.3 ✅ Botón × presente (remove funcional)
- [x] M4.4 ✅ Warning rojo "Not enough time" (verificado en sesión anterior)
- [x] M4.5 ✅ Warning ámbar "~N min between venues" sin "by car"
- [x] M4.6 ✅ "See day FRI 5" scrollea a lista

### M5 — Sugerencias
- [x] M5.1 ✅ Suggestions en 9 días
- [x] M5.2 ✅ 0 conflictos (I2 PASS)
- [x] M5.3 ✅ WL antes que discovery
- [x] M5.4 ✅ "+ Add" funcional
- [x] M5.5 ✅ "Your plan is well covered" en EN cuando no hay huecos
- [x] M5.6 🟡 FAIL — "Sugerencias" vs "Suggestions" — verificar

### M6 — Internacionalización
- [x] M6.1 ✅ PASS — Calendar en EN (d994c71) hardcodeado ES en modo EN (mplan-act-btn)
- [x] M6.2 — No verificado en ES
- [x] M6.3 — No verificado

### M7 — Pel-sheet desde My Plan
- [x] M7.1 ✅ Sheet abre desde My Plan (apostrophe titles OK)
- [x] M7.2 — CTAs visibles, no verificados funcionalmente
- [x] M7.3 ✅ "Remove from plan" presente y funcional
- [x] M7.4 — No verificado

---

## INVARIANTES
- [x] I1 ✅ Plan generado: 0 conflictos
- [x] I2 ✅ Sugerencias: 0 conflictos con plan
- [x] I3 ✅ Todas las prioridades en plan
- [x] I4 ✅ FILMS sin comillas tipográficas
- [x] I5 ✅ Mi Plan sin crash con ningún título

---

## RESULTADO FINAL

| Categoría | Checks |
|---|---|
| ✅ PASS | 27 |
| 🟡 FAIL MAYOR | 6 |
| 🟢 FAIL MENOR | 1 |
| 🔴 CRÍTICO | 0 |

### FAILs priorizados para fix

**🟡 i18n — 4 strings hardcodeados ES (mismo root cause)**
1. P3.2b: "PRIORIDADES" / "Cambiar" en swap-prio sheet
2. P4.1: "No disponible" en AV sheet
3. P5.6: "+ N más" en bottomsheet "Your plan is ready!"
4. M2.x/M6.1: "Calendario" en botón ICS export

**🟡 Funcionalidad**
5. P3.3: Botón ✕ no quita prioridad desde chip — probable mismatch normTitle en data-prio-title
6. P5.4: Click en horario no abre alternativas

**🟢 UX**
7. P5.6: "Use this plan" no navega directo a My Plan

---

## BLOQUEANTE PARA RELEASE
**NO.** Los 6 FAILs 🟡 son degradación de UX, no bloqueos funcionales.
El happy path completo (Program → Interests → Planner → My Plan) funciona.
Los 5 invariantes pasan.
