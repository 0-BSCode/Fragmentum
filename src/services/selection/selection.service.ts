// Selection Service
// Handles selection validation and retrieval

import { MIN_SELECTION_LENGTH } from "@/constants";

/**
 * Validate if selection text meets requirements
 */
export function isValidSelection(text: string): boolean {
  if (!text || text.length < MIN_SELECTION_LENGTH) {
    return false;
  }

  // Ignore whitespace-only selections
  if (!/\S/.test(text)) {
    return false;
  }

  return true;
}

/**
 * Get current selection text, trimmed
 */
export function getSelectionText(): string {
  const selection = window.getSelection();
  return selection?.toString().trim() ?? '';
}
