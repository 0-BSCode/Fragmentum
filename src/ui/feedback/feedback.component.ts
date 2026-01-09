// Feedback Component
// Manages user feedback display

import type { FeedbackType } from "@/contracts";
import { CSS_CLASSES, ELEMENT_IDS, FEEDBACK_DURATION } from "@/constants";
import { stateManager } from "@/state";

/**
 * Display feedback message to user
 */
export function showFeedback(message: string, type: FeedbackType = 'success'): void {
  const floatingButton = stateManager.get('floatingButton');
  if (!floatingButton) return;

  const feedback = floatingButton.querySelector(`#${ELEMENT_IDS.feedback}`);
  if (!(feedback instanceof HTMLElement)) return;

  feedback.textContent = message;
  feedback.className = `${CSS_CLASSES.feedback} ${CSS_CLASSES.feedback}-${type}`;
  feedback.style.display = 'block';

  // Clear existing timeout
  const existingTimeout = stateManager.get('feedbackTimeout');
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  // Set new timeout to hide feedback
  const timeout = setTimeout(() => {
    feedback.style.display = 'none';
  }, FEEDBACK_DURATION);

  stateManager.set('feedbackTimeout', timeout);
}
