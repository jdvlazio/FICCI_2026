// @ts-check
const { test, expect } = require('@playwright/test');

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — selectores exactos del DOM de Otrofestiv
// ─────────────────────────────────────────────────────────────────────────────

async function selectFestival(page, festId) {
  // Abrir dropdown
  await page.locator('#splash-sel-btn').click();
  await page.waitForSelector('#splash-dropdown', { state: 'visible', timeout: 5000 });
  // Seleccionar festival
  await page.locator(`.splash-drop-item[data-fest="${festId}"]`).click();
  await page.waitForTimeout(300);
}

async function enterFestival(page, festId) {
  await page.goto('/');
  await page.waitForSelector('#splash-sel-btn', { timeout: 15000 });

  // Comprobar si ya está seleccionado
  const currentFest = await page.locator('#splash-sel-btn').getAttribute('data-current-fest').catch(() => null);
  const selName = await page.locator('#splash-sel-name').textContent().catch(() => '');

  if (!selName.toLowerCase().includes(festId.replace(/\d+/g, '').toLowerCase())) {
    await selectFestival(page, festId);
  }

  await page.locator('.splash-enter-btn').click();
  await page.waitForSelector('.poster-card, .plist-item, .dtab', { timeout: 15000 });
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
  await enterFestival(page, 'leviza2026');
  await addToWatchlist(page, 'La Suprema');
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
  await enterFestival(page, 'leviza2026');
  await addToWatchlist(page, 'La Suprema');
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
  await enterFestival(page, 'leviza2026');

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
  await enterFestival(page, 'leviza2026');

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
  await enterFestival(page, 'leviza2026');
  await addToWatchlist(page, 'La Suprema');

  await page.locator('[data-title="La Suprema"]').first().click();
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
  await enterFestival(page, 'leviza2026');
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
  await enterFestival(page, 'leviza2026');
  await page.waitForSelector('.poster-card', { timeout: 8000 });

  const content = await page.content();
  expect(content).not.toMatch(/>FICC\s*</);
});
