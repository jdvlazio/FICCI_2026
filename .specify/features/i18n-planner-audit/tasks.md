# Tasks — Auditoría i18n strings hardcodeados

- [x] 1. Añadir 17 keys nuevas al bloque ES en index.html — ya estaban (sesión anterior)
- [x] 2. Añadir 17 keys nuevas al bloque EN en index.html — ya estaban (sesión anterior)
- [x] 3. Aplicar Tipo A — wiring de claves existentes:
      L4872: showActionModal(...,'Quitar',...) → t('misc_quitar')
      L7616: showToast('De vuelta en pendientes',...) → t('plan_vuelta_pendientes')
      Las demás ya usaban t() correctamente.
- [x] 4. Aplicar Tipo B — wiring de claves nuevas: todas ya usaban t() correctamente.
- [x] 5. i18n/es.json, i18n/en.json, strings-reference.json — sincronizados (265 keys cada uno)
      NOTA: sync-i18n.py causó regresión al correrlo — los JSON tienen menos keys que
      el inline _I18N. NO correr sync-i18n hasta resolver la divergencia.
- [x] 6. validate.py 13/13 ✓
- [ ] 7. QA: cambiar a EN → verificar Planner "Remove", Mi Plan "Moved back to Interests"
- [ ] 8. QA: volver a ES → verificar que nada cambió
