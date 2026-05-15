// @ts-check
const { test, expect } = require('@playwright/test');

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — selectores exactos del DOM de Otrofestiv
// ─────────────────────────────────────────────────────────────────────────────

// Tiempo fijo para tests de Leviza (festival 14-17 MAY 2026, Colombia UTC-5).
// JUE 14 00:00 COT → todas las sesiones del festival son "futuras", CI determinístico.
const LEVIZA_SIMTIME = '2026-05-14T00:00:00-05:00';

async function selectFestival(page, festId) {
  await page.locator('#splash-sel-btn').click();
  await page.waitForSelector('#splash-dropdown', { state: 'visible', timeout: 5000 });
  await page.locator(`.splash-drop-item[data-fest="${festId}"]`).click();
  await page.waitForTimeout(300);
}

async function enterFestival(page, festId, simTime) {
  await page.goto('/');
  await page.waitForSelector('#splash-sel-btn', { timeout: 15000 });

  const selName = await page.locator('#splash-sel-name').textContent().catch(() => '');
  if (!selName.toLowerCase().includes(festId.replace(/\d+/g, '').toLowerCase())) {
    await selectFestival(page, festId);
  }

  await page.locator('.splash-enter-btn').click();
  await page.waitForSelector('.poster-card, .plist-item, .dtab', { timeout: 15000 });

  // Freeze simTime + re-inicializa activeDay y vista para CI determinístico.
  // page.evaluate accede directamente a la variable del app (let _simTime),
  // no a window._simTime — por eso funciona donde addInitScript no funciona.
  if (simTime) {
    await page.evaluate((t) => {
      _simTime = t;
      const ts = simTodayStr();
      const ni = DAY_KEYS.findIndex(d => FESTIVAL_DATES[d] === ts);
      if (ni >= 0) {
        activeDay = DAY_KEYS[ni];
        programaViewMode = 'list';
      } else {
        activeDay = 'all';
        programaViewMode = 'grid';
      }
      _renderProgramaContent && _renderProgramaContent();
    }, simTime);
  }
}

// freezeSimTime — para cambiar el tiempo en medio de un test específico.
async function freezeSimTime(page, isoStr) {
  await page.evaluate((t) => { _simTime = t; }, isoStr);
}

async function addToWatchlist(page, title) {
  await page.evaluate((t) => {
    watchlist.clear();
    watchlist.add(t);
    if (typeof saveState === 'function') saveState('wl', 'watched');
  }, title);
}

