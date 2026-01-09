// Event Handlers
// Implementations for all event handlers

import { DEBOUNCE_DELAY, MESSAGES, ACTIONS, MAX_DISPLAY_TEXT_LENGTH } from "@/constants";
import { stateManager } from "@/state";
import { isValidSelection, getSelectionText } from "@/services/selection";
import { generateTextFragment } from "@/services/fragment";
import { copyToClipboard } from "@/services/clipboard";
import {
  showFloatingButton,
  hideFloatingButton,
  showSuccessState,
  getFloatingButton,
} from "@/ui/button";
import { showFeedback } from "@/ui/feedback";
import { generateUUID } from "@/services/compile.service";
import type { IHighlight } from "@/contracts";

/**
 * Handle text selection events (debounced)
 * Shows or hides the floating button based on selection validity
 */
export function handleSelection(e: MouseEvent | TouchEvent): void {
  const floatingButton = getFloatingButton();

  // Don't trigger if clicking on the button itself
  if (floatingButton && e.target instanceof Node && floatingButton.contains(e.target)) {
    return;
  }

  // Clear existing debounce timeout
  const existingTimeout = stateManager.get('selectionDebounceTimeout');
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  // Set new debounced handler
  const timeout = setTimeout(() => {
    const text = getSelectionText();

    if (isValidSelection(text)) {
      showFloatingButton();
    } else {
      hideFloatingButton();
    }
  }, DEBOUNCE_DELAY);

  stateManager.set('selectionDebounceTimeout', timeout);
}

/**
 * Handle keyboard shortcut (Ctrl+Shift+L or Cmd+Shift+L)
 */
export function handleKeyboardShortcut(e: KeyboardEvent): void {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
    e.preventDefault();
    handleFragmentGeneration();
  }
}

/**
 * Handle clicks outside button to hide it
 */
export function handleClickOutside(e: MouseEvent): void {
  const floatingButton = getFloatingButton();

  if (!floatingButton || (e.target instanceof Node && floatingButton.contains(e.target))) {
    return;
  }

  const selection = window.getSelection();
  if (!selection?.toString().trim()) {
    hideFloatingButton();
  }
}

/**
 * Main handler for fragment generation and clipboard copy
 * Also auto-saves highlight to collection for later compilation
 */
export async function handleFragmentGeneration(): Promise<void> {
  const selection = window.getSelection();
  const text = getSelectionText();

  if (!isValidSelection(text)) {
    showFeedback(MESSAGES.selectText, 'error');
    return;
  }

  try {
    if (!selection) {
      showFeedback(MESSAGES.noSelection, 'error');
      return;
    }

    const fragmentURL = generateTextFragment(selection);
    const success = await copyToClipboard(fragmentURL);

    if (success) {
      showSuccessState();
      showFeedback(MESSAGES.copied, 'success');

      // Auto-save highlight to collection
      await saveHighlightToCollection(fragmentURL, text);
    }
  } catch (error) {
    console.error('Fragmentum error:', error);
    showFeedback(MESSAGES.copyFailed, 'error');
  }
}

/**
 * Save generated highlight to collection for later compilation
 */
async function saveHighlightToCollection(fragmentURL: string, selectedText: string): Promise<void> {
  try {
    // Extract base URL and fragment portion
    const [baseUrl, fragment] = fragmentURL.split('#:~:');

    // Only save if we have a valid fragment
    if (!fragment) {
      return;
    }

    // Get the page URL without any existing fragment
    const pageUrl = window.location.href.split('#')[0];

    // Create highlight data
    const highlight: IHighlight = {
      id: generateUUID(),
      pageUrl,
      fragment, // Already in format "text=encoded%20text"
      selectedText: selectedText.substring(0, MAX_DISPLAY_TEXT_LENGTH),
      timestamp: Date.now(),
    };

    // Send to background for storage
    chrome.runtime.sendMessage({
      action: ACTIONS.highlightAdded,
      data: highlight,
    });
  } catch (error) {
    // Silently fail - saving is not critical to main functionality
    console.warn('Fragmentum: Failed to save highlight to collection:', error);
  }
}

/**
 * Handle messages from background script (context menu)
 */
export function handleMessage(message: { action: string }): void {
  if (message.action === ACTIONS.generateFragment) {
    // Ensure button is visible for feedback
    showFloatingButton();
    handleFragmentGeneration();
  }
}
