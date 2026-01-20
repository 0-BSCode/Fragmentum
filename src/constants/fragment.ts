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
