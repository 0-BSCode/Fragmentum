// Fragmentum - Text Fragment Generation Content Script
// Composition root - orchestrates all modules

import { createToast } from "@/ui/toast";
import { attachEventListeners } from "@/events";

/**
 * Initialize the Fragmentum extension
 * Sets up UI components and attaches event listeners
 */
function init(): void {
  // Create UI components
  createToast();

  // Attach the event listeners
  attachEventListeners();
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
