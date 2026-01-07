// Fragment Generator Service
// Main service for generating text fragment URLs

import type { FragmentParts } from '../../contracts';
import { LONG_SELECTION_THRESHOLD, CONTEXT_WORDS } from '../../constants';
import { normalizeText, encodeFragmentComponent, buildFragmentURL } from './encoder';
import { extractContext } from './context-extractor';

/**
 * Generate a Text Fragment URL from a selection
 * Format: #:~:text=[prefix-,]textStart[,textEnd][,-suffix]
 */
export function generateTextFragment(selection: Selection): string {
  if (!selection.rangeCount) {
    throw new Error('No selection range available');
  }

  const range = selection.getRangeAt(0);
  const selectedText = selection.toString().trim();
  const normalizedText = normalizeText(selectedText);

  const fragmentParts: FragmentParts = {
    textStart: '',
  };

  // For long selections, use textStart,textEnd pattern
  if (normalizedText.length > LONG_SELECTION_THRESHOLD) {
    const words = normalizedText.split(/\s+/);
    const startWords = words.slice(0, CONTEXT_WORDS).join(' ');
    const endWords = words.slice(-CONTEXT_WORDS).join(' ');

    fragmentParts.textStart = encodeFragmentComponent(startWords);
    fragmentParts.textEnd = encodeFragmentComponent(endWords);
  } else {
    fragmentParts.textStart = encodeFragmentComponent(normalizedText);
  }

  // Extract context for better precision
  const context = extractContext(range, CONTEXT_WORDS, CONTEXT_WORDS);
  if (context.prefix) {
    fragmentParts.prefix = encodeFragmentComponent(context.prefix);
  }
  if (context.suffix) {
    fragmentParts.suffix = encodeFragmentComponent(context.suffix);
  }

  return buildFragmentURL(fragmentParts);
}
