// Fragmentum - Background Service Worker
// Handles message passing and highlight storage
// Context menu functionality is deprecated - see @deprecated comments below

import { ACTIONS } from "@/constants";
import { storageService } from "@/services/storage.service";
import { compileFragments } from "@/services/compile.service";
import type { IHighlight } from "@/contracts";

/**
 * @deprecated Context menu is deprecated as of the pivot to manual input.
 * Fragment generation is now handled via the popup where users paste
 * "Copy link to highlight" URLs from the browser's native feature.
 */
// const CONTEXT_MENU_ID = "fragmentum-generate";
// const CONTEXT_MENU_TITLE = "Fragmentum: Add link to highlights";

/**
 * @deprecated Context menu creation is disabled.
 */
// // Create context menu on extension install/update
// chrome.runtime.onInstalled.addListener(() => {
//   chrome.contextMenus.create({
//     id: CONTEXT_MENU_ID,
//     title: CONTEXT_MENU_TITLE,
//     contexts: ["selection"], // Only show when text is selected
//   });
// });

/**
 * @deprecated Context menu click handler is disabled.
 */
// // Handle context menu click
// chrome.contextMenus.onClicked.addListener((info, tab) => {
//   console.log(info);
//   if (info.menuItemId === CONTEXT_MENU_ID && tab?.id) {
//     // Send message to content script, handling cases where it may not be loaded
//     chrome.tabs
//       .sendMessage(tab.id, { action: ACTIONS.generateFragment })
//       .catch(() => {
//         // Content script not available on this page (e.g., chrome:// pages)
//         // Silently ignore - the context menu shouldn't appear on these pages anyway
//       });
//   }
// });

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.action) {
    case ACTIONS.highlightAdded:
      // Save highlight to storage
      storageService
        .addHighlight(message.data as IHighlight)
        .then(() => sendResponse({ success: true }))
        .catch((error) =>
          sendResponse({ success: false, error: String(error) }),
        );
      return true; // Async response

    case ACTIONS.getHighlights:
      // Return highlights for requested page
      storageService
        .getHighlightsForPage(message.pageUrl as string)
        .then((highlights) => sendResponse({ highlights }))
        .catch((error) =>
          sendResponse({ highlights: [], error: String(error) }),
        );
      return true; // Async response

    case ACTIONS.removeHighlight:
      // Remove specific highlight
      storageService
        .removeHighlight(message.id as string, message.pageUrl as string)
        .then(() => sendResponse({ success: true }))
        .catch((error) =>
          sendResponse({ success: false, error: String(error) }),
        );
      return true; // Async response

    case ACTIONS.clearHighlights:
      // Clear all highlights for page
      storageService
        .clearHighlightsForPage(message.pageUrl as string)
        .then(() => sendResponse({ success: true }))
        .catch((error) =>
          sendResponse({ success: false, error: String(error) }),
        );
      return true; // Async response

    case ACTIONS.compileHighlights:
      // Compile highlights into single URL
      storageService
        .getHighlightsForPage(message.pageUrl as string)
        .then((highlights) => {
          const compiledUrl = compileFragments(
            message.pageUrl as string,
            highlights,
          );
          sendResponse({ url: compiledUrl, count: highlights.length });
        })
        .catch((error) =>
          sendResponse({
            url: message.pageUrl,
            count: 0,
            error: String(error),
          }),
        );
      return true; // Async response
  }
});
