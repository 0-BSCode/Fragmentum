// Highlight Service
// Manages highlight CRUD operations via background script messaging

import { ACTIONS } from "@/constants";
import type { IHighlight } from "@/contracts";

/**
 * Load highlights for a specific page
 */
export async function loadHighlights(pageUrl: string): Promise<IHighlight[]> {
  const response = await chrome.runtime.sendMessage({
    action: ACTIONS.getHighlights,
    pageUrl,
  });
  return response.highlights ?? [];
}

/**
 * Add a new highlight
 */
export async function addHighlight(highlight: IHighlight): Promise<void> {
  await chrome.runtime.sendMessage({
    action: ACTIONS.highlightAdded,
    data: highlight,
  });
}

/**
 * Remove a highlight by ID
 */
export async function removeHighlight(
  id: string,
  pageUrl: string
): Promise<void> {
  await chrome.runtime.sendMessage({
    action: ACTIONS.removeHighlight,
    id,
    pageUrl,
  });
}

/**
 * Clear all highlights for a page
 */
export async function clearHighlights(pageUrl: string): Promise<void> {
  await chrome.runtime.sendMessage({
    action: ACTIONS.clearHighlights,
    pageUrl,
  });
}

/**
 * Clear all highlights globally (all pages)
 * Returns the count of deleted highlights
 */
export async function clearAllHighlightsGlobal(): Promise<number> {
  const response = await chrome.runtime.sendMessage({
    action: ACTIONS.clearAllHighlightsGlobal,
  });
  return response.count ?? 0;
}

/**
 * Compile highlights into a single URL
 * Returns the compiled URL and count
 */
export async function compileHighlights(
  pageUrl: string
): Promise<{ url: string; count: number }> {
  const response = await chrome.runtime.sendMessage({
    action: ACTIONS.compileHighlights,
    pageUrl,
  });
  return { url: response.url, count: response.count };
}

/**
 * Navigate to a highlight fragment
 */
export async function navigateToFragment(
  pageUrl: string,
  fragment: string
): Promise<void> {
  const fullUrl = `${pageUrl}#:~:${fragment}`;

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (tab?.id) {
    await chrome.tabs.update(tab.id, { url: fullUrl });
  }
}
