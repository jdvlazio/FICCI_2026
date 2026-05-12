# Plan — Animación de entrada del splash

## Dependencia
`<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js"></script>`
Añadir en `<head>` de index.html. ~67kb minified, carga async.

## Elementos HTML necesarios
- `.bar-top` y `.bar-bot` — divs de letterbox, position:absolute, z-index alto
- `.wm-char` — cada carácter del wordmark envuelto en span (generado por JS)
- `.splash-divider` — línea amber nueva bajo el wordmark
- Los demás ya existen: `.splash-selector`, `.splash-enter-btn`, `.splash-tagline`

## CSS
- `.bar-top/.bar-bot`: position:absolute, top/bottom:0, left:0, right:0,
  height:~15% viewport, background:#0A0A0A, z-index:99, pointer-events:none
- `.wm-char`: display:inline-block (necesario para transforms 3D)
- `.splash-divider`: width:0, height:1px, background:rgba(245,158,11,.35), margin:12px auto 20px

## JS — función `_initSplashAnimation()`
```js
function _initSplashAnimation(){
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  if(!window.gsap) return;
  // split wordmark into chars
  // build gsap.timeline()
  // 5 pasos de la secuencia aprobada
  // marcar como corrida — no repetir
}
```
Llamar desde `init()` — solo una vez, solo en el splash.

## Riesgos Senior Dev
- GSAP carga async desde CDN — la función debe esperar a que esté disponible
- Los chars del wordmark se generan dinámicamente — el HTML estático actual
  tiene texto plano; necesita wrapping por JS antes de animar
- `pointer-events:none` en las barras para no bloquear taps durante la animación
- La animación no debe correr si el usuario llega al splash via botón "atrás" desde la app
