// Application Constants
// Centralized configuration values

export const FEEDBACK_DURATION = 2000;
export const MIN_SELECTION_LENGTH = 1;
export const LONG_SELECTION_THRESHOLD = 300;
export const CONTEXT_WORDS = 3;
export const MAX_DISPLAY_TEXT_LENGTH = 100;

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
