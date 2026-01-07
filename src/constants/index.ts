// Application Constants
// Centralized configuration values

export const DEBOUNCE_DELAY = 200;
export const FEEDBACK_DURATION = 2000;
export const MIN_SELECTION_LENGTH = 3;
export const LONG_SELECTION_THRESHOLD = 300;
export const CONTEXT_WORDS = 3;

export const BUTTON_DIMENSIONS = {
  width: 40,
  height: 40,
  margin: 8,
} as const;

export const CSS_CLASSES = {
  container: 'fragmentum-button-container',
  button: 'fragmentum-button',
  visible: 'fragmentum-visible',
  success: 'fragmentum-success',
  iconLink: 'fragmentum-icon-link',
  iconCheck: 'fragmentum-icon-check',
  feedback: 'fragmentum-feedback',
} as const;

export const ELEMENT_IDS = {
  container: 'fragmentum-button-container',
  button: 'fragmentum-button',
  feedback: 'fragmentum-feedback',
} as const;

export const MESSAGES = {
  selectText: 'Please select some text',
  noSelection: 'No selection available',
  copied: 'Copied!',
  copyFailed: 'Failed to copy',
} as const;

export const ACTIONS = {
  generateFragment: 'generateFragment',
} as const;
