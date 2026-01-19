// Context Extractor Service
// Extracts prefix and suffix context around text selections

import type { SelectionContext } from "@/contracts";

// ============================================================
// Exported Functions
// ============================================================

/**
 * Extract prefix and suffix context around a selection range.
 * Traverses up to block-level ancestors to capture context from sibling elements.
 */
export function extractContext(
  range: Range,
  prefixWords: number,
  suffixWords: number,
): SelectionContext {
  const context: SelectionContext = { prefix: "", suffix: "" };

  try {
    // Find a suitable ancestor that contains enough context
    const contextAncestor = findContextAncestor(range.startContainer);

    if (contextAncestor) {
      // Get prefix context - from ancestor start to selection start
      const prefixRange = document.createRange();
      prefixRange.setStart(contextAncestor, 0);
      prefixRange.setEnd(range.startContainer, range.startOffset);

      const prefixText = sanitizeContextText(prefixRange.toString());
      const prefixWordArray = prefixText.split(/\s+/).filter(isValidContextWord);
      context.prefix = prefixWordArray.slice(-prefixWords).join(" ");

      // Get suffix context - from selection end to ancestor end
      const suffixRange = document.createRange();
      suffixRange.setStart(range.endContainer, range.endOffset);
      suffixRange.setEnd(
        contextAncestor,
        contextAncestor.childNodes.length,
      );

      const suffixText = sanitizeContextText(suffixRange.toString());
      const suffixWordArray = suffixText.split(/\s+/).filter(isValidContextWord);
      context.suffix = suffixWordArray.slice(0, suffixWords).join(" ");
    }
  } catch (error) {
    console.warn("Could not extract context:", error);
  }

  return context;
}

// ============================================================
// Internal Constants
// ============================================================

/** Block-level elements that serve as good context boundaries */
const BLOCK_ELEMENTS = [
  "article",
  "aside",
  "blockquote",
  "body",
  "div",
  "footer",
  "header",
  "li",
  "main",
  "nav",
  "ol",
  "p",
  "section",
  "ul",
];

// ============================================================
// Internal Functions
// ============================================================

/**
 * Find the nearest block-level ancestor that can provide good context.
 * Stops at list containers (ul/ol) to capture sibling list items.
 */
function findContextAncestor(node: Node): Element | null {
  let current: Node | null = node;

  while (current && current !== document.body) {
    if (current.nodeType === Node.ELEMENT_NODE) {
      const el = current as Element;
      const tag = el.tagName.toLowerCase();

      // For list items, go up to the list container to capture siblings
      if (tag === "li") {
        current = current.parentNode;
        continue;
      }

      // Stop at good context boundaries
      if (BLOCK_ELEMENTS.includes(tag)) {
        return el;
      }
    }
    current = current.parentNode;
  }

  return document.body;
}

/**
 * Sanitize context text by removing DOM artifacts and normalizing
 */
function sanitizeContextText(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, "") // Zero-width chars
    .replace(/[\x00-\x1F\x7F]/g, "") // Control characters
    .replace(/\s+/g, " ")
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
