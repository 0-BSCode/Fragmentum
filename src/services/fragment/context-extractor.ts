// Context Extractor Service
// Extracts prefix and suffix context around text selections

import type { SelectionContext } from '../../contracts';

/**
 * Sanitize context text by removing DOM artifacts and normalizing
 */
function sanitizeContextText(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '') // Zero-width chars
    .replace(/[\x00-\x1F\x7F]/g, '') // Control characters
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validate that a word is suitable for use in context
 * Filters out DOM artifacts, very long strings, and non-text content
 */
function isValidContextWord(word: string): boolean {
  if (!word || word.length === 0) return false;
  if (word.length > 50) return false; // Unusually long "words" are likely artifacts
  if (/^[\d\W]+$/.test(word) && word.length > 10) return false; // Long non-word strings
  return true;
}

/**
 * Extract prefix and suffix context around a selection range
 * Improved to handle DOM edge cases and filter artifacts
 */
export function extractContext(
  range: Range,
  prefixWords: number,
  suffixWords: number
): SelectionContext {
  const context: SelectionContext = { prefix: '', suffix: '' };

  try {
    // Get prefix context
    const prefixRange = range.cloneRange();
    prefixRange.collapse(true);
    if (range.startContainer.parentNode) {
      prefixRange.setStart(range.startContainer.parentNode, 0);
    }
    const prefixText = sanitizeContextText(prefixRange.toString());
    const prefixWordArray = prefixText.split(/\s+/).filter(isValidContextWord);
    context.prefix = prefixWordArray.slice(-prefixWords).join(' ');

    // Get suffix context
    const suffixRange = range.cloneRange();
    suffixRange.collapse(false);
    if (range.endContainer.parentNode) {
      suffixRange.setEndAfter(range.endContainer.parentNode);
    }
    const suffixText = sanitizeContextText(suffixRange.toString());
    const suffixWordArray = suffixText.split(/\s+/).filter(isValidContextWord);
    context.suffix = suffixWordArray.slice(0, suffixWords).join(' ');
  } catch (error) {
    console.warn('Could not extract context:', error);
  }

  return context;
}
