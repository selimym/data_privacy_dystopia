import { Page } from '@playwright/test';

/**
 * IndexedDB and localStorage management for test isolation.
 * Ensures clean state between tests.
 */

/**
 * Clear all game storage (IndexedDB + localStorage)
 */
export async function clearGameStorage(page: Page): Promise<void> {
  await page.evaluate(async () => {
    // Clear localStorage
    localStorage.clear();

    // Clear sessionStorage
    sessionStorage.clear();

    // Clear IndexedDB
    const databases = await indexedDB.databases();
    for (const db of databases) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
      }
    }
  });

  // Wait for storage to clear
  await page.waitForTimeout(500);
}

/**
 * Get current game state from IndexedDB
 */
export async function getGameState(page: Page): Promise<any> {
  return await page.evaluate(async () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('GameStore', 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['gameState'], 'readonly');
        const store = transaction.objectStore('gameState');
        const getRequest = store.get('currentState');

        getRequest.onsuccess = () => resolve(getRequest.result);
        getRequest.onerror = () => reject(getRequest.error);
      };
    });
  });
}

/**
 * Set game state in IndexedDB
 */
export async function setGameState(page: Page, state: any): Promise<void> {
  await page.evaluate(async (stateData) => {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('GameStore', 1);

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('gameState')) {
          db.createObjectStore('gameState');
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['gameState'], 'readwrite');
        const store = transaction.objectStore('gameState');
        const putRequest = store.put(stateData, 'currentState');

        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
    });
  }, state);
}

/**
 * Get localStorage value
 */
export async function getLocalStorage(page: Page, key: string): Promise<string | null> {
  return await page.evaluate((k) => localStorage.getItem(k), key);
}

/**
 * Set localStorage value
 */
export async function setLocalStorage(page: Page, key: string, value: string): Promise<void> {
  await page.evaluate(
    ({ k, v }) => localStorage.setItem(k, v),
    { k: key, v: value }
  );
}

/**
 * Check if game state exists in storage
 */
export async function hasGameState(page: Page): Promise<boolean> {
  const state = await getGameState(page);
  return state !== null && state !== undefined;
}

/**
 * Wait for IndexedDB to be ready
 */
export async function waitForStorageReady(page: Page, timeout = 5000): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const ready = await page.evaluate(() => {
      return typeof indexedDB !== 'undefined';
    });

    if (ready) {
      return;
    }

    await page.waitForTimeout(100);
  }

  throw new Error('IndexedDB not ready within timeout');
}

/**
 * Get all NPCs from storage
 */
export async function getAllNPCs(page: Page): Promise<any[]> {
  return await page.evaluate(async () => {
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
}

/**
 * Get operator metrics from storage
 */
export async function getOperatorMetrics(page: Page): Promise<any> {
  return await page.evaluate(async () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('GameStore', 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains('operatorMetrics')) {
          resolve(null);
          return;
        }

        const transaction = db.transaction(['operatorMetrics'], 'readonly');
        const store = transaction.objectStore('operatorMetrics');
        const getRequest = store.get('current');

        getRequest.onsuccess = () => resolve(getRequest.result);
        getRequest.onerror = () => reject(getRequest.error);
      };
    });
  });
}
