# Badge Design System Audit
**Fecha:** 2026-05-12 | **Estado:** Pendiente aprobación de regla

---

## Inventario completo (13 instancias)

| ID | Contexto | Clase | Posición actual |
|---|---|---|---|
| B01 | sec-hdr Planner (★ Prioridades) | cb-amber | ✅ DESPUÉS del texto |
| B02 | prio-strip sec-hdr | cb-amber | ✅ DESPUÉS del texto |
| B03 | Interests: prioridades | cb-amber | ✅ DESPUÉS del texto |
| B04 | Interests: intereses | cb-neutral | ✅ DESPUÉS del texto |
| B05 | Interests: vistas | cb-neutral | ✅ DESPUÉS del texto |
| B06 | Archivo sec-hdr | cb-neutral | ✅ DESPUÉS del texto |
| B07 | ag-day-label (FRI 5) | cb-neutral | ✅ DESPUÉS del chip |
| B08 | plan-list-hdr Mi Plan | cb-neutral | ✅ DESPUÉS del chip |
| B09 | pel-sheet "FUNCIONES" | cb-neutral | ✅ DESPUÉS del label |
| B10 | pel-sheet screenings count | cb-neutral | ✅ DESPUÉS del label |
| B11 | filter chips sección/venue | cb-neutral | ✅ DESPUÉS del label |
| B12 | **ag-summary (Plan óptimo)** | cb-amber | ❌ FILA PROPIA (anomalía) |
| B13 | ag-summary excluidos | cb-gray2 | ❌ ANTES de "not included" |

---

## Patrón dominante
**11 de 13:** badge DESPUÉS del texto. 2 anomalías en ag-summary.

## Regla canónica propuesta
> Badge SIEMPRE después del texto que cuantifica, en la misma línea.
> Nunca en fila propia. Nunca antes del texto.

```
✅  🗓 Plan óptimo [14/15]
❌  🗓 Plan óptimo
    [14/15]
❌  [14/15] Plan óptimo
```

## Impacto
Solo B12 requiere cambio:
- Badge [N/total] inline con título ag-summary (DESPUÉS del planLabel)
- tags-row solo si bad > 0
- Inline styles → count-badge cb-* class

B13: "N not included" como texto plano, sin badge.

## Estado
- [x] Inventario completo (13 instancias)
- [ ] Regla canónica aprobada
- [ ] tasks.md creado tras aprobación
- [ ] Implementación + QA + commit
