// Storage Service
// Chrome storage wrapper for highlight persistence

import type { IHighlight, IHighlightCollection, IHighlightStorage } from '@/contracts';
import { STORAGE_KEYS, STORAGE_VERSION } from '@/constants';

/**
 * Storage service API
 */
export const storageService = {
  addHighlight,
  getHighlightsForPage,
  removeHighlight,
  clearHighlightsForPage,
  getAllHighlights,
};

// ============================================================
// Internal Functions
// ============================================================

/**
 * Read all highlights from storage
 */
async function getAllHighlights(): Promise<IHighlightCollection> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.highlights);
  const storage = result[STORAGE_KEYS.highlights] as IHighlightStorage | undefined;
  return storage?.highlights ?? {};
}

/**
 * Save highlights collection to storage
 */
async function saveHighlights(highlights: IHighlightCollection): Promise<void> {
  const storage: IHighlightStorage = {
    highlights,
    version: STORAGE_VERSION,
  };
  await chrome.storage.local.set({ [STORAGE_KEYS.highlights]: storage });
}

/**
 * Add a highlight to the collection
 */
async function addHighlight(highlight: IHighlight): Promise<void> {
  const highlights = await getAllHighlights();

  // Initialize array for page if it doesn't exist
  if (!highlights[highlight.pageUrl]) {
    highlights[highlight.pageUrl] = [];
  }

  // Add highlight to the page's collection
  highlights[highlight.pageUrl].push(highlight);

  await saveHighlights(highlights);
}

/**
 * Get all highlights for a specific page
 */
async function getHighlightsForPage(pageUrl: string): Promise<IHighlight[]> {
  const highlights = await getAllHighlights();
  return highlights[pageUrl] ?? [];
}

/**
 * Remove a specific highlight by ID
 */
async function removeHighlight(id: string, pageUrl: string): Promise<void> {
  const highlights = await getAllHighlights();

  if (highlights[pageUrl]) {
    highlights[pageUrl] = highlights[pageUrl].filter(h => h.id !== id);

    // Clean up empty page entries
    if (highlights[pageUrl].length === 0) {
      delete highlights[pageUrl];
    }

    await saveHighlights(highlights);
  }
}

/**
 * Clear all highlights for a specific page
 */
async function clearHighlightsForPage(pageUrl: string): Promise<void> {
  const highlights = await getAllHighlights();

  if (highlights[pageUrl]) {
    delete highlights[pageUrl];
    await saveHighlights(highlights);
  }
}
