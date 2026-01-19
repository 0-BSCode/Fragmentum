// Event Listeners
// Attachment of event listeners to DOM and Chrome APIs

import {
  handleKeyboardShortcut,
  handleMessage,
} from "./handlers";

/**
 * Attach keyboard shortcut listener
 */
function attachKeyboardListener(): void {
  document.addEventListener("keydown", handleKeyboardShortcut);
}

/**
 * Listen for messages from background script (context menu)
 */
function attachMessageListener(): void {
  chrome.runtime.onMessage.addListener((message) => {
    handleMessage(message);
  });
}

/**
 * Attach all event listeners
 */
export function attachEventListeners(): void {
  attachKeyboardListener();
  attachMessageListener();
}
