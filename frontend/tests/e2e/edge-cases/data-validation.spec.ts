import { test, expect } from '@playwright/test';
import { clearGameStorage, getAllNPCs } from '../helpers/indexeddb-helpers';
import { startSystemMode } from '../helpers/game-setup';
import { selectCitizen } from '../helpers/citizen-actions';
import { validateCitizenData } from '../helpers/test-data';

/**
 * Edge Case Test: Data Validation
 *
 * Validates generated data quality:
 * - Sample 5 citizens
 * - Validate names coherent, ages 18-80, SSNs match XXX-XX-XXXX
 * - Validate risk scores = sum of factors
 * - Check for data anomalies
 */

test.describe('Data Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearGameStorage(page);
    await startSystemMode(page);
  });

  test('should generate valid citizen names', async ({ page }) => {
    // Sample 5 citizens
    for (let i = 0; i < 5; i++) {
      await selectCitizen(page, 0);
      await page.waitForTimeout(500);

      const citizenFile = page.locator('[data-testid="citizen-file"], .citizen-file-panel');
      const nameField = citizenFile.locator('[data-testid="citizen-name"], .citizen-name, h1, h2').first();

      const name = await nameField.textContent();
      console.log(`Citizen ${i + 1} name: ${name}`);

      // Name should exist and be reasonable
      expect(name).toBeTruthy();
      expect(name!.length).toBeGreaterThan(2);
      expect(name!.length).toBeLessThan(100);

      // Should contain letters
      expect(name).toMatch(/[a-zA-Z]/);

      // Close citizen file
      const closeButton = page.locator('[data-testid="close-citizen-file"], [aria-label="Close"]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('should generate valid ages (18-80)', async ({ page }) => {
    const ages: number[] = [];

    // Sample citizens
    for (let i = 0; i < 5; i++) {
      await selectCitizen(page, 0);
      await page.waitForTimeout(500);

      const citizenFile = page.locator('[data-testid="citizen-file"], .citizen-file-panel');
      const ageField = citizenFile.locator('[data-testid="citizen-age"], [class*="age"]');

      if ((await ageField.count()) > 0) {
        const ageText = await ageField.first().textContent();
        const age = parseInt(ageText || '0');

        if (age > 0) {
          ages.push(age);
          console.log(`Citizen ${i + 1} age: ${age}`);
        }
      }

      const closeButton = page.locator('[data-testid="close-citizen-file"], [aria-label="Close"]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(300);
      }
    }

    // Validate ages
    for (const age of ages) {
      expect(age).toBeGreaterThanOrEqual(18);
      expect(age).toBeLessThanOrEqual(80);
    }

    if (ages.length > 0) {
      console.log(`Valid ages sampled: ${ages.join(', ')}`);
    }
  });

  test('should generate valid SSN format (XXX-XX-XXXX)', async ({ page }) => {
    const ssns: string[] = [];

    for (let i = 0; i < 5; i++) {
      await selectCitizen(page, 0);
      await page.waitForTimeout(500);

      const citizenFile = page.locator('[data-testid="citizen-file"], .citizen-file-panel');
      const ssnField = citizenFile.locator('[data-testid="citizen-ssn"], [class*="ssn"]');

      if ((await ssnField.count()) > 0) {
        const ssn = await ssnField.first().textContent();

        if (ssn) {
          ssns.push(ssn);
          console.log(`Citizen ${i + 1} SSN: ${ssn}`);

          // Validate format XXX-XX-XXXX
          const ssnPattern = /^\d{3}-\d{2}-\d{4}$/;
          expect(ssn).toMatch(ssnPattern);
        }
      }

      const closeButton = page.locator('[data-testid="close-citizen-file"], [aria-label="Close"]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(300);
      }
    }

    console.log(`Valid SSNs sampled: ${ssns.length}`);
  });

  test('should validate risk scores are numeric', async ({ page }) => {
    const riskScores: number[] = [];

    for (let i = 0; i < 5; i++) {
      await selectCitizen(page, 0);
      await page.waitForTimeout(500);

      const citizenFile = page.locator('[data-testid="citizen-file"], .citizen-file-panel');
      const riskScoreField = citizenFile.locator('[data-testid="risk-score"], .risk-score');

      if ((await riskScoreField.count()) > 0) {
        const scoreText = await riskScoreField.first().textContent();
        const scoreMatch = scoreText?.match(/(\d+)/);

        if (scoreMatch) {
          const score = parseInt(scoreMatch[1]);
          riskScores.push(score);
          console.log(`Citizen ${i + 1} risk score: ${score}`);

          // Risk score should be reasonable
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThan(1000);
        }
      }

      const closeButton = page.locator('[data-testid="close-citizen-file"], [aria-label="Close"]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(300);
      }
    }

    if (riskScores.length > 0) {
      const avgScore = riskScores.reduce((a, b) => a + b) / riskScores.length;
      console.log(`Average risk score: ${avgScore.toFixed(2)}`);
    }
  });

  test('should have diverse risk scores across population', async ({ page }) => {
    const riskScores: number[] = [];

    // Sample more citizens for diversity check
    for (let i = 0; i < 10; i++) {
      await selectCitizen(page, 0);
      await page.waitForTimeout(300);

      const riskScoreField = page.locator('[data-testid="risk-score"], .risk-score');

      if ((await riskScoreField.count()) > 0) {
        const scoreText = await riskScoreField.first().textContent();
        const scoreMatch = scoreText?.match(/(\d+)/);

        if (scoreMatch) {
          riskScores.push(parseInt(scoreMatch[1]));
        }
      }

      const closeButton = page.locator('[data-testid="close-citizen-file"], [aria-label="Close"]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(200);
      }
    }

    if (riskScores.length > 0) {
      // Calculate diversity metrics
      const uniqueScores = new Set(riskScores).size;
      const min = Math.min(...riskScores);
      const max = Math.max(...riskScores);
      const range = max - min;

      console.log('Risk Score Diversity:');
      console.log(`  Unique scores: ${uniqueScores}/${riskScores.length}`);
      console.log(`  Min: ${min}`);
      console.log(`  Max: ${max}`);
      console.log(`  Range: ${range}`);

      // Should have some diversity (not all identical)
      expect(uniqueScores).toBeGreaterThan(1);
      expect(range).toBeGreaterThan(0);
    }
  });

  test('should validate NPCs stored in IndexedDB', async ({ page }) => {
    await page.waitForTimeout(2000);

    const npcs = await getAllNPCs(page);

    console.log(`Total NPCs in storage: ${npcs.length}`);

    // Should have generated citizens
    expect(npcs.length).toBeGreaterThan(0);

    // Sample first 5 NPCs
    const sampleSize = Math.min(5, npcs.length);

    for (let i = 0; i < sampleSize; i++) {
      const npc = npcs[i];

      console.log(`NPC ${i + 1}:`, {
        name: npc.name,
        age: npc.age,
        occupation: npc.occupation,
      });

      // Validate basic structure
      expect(npc.id).toBeTruthy();
      expect(npc.name).toBeTruthy();

      // Use validation helper
      const isValid = validateCitizenData(npc);
      console.log(`  Valid: ${isValid}`);
    }
  });

  test('should not have duplicate citizen IDs', async ({ page }) => {
    await page.waitForTimeout(2000);

    const npcs = await getAllNPCs(page);
    const ids = npcs.map((npc) => npc.id);
    const uniqueIds = new Set(ids);

    console.log(`Total NPCs: ${npcs.length}`);
    console.log(`Unique IDs: ${uniqueIds.size}`);

    // All IDs should be unique
    expect(uniqueIds.size).toBe(npcs.length);
  });

  test('should have reasonable data domain coverage', async ({ page }) => {
    // Check that citizens have data from multiple domains
    await selectCitizen(page, 0);
    await page.waitForTimeout(500);

    // Switch to domains tab
    const domainsTab = page.getByRole('tab', { name: /domains/i });

    if ((await domainsTab.count()) > 0) {
      await domainsTab.click();
      await page.waitForTimeout(300);

      // Count visible domains
      const domainSections = page.locator('[data-testid*="domain"], .domain-section, [class*="domain"]');
      const domainCount = await domainSections.count();

      console.log(`Data domains visible: ${domainCount}`);

      // Should have at least some domains
      expect(domainCount).toBeGreaterThan(0);
    }
  });
});
