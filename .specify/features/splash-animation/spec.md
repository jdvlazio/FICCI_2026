# Spec — Splash animation: fix PWA + diferencias cross-browser

## Contexto
La animación aprobada (letterbox + spell-out + fade) funciona en Chrome.
En iOS PWA standalone falla: wordmark invisible, glitches, diferencias visuales.

## Causa raíz confirmada

### Bug 1 — Wordmark invisible (CRÍTICO)
`animation-fill-mode:both` en WebKit PWA standalone aplica el estado `from`
inmediatamente, pero la animación puede no completarse (timing diferente en
WKWebView standalone). Las barras quedan en `scaleY(1)` cubriendo el wordmark.
El `fill-mode:both` en `.splash-action`/`.splash-tagline` los deja en `opacity:0`.

**Solución:** Eliminar `fill-mode:both` de la animación CSS. Usar JS puro para
el estado inicial de las barras y los fades — no depender del CSS backwards fill.
Arquitectura: JS setea estados iniciales via `style`, luego los remueve para
triggear la transición CSS. Fallback: si JS falla, todo visible por defecto.

### Bug 2 — Fuentes no cacheadas (diferencia visual)
`/fonts/*.woff2` no están en `STATIC_ASSETS` del SW. Primera carga sin caché
puede causar FOUT (flash of unstyled text) con system font, especialmente en
PWA. Plus Jakarta Sans y San Francisco tienen métricas diferentes.

**Solución:** Añadir las 5 variantes de Plus Jakarta Sans a `STATIC_ASSETS`.

### Observación — Safe area y viewport (diferencias aceptables)
`env(safe-area-inset-top)` y viewport height se comportan diferente entre
Chrome desktop, Safari browser, y Safari PWA standalone. Estas diferencias
son inherentes a los entornos — no son bugs de código sino diferencias de
plataforma. El layout actual ya maneja esto correctamente con `env()`.

## Animación aprobada (a preservar)
1. Letterbox: barras top/bot se abren desde scaleY(1) a scaleY(0)
2. Wordmark: spell-out letra por letra con stagger
3. Action group: fade-up
4. Tagline: fade-in

## Criterios de aceptación
- [ ] Wordmark siempre visible: si cualquier paso de la animación falla,
      el wordmark es visible y el splash es funcional
- [ ] Sin glitches en PWA: no flashes de elementos invisibles
- [ ] Spell-out visible en todos los entornos donde JS corre
- [ ] Fuentes cacheadas en SW desde la primera carga
- [ ] validate.py pasa 10/10 sin pipe a tail
