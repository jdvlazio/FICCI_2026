# Fix — i18n strings hardcodeados detectados en auditoría

## Origen
Audit matrix 4415b4e — P3.2b, P4.1, P5.6, M6.1

## Strings afectados

| ID | String ES hardcodeado | Contexto |
|---|---|---|
| A | "PRIORIDADES · N/N" + "Cambiar" | swap-prio sheet (límite alcanzado) |
| B | "No disponible" | AV sheet header |
| C | "+ N más · DIA X–DIA Y" | bottomsheet "Your plan is ready!" |
| D | "Calendario" | botón export ICS en Mi Plan |

## Root cause
Misma causa que casos anteriores: strings añadidos sin pasar por
Content Designer + sin t() desde el inicio.

## Criterios de aceptación
- [ ] A: swap-prio sheet — "PRIORIDADES" → t() + "Cambiar" → t()
- [ ] B: AV sheet — "No disponible" → t()
- [ ] C: bottomsheet — "+ N más" → t()
- [ ] D: botón ICS — "Calendario" → t()
- [ ] 4 keys nuevas ES + EN aprobadas por Content Designer
- [ ] validate.py 12/12
- [ ] QA browser EN + ES para los 4 strings
