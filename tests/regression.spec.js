// @ts-check
const { test, expect } = require('@playwright/test');

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function enterLeviza(page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  // Select Leviza if not already selected
  const selText = await page.locator('[id*="sel-name"], [class*="sel-name"]').first().textContent({ timeout: 5000 }).catch(() => '');
  if (!selText.toLowerCase().includes('leviza') && !selText.toLowerCase().includes('zapatoca')) {
    await page.locator('[class*="dropdown"], [class*="splash-sel"]').first().click().catch(() => {});
    await page.waitForTimeout(500);
    await page.locator('[data-fest="leviza2026"]').click().catch(async () => {
      await page.locator('button, [role="option"]').filter({ hasText: /leviza|zapatoca/i }).first().click();
    });
    await page.waitForTimeout(300);
  }

  await page.locator('button').filter({ hasText: /entrar/i }).click();
  await page.waitForSelector('.poster-card, .plist-item, .nav-tab', { timeout: 15000 });
}

async function enterTribeca(page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  await page.locator('[class*="dropdown"], [class*="splash-sel"]').first().click().catch(() => {});
  await page.waitForTimeout(500);
  await page.locator('[data-fest="tribeca2026"]').click().catch(async () => {
    await page.locator('button, [role="option"]').filter({ hasText: /tribeca/i }).first().click();
  });
  await page.waitForTimeout(300);

  await page.locator('button').filter({ hasText: /entrar/i }).click();
  await page.waitForSelector('.poster-card, .plist-item, .nav-tab', { timeout: 15000 });
}

async function addToWatchlist(page, title) {
  await page.evaluate((t) => {
    if (typeof watchlist !== 'undefined') {
      watchlist.clear();
      watchlist.add(t);
      if (typeof saveState === 'function') saveState('wl', 'watched');
    }
  }, title);
}

