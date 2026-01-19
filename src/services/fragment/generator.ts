// Fragment Generator Service
// Main service for generating text fragment URLs
// Implements Chrome-like iterative expansion for robust fragment generation

import type { FragmentParts } from "../../contracts";
import {
  LONG_SELECTION_THRESHOLD,
  MAX_EXPANSION_ITERATIONS,
  GENERATION_TIMEOUT_MS,
  BLOCK_ELEMENTS,
  WORD_BOUNDARY_CHARS,
} from "@/constants";
import {
  normalizeText,
  encodeFragmentComponent,
  buildFragmentURL,
} from "./encoder";
import { extractContext } from "./context-extractor";
import { isUniquelyIdentifying, validateFragment } from "./validator";

// ============================================================
// Exported Functions
// ============================================================

/**
 * Generate a Text Fragment URL from a selection
 * Uses iterative expansion to ensure unique matching
 * Format: #:~:text=[prefix-,]textStart[,textEnd][,-suffix]
 */
export function generateTextFragment(selection: Selection): string {
  if (!selection.rangeCount) {
    throw new Error("No selection range available");
  }

  const originalRange = selection.getRangeAt(0);

  // Expand to word boundaries for more stable fragments
  const range = expandToWordBoundaries(originalRange);

  const selectedText = range.toString().trim();
  const normalizedText = normalizeText(selectedText);

  if (!normalizedText) {
    throw new Error("No text selected");
  }

  const words = normalizedText.split(/\s+/).filter((w) => w.length > 0);

  if (words.length === 0) {
    throw new Error("No valid words in selection");
  }

  // Determine strategy
  const strategy = determineStrategy(normalizedText, range);

  // For single-word selections, use exact match
  if (words.length === 1) {
    return generateSimpleFragment(words[0], range);
  }

  // Use FragmentFactory for iterative expansion
  const factory = new FragmentFactory(words, range, strategy);

  try {
    const parts = factory.tryToMakeUniqueFragment();
    if (parts) {
      return buildFragmentURL(parts);
    }
  } catch (error) {
    // Timeout or other error - fall back to simple generation
    console.warn("Fragment generation error:", error);
  }

  // Fallback: generate without validation
  return generateFallbackFragment(words, range, strategy);
}

// ============================================================
// Internal Types
// ============================================================

/**
 * Fragment generation strategy
 */
type GenerationStrategy = "EXACT_MATCH" | "RANGE_PATTERN";

// ============================================================
// Internal Classes
// ============================================================

/**
 * FragmentFactory - Manages iterative expansion for unique fragment generation
 * Based on Chrome's Link-to-Text-Fragment implementation
 */
class FragmentFactory {
  private words: string[];
  private range: Range;
  private startWordCount: number = 1;
  private endWordCount: number = 1;
  private hasPrefix: boolean = false;
  private hasSuffix: boolean = false;
  private strategy: GenerationStrategy;
  private startTime: number;

  constructor(words: string[], range: Range, strategy: GenerationStrategy) {
    this.words = words;
    this.range = range;
    this.strategy = strategy;
    this.startTime = Date.now();
  }

  /**
   * Check if we've exceeded the timeout
   */
  private checkTimeout(): void {
    if (Date.now() - this.startTime > GENERATION_TIMEOUT_MS) {
      throw new Error("Fragment generation timeout");
    }
  }

  /**
   * Build fragment parts from current state
   */
  build(): FragmentParts {
    const parts: FragmentParts = {
      textStart: "",
    };

    if (this.strategy === "EXACT_MATCH") {
      // Use entire text as textStart
      parts.textStart = encodeFragmentComponent(this.words.join(" "));
    } else {
      // Range pattern: use start and end word counts
      const startPhrase = this.words.slice(0, this.startWordCount).join(" ");
      const endPhrase = this.words.slice(-this.endWordCount).join(" ");
      parts.textStart = encodeFragmentComponent(startPhrase);
      parts.textEnd = encodeFragmentComponent(endPhrase);
    }

    // Add context if needed
    if (this.hasPrefix || this.hasSuffix) {
      const context = extractContext(
        this.range,
        this.hasPrefix ? 3 : 0,
        this.hasSuffix ? 3 : 0,
      );
      if (this.hasPrefix && context.prefix) {
        parts.prefix = encodeFragmentComponent(context.prefix);
      }
      if (this.hasSuffix && context.suffix) {
        parts.suffix = encodeFragmentComponent(context.suffix);
      }
    }

    return parts;
  }

  /**
   * Expand the fragment by one step to increase uniqueness
   * Expansion order:
   * 1. Increase startWordCount
   * 2. Increase endWordCount
   * 3. Add prefix context
   * 4. Add suffix context
   */
  embiggen(): boolean {
    this.checkTimeout();

    const maxStartWords = Math.floor(this.words.length / 2);
    const maxEndWords = Math.floor(this.words.length / 2);

    // Try expanding start phrase first
    if (this.startWordCount < maxStartWords) {
      this.startWordCount++;
      return true;
    }

    // Then try expanding end phrase
    if (this.endWordCount < maxEndWords) {
      this.endWordCount++;
      return true;
    }

    // Then try adding prefix context
    if (!this.hasPrefix) {
      this.hasPrefix = true;
      return true;
    }

    // Finally try adding suffix context
    if (!this.hasSuffix) {
      this.hasSuffix = true;
      return true;
    }

    // Cannot expand further
    return false;
  }

