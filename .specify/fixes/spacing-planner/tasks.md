# Tasks — Spacing Planner (8px grid)

Aprobado: sí

## Cambios CSS (4 valores, todos en sistema de tokens existente)

| Selector | Propiedad | Antes | Después | Razón |
|---|---|---|---|---|
| .prio-strip | margin-bottom | var(--sp-3) 12px | var(--sp-4) 16px | 2×8 grid |
| .av-calc-wrap | padding-top | var(--sp-3) 12px | var(--sp-4) 16px | 2×8 grid |
| .ag-section | margin-bottom | var(--sp-5) 24px | var(--sp-4) 16px | reduce acumulación |
| .amber-border-top | padding-top | var(--sp-3) 12px | var(--sp-4) 16px | 2×8 grid |

Resultado: gap Generate plan → Options = 16 + 2px borde + 16 = 34px ≈ sp-6

- [ ] 1. Implementar 4 cambios CSS
- [ ] 2. validate.py 12/12
- [ ] 3. QA browser visual — medir gap resultante
- [ ] 4. Commit
