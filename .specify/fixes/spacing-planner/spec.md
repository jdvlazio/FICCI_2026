# Spec — Spacing audit Planner: grid de 8px

## Origen
Auditoría visual post-matrix. Observación: separadores y distancias
excesivas entre secciones del Planner.

## Método
8px grid audit — estándar Material Design / Apple HIG.
Todo espacio debe ser múltiplo de 8 (o 4 para valores pequeños).

## Mediciones reales (browser, build 202605121724)

```
Priorities strip        h: 164px   mb: 12px  ← ❌ 12 no es múltiplo de 8
── gap: 16px ───────────────────────────────   ✅ 2×8
Availability section    h: 99px    mt: 16px   ✅ 2×8
── gap: 24px ───────────────────────────────   ✅ 3×8
Generate plan button    h: 72px    mt: 24px   ✅ 3×8
── gap: 55px ───────────────────────────────   ❌ NO EN GRID — acumulación
Options header          h: 15px
```

## Root cause del gap de 55px
Tres márgenes acumulados sin relación entre sí:
  ag-calc-wrap mb: 24px
+ separator margin-top propio
+ ag-options margin-top
= ~55px

## Propuesta (para aprobación)
Un solo punto de separación entre Generate plan y Options.
  ANTES: ~55px    DESPUÉS: 32px (4×8)
  
Correcciones adicionales en grid:
  prio-strip mb: 12px → 16px  (2×8)
  av-calc pt: 12px → 16px     (2×8)

## Estado
- [x] Medición completada
- [ ] **Propuesta pendiente aprobación visual de Juan**
- [ ] Implementación sólo tras aprobación explícita
- [ ] tasks.md — se crea tras aprobación
