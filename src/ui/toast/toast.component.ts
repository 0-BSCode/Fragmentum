// Toast Component
// Provides non-intrusive feedback notifications

import { CSS_CLASSES, ELEMENT_IDS, FEEDBACK_DURATION } from "@/constants";
import { stateManager } from "@/state";

// ============================================================
// Exported Functions
// ============================================================

/**
 * Create the toast element and inject into DOM
 */
export function createToast(): void {
  if (stateManager.get('toastElement')) return;

  const container = document.createElement('div');
  container.id = ELEMENT_IDS.toast;
  container.className = CSS_CLASSES.toast;
  container.innerHTML = TOAST_TEMPLATE;
  container.setAttribute('role', 'alert');
  container.setAttribute('aria-live', 'polite');

  document.body.appendChild(container);
  stateManager.set('toastElement', container);
}

/**
 * Show a toast notification
 */
export function showToast(message: string, type: 'success' | 'error'): void {
  const toast = stateManager.get('toastElement');
  if (!toast) return;

  // Clear any existing timeout
  const existingTimeout = stateManager.get('feedbackTimeout');
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  // Update message
  const messageEl = toast.querySelector(`.${CSS_CLASSES.toastMessage}`);
  if (messageEl) {
    messageEl.textContent = message;
  }

  // Update icons visibility
  const successIcon = toast.querySelector(`.${CSS_CLASSES.toastIconSuccess}`) as HTMLElement;
  const errorIcon = toast.querySelector(`.${CSS_CLASSES.toastIconError}`) as HTMLElement;

  if (successIcon && errorIcon) {
    successIcon.style.display = type === 'success' ? 'block' : 'none';
    errorIcon.style.display = type === 'error' ? 'block' : 'none';
  }

  // Set type class
  toast.classList.remove(CSS_CLASSES.toastSuccess, CSS_CLASSES.toastError);
  toast.classList.add(type === 'success' ? CSS_CLASSES.toastSuccess : CSS_CLASSES.toastError);

  // Show toast
  toast.classList.add(CSS_CLASSES.toastVisible);

  // Auto-hide after duration
  const timeout = setTimeout(() => {
    hideToast();
  }, FEEDBACK_DURATION);

  stateManager.set('feedbackTimeout', timeout);
}

/**
 * Hide the toast notification
 */
export function hideToast(): void {
  const toast = stateManager.get('toastElement');
  if (!toast) return;

  toast.classList.remove(CSS_CLASSES.toastVisible);
}

// ============================================================
// Internal Constants
// ============================================================

/**
 * Toast HTML template
 */
const TOAST_TEMPLATE = `
  <div class="${CSS_CLASSES.toastContent}">
    <svg class="${CSS_CLASSES.toastIconSuccess}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    <svg class="${CSS_CLASSES.toastIconError}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
    <span class="${CSS_CLASSES.toastMessage}"></span>
  </div>
`;
