# Fix — P5.4: Click en horario no abre alternativas en Planner

## Origen
Audit matrix 4415b4e — P5.4

## Síntoma
Click en el texto del horario (ej. "2:15 PM") en un item del plan
en el Planner no muestra las funciones alternativas disponibles.
El texto tiene cursor pointer y badge "2 alt." indicando que hay alternativas.

## Diagnóstico pendiente
Verificar: el handler onclick del mplan-t1 usa toggleFilmAlternatives()
con strings que pueden tener mismatch de apostrophes o safeT sin definir.

## Criterios
- [ ] Click en horario expande lista de alternativas
- [ ] validate.py 12/12
- [ ] QA browser
