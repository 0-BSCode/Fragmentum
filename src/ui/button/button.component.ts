// Button Component
// Manages the floating fragment button UI

import { CSS_CLASSES, ELEMENT_IDS, FEEDBACK_DURATION } from "@/constants";
import { stateManager } from "@/state";
import { positionButton } from './button.positioning';

/**
 * Button HTML template
 */
const BUTTON_TEMPLATE = `
  <button
    id="${ELEMENT_IDS.button}"
    class="${CSS_CLASSES.button}"
    aria-label="Copy link to text"
    title="Copy link to selected text"
  >
    <svg class="${CSS_CLASSES.iconLink}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </svg>
    <svg class="${CSS_CLASSES.iconCheck}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  </button>
  <div class="${CSS_CLASSES.feedback}" id="${ELEMENT_IDS.feedback}"></div>
`;

/**
 * Create the floating button element and inject into DOM
 */
export function createFloatingButton(): void {
  if (stateManager.get('floatingButton')) return;

  const container = document.createElement('div');
  container.id = ELEMENT_IDS.container;
  container.className = CSS_CLASSES.container;
  container.innerHTML = BUTTON_TEMPLATE;

  document.body.appendChild(container);
  stateManager.set('floatingButton', container);
}

/**
 * Get the floating button element
 */
export function getFloatingButton(): HTMLDivElement | null {
  return stateManager.get('floatingButton');
}

/**
 * Show the floating button near the text selection
 */
export function showFloatingButton(): void {
  const floatingButton = stateManager.get('floatingButton');
  if (!floatingButton) return;

  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  positionButton(floatingButton, rect);
  floatingButton.classList.add(CSS_CLASSES.visible);
}

/**
 * Reset button to default state (link icon, default color)
 */
function resetButtonState(): void {
  const floatingButton = stateManager.get('floatingButton');
  if (!floatingButton) return;

  const button = floatingButton.querySelector(`#${ELEMENT_IDS.button}`);
  const linkIcon = floatingButton.querySelector(`.${CSS_CLASSES.iconLink}`);
  const checkIcon = floatingButton.querySelector(`.${CSS_CLASSES.iconCheck}`);

  if (button) {
    button.classList.remove(CSS_CLASSES.success);
  }
  if (linkIcon instanceof HTMLElement) {
    linkIcon.style.display = 'block';
  }
  if (checkIcon instanceof HTMLElement) {
    checkIcon.style.display = 'none';
  }
}

/**
 * Hide the floating button with animation
 */
export function hideFloatingButton(): void {
  const floatingButton = stateManager.get('floatingButton');
  if (!floatingButton) return;

  floatingButton.classList.remove(CSS_CLASSES.visible);
  resetButtonState();
}

/**
 * Show success state (checkmark icon, green background)
 */
export function showSuccessState(): void {
  const floatingButton = stateManager.get('floatingButton');
  if (!floatingButton) return;

  const button = floatingButton.querySelector(`#${ELEMENT_IDS.button}`);
  const linkIcon = floatingButton.querySelector(`.${CSS_CLASSES.iconLink}`);
  const checkIcon = floatingButton.querySelector(`.${CSS_CLASSES.iconCheck}`);

  if (button) {
    button.classList.add(CSS_CLASSES.success);
  }
  if (linkIcon instanceof HTMLElement) {
    linkIcon.style.display = 'none';
  }
  if (checkIcon instanceof HTMLElement) {
    checkIcon.style.display = 'block';
  }

  // Auto-hide after success
  setTimeout(() => {
    hideFloatingButton();
  }, FEEDBACK_DURATION);
}

/**
 * Get the button element for attaching event handlers
 */
export function getButtonElement(): HTMLButtonElement | null {
  const floatingButton = stateManager.get('floatingButton');
  if (!floatingButton) return null;

  return floatingButton.querySelector(`#${ELEMENT_IDS.button}`);
}
