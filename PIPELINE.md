# Pipeline de onboarding — festivales Otrofestiv

> **Regla de oro:** cada fase debe completarse y validarse antes de iniciar la siguiente.  
> Un push que falla `validate-festivals.js` se revierte sin excepciones.

---

## Fases en orden obligatorio

### Fase 1 · Extracción `[Data Engineer]`

**Objetivo:** JSON del festival con todos los campos poblados desde el origen.

1. Scraping de la web oficial del festival  
   - Campos obligatorios: `title`, `slug`, `section`, `type`, `director`, `country`, `year`, `synopsis`, `screenings`, `language`, `premiere`  
   - Campos deseables: `filmType`, `genre`, `duration`

2. **`poster` (og:image) — capturar desde el día 1**  
   URL patrón: `{festival-url}/films/{slug}` → leer `<meta property="og:image">`  
   Este campo nunca debe llegar vacío si la página del film existe.

3. Day keys en formato ISO `YYYY-MM-DD` — único formato aceptado desde Tribeca 2026 en adelante.

4. Secciones con emoji — cada sección recibe un emoji único antes del commit.

**Gates de salida (bloqueantes):**
- [ ] Cero films sin `slug`
- [ ] Cero títulos en ALLCAPS (3+ palabras consecutivas en mayúsculas)
- [ ] `poster` ≥ 90% de films auditables

---

### Fase 2 · Configuración en FESTIVAL_CONFIG `[Senior Dev + PM]`

**Objetivo:** El festival existe en la app con su configuración completa.

1. Crear entrada en `FESTIVAL_CONFIG` dentro de `index.html`:
   ```js
   'festival-id': {
     id: 'festival-id',
     name: 'Nombre completo',
     name_short: 'Nombre corto',
     city: 'Ciudad',
     country: 'XX',           // ISO-2, usado por flagFmt() para supresión de banderas
     storageKey: 'otrofestiv_festival_id',
     festivalEndStr: 'YYYY-MM-DDTHH:MM:SS',
     festivalDates: { 'YYYY-MM-DD': 'YYYY-MM-DD', ... },
     dayKeys: ['YYYY-MM-DD', ...],
     dayShort: { 'YYYY-MM-DD': 'MON D', ... },
     dayShort_en: { 'YYYY-MM-DD': 'MON D', ... },
     dayLong: { 'YYYY-MM-DD': 'Day, Month D', ... },
   }
   ```

2. El JSON del festival **no lleva bloque `config{}`** — nunca.

3. Emojis de sección aprobados por PM + Content Designer.

**Gates de salida (bloqueantes):**
- [ ] JSON sin `config{}`
- [ ] `storageKey` único (verificar contra todos los festivales)
- [ ] `festivalEndStr` presente y correcto
- [ ] `country` presente (necesario para `flagFmt`)

---

### Fase 3 · Enriquecimiento TMDB `[Data Engineer — algoritmo aprobado por Senior Dev]`

**Objetivo:** Poblar `posters{}`, `genre`, `synopsis_en`, `year` con datos verificados.

**Algoritmo de matching estricto — los 4 criterios deben cumplirse simultáneamente:**

| Criterio | Regla |
|----------|-------|
| Título | Similitud > 0.6 con título TMDB o título original |
| Año | Diferencia ≤ 1 año (si ambos disponibles) |
| Director | Al menos un apellido coincide con crew[job=Director] |
| País | Al menos un país coincide con `production_countries` |

- Si algún criterio falla → el film queda **sin TMDB** (no se asigna ningún dato)
- Los rechazos se loguean para revisión manual
- Se consultan hasta 3 resultados de búsqueda por film antes de descartar
- Se prueban `movie` y `tv` en ese orden

**Campos aceptados de TMDB (solo si vacíos en el JSON):**
- `poster` → `posters{}` dict
- `synopsis_en` → campo en el objeto film
- `genre` → campo en el objeto film (si vacío)
- `year` → campo en el objeto film (si vacío)

**Nota sobre match rate:**
- Match rate > 80% → sospechoso, el algoritmo puede ser demasiado permisivo
- Match rate < 20% → revisar algoritmo de búsqueda o datos de entrada