async function goToPlanear(page) {
  await page.evaluate(() => {
    if (typeof cachedResult !== 'undefined') cachedResult = null;
    if (typeof savedAgenda !== 'undefined') savedAgenda = null;
    if (typeof switchMainNav === 'function') switchMainNav('mnav-planner');
    if (typeof showAgView === 'function') showAgView();
  });
  await page.waitForSelector('.av-calc-btn', { timeout: 8000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1 — Apóstrofe: corazón en lista agrega sin romper
// ─────────────────────────────────────────────────────────────────────────────
test('T01 — apóstrofe: corazón en lista agrega al watchlist', async ({ page }) => {
  await enterTribeca(page);

  // Navegar a SAT 6
  await page.locator('.nav-tab').filter({ hasText: /\b6\b/ }).first().click();
  await page.waitForSelector('.plist-item', { timeout: 8000 });

  // Buscar Whoopi
  const whoopi = page.locator('.plist-item[data-title*="Whoopi"]').first();
  await whoopi.scrollIntoViewIfNeeded();
  await whoopi.locator('.plist-heart').click();
  await page.waitForTimeout(500);

  const inWL = await page.evaluate(() =>
    typeof watchlist !== 'undefined' && watchlist.has("Shorts: Whoopi's Wonderful World of Animation")
  );
  expect(inWL).toBe(true);

  // Sheet NO debe abrirse
  expect(await page.locator('#pel-sheet.open').count()).toBe(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2 — Apóstrofe: tap en título abre sheet
// ─────────────────────────────────────────────────────────────────────────────
test('T02 — apóstrofe: tap en título abre sheet', async ({ page }) => {
  await enterTribeca(page);

  await page.locator('.nav-tab').filter({ hasText: /\b6\b/ }).first().click();
  await page.waitForSelector('.plist-item', { timeout: 8000 });

  const whoopi = page.locator('.plist-item[data-title*="Whoopi"]').first();
  await whoopi.scrollIntoViewIfNeeded();
  await whoopi.locator('.plist-info').click();

  await page.waitForSelector('#pel-sheet.open', { timeout: 8000 });
  expect(await page.locator('#pel-sheet.open').count()).toBe(1);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3 — Ver opciones genera resultados
// ─────────────────────────────────────────────────────────────────────────────
test('T03 — ver opciones genera resultados', async ({ page }) => {
  await enterLeviza(page);
  await addToWatchlist(page, 'La Suprema');
  await goToPlanear(page);

  await expect(page.locator('#ag-result-wrap')).toBeHidden({ timeout: 3000 });

  await page.locator('.av-calc-btn').click();
  await expect(page.locator('#ag-result-wrap')).toBeVisible({ timeout: 20000 });

  const content = await page.locator('#ag-result').textContent();
  expect(content?.trim().length).toBeGreaterThan(5);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4 — Ver opciones recalcula al presionar de nuevo
// ─────────────────────────────────────────────────────────────────────────────
test('T04 — ver opciones recalcula al presionar de nuevo', async ({ page }) => {
  await enterLeviza(page);
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
// ─────────────────────────────────────────────────────────────────────────────
test('T05 — corazón en lista no abre sheet', async ({ page }) => {
  await enterLeviza(page);

  await page.locator('.nav-tab').filter({ hasText: /15/ }).first().click();
  await page.waitForSelector('.plist-item', { timeout: 8000 });

  await page.locator('.plist-item').first().locator('.plist-heart').click();
  await page.waitForTimeout(600);

  expect(await page.locator('#pel-sheet.open').count()).toBe(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 6 — Scroll se mantiene después de toggle
// ─────────────────────────────────────────────────────────────────────────────
test('T06 — scroll se mantiene después de toggle corazón', async ({ page }) => {
  await enterLeviza(page);

  await page.locator('.nav-tab').filter({ hasText: /15/ }).first().click();
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
// ─────────────────────────────────────────────────────────────────────────────
test('T07 — quitar de Intereses desde sheet cierra el sheet', async ({ page }) => {
  await enterLeviza(page);
  await addToWatchlist(page, 'La Suprema');

  await page.locator('[data-title="La Suprema"]').first().click();
  await page.waitForSelector('#pel-sheet.open', { timeout: 8000 });

  const wlBtn = page.locator('#pel-wl-btn');
  await expect(wlBtn).toContainText(/intereses/i);
  await wlBtn.click();

  await page.waitForTimeout(700);
  expect(await page.locator('#pel-sheet.open').count()).toBe(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 8 — Festival selector: Leviza antes que Tribeca
// ─────────────────────────────────────────────────────────────────────────────
test('T08 — festival selector: Leviza aparece antes que Tribeca', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  // Abrir dropdown
  await page.locator('[class*="splash"][class*="drop"], [class*="splash-sel"]').first().click().catch(() => {});
  await page.waitForTimeout(1000);

  const items = page.locator('[data-fest]');
  const count = await items.count();

  if (count >= 2) {
    const firstId = await items.first().getAttribute('data-fest');
    expect(firstId).toContain('leviza');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 9 — Taller recurrente: 3 sesiones en el plan
// ─────────────────────────────────────────────────────────────────────────────
test('T09 — taller recurrente: 3 sesiones en el plan', async ({ page }) => {
  await enterLeviza(page);
  await addToWatchlist(page, 'Taller de Guion');
  await goToPlanear(page);

  await page.locator('.av-calc-btn').click();
  await page.locator('#ag-result-wrap').waitFor({ state: 'visible', timeout: 20000 });

  // Verificar 3 sesiones en el resultado
  const plan = await page.evaluate(() => {
    if (typeof cachedResult === 'undefined' || !cachedResult) return 0;
    const scenarios = cachedResult.scenarios || [];
    if (!scenarios.length) return 0;
    const best = scenarios[0];
    return best.filter(s => s._title === 'Taller de Guion').length;
  });
  expect(plan).toBe(3);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 10 — Poster editorial sin truncar
// ─────────────────────────────────────────────────────────────────────────────
test('T10 — poster editorial: sección completa sin truncar', async ({ page }) => {
  await enterLeviza(page);
  await page.waitForSelector('.poster-card', { timeout: 8000 });

  const content = await page.content();
  // "FICC" truncado (sin IÓN) no debe aparecer como texto visible
  expect(content).not.toMatch(/>FICC\s*</);
});
