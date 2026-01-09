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

/** Inline element tags that can cause text fragment matching issues */
const INLINE_TAGS = [
  "code",
  "em",
  "strong",
  "b",
  "i",
  "span",
  "a",
  "mark",
  "sub",
  "sup",
  "small",
];

/**
 * Check if a range contains inline elements that could interfere with text fragment matching.
 * When selections span inline elements, exact string matching often fails, so we need
 * to use the range pattern (textStart,textEnd) instead.
 */
function hasInlineElements(range: Range): boolean {
  const container = range.commonAncestorContainer;

  // Single text node - no inline elements
  if (container.nodeType === Node.TEXT_NODE) {
    return false;
  }

  // Check for inline elements within the range
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node) => {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();
      return INLINE_TAGS.includes(tag)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP;
    },
  });

  return walker.nextNode() !== null;
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

  // Use range pattern (textStart,textEnd) for:
  // 1. Long selections that exceed threshold
  // 2. Selections spanning inline elements (which break exact matching)
  const useRangePattern =
    normalizedText.length > LONG_SELECTION_THRESHOLD ||
    hasInlineElements(range);

  if (useRangePattern) {
    const words = normalizedText.split(/\s+/);
    const startWords = words.slice(0, CONTEXT_WORDS).join(" ");
    const endWords = words.slice(-CONTEXT_WORDS).join(" ");

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
