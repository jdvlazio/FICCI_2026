# Tasks — Splash animation: fix PWA

- [ ] 1. CSS: reemplazar animation:...both → transition en barras, sin fill-mode
- [ ] 2. CSS: eliminar animation de .splash-action y .splash-tagline (controlado por JS)
- [ ] 3. JS: _initSplashAnimation — fase 0 (JS inline styles para estado inicial)
- [ ] 4. JS: _initSplashAnimation — fase 1 (doble rAF + clase)
- [ ] 5. JS: _initSplashAnimation — fase 2 (fallback timeout 1500ms)
- [ ] 6. JS: spell-out con JS transitions, inline animation-delay eliminado
- [ ] 7. sw.js: añadir 5 variantes de fuente a STATIC_ASSETS
- [ ] 8. python3 validate.py (sin pipe, verificar returncode)
- [ ] 9. QA browser: splash completo, fallback (simulate slow)
- [ ] 10. Commit + push

## Orden de ejecución
Tasks 1-6 son un único cambio coordinado en index.html.
Task 7 es cambio separado en sw.js.
Ambos en un solo commit.
