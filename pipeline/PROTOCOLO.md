# Otrofestiv · Protocolo de producción de festivales

Este documento describe el proceso estándar para montar un festival en la app.
Siempre el mismo proceso — solo cambian los datos.

---

## Lo que necesito de ti para comenzar

### Opción A — PDF del programa de mano
Súbelo directamente en el chat. Necesito que tenga texto seleccionable (no imagen escaneada). Puedo leer grillas de horarios, listas de películas, cualquier formato.

### Opción B — CSV del organizador
Pide al organizador que llene el archivo `/pipeline/csv-template.csv`. Si no es posible, con un Google Sheet o Excel funciona igual — lo pasan a CSV o me lo compartes.

### Información adicional que siempre necesito
- Nombre oficial del festival y año
- Fechas del festival (ej: 11–20 SEP 2025)
- Ciudad / región
- Modo de transporte predominante: `walking` (pueblo/campus) · `mixed` (ciudad con sedes concentradas) · `transit` (ciudad grande, Uber/Metro)
- ID corto para el JSON (ej: `cinemancia-2025`, `aff-2026`)

---

## El pipeline — siempre en este orden

### Paso 1 · Parseo
**Yo produzco:** JSON de films con estructura canónica.
- Cada film único con sus metadatos
- Múltiples funciones en `screenings[]`
- Programas combinados con `is_programa: true`
- Eventos/talleres con `type: "event"`
- Q&A marcado con `has_qa: true`
- Inscripción previa con `requires_registration: true`

**Tú revisas:** que los títulos, directores, horarios y venues sean correctos.

### Paso 2 · Enrichment (TMDB + Letterboxd)
**Yo hago:** abrir `otrofestiv.app/enricher/`, cargar los films, correr TMDB automáticamente, y resolver slugs de Letterboxd desde la tab del browser.
**Tú produces:** JSON con `posters{}` y `lbSlugs{}` listos.

### Paso 3 · Venues
**Yo produzco:** bloque `venues{}` con coordenadas via Nominatim para cada sede.
- Formato de nombre: `"Nombre Sede - Ciudad"` (canónico, siempre igual)
- Coordenadas exactas de la dirección física, no del centro de la ciudad

**Tú revisas:** que los nombres de las sedes coincidan exactamente con los del JSON de films.

### Paso 4 · Ensamblaje
**Yo produzco:** `festivals/nombre-año.json` completo, listo para deploy.

### Paso 5 · Deploy
**Yo hago:** push directo al repo `jdvlazio/Otrofestiv.app` via GitHub API.
**Resultado:** festival disponible en `otrofestiv.app` en ~2 minutos.

---

## Convenciones que nunca cambian

### Nombres de venues
Siempre: `"Nombre de la Sede - Ciudad"`
```
"Cine MAMM - Medellín"
"Teatro Caribe - Itagüí"
"Teatro Otraparte - Envigado"
"Plaza Bocagrande - Cartagena"
```

### Días
Siempre el formato del festival en español con número: `"VIE 12"`, `"SÁB 13"`, `"DOM 14"`

### Horarios
Siempre 24h con dos dígitos: `"17:00"`, `"09:30"`, `"21:00"`

### Duración
Siempre con `min`: `"147 min"`, `"90 min"`

### Flags
Siempre emoji de banderas: `"🇨🇴"`, `"🇦🇷🇫🇷"`

---

## Festivales en producción

| Festival | ID | Archivo | Estado |
|---|---|---|---|
| AFF 2026 | `aff2026` | `festivals/aff-2026.json` | ✓ Activo |
| FICCI 65 | `ficci65` | `festivals/ficci-65.json` | ✓ Archivado |

## Próximos festivales

| Festival | Fecha estimada | Estado |
|---|---|---|
| Festival de Cine de Jardín | Sep 2026 | Por confirmar |
| Cinemancia 6ta edición | Sep 2026 | Por confirmar |

---

## Archivos de referencia en este repositorio

```
/pipeline/
  PROTOCOLO.md          ← este archivo
  festival-template.json ← molde JSON vacío con comentarios
  csv-template.csv       ← template para organizadores

/festivals/
  aff-2026.json          ← AFF 2026 (producción)
  ficci-65.json          ← FICCI 65 (archivado)

/ARQUITECTURA.md         ← documentación técnica completa del sistema
/backstage/index.html    ← herramienta de producción (venues, revisión, deploy)
/enricher/index.html     ← enricher de películas (TMDB + Letterboxd)
```
