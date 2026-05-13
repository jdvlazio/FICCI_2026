// @ts-check
const { test, expect } = require('@playwright/test');

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Entra al festival Leviza desde el splash */
async function enterLeviza(page) {
  await page.goto('/');
  await page.waitForSelector('.splash-entrar-btn, button:has-text("Entrar")');
  // Seleccionar Leviza si no es el default
  const festName = await page.locator('.splash-sel-name, #splash-sel-name').textContent().catch(() => '');
  if (!festName.includes('Leviza') && !festName.includes('Zapatoca')) {
    await page.locator('.splash-dropdown-btn, [onclick*="splash"]').first().click();
    await page.locator('[data-fest="leviza2026"]').click();
  }
  await page.locator('button:has-text("Entrar")').click();
  await page.waitForSelector('.nav-tab, .poster-card, .plist-item', { timeout: 10000 });
}

/** Entra al festival Tribeca desde el splash */
async function enterTribeca(page) {
  await page.goto('/');
  await page.waitForSelector('button:has-text("Entrar")');
  const festName = await page.locator('.splash-sel-name, #splash-sel-name').textContent().catch(() => '');
  if (!festName.includes('Tribeca')) {
    await page.locator('.splash-dropdown-btn, [onclick*="splash"]').first().click();
    await page.locator('[data-fest="tribeca2026"]').click();
  }
  await page.locator('button:has-text("Entrar")').click();
  await page.waitForSelector('.nav-tab, .poster-card, .plist-item', { timeout: 10000 });
}

/** Agrega un film a watchlist via JS */
async function addToWatchlist(page, title) {
  await page.evaluate((t) => {
    watchlist.clear();
    watchlist.add(t);
    saveState('wl', 'watched');
  }, title);
}