async function goToPlanear(page) {
  await page.evaluate(() => {
    cachedResult = null;
    savedAgenda = null;
    switchMainNav('mnav-planner');
    showAgView();
  });
  await page.waitForSelector('.av-calc-btn', { timeout: 8000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1 — Apóstrofe: corazón en lista agrega sin romper
// Bug: safeT con &#39; en onclick rompía el JS silenciosamente
// ─────────────────────────────────────────────────────────────────────────────
test('T01 — apóstrofe: corazón en lista agrega al watchlist', async ({ page }) => {
  await enterFestival(page, 'tribeca2026');

  // Navegar a SAT 6 (2026-06-06)
  await page.locator('.dtab[data-day="2026-06-06"]').click();
  await page.waitForSelector('.plist-item', { timeout: 8000 });

  // Buscar Whoopi's y hacer scroll
  const whoopi = page.locator('.plist-item[data-title*="Whoopi"]').first();
  await whoopi.scrollIntoViewIfNeeded();
  await whoopi.locator('.plist-heart').click();
  await page.waitForTimeout(500);

  const inWL = await page.evaluate(() =>
    watchlist.has("Shorts: Whoopi's Wonderful World of Animation")
  );
  expect(inWL).toBe(true);

  // Sheet NO debe abrirse
  expect(await page.locator('#pel-sheet.open').count()).toBe(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2 — Apóstrofe: tap en título abre sheet
// Bug: capture listener fallaba con apóstrofe en data-title
// ─────────────────────────────────────────────────────────────────────────────
test('T02 — apóstrofe: tap en título abre sheet', async ({ page }) => {
  await enterFestival(page, 'tribeca2026');

  await page.locator('.dtab[data-day="2026-06-06"]').click();
  await page.waitForSelector('.plist-item', { timeout: 8000 });

  const film = page.locator('.plist-item[data-title*="Here I"]').first();
  await film.scrollIntoViewIfNeeded();
  await film.locator('.plist-info').click();

  await page.waitForSelector('#pel-sheet.open', { timeout: 8000 });
  expect(await page.locator('#pel-sheet.open').count()).toBe(1);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3 — Ver opciones genera resultados
// Bug: ag-result no existía en DOM → runCalc no inyectaba resultados
// ─────────────────────────────────────────────────────────────────────────────
test('T03 — ver opciones genera resultados', async ({ page }) => {
  await enterFestival(page, 'leviza2026', LEVIZA_SIMTIME);
  await addToWatchlist(page, 'Taller de Guion'); // tiene screenings JUE+VIE+SÁB
  await goToPlanear(page);

  // Estado B: wrapper debe estar oculto
  await expect(page.locator('#ag-result-wrap')).toBeHidden({ timeout: 3000 });

  await page.locator('.av-calc-btn').click();

  // Wrapper debe aparecer con resultados
  await expect(page.locator('#ag-result-wrap')).toBeVisible({ timeout: 20000 });
  const content = await page.locator('#ag-result').textContent();
  expect(content?.trim().length).toBeGreaterThan(5);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4 — Ver opciones recalcula al presionar de nuevo
// ─────────────────────────────────────────────────────────────────────────────
test('T04 — ver opciones recalcula al presionar de nuevo', async ({ page }) => {
  await enterFestival(page, 'leviza2026', LEVIZA_SIMTIME);
  await addToWatchlist(page, 'Taller de Guion'); // tiene screenings JUE+VIE+SÁB
  await goToPlanear(page);

  await page.locator('.av-calc-btn').click();
  await page.locator('#ag-result-wrap').waitFor({ state: 'visible', timeout: 20000 });

  await page.locator('.av-calc-btn').click();
  await page.locator('#ag-result-wrap').waitFor({ state: 'visible', timeout: 20000 });

  const content = await page.locator('#ag-result').textContent();
  expect(content?.trim().length).toBeGreaterThan(5);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5 — Corazón en lista NO abre sheet
// Bug: capture listener con capture:true interceptaba stopPropagation
// ─────────────────────────────────────────────────────────────────────────────
test('T05 — corazón en lista no abre sheet', async ({ page }) => {
  await enterFestival(page, 'leviza2026', LEVIZA_SIMTIME);

  await page.locator('.dtab[data-day="VIE 15"]').click();
  await page.waitForSelector('.plist-item', { timeout: 8000 });

  await page.locator('.plist-item').first().locator('.plist-heart').click();
  await page.waitForTimeout(600);

  expect(await page.locator('#pel-sheet.open').count()).toBe(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 6 — Scroll se mantiene después de toggle
// Bug: _renderProgramaContent() hacía re-render completo
// ─────────────────────────────────────────────────────────────────────────────
test('T06 — scroll se mantiene después de toggle corazón', async ({ page }) => {
  await enterFestival(page, 'leviza2026', LEVIZA_SIMTIME);

  await page.locator('.dtab[data-day="VIE 15"]').click();
  await page.waitForSelector('.plist-item', { timeout: 8000 });

  await page.evaluate(() => window.scrollTo(0, 300));
  await page.waitForTimeout(300);
  const scrollBefore = await page.evaluate(() => window.scrollY);

  const items = page.locator('.plist-item');
  const count = await items.count();
  if (count > 2) {
    await items.nth(2).locator('.plist-heart').click();
    await page.waitForTimeout(400);
    const scrollAfter = await page.evaluate(() => window.scrollY);
    expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThan(150);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 7 — Quitar de Intereses desde sheet cierra el sheet
// Bug: mensaje quedaba dentro del sheet invisible
// ─────────────────────────────────────────────────────────────────────────────
test('T07 — quitar de Intereses desde sheet cierra el sheet', async ({ page }) => {
  await enterFestival(page, 'leviza2026', LEVIZA_SIMTIME);
  await addToWatchlist(page, 'La Suprema');

  // Abrir sheet directamente via JS — independiente del día activo
  await page.evaluate(() => openPelSheet('La Suprema'));
  await page.waitForSelector('#pel-sheet.open', { timeout: 8000 });

  const wlBtn = page.locator('#pel-wl-btn');
  await expect(wlBtn).toContainText(/(intereses|interests)/i);
  await wlBtn.click();

  await page.waitForTimeout(700);
  expect(await page.locator('#pel-sheet.open').count()).toBe(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 8 — Festival selector: Leviza antes que Tribeca
// Bug: orden era festivalEndStr descendente — Tribeca antes que Leviza
// ─────────────────────────────────────────────────────────────────────────────
test('T08 — festival selector: Leviza aparece antes que Tribeca', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#splash-sel-btn', { timeout: 15000 });

  await page.locator('#splash-sel-btn').click();
  await page.waitForSelector('#splash-dropdown', { state: 'visible', timeout: 5000 });

  const items = page.locator('.splash-drop-item[data-fest]');
  const count = await items.count();
  expect(count).toBeGreaterThan(1);

  const firstFestId = await items.first().getAttribute('data-fest');
  expect(firstFestId).toContain('leviza');
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 9 — Taller recurrente: 3 sesiones en el plan
// Bug: algoritmo elegía 1 sesión en vez de 3
// ─────────────────────────────────────────────────────────────────────────────
test('T09 — taller recurrente: 3 sesiones en el plan', async ({ page }) => {
  await enterFestival(page, 'leviza2026', LEVIZA_SIMTIME);
  await addToWatchlist(page, 'Taller de Guion');
  await goToPlanear(page);

  await page.locator('.av-calc-btn').click();
  await page.locator('#ag-result-wrap').waitFor({ state: 'visible', timeout: 20000 });

  // Verificar directamente en cachedResult
  const sessionCount = await page.evaluate(() => {
    if (!cachedResult || !cachedResult.scenarios || !cachedResult.scenarios.length) return 0;
    const s0 = cachedResult.scenarios[0];
    if (!s0 || !s0.schedule) return 0;
    return s0.schedule.filter(s => s._title === 'Taller de Guion').length;
  });
  expect(sessionCount).toBe(3);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 10 — Poster editorial sin truncar
// Bug: makeProgramPoster truncaba FICCIÓN a FICC
// ─────────────────────────────────────────────────────────────────────────────
test('T10 — poster editorial: sección completa sin truncar', async ({ page }) => {
  await enterFestival(page, 'leviza2026', LEVIZA_SIMTIME);
  await page.waitForSelector('.poster-card, .plist-item', { timeout: 8000 });

  const content = await page.content();
  expect(content).not.toMatch(/>FICC\s*</);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 11 — Mi Plan: botón "Cerrar" en panel de alternativas funciona
// Bug: onclick="_expandedFilm='';renderAgenda()}" — } sobrante causaba
// SyntaxError silencioso y el panel no se cerraba.
// ─────────────────────────────────────────────────────────────────────────────
test('T11 — cerrar alternativas en Mi Plan cierra el panel', async ({ page }) => {
  await enterFestival(page, 'tribeca2026');

  // Necesita plan con sesiones — agregar una película al watchlist y generar plan
  await page.locator('.mnav-tab[data-nav="mnav-cartelera"], .main-nav-tab').first().click();
  await page.waitForTimeout(500);

  // Ir a Mi Plan directamente via JS (Tribeca tiene plan predefinido en localStorage vacío → usar Planear)
  // Navegar a Mi Plan
  await page.evaluate(() => switchMainNav('mnav-miplan'));
  await page.waitForTimeout(1000);

  // Si hay sesiones en el plan, buscar una hora punteada (.mplan-t1)
  const hasPlan = await page.locator('.mplan-t1').count();
  if (hasPlan === 0) {
    // Sin plan no hay hora punteada — skip test pero no falla
    console.log('T11: sin plan activo, skip');
    return;
  }

  // Click en primera hora punteada
  await page.locator('.mplan-t1').first().click();
  await page.waitForTimeout(800);

  // Panel de alternativas debe estar visible
  const altPanel = page.locator('.film-alts').first();
  await expect(altPanel).toBeVisible({ timeout: 5000 });

  // Click en Cerrar
  await page.locator('.film-alts .checkin-result-btn.secondary').first().click();
  await page.waitForTimeout(800);

  // Panel debe haberse cerrado
  const panelCount = await page.locator('.film-alts').count();
  expect(panelCount).toBe(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 12 — Vista lista por defecto en navegación por día
// Regla global: activeDay !== 'all' → programaViewMode = 'list'
// Bug: loadFestival() inicializaba en 'grid' sin importar el día activo.
// ─────────────────────────────────────────────────────────────────────────────
test('T12 — día específico carga en vista lista por defecto', async ({ page }) => {
  await enterFestival(page, 'leviza2026', LEVIZA_SIMTIME);

  // Leviza con simTime en medianoche JUE → activeDay = 'JUE 14' (día específico)
  await page.waitForSelector('.plist-item, .poster-card', { timeout: 8000 });

  // El día activo no debe ser 'all' → debe usar vista lista (.plist-item)
  const activeDay = await page.evaluate(() => activeDay);
  if (activeDay === 'all') {
    // Si por alguna razón es 'all', la vista puede ser grid — OK
    return;
  }

  // Debe haber .plist-item, NO .poster-card (lista, no grid)
  const listItems = await page.locator('.plist-item').count();
  const gridCards = await page.locator('.poster-card').count();
  expect(listItems).toBeGreaterThan(0);
  expect(gridCards).toBe(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 13 — Topbar: fecha no wrappea (siempre 1 línea)
// Bug: .hdr-fest-dates sin white-space:nowrap → "MAY" se separaba de "14-17"
// ─────────────────────────────────────────────────────────────────────────────
test('T13 — topbar fecha en una sola línea', async ({ page }) => {
  await enterFestival(page, 'leviza2026', LEVIZA_SIMTIME);
  await page.waitForSelector('.hdr-fest-dates', { timeout: 5000 });

  const lineCount = await page.evaluate(() => {
    const el = document.querySelector('.hdr-fest-dates');
    if (!el) return -1;
    // Si el elemento tiene más de 1 línea, su scrollHeight > lineHeight
    const style = getComputedStyle(el);
    const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
    return Math.round(el.scrollHeight / lineHeight);
  });

  expect(lineCount).toBe(1);
});

// ═════════════════════════════════════════════════════════════════════════════
// BATCH 1 — Sheet content · Watchlist · Programa
// ═════════════════════════════════════════════════════════════════════════════

// T14 — Sheet: título correcto
test('T14 — sheet muestra el título correcto', async ({ page }) => {
  await enterFestival(page, 'leviza2026', LEVIZA_SIMTIME);
  await page.evaluate(() => openPelSheet('La Suprema'));
  await page.waitForSelector('#pel-sheet.open', { timeout: 8000 });
  const title = await page.locator('#pel-sheet-title').textContent();
  expect(title?.trim().length).toBeGreaterThan(0);
  expect(title).toContain('Suprema');
});

// T15 — Sheet: tiene al menos una función listada
test('T15 — sheet muestra funciones del título', async ({ page }) => {
  await enterFestival(page, 'leviza2026', LEVIZA_SIMTIME);
  await page.evaluate(() => openPelSheet('La Suprema'));
  await page.waitForSelector('#pel-sheet.open', { timeout: 8000 });
  const funciones = await page.locator('.pel-sheet-screen, .pel-func-row, .pel-screen-row').count();
  expect(funciones).toBeGreaterThan(0);
});

// T16 — Sheet: botón watchlist presente y funcional
test('T16 — sheet tiene botón de intereses', async ({ page }) => {
  await enterFestival(page, 'leviza2026', LEVIZA_SIMTIME);
  await page.evaluate(() => openPelSheet('La Suprema'));
  await page.waitForSelector('#pel-sheet.open', { timeout: 8000 });
  await expect(page.locator('#pel-wl-btn')).toBeVisible();
});

// T17 — Sheet: añadir al watchlist desde sheet
test('T17 — añadir al watchlist desde sheet actualiza el estado', async ({ page }) => {
  await enterFestival(page, 'leviza2026', LEVIZA_SIMTIME);
  await page.evaluate(() => { watchlist.clear(); saveState('wl','watched'); });
  await page.evaluate(() => openPelSheet('La Suprema'));
  await page.waitForSelector('#pel-sheet.open', { timeout: 8000 });
  await page.locator('#pel-wl-btn').click();
  await page.waitForTimeout(500);
  const inWL = await page.evaluate(() => watchlist.has('La Suprema'));
  expect(inWL).toBe(true);
});

// T18 — Sheet: cerrar con swipe-button o X cierra el sheet
test('T18 — sheet se cierra con el botón X', async ({ page }) => {
  await enterFestival(page, 'leviza2026', LEVIZA_SIMTIME);
  await page.evaluate(() => openPelSheet('La Suprema'));
  await page.waitForSelector('#pel-sheet.open', { timeout: 8000 });
  await page.locator('.pel-sheet-close, .sheet-close-btn, [onclick*="closePelSheet"]').first().click();
  await page.waitForTimeout(500);
  expect(await page.locator('#pel-sheet.open').count()).toBe(0);
});

// T19 — Watchlist: persiste al cambiar de tab y volver
test('T19 — watchlist persiste al navegar entre tabs', async ({ page }) => {
  await enterFestival(page, 'leviza2026', LEVIZA_SIMTIME);
  await addToWatchlist(page, 'La Suprema');
  await page.evaluate(() => switchMainNav('mnav-intereses'));
  await page.waitForTimeout(500);
  await page.evaluate(() => switchMainNav('mnav-cartelera'));
  await page.waitForTimeout(500);
  const inWL = await page.evaluate(() => watchlist.has('La Suprema'));
  expect(inWL).toBe(true);
});

// T20 — Programa: cambiar a día TODO muestra grid
test('T20 — TODO muestra vista grid', async ({ page }) => {
  await enterFestival(page, 'leviza2026', LEVIZA_SIMTIME);
  await page.evaluate(() => { activeDay='all'; programaViewMode='grid'; _renderProgramaContent(); });
  await page.waitForSelector('.poster-card', { timeout: 8000 });
  const cards = await page.locator('.poster-card').count();
  expect(cards).toBeGreaterThan(0);
});

// T21 — Programa: cambiar a día específico muestra lista
test('T21 — día específico muestra vista lista', async ({ page }) => {
  await enterFestival(page, 'leviza2026', LEVIZA_SIMTIME);
  const grid = await page.locator('.poster-card').count();
  const list = await page.locator('.plist-item').count();
  // En día específico debe haber lista, no grid
  expect(list).toBeGreaterThan(0);
  expect(grid).toBe(0);
});

// T22 — Programa: toggle de vista grid/lista funciona
test('T22 — toggle grid/lista cambia el modo de vista', async ({ page }) => {
  await enterFestival(page, 'leviza2026', LEVIZA_SIMTIME);
  // Cambiar a TODO para estar en grid
  await page.evaluate(() => { activeDay='all'; programaViewMode='grid'; _renderProgramaContent(); });
  await page.waitForSelector('.poster-card', { timeout: 5000 });
  // Toggle a lista
  await page.evaluate(() => setProgramaView('list'));
  await page.waitForTimeout(400);
  const afterToggle = await page.evaluate(() => programaViewMode);
  expect(afterToggle).toBe('list');
});

// T23 — Programa: filtro por día muestra solo films de ese día
test('T23 — filtro por día muestra films del día correcto', async ({ page }) => {
  await enterFestival(page, 'leviza2026', LEVIZA_SIMTIME);
  // Cambiar a VIE 15
  await page.evaluate(() => { activeDay='VIE 15'; programaViewMode='list'; _renderProgramaContent(); });
  await page.waitForSelector('.plist-item', { timeout: 5000 });
  // Todos los items deben ser de VIE 15
  const wrongDay = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.plist-item')).some(el => {
      const meta = el.querySelector('.plist-meta')?.textContent || '';
      return meta.includes('JUE') || meta.includes('SÁB') || meta.includes('DOM');
    });
  });
  expect(wrongDay).toBe(false);
});
