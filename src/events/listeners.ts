/**
 * @deprecated Event listeners are deprecated as of the pivot to manual input.
 * Fragment generation is now handled via the popup where users paste
 * "Copy link to highlight" URLs from the browser's native feature.
 *
 * This file is preserved for reference and potential future use.
 * Last active: January 2026
 */

// // Event Listeners
// // Attachment of event listeners to DOM and Chrome APIs
//
// import {
//   handleKeyboardShortcut,
//   handleMessage,
// } from "./handlers";
//
// /**
//  * Attach all event listeners
//  */
// export function attachEventListeners(): void {
//   attachKeyboardListener();
//   attachMessageListener();
// }
//
// // ============================================================
// // Internal Functions
// // ============================================================
//
// /**
//  * Attach keyboard shortcut listener
//  */
// function attachKeyboardListener(): void {
//   document.addEventListener("keydown", handleKeyboardShortcut);
// }
//
// /**
//  * Listen for messages from background script (context menu)
//  */
// function attachMessageListener(): void {
//   chrome.runtime.onMessage.addListener((message) => {
//     handleMessage(message);
//   });
// }

export {};
