// Event Handlers
// Implementations for all event handlers

import { MESSAGES, ACTIONS, MAX_DISPLAY_TEXT_LENGTH } from "@/constants";
import { isValidSelection, getSelectionText } from "@/services/selection";
import { generateTextFragment } from "@/services/fragment";
import { copyToClipboard } from "@/services/clipboard";
import { showToast } from "@/ui/toast";
import { generateUUID } from "@/services/compile.service";
import type { IHighlight } from "@/contracts";

/**
 * Handle keyboard shortcut (Ctrl+Shift+L or Cmd+Shift+L)
 */
export function handleKeyboardShortcut(e: KeyboardEvent): void {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "L") {
    e.preventDefault();
    handleFragmentGeneration();
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
    showToast(MESSAGES.selectText, "error");
    return;
  }

  try {
    if (!selection) {
      showToast(MESSAGES.noSelection, "error");
      return;
    }

    const fragmentURL = generateTextFragment(selection);
    const success = await copyToClipboard(fragmentURL);

    if (success) {
      showToast(MESSAGES.copied, "success");

      // Auto-save highlight to collection
      await saveHighlightToCollection(fragmentURL, text);
    }
  } catch (error) {
    console.error("Fragmentum error:", error);
    showToast(MESSAGES.copyFailed, "error");
  }
}

/**
 * Save generated highlight to collection for later compilation
 */
async function saveHighlightToCollection(
  fragmentURL: string,
  selectedText: string,
): Promise<void> {
  try {
    // Extract fragment portion
    const [, fragment] = fragmentURL.split("#:~:");

    // Only save if we have a valid fragment
    if (!fragment) {
      return;
    }

    // Get the page URL without any existing fragment
    const pageUrl = window.location.href.split("#")[0];

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
    console.warn("Fragmentum: Failed to save highlight to collection:", error);
  }
}

/**
 * Handle messages from background script (context menu)
 */
export function handleMessage(message: { action: string }): void {
  if (message.action === ACTIONS.generateFragment) {
    handleFragmentGeneration();
  }
}