/** Navega a Planear via JS */
async function goToPlanear(page) {
  await page.evaluate(() => {
    cachedResult = null;
    savedAgenda = null;
    switchMainNav('mnav-planner');
    showAgView();
  });
  await page.waitForSelector('.av-calc-btn', { timeout: 5000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1 — Apóstrofe: corazón en lista agrega sin romper
// Bug: safeT con &#39; en onclick rompía el JS silenciosamente
// ─────────────────────────────────────────────────────────────────────────────
test('T01 — apóstrofe: corazón en lista agrega al watchlist', async ({ page }) => {
  await enterTribeca(page);

  // Ir a SAT 6 donde está Whoopi's
  const satTab = page.locator('.nav-tab').filter({ hasText: '6' });
  await satTab.click();
  await page.waitForSelector('.plist-item', { timeout: 5000 });

  // Encontrar el item de Whoopi's
  const whoopi = page.locator('.plist-item[data-title*="Whoopi"]');
  await whoopi.scrollIntoViewIfNeeded();

  // Click en el corazón
  const heart = whoopi.locator('.plist-heart');
  await heart.click();

  // Verificar que está en watchlist
  const inWL = await page.evaluate(() => watchlist.has("Shorts: Whoopi's Wonderful World of Animation"));
  expect(inWL).toBe(true);

  // Verificar que el sheet NO se abrió
  const sheetOpen = await page.locator('#pel-sheet.open').count();
  expect(sheetOpen).toBe(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2 — Apóstrofe: tap en título abre sheet correctamente
// Bug: capture listener abría sheet pero con título roto por apóstrofe
// ─────────────────────────────────────────────────────────────────────────────
test('T02 — apóstrofe: tap en título abre sheet con datos correctos', async ({ page }) => {
  await enterTribeca(page);

  const satTab = page.locator('.nav-tab').filter({ hasText: '6' });
  await satTab.click();
  await page.waitForSelector('.plist-item', { timeout: 5000 });

  const whoopi = page.locator('.plist-item[data-title*="Whoopi"]');
  await whoopi.scrollIntoViewIfNeeded();

  // Click en el título (no en el corazón)
  await whoopi.locator('.plist-info').click();

  // Sheet debe abrirse
  await page.waitForSelector('#pel-sheet.open', { timeout: 5000 });

  // El título en el sheet debe contener Whoopi
  const sheetTitle = await page.locator('.pel-sheet-title, .pel-title').textContent();
  expect(sheetTitle).toContain("Whoopi");
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3 — Ver opciones: aparece sección con resultados
// Bug: ag-result no existía en DOM → runCalc no podía inyectar resultados
// ─────────────────────────────────────────────────────────────────────────────
test('T03 — ver opciones: genera y muestra resultados', async ({ page }) => {
  await enterLeviza(page);
  await addToWatchlist(page, 'La Suprema');
  await goToPlanear(page);

  // Estado B: sección Opciones NO debe estar visible
  const wrap = page.locator('#ag-result-wrap');
  await expect(wrap).toBeHidden();

  // Click en Ver opciones
  await page.locator('.av-calc-btn').click();

  // Sección Opciones debe aparecer con resultados
  await expect(wrap).toBeVisible({ timeout: 15000 });

  // Debe haber al menos un plan
  const planCard = page.locator('.plan-card, [class*="plan-optimo"], .ag-scenario');
  await expect(planCard.first()).toBeVisible({ timeout: 10000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4 — Ver opciones: recalcula al presionar de nuevo
// Bug: segundo click no recalculaba después del fix de ag-result-wrap
// ─────────────────────────────────────────────────────────────────────────────
test('T04 — ver opciones: segundo click recalcula', async ({ page }) => {
  await enterLeviza(page);
  await addToWatchlist(page, 'La Suprema');
  await goToPlanear(page);

  await page.locator('.av-calc-btn').click();
  await page.locator('#ag-result-wrap').waitFor({ state: 'visible', timeout: 15000 });

  // Segundo click
  await page.locator('.av-calc-btn').click();
  await page.locator('#ag-result-wrap').waitFor({ state: 'visible', timeout: 15000 });

  const planCard = page.locator('.plan-card, [class*="plan-optimo"], .ag-scenario');
  await expect(planCard.first()).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5 — Corazón en lista NO abre sheet
// Bug: capture listener con capture:true interceptaba antes del stopPropagation
// ─────────────────────────────────────────────────────────────────────────────
test('T05 — corazón en lista no abre sheet', async ({ page }) => {
  await enterLeviza(page);

  // Ir a vista lista (VIE 15)
  const vieTab = page.locator('.nav-tab').filter({ hasText: '15' });
  await vieTab.click();
  await page.waitForSelector('.plist-item', { timeout: 5000 });

  const firstItem = page.locator('.plist-item').first();
  const heart = firstItem.locator('.plist-heart');
  await heart.click();

  // Sheet NO debe abrirse
  await page.waitForTimeout(500);
  const sheetOpen = await page.locator('#pel-sheet.open').count();
  expect(sheetOpen).toBe(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 6 — Scroll se mantiene después de toggle corazón
// Bug: _renderProgramaContent() hacía re-render completo perdiendo scrollY
// ─────────────────────────────────────────────────────────────────────────────
test('T06 — scroll se mantiene después de toggle corazón en lista', async ({ page }) => {
  await enterLeviza(page);

  const vieTab = page.locator('.nav-tab').filter({ hasText: '15' });
  await vieTab.click();
  await page.waitForSelector('.plist-item', { timeout: 5000 });

  // Scroll hacia abajo
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(300);

  const scrollBefore = await page.evaluate(() => window.scrollY);
  expect(scrollBefore).toBeGreaterThan(200);

  // Click en corazón del último item visible
  const items = page.locator('.plist-item');
  const count = await items.count();
  const target = items.nth(Math.min(3, count - 1));
  await target.locator('.plist-heart').click();

  await page.waitForTimeout(300);
  const scrollAfter = await page.evaluate(() => window.scrollY);

  // Scroll debe mantenerse dentro de ±100px
  expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThan(100);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 7 — Quitar de Intereses desde sheet cierra el sheet
// Bug: mensaje quedaba dentro del sheet, invisible
// ─────────────────────────────────────────────────────────────────────────────
test('T07 — quitar de Intereses desde sheet cierra el sheet', async ({ page }) => {
  await enterLeviza(page);
  await addToWatchlist(page, 'La Suprema');

  // Abrir sheet de La Suprema
  const card = page.locator('.poster-card[data-title="La Suprema"], .plist-item[data-title="La Suprema"]').first();
  await card.click();
  await page.waitForSelector('#pel-sheet.open', { timeout: 5000 });

  // Click en "En Intereses" para quitar
  const wlBtn = page.locator('#pel-wl-btn');
  await expect(wlBtn).toContainText('Intereses');
  await wlBtn.click();

  // Sheet debe cerrarse (~300ms delay + animación)
  await page.waitForTimeout(600);
  const sheetOpen = await page.locator('#pel-sheet.open').count();
  expect(sheetOpen).toBe(0);

  // Film debe haberse quitado del watchlist
  const inWL = await page.evaluate(() => watchlist.has('La Suprema'));
  expect(inWL).toBe(false);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 8 — Festival selector: activo/inminente aparece primero
// Bug: orden era por festivalEndStr descendente — Tribeca (futuro) antes que Leviza (activo)
// ─────────────────────────────────────────────────────────────────────────────
test('T08 — festival selector: Leviza aparece antes que Tribeca', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('button:has-text("Entrar")');

  // Abrir dropdown
  await page.locator('.splash-dropdown-btn, [id*="splash"][class*="btn"]').first().click();
  await page.waitForSelector('.splash-drop-item', { timeout: 3000 });

  const items = page.locator('.splash-drop-item');
  const count = await items.count();
  expect(count).toBeGreaterThan(1);

  // El primer item debe ser Leviza (activo/inminente), no Tribeca
  const firstFest = await items.first().textContent();
  expect(firstFest).toContain('Leviza');
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 9 — Taller is_recurring: las 3 sesiones aparecen en el plan
// Bug: algoritmo elegía una sola sesión del taller en vez de las 3
// ─────────────────────────────────────────────────────────────────────────────
test('T09 — taller recurrente: las 3 sesiones aparecen en el plan', async ({ page }) => {
  await enterLeviza(page);
  await addToWatchlist(page, 'Taller de Guion');
  await goToPlanear(page);

  await page.locator('.av-calc-btn').click();
  await page.locator('#ag-result-wrap').waitFor({ state: 'visible', timeout: 15000 });

  // Debe haber exactamente 3 filas de Taller de Guion en el plan
  const tallerRows = page.locator('[data-title="Taller de Guion"], .mplan-row:has-text("Taller de Guion"), .ag-film-item:has-text("Taller de Guion")');
  const rowCount = await tallerRows.count();
  expect(rowCount).toBe(3);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 10 — Poster editorial: día visible en el poster generado
// Bug: makeProgramPoster truncaba a 28 chars cortando FICCIÓN en FICC
// ─────────────────────────────────────────────────────────────────────────────
test('T10 — poster editorial: sección completa visible sin truncar', async ({ page }) => {
  await enterLeviza(page);

  // En el grid, los posters de Competencia Nacional deben mostrar el día
  const posterCard = page.locator('.poster-card.editorial, .poster-card').first();
  await posterCard.waitFor({ timeout: 5000 });

  // Verificar que no hay texto "FICC" truncado en ningún poster SVG
  const pageContent = await page.content();
  expect(pageContent).not.toContain('>FICC<');
});
