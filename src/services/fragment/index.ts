/**
 * @deprecated Fragment services are deprecated as of the pivot to manual input.
 * Fragment generation is now handled via the popup where users paste
 * "Copy link to highlight" URLs from the browser's native feature.
 *
 * Only encoder.ts is kept active for potential future URL building needs.
 * Last active: January 2026
 */

// // Fragment Services Barrel Export
// // Re-exports all fragment-related services
//
// export { normalizeText, encodeFragmentComponent, buildFragmentURL } from './encoder';
// export { extractContext } from './context-extractor';
// export { generateTextFragment } from './generator';

// Keep encoder exports for potential future use
export { normalizeText, encodeFragmentComponent, buildFragmentURL } from './encoder';
