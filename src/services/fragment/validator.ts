// Fragment Validator Service
// Validates that generated fragments uniquely match the intended selection
// Based on W3C Text Fragment specification matching algorithm

import type { FragmentParts } from "@/contracts";
import { normalizeText } from "./encoder";

// ============================================================
// Exported Types
// ============================================================

/**
 * Result of validating a fragment against the document
 */
export interface ValidationResult {
  isUnique: boolean;
  matchCount: number;
  matchesSelection: boolean;
}

// ============================================================
// Exported Functions
// ============================================================

/**
 * Validate that a fragment uniquely matches the expected selection
 */
export function validateFragment(
  parts: FragmentParts,
  expectedRange: Range,
): ValidationResult {
  const matches = findFragmentMatches(parts);

  const matchesSelection = matches.some((match) =>
    rangesOverlap(match.range, expectedRange),
  );

  return {
    isUnique: matches.length === 1,
    matchCount: matches.length,
    matchesSelection: matchesSelection && matches.length >= 1,
  };
}

/**
 * Find all matches for a fragment in the current document
 * Implements a simplified version of the text fragment matching algorithm
 */
export function findFragmentMatches(parts: FragmentParts): FragmentMatch[] {
  const matches: FragmentMatch[] = [];

  // Get all text content from the document body
  const textNodes = getTextNodes(document.body);
  const { fullText, nodeMap } = buildTextMap(textNodes);

  // Decode the fragment parts for matching
  const textStart = decodeURIComponent(parts.textStart);
  const textEnd = parts.textEnd ? decodeURIComponent(parts.textEnd) : undefined;
  const prefix = parts.prefix ? decodeURIComponent(parts.prefix) : undefined;
  const suffix = parts.suffix ? decodeURIComponent(parts.suffix) : undefined;

  // Normalize for matching
  const normalizedFullText = normalizeText(fullText);
  const normalizedStart = normalizeText(textStart);
  const normalizedEnd = textEnd ? normalizeText(textEnd) : undefined;
  const normalizedPrefix = prefix ? normalizeText(prefix) : undefined;
  const normalizedSuffix = suffix ? normalizeText(suffix) : undefined;

  // Find potential match positions
  let searchStart = 0;
  while (searchStart < normalizedFullText.length) {
    // Find textStart
    const startIndex = normalizedFullText.indexOf(normalizedStart, searchStart);
    if (startIndex === -1) break;

    let matchStart = startIndex;
    let matchEnd: number;

    if (normalizedEnd) {
      // Range pattern: find textEnd after textStart
      const endSearchStart = startIndex + normalizedStart.length;
      const endIndex = normalizedFullText.indexOf(
        normalizedEnd,
        endSearchStart,
      );
      if (endIndex === -1) {
        searchStart = startIndex + 1;
        continue;
      }
      matchEnd = endIndex + normalizedEnd.length;
    } else {
      // Exact match pattern
      matchEnd = startIndex + normalizedStart.length;
    }

    // Validate prefix if present
    if (normalizedPrefix) {
      const prefixEnd = startIndex;
      const prefixSearchStart = Math.max(0, prefixEnd - normalizedPrefix.length - 50); // Allow some whitespace
      const textBefore = normalizedFullText.substring(prefixSearchStart, prefixEnd);
      if (!textBefore.includes(normalizedPrefix)) {
        searchStart = startIndex + 1;
        continue;
      }
    }

    // Validate suffix if present
    if (normalizedSuffix) {
      const suffixStart = matchEnd;
      const suffixSearchEnd = Math.min(
        normalizedFullText.length,
        suffixStart + normalizedSuffix.length + 50,
      );
      const textAfter = normalizedFullText.substring(suffixStart, suffixSearchEnd);
      if (!textAfter.includes(normalizedSuffix)) {
        searchStart = startIndex + 1;
        continue;
      }
    }

    // Create a Range for this match
    const range = createRangeFromTextPositions(
      nodeMap,
      fullText,
      matchStart,
      matchEnd,
    );

    if (range) {
      matches.push({
        range,
        text: normalizedFullText.substring(matchStart, matchEnd),
      });
    }

    searchStart = startIndex + 1;
  }

  return matches;
}

/**
 * Check if a fragment would be unique in the document
 */
export function isUniquelyIdentifying(parts: FragmentParts): boolean {
  const matches = findFragmentMatches(parts);
  return matches.length === 1;
}

// ============================================================
// Internal Types
// ============================================================

/**
 * A match found in the document
 */
interface FragmentMatch {
  range: Range;
  text: string;
}

/**
 * Build a map of text positions to nodes
 */
interface TextNodeMap {
  node: Text;
  start: number;
  end: number;
}

// ============================================================
// Internal Functions
// ============================================================

/**
 * Get all text nodes in an element
 */
function getTextNodes(element: Element): Text[] {
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      // Skip script, style, and hidden elements
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;

      const tagName = parent.tagName.toLowerCase();
      if (["script", "style", "noscript", "template"].includes(tagName)) {
        return NodeFilter.FILTER_REJECT;
      }

      // Skip empty text nodes
      if (!node.textContent?.trim()) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    textNodes.push(node);
  }

  return textNodes;
}

function buildTextMap(textNodes: Text[]): {
  fullText: string;
  nodeMap: TextNodeMap[];
} {
  let fullText = "";
  const nodeMap: TextNodeMap[] = [];

  for (const node of textNodes) {
    const text = node.textContent || "";
    const start = fullText.length;
    fullText += text;
    nodeMap.push({
      node,
      start,
      end: fullText.length,
    });
  }

  return { fullText, nodeMap };
}

/**
 * Create a Range from text positions using the node map
 */
function createRangeFromTextPositions(
  nodeMap: TextNodeMap[],
  _fullText: string,
  startPos: number,
  endPos: number,
): Range | null {
  try {
    const range = document.createRange();

    // Find start node and offset
    let startNode: Text | null = null;
    let startOffset = 0;
    for (const entry of nodeMap) {
      if (startPos >= entry.start && startPos < entry.end) {
        startNode = entry.node;
        startOffset = startPos - entry.start;
        break;
      }
    }

    // Find end node and offset
    let endNode: Text | null = null;
    let endOffset = 0;
    for (const entry of nodeMap) {
      if (endPos > entry.start && endPos <= entry.end) {
        endNode = entry.node;
        endOffset = endPos - entry.start;
        break;
      }
    }

    if (!startNode || !endNode) {
      return null;
    }

    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);

    return range;
  } catch {
    return null;
  }
}

/**
 * Check if two ranges overlap
 */
function rangesOverlap(range1: Range, range2: Range): boolean {
  // Ranges overlap if neither is completely before or after the other
  const comparison1 = range1.compareBoundaryPoints(Range.END_TO_START, range2);
  const comparison2 = range1.compareBoundaryPoints(Range.START_TO_END, range2);

  // If range1 ends before range2 starts, or range1 starts after range2 ends, no overlap
  return comparison1 <= 0 && comparison2 >= 0;
}
