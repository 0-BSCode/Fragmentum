// Button Positioning Service
// Handles intelligent positioning of the floating button

import { BUTTON_DIMENSIONS } from '../../constants';

/**
 * Position the button intelligently based on selection bounds and viewport
 */
export function positionButton(element: HTMLElement, selectionRect: DOMRect): void {
  const { width: buttonWidth, height: buttonHeight, margin } = BUTTON_DIMENSIONS;

  let top = selectionRect.top + window.scrollY - buttonHeight - margin;
  let left = selectionRect.right + window.scrollX - buttonWidth;

  // If off-screen top, position below selection
  if (selectionRect.top < buttonHeight + margin) {
    top = selectionRect.bottom + window.scrollY + margin;
  }

  // If off-screen right, align to right edge
  if (left + buttonWidth > window.innerWidth) {
    left = window.innerWidth - buttonWidth - margin;
  }

  // If off-screen left, align to left edge
  if (left < margin) {
    left = margin;
  }

  element.style.top = `${top}px`;
  element.style.left = `${left}px`;
}
