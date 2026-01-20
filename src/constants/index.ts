// Application Constants
// Centralized entrypoint - re-exports from domain-specific modules

// Fragment generation
export {
  MAX_EXPANSION_ITERATIONS,
  GENERATION_TIMEOUT_MS,
  WORD_BOUNDARY_CHARS,
  BLOCK_ELEMENTS,
} from './fragment';

// Text selection
export {
  MIN_SELECTION_LENGTH,
  LONG_SELECTION_THRESHOLD,
  CONTEXT_WORDS,
  MAX_DISPLAY_TEXT_LENGTH,
} from './selection';

// Storage
export {
  STORAGE_VERSION,
  STORAGE_KEYS,
} from './storage';

// UI
export {
  FEEDBACK_DURATION,
  CSS_CLASSES,
  ELEMENT_IDS,
} from './ui';

// Messages
export { MESSAGES } from './messages';

// Actions
export { ACTIONS } from './actions';
