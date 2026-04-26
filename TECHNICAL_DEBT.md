# Deuda Técnica — Otrofestiv

## 1. Sistema de Posters — Arquitectura Incompleta

**Fecha:** 26 Abr 2026  
**Prioridad:** Alta  

### Estado actual
Los posters de películas se obtienen de `posters{}` en el JSON del festival — un mapa de título → URL de TMDB hardcodeada manualmente. Cada vez que se agrega una película nueva, alguien debe:
1. Buscar el TMDB ID
2. Encontrar el poster path en TMDB
3. Hardcodearlo en `festivals/aff-2026.json`

### El problema
- Proceso manual → propenso a errores (demostrado con Homebound y A Sad and Beautiful World el 26 Abr 2026)
- Múltiples fuentes de poster pueden coexistir y contradecirse (`posters{}`, `tmdb_id` en film, `CUSTOM_POSTERS`, `SHORT_IMGS`)
- Viola Single Source of Truth

### La arquitectura correcta
```
build.js
  → lee festivals/*.json
  → para cada film con tmdb_id, hace fetch a TMDB API en build-time
  → embebe las URLs de poster en el bundle
  → sin requests en runtime, sin race conditions, sin pasos manuales
```

Cada film solo necesita:
```json
{ "title": "Homebound", "tmdb_id": 1227739 }
```

### Por qué no está implementado
El servidor de build de Claude tiene un allowlist de dominios que no incluye `api.themoviedb.org`. El build-time fetch requiere correr `build.js` localmente o en GitHub Actions donde TMDB sí es accesible.

### Próximos pasos
1. Mover el build a GitHub Actions con acceso a TMDB
2. En `build.js`: para cada film con `tmdb_id`, fetchear el poster path y embeber la URL
3. Eliminar `posters{}` del JSON — reemplazar por `tmdb_id` en cada film
4. Eliminar `SHORT_IMGS`, `CUSTOM_POSTERS` del código — consolidar en un solo lookup
5. Films sin TMDB (cortos, eventos, talleres) → poster generativo, sin campo `tmdb_id`

### Impacto si no se resuelve
Cada festival nuevo requiere búsqueda manual de poster paths. Error humano garantizado a medida que crece el número de festivales y películas.

---

## 2. Build desde Servidor de Claude — Limitaciones de Red

**Fecha:** 26 Abr 2026  
**Prioridad:** Media  

El build corre en el servidor de Claude con allowlist restringida:
- ✓ github.com, npmjs.org, pypi.org (build/deploy)
- ✗ api.themoviedb.org (posters)
- ✗ api.anthropic.com solo para Claude

Mover el build a GitHub Actions daría acceso completo a red y resolvería la deuda #1.
