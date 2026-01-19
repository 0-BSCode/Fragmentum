// Application Constants
// Centralized configuration values

export const FEEDBACK_DURATION = 2000;
export const MIN_SELECTION_LENGTH = 1;
export const LONG_SELECTION_THRESHOLD = 300;
export const CONTEXT_WORDS = 3;
export const MAX_DISPLAY_TEXT_LENGTH = 100;

// Fragment generation configuration
// Iterative expansion settings (Chrome-like algorithm)
export const MAX_EXPANSION_ITERATIONS = 10;
export const GENERATION_TIMEOUT_MS = 500;

// Word boundary detection
export const WORD_BOUNDARY_CHARS = /[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000.,;:!?'"()\[\]{}<>\/\\|@#$%^&*+=~`-]/;

// Block elements that fragments shouldn't span
export const BLOCK_ELEMENTS = new Set([
  'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'BR', 'DD', 'DETAILS',
  'DIALOG', 'DIV', 'DL', 'DT', 'FIELDSET', 'FIGCAPTION', 'FIGURE',
  'FOOTER', 'FORM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER',
  'HGROUP', 'HR', 'LI', 'MAIN', 'NAV', 'OL', 'P', 'PRE', 'SECTION',
  'TABLE', 'UL',
]);

// Storage configuration
export const STORAGE_VERSION = 1;
export const STORAGE_KEYS = {
  highlights: 'fragmentum_highlights',
} as const;

export const CSS_CLASSES = {
  // Toast classes
  toast: "fragmentum-toast",
  toastVisible: "fragmentum-toast-visible",
  toastSuccess: "fragmentum-toast-success",
  toastError: "fragmentum-toast-error",
  toastContent: "fragmentum-toast-content",
  toastMessage: "fragmentum-toast-message",
  toastIconSuccess: "fragmentum-toast-icon-success",
  toastIconError: "fragmentum-toast-icon-error",
} as const;

export const ELEMENT_IDS = {
  toast: "fragmentum-toast",
} as const;

export const MESSAGES = {
  selectText: "Please select some text",
  noSelection: "No selection available",
  copied: "Link copied!",
  copyFailed: "Failed to copy",
} as const;

export const ACTIONS = {
  generateFragment: "generateFragment",
  highlightAdded: "highlightAdded",
  getHighlights: "getHighlights",
  removeHighlight: "removeHighlight",
  clearHighlights: "clearHighlights",
  compileHighlights: "compileHighlights",
} as const;
