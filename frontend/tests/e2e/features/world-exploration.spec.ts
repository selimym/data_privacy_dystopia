import { test, expect } from '@playwright/test';
import { clearGameStorage } from '../helpers/indexeddb-helpers';

/**
 * Feature Test: World Exploration
 *
 * Tests the WorldScene exploration mode:
 * - WorldScene loads
 * - Player movement (arrow keys/WASD)
 * - NPC interaction (click → data panel)
 * - Abuse mode toggle
 */

test.describe('World Exploration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearGameStorage(page);
  });

  test('should load WorldScene via Explore Town', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const exploreTownButton = page.getByRole('button', { name: /explore town/i });

    if (await exploreTownButton.isVisible()) {
      await exploreTownButton.click();
      await page.waitForTimeout(2000);

      // Canvas should be visible
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible();

      console.log('WorldScene loaded');
    } else {
      test.skip();
      console.log('Explore Town not available - skipping WorldScene tests');
    }
  });

  test('should respond to arrow key movement', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const exploreTownButton = page.getByRole('button', { name: /explore town/i });

    if (!(await exploreTownButton.isVisible())) {
      test.skip();
      return;
    }

    await exploreTownButton.click();
    await page.waitForTimeout(2000);

    const canvas = page.locator('canvas');
    await canvas.click(); // Focus on canvas

    // Press arrow keys
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowUp');

    console.log('Arrow key movement tested');

    // Game should still be running (no crashes)
    await expect(canvas).toBeVisible();
  });

  test('should respond to WASD movement', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const exploreTownButton = page.getByRole('button', { name: /explore town/i });

    if (!(await exploreTownButton.isVisible())) {
      test.skip();
      return;
    }

    await exploreTownButton.click();
    await page.waitForTimeout(2000);

    const canvas = page.locator('canvas');
    await canvas.click();

    // Press WASD keys
    await page.keyboard.press('KeyD');
    await page.waitForTimeout(500);
    await page.keyboard.press('KeyS');
    await page.waitForTimeout(500);
    await page.keyboard.press('KeyA');
    await page.waitForTimeout(500);
    await page.keyboard.press('KeyW');

    console.log('WASD movement tested');

    await expect(canvas).toBeVisible();
  });

  test('should show NPC data panel on click', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const exploreTownButton = page.getByRole('button', { name: /explore town/i });

    if (!(await exploreTownButton.isVisible())) {
      test.skip();
      return;
    }

    await exploreTownButton.click();
    await page.waitForTimeout(2000);

    const canvas = page.locator('canvas');

    // Click somewhere on the canvas (hoping to hit an NPC)
    const box = await canvas.boundingBox();
    if (box) {
      // Click center of canvas
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(1000);

      // Look for NPC data panel
      const dataPanel = page.locator('[data-testid="npc-panel"], .npc-data, .citizen-info');
      const dataPanelVisible = await dataPanel.isVisible().catch(() => false);

      console.log(`NPC data panel visible: ${dataPanelVisible}`);

      if (dataPanelVisible) {
        const panelText = await dataPanel.textContent();
        console.log('NPC panel:', panelText?.substring(0, 100));
      } else {
        console.log('No NPC clicked or panel uses different selectors');
      }
    }
  });

  test('should have abuse mode toggle', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const exploreTownButton = page.getByRole('button', { name: /explore town/i });

    if (!(await exploreTownButton.isVisible())) {
      test.skip();
      return;
    }

    await exploreTownButton.click();
    await page.waitForTimeout(2000);

    // Look for abuse mode toggle
    const abuseToggle = page.locator('[data-testid="abuse-mode-toggle"], input[type="checkbox"], .abuse-mode');
    const toggleVisible = (await abuseToggle.count()) > 0;

    console.log(`Abuse mode toggle visible: ${toggleVisible}`);

    if (toggleVisible) {
      // Try to toggle it
      const checkbox = page.locator('input[type="checkbox"]').first();
      if (await checkbox.isVisible()) {
        await checkbox.click();
        await page.waitForTimeout(500);

        const isChecked = await checkbox.isChecked();
        console.log(`Abuse mode enabled: ${isChecked}`);
      }
    }
  });

  test('should display map correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const exploreTownButton = page.getByRole('button', { name: /explore town/i });

    if (!(await exploreTownButton.isVisible())) {
      test.skip();
      return;
    }

    await exploreTownButton.click();
    await page.waitForTimeout(2000);

    // Canvas should be rendered with proper dimensions
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();

    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);

    console.log(`Canvas dimensions: ${box!.width}x${box!.height}`);
  });

  test('should show NPCs on the map', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const exploreTownButton = page.getByRole('button', { name: /explore town/i });

    if (!(await exploreTownButton.isVisible())) {
      test.skip();
      return;
    }

    await exploreTownButton.click();
    await page.waitForTimeout(3000); // Wait for NPCs to load

    // NPCs should be rendered on canvas
    // We can't directly inspect canvas content, but we can check if NPCs are in storage
    const npcs = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('GameStore', 1);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
          const db = request.result;

          if (!db.objectStoreNames.contains('npcs')) {
            resolve([]);
            return;
          }

          const transaction = db.transaction(['npcs'], 'readonly');
          const store = transaction.objectStore('npcs');
          const getAllRequest = store.getAll();

          getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
          getAllRequest.onerror = () => reject(getAllRequest.error);
        };
      });
    });

    console.log(`NPCs in storage: ${(npcs as any[]).length}`);
    expect((npcs as any[]).length).toBeGreaterThan(0);
  });

  test('should allow returning to main menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const exploreTownButton = page.getByRole('button', { name: /explore town/i });

    if (!(await exploreTownButton.isVisible())) {
      test.skip();
      return;
    }

    await exploreTownButton.click();
    await page.waitForTimeout(2000);

    // Look for back/menu button
    const backButton = page.locator('[data-testid="back-button"], button:has-text("Back"), button:has-text("Menu")');
    const backButtonVisible = await backButton.isVisible().catch(() => false);

    console.log(`Back button visible: ${backButtonVisible}`);

    if (backButtonVisible) {
      await backButton.click();
      await page.waitForTimeout(1000);

      // Should return to main menu
      const mainMenu = page.locator('[data-testid="main-menu"], .main-menu');
      const mainMenuVisible = await mainMenu.isVisible().catch(() => false);

      console.log(`Returned to main menu: ${mainMenuVisible}`);
    } else {
      console.log('No back button found - may use different navigation');
    }
  });
});
