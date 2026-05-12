# Tasks — Badge Design System Implementation

Regla aprobada: badge SIEMPRE después del texto, en la misma línea.

## Cambios requeridos

### B12 — ag-summary (Plan óptimo) ← única anomalía real
- [x] Badge [N/total] inline DESPUÉS de planLabel
- [x] Usar count-badge cb-amber/cb-gray2 (no inline styles)
- [x] tags-row solo si bad > 0 → card más pequeña cuando no hay excluidos

### B13 — ag-summary excluidos
- [x] Eliminar badge cb-gray2 antes de "not included"
- [x] Texto plano: "N not included" — no necesita badge

### Pipeline
- [x] 1. Implementar B12 + B13
- [x] 2. validate.py 12/12
- [x] 3. QA browser — verificar todas las variantes (óptimo, variación, con/sin excluidos)
- [x] 4. Commit con referencia al spec badge-audit.md
