# Tasks — Badge Design System Implementation

Regla aprobada: badge SIEMPRE después del texto, en la misma línea.

## Cambios requeridos

### B12 — ag-summary (Plan óptimo) ← única anomalía real
- [ ] Badge [N/total] inline DESPUÉS de planLabel
- [ ] Usar count-badge cb-amber/cb-gray2 (no inline styles)
- [ ] tags-row solo si bad > 0 → card más pequeña cuando no hay excluidos

### B13 — ag-summary excluidos
- [ ] Eliminar badge cb-gray2 antes de "not included"
- [ ] Texto plano: "N not included" — no necesita badge

### Pipeline
- [ ] 1. Implementar B12 + B13
- [ ] 2. validate.py 12/12
- [ ] 3. QA browser — verificar todas las variantes (óptimo, variación, con/sin excluidos)
- [ ] 4. Commit con referencia al spec badge-audit.md
