# Spec — Animación de entrada del splash

## Qué
Reemplazar la entrada estática del splash por una secuencia cinemática
aprobada por Motion Designer.

## Secuencia aprobada
1. Letterbox (barras negras arriba/abajo) se abren
2. Wordmark "Otrofestiv" se deletrea carácter por carácter
3. Línea amber se dibuja bajo el wordmark
4. Grupo selector + botón sube suavemente
5. Tagline aparece

## Herramienta
GSAP 3.13.0 vía cdnjs.cloudflare.com — en los dominios permitidos.
Una sola línea de script, sin dependencias adicionales.

## Criterios de aceptación
- [ ] Secuencia corre al cargar el splash
- [ ] Solo corre una vez — no en re-renders de la app
- [ ] Respeta prefers-reduced-motion
- [ ] No bloquea interacción (el botón Entrar es tappable en cuanto aparece)
- [ ] Sin regresiones en la navegación post-splash
