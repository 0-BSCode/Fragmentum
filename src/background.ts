// Fragmentum - Background Service Worker
// Handles message passing and highlight storage

import { ACTIONS } from "@/constants";
import { storageService } from "@/services/storage.service";
import { compileFragments } from "@/services/compile.service";
import type { IHighlight } from "@/contracts";

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

    case ACTIONS.clearAllHighlightsGlobal:
      // Clear all highlights globally (all pages)
      storageService
        .clearAllHighlights()
        .then((count) => sendResponse({ success: true, count }))
        .catch((error) =>
          sendResponse({ success: false, count: 0, error: String(error) }),
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
