// Highlight Contract
// Type definitions for highlight collection and compilation

/**
 * Represents a single text highlight captured from a page
 */
export interface IHighlight {
  /** Unique identifier (UUID) */
  id: string;
  /** Base page URL (without fragment) */
  pageUrl: string;
  /** The text= fragment portion only (e.g., "text=Hello%20world") */
  fragment: string;
  /** Original selected text for display (truncated) */
  selectedText: string;
  /** Timestamp when highlight was captured */
  timestamp: number;
}

/**
 * Collection of highlights grouped by page URL
 */
export interface IHighlightCollection {
  [pageUrl: string]: IHighlight[];
}

/**
 * Storage schema for chrome.storage.local
 */
export interface IHighlightStorage {
  highlights: IHighlightCollection;
  version: number;
}

/**
 * Message types for highlight operations
 */
export interface IHighlightAddedMessage {
  action: 'highlightAdded';
  data: IHighlight;
}

export interface IGetHighlightsMessage {
  action: 'getHighlights';
  pageUrl: string;
}

export interface IRemoveHighlightMessage {
  action: 'removeHighlight';
  id: string;
  pageUrl: string;
}

export interface IClearHighlightsMessage {
  action: 'clearHighlights';
  pageUrl: string;
}

export interface ICompileHighlightsMessage {
  action: 'compileHighlights';
  pageUrl: string;
}

export type HighlightMessage =
  | IHighlightAddedMessage
  | IGetHighlightsMessage
  | IRemoveHighlightMessage
  | IClearHighlightsMessage
  | ICompileHighlightsMessage;