  /**
   * Try to make a unique fragment through iterative expansion
   */
  tryToMakeUniqueFragment(): FragmentParts | null {
    for (let i = 0; i < MAX_EXPANSION_ITERATIONS; i++) {
      this.checkTimeout();

      const fragment = this.build();

      // Validate uniqueness
      const validation = validateFragment(fragment, this.range);
      console.log(validation);

      if (validation.isUnique && validation.matchesSelection) {
        return fragment;
      }

      // Try to expand
      if (!this.embiggen()) {
        // Cannot expand further, return best effort
        break;
      }
    }

    // Return the fragment even if not unique (best effort)
    return this.build();
  }
}

// ============================================================
// Internal Functions
// ============================================================

/**
 * Expand a range to word boundaries
 * Uses Intl.Segmenter if available, falls back to regex
 */
function expandToWordBoundaries(range: Range): Range {
  const newRange = range.cloneRange();

  try {
    // Expand start to word boundary
    expandStartToWordBoundary(newRange);

    // Expand end to word boundary
    expandEndToWordBoundary(newRange);
  } catch {
    // If expansion fails, return original range
    return range;
  }

  return newRange;
}

/**
 * Expand range start to the nearest word boundary
 */
function expandStartToWordBoundary(range: Range): void {
  const container = range.startContainer;
  if (container.nodeType !== Node.TEXT_NODE) return;

  const text = container.textContent || "";
  let offset = range.startOffset;

  // Move backwards to find word start
  while (offset > 0 && !isWordBoundaryChar(text[offset - 1])) {
    offset--;
  }

  range.setStart(container, offset);
}

/**
 * Expand range end to the nearest word boundary
 */
function expandEndToWordBoundary(range: Range): void {
  const container = range.endContainer;
  if (container.nodeType !== Node.TEXT_NODE) return;

  const text = container.textContent || "";
  let offset = range.endOffset;

  // Move forwards to find word end
  while (offset < text.length && !isWordBoundaryChar(text[offset])) {
    offset++;
  }

  range.setEnd(container, offset);
}

/**
 * Check if a character is a word boundary
 */
function isWordBoundaryChar(char: string): boolean {
  return WORD_BOUNDARY_CHARS.test(char);
}

/**
 * Check if the range contains any block-level element boundaries
 */
function containsBlockBoundary(range: Range): boolean {
  const fragment = range.cloneContents();

  // Check if any block elements exist in the selection
  const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node) => {
      const element = node as Element;
      if (BLOCK_ELEMENTS.has(element.tagName)) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_SKIP;
    },
  });

  return walker.nextNode() !== null;
}

/**
 * Determine the best generation strategy for the selection
 */
function determineStrategy(
  normalizedText: string,
  range: Range,
): GenerationStrategy {
  // Use range pattern if:
  // 1. Text is long (> threshold)
  // 2. Selection spans block boundaries
  if (
    normalizedText.length > LONG_SELECTION_THRESHOLD ||
    containsBlockBoundary(range)
  ) {
    return "RANGE_PATTERN";
  }

  return "EXACT_MATCH";
}

/**
 * Generate a simple fragment for single-word selections
 */
function generateSimpleFragment(word: string, range: Range): string {
  const parts: FragmentParts = {
    textStart: encodeFragmentComponent(word),
  };

  // Check if unique
  if (!isUniquelyIdentifying(parts)) {
    // Add context for disambiguation
    const context = extractContext(range, 3, 3);
    if (context.prefix) {
      parts.prefix = encodeFragmentComponent(context.prefix);
    }
    if (context.suffix) {
      parts.suffix = encodeFragmentComponent(context.suffix);
    }
  }

  return buildFragmentURL(parts);
}

/**
 * Generate a fallback fragment when iterative expansion fails or times out
 */
function generateFallbackFragment(
  words: string[],
  range: Range,
  strategy: GenerationStrategy,
): string {
  const parts: FragmentParts = {
    textStart: "",
  };

  if (strategy === "EXACT_MATCH" || words.length <= 3) {
    parts.textStart = encodeFragmentComponent(words.join(" "));
  } else {
    // Use first and last thirds of words
    const phraseLength = Math.max(2, Math.ceil(words.length / 3));
    const startPhrase = words.slice(0, phraseLength).join(" ");
    const endPhrase = words.slice(-phraseLength).join(" ");
    parts.textStart = encodeFragmentComponent(startPhrase);
    parts.textEnd = encodeFragmentComponent(endPhrase);
  }

  // Always add context for fallback (best effort)
  const context = extractContext(range, 3, 3);
  if (context.prefix) {
    parts.prefix = encodeFragmentComponent(context.prefix);
  }
  if (context.suffix) {
    parts.suffix = encodeFragmentComponent(context.suffix);
  }

  return buildFragmentURL(parts);
}
