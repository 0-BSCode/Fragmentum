// Compile Service
// Compiles multiple highlights into a single URL with multiple text fragments

import type { IHighlight } from '@/contracts';

/**
 * Compile multiple highlights into a single URL with multiple text= directives
 *
 * The Text Fragment spec supports multiple text= directives:
 * https://example.com/page#:~:text=first&text=second&text=third
 *
 * When opened, the browser will highlight ALL specified fragments on the page.
 *
 * @param pageUrl - The base page URL (without fragment)
 * @param highlights - Array of highlights to compile
 * @returns The compiled URL with all text fragments
 */
export function compileFragments(pageUrl: string, highlights: IHighlight[]): string {
  if (highlights.length === 0) {
    return pageUrl;
  }

  // Extract just the fragment portions and join with &
  // Each highlight.fragment is already in format "text=encoded%20text"
  const fragments = highlights.map(h => h.fragment);
  const combined = '#:~:' + fragments.join('&');

  return pageUrl + combined;
}

/**
 * Generate a UUID for highlight identification
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}