---

### Fase 4 · Validación automática `[automatizado — validate-festivals.js]`

```bash
node scripts/validate-festivals.js [festival-id]
```

**Gates bloqueantes (exit code 1 = no se hace push):**
- `config{}` presente en el JSON
- Título con 3+ palabras en ALLCAPS
- Cobertura de poster = 0%

**Warnings (no bloquean pero requieren revisión antes del deploy):**
- Cobertura de poster < 95%
- Cobertura de género < 80%
- Duración ≤ 0 o > 400 min
- Venue vacío
- `is_cortos: true` sin `film_list`
- Emoji de sección duplicado (salvo retrospectivas)

---

### Fase 5 · Revisión de roles `[Content Designer · UX Designer · PM]`

**Content Designer:**
- [ ] Títulos en formato correcto (sin ALLCAPS, sin errores tipográficos)
- [ ] Sinopsis en ES revisadas (longitud, tono, coherencia)
- [ ] Géneros en español y consistentes con el catálogo
- [ ] Emojis de sección aprobados

**UX Designer:**
- [ ] Posters correctos en el contexto real de la UI (editorial vs portrait vs generativo)
- [ ] Secciones con sección-color coherente
- [ ] Ningún film con layout roto

**PM:**
- [ ] Informe de cobertura aprobado (poster %, género %, sinopsis %)
- [ ] Sign-off explícito antes del primer deploy público

---

### Fase 6 · Deploy `[Senior Dev]`

1. Push a `main` con commit semántico que incluya métricas de cobertura:
   ```
   feat(festival): festival-id — N films, poster X%, género X%, sinopsis X%
   ```
2. Bump de versión SW para forzar cache refresh en todos los clientes
3. Verificación en dispositivo iOS real (Safari) antes de anunciar

---

## Reglas inmutables

| Regla | Detalle |
|-------|---------|
| `config{}` prohibido en JSON | La configuración vive en `FESTIVAL_CONFIG` en `index.html` siempre |
| Matching TMDB estricto | Los 4 criterios simultáneos — nunca primer resultado sin validar |
| `og:image` en fase 1 | Se captura en extracción, no como parche posterior |
| Day keys ISO | `YYYY-MM-DD` desde Tribeca 2026. Los festivales legacy mantienen su formato pero no se replica |
| Validate antes de push | `validate-festivals.js` no es opcional. Un push que falla se revierte |
| Arquitectura antes de ejecución | El algoritmo de matching, la prioridad de posters y el schema de datos se aprueban antes de implementar |
| Cero decisiones de arquitectura en ejecución | El Data Engineer no decide el criterio de matching — lo aprueba el Senior Dev antes de correr el script |

---

## Deuda técnica por festival

| Festival | Género | Poster | Sinopsis | Pendiente |
|----------|--------|--------|----------|-----------|
| FICCI 65 | 0% | 62% | 75% | TMDB estricto + og:image scraping |
| Cinemancia 2025 | 72% | 71% | 100% | TMDB estricto + og:image scraping |
| AFF 2026 | 65% | 65% | 100% | TMDB estricto + og:image scraping |
| Tribeca 2026 | 93% | 98% | 79% | synopsis_en pendiente |

---

## Historial de errores — para no repetir

| Error | Impacto | Fix aplicado |
|-------|---------|-------------|
| TMDB sin validación | 134 posters falsos (ej. "The Leader" → "The Leader and the Band") | Algoritmo estricto con 4 criterios |
| Scraping incompleto de imágenes | 29 films sin poster a pesar de tener og:image en la web | og:image en fase 1 obligatorio |
| `config{}` en JSON | Configuración ignorada silenciosamente por el engine | Gate bloqueante en validator |
| Títulos en ALLCAPS | ALEJANDRO SANZ, MOUTH FULL OF GOLDS visibles en producción | Gate bloqueante en validator |
| `synopsis_en` de TMDB sin validar | Sinopsis de films incorrectos aparecen en la UI | Misma validación estricta que posters |
