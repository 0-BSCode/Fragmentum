// Fragment Parser Service
// Parses "Copy link to highlight" URLs into structured components

/**
 * Parsed fragment URL components
 */
export interface ParsedFragment {
  pageUrl: string;
  fragment: string;
  selectedText: string;
}

/**
 * Parse a "Copy link to highlight" URL
 * Returns parsed components or null if invalid
 *
 * Handles URLs with optional heading anchors:
 * - https://example.com/page#:~:text=hello
 * - https://example.com/page#heading:~:text=hello
 *
 * @param url - The fragment URL to parse
 * @returns Parsed fragment data or null if invalid format
 */
export function parseFragmentUrl(url: string): ParsedFragment | null {
  // Find the hash character (start of any fragment)
  const hashIndex = url.indexOf("#");
  if (hashIndex === -1) return null;

  // Extract base URL (everything before #)
  const pageUrl = url.substring(0, hashIndex);

  // Get everything after #
  const fullFragment = url.substring(hashIndex + 1);

  // Find the text fragment directive marker
  const directiveIndex = fullFragment.indexOf(":~:");
  if (directiveIndex === -1) return null;

  // Extract the fragment directive part (everything after :~:)
  const fragment = fullFragment.substring(directiveIndex + 3); // Skip ":~:"

  // Validate fragment starts with text=
  if (!fragment.startsWith("text=")) return null;

  // Extract the text portion for display
  const textMatch = fragment.match(/text=([^&]+)/);
  if (!textMatch) return null;

  // Decode the text portion for display
  // Handle prefix-,text,end,-suffix format
  let selectedText: string;
  try {
    selectedText = decodeURIComponent(textMatch[1]);
    // Clean up prefix/suffix markers for display
    selectedText = selectedText
      .replace(/^[^,]*-,/, "") // Remove prefix-,
      .replace(/,-[^,]*$/, "") // Remove ,-suffix
      .replace(/,/g, " ... "); // Range separator to ellipsis
  } catch {
    // If decoding fails, use raw text
    selectedText = textMatch[1];
  }

  return { pageUrl, fragment, selectedText };
}
