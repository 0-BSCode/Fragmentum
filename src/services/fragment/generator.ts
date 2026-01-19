// Fragment Generator Service
// Main service for generating text fragment URLs

import type { FragmentParts } from "../../contracts";
import { LONG_SELECTION_THRESHOLD, CONTEXT_WORDS } from "@/constants";
import {
  normalizeText,
  encodeFragmentComponent,
  buildFragmentURL,
} from "./encoder";
import { extractContext } from "./context-extractor";

// Inline elements that can break text fragment matching
const INLINE_ELEMENT_SELECTOR =
  "a, code, em, strong, span, b, i, mark, abbr, cite, q, sub, sup, time, var, kbd, samp";

/**
 * Detect if selection spans inline elements
 * Text fragments have trouble matching across inline element boundaries
 */
function selectionSpansInlineElements(range: Range): boolean {
  // If start and end are in different containers, likely spans elements
  if (range.startContainer !== range.endContainer) {
    return true;
  }

  // Check for inline elements within the selection
  const fragment = range.cloneContents();
  const inlineElements = fragment.querySelectorAll(INLINE_ELEMENT_SELECTOR);
  return inlineElements.length > 0;
}

/**
 * Generate a Text Fragment URL from a selection
 * Format: #:~:text=[prefix-,]textStart[,textEnd][,-suffix]
 */
export function generateTextFragment(selection: Selection): string {
  if (!selection.rangeCount) {
    throw new Error("No selection range available");
  }

  const range = selection.getRangeAt(0);
  const selectedText = selection.toString().trim();
  const normalizedText = normalizeText(selectedText);

  const fragmentParts: FragmentParts = {
    textStart: "",
  };

  const words = normalizedText.split(/\s+/);

  // Use range pattern (textStart,textEnd) when:
  // 1. Long selection (> threshold), OR
  // 2. Selection spans inline elements AND has multiple words
  const hasInlineElements = selectionSpansInlineElements(range);
  const useRangePattern =
    normalizedText.length > LONG_SELECTION_THRESHOLD ||
    (hasInlineElements && words.length > 1);

  if (useRangePattern && words.length > 1) {
    // Use first and last words for range pattern
    // This avoids problematic inline elements in the match string
    fragmentParts.textStart = encodeFragmentComponent(words[0]);
    fragmentParts.textEnd = encodeFragmentComponent(words[words.length - 1]);
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
