// Fragment Encoder Service
// Handles URL encoding and text normalization for text fragments

import type { IFragmentEncoder, FragmentParts } from '../../contracts';

/**
 * Normalize text for consistent fragment matching
 * - Unicode NFKC normalization (e.g., fancy quotes → regular quotes)
 * - Remove zero-width characters that may be invisible in selection
 * - Collapse whitespace and remove line breaks
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '') // Zero-width chars, BOM, soft hyphen
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * URL encode fragment component properly
 * Encodes special characters that have meaning in Text Fragments syntax
 * and characters that may cause URL parsing issues
 */
export function encodeFragmentComponent(text: string): string {
  return encodeURIComponent(text)
    // Encode characters with special meaning in Text Fragments: - , ` ! ' ( ) *
    // Also encode / to prevent URL path interpretation issues
    .replace(/[!'()*\-,`\/]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

/**
 * Build the complete fragment URL from parts
 */
export function buildFragmentURL(parts: FragmentParts): string {
  const currentURL = window.location.href.split('#')[0]; // Strip existing fragment

  let fragment = '#:~:text=';

  if (parts.prefix) {
    fragment += `${parts.prefix}-,`;
  }

  fragment += parts.textStart;

  if (parts.textEnd) {
    fragment += `,${parts.textEnd}`;
  }

  if (parts.suffix) {
    fragment += `,-${parts.suffix}`;
  }

  return currentURL + fragment;
}

/**
 * Fragment Encoder implementation
 * Implements IFragmentEncoder contract
 */
export class FragmentEncoder implements IFragmentEncoder {
  encode(text: string): string {
    return encodeFragmentComponent(text);
  }
}

/**
 * Fragment Builder implementation
 * Implements IFragmentBuilder contract
 */
export class FragmentBuilder {
  build(parts: FragmentParts): string {
    return buildFragmentURL(parts);
  }
}

// Export singleton instances
export const fragmentEncoder = new FragmentEncoder();
export const fragmentBuilder = new FragmentBuilder();
