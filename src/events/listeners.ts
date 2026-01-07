// Event Listeners
// Attachment of event listeners to DOM and Chrome APIs

import { getButtonElement } from "../ui/button";
import {
  handleSelection,
  handleKeyboardShortcut,
  handleClickOutside,
  handleFragmentGeneration,
  handleMessage,
} from "./handlers";

/**
 * Attach all document event listeners
 */
function attachDocumentEventListeners(): void {
  document.addEventListener("mouseup", handleSelection);
  document.addEventListener("touchend", handleSelection);
  document.addEventListener("keydown", handleKeyboardShortcut);
  document.addEventListener("click", handleClickOutside);
}

/**
 * Attach click handler to the floating button
 * Should be called after button is created
 */
function attachButtonClickListener(): void {
  const button = getButtonElement();
  if (button) {
    button.addEventListener("click", handleFragmentGeneration);
  }
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
  attachDocumentEventListeners();
  attachButtonClickListener();
  attachMessageListener();
}
