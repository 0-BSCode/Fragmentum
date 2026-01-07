// Selection Service
// Handles selection validation and retrieval

import { MIN_SELECTION_LENGTH } from '../../constants';

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

/**
 * Get current selection object
 */
export function getSelection(): Selection | null {
  return window.getSelection();
}

/**
 * Check if there is a valid selection currently active
 */
export function hasValidSelection(): boolean {
  const text = getSelectionText();
  return isValidSelection(text);
}

/**
 * Selection Service class
 * Provides methods for selection validation and retrieval
 */
export class SelectionService {
  isValid(text: string): boolean {
    return isValidSelection(text);
  }

  getText(): string {
    return getSelectionText();
  }

  get(): Selection | null {
    return getSelection();
  }

  hasValid(): boolean {
    return hasValidSelection();
  }
}

// Export singleton instance
export const selectionService = new SelectionService();
