# Fix — P3.3: Botón ✕ no quita prioridad desde chip

## Origen
Audit matrix 4415b4e — P3.3

## Síntoma
Click en ✕ del prio-chip no reduce prioritized.size.
El chip permanece en la UI sin cambio visual.

## Diagnóstico pendiente
Hipótesis: mismatch entre data-prio-title en el chip
y el título en el Set prioritized.

## Criterios de aceptación
- [ ] Click en ✕ de chip reduce prioritized.size en 1
- [ ] Chip desaparece de la UI
- [ ] Funciona con títulos con apostrophe (U+2019 vs U+0027)
- [ ] validate.py 12/12
- [ ] QA browser
