// Highlights List Component
// Renders the list of highlights with navigation and delete actions

import type { IHighlight } from "@/contracts";
import type { PopupElements } from "../popup.state";
import { escapeHtml, formatTime } from "../utils/popup.utils";

/**
 * Event handlers for highlight list interactions
 */
export interface HighlightListHandlers {
  onNavigate: (fragment: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Render the highlights list
 */
export function renderHighlightsList(
  elements: PopupElements,
  highlights: IHighlight[],
  handlers: HighlightListHandlers
): void {
  // Sort by timestamp (newest first)
  const sorted = [...highlights].sort((a, b) => b.timestamp - a.timestamp);

  elements.highlightsList.innerHTML = sorted
    .map(
      (h) => `
    <div class="highlight-item" data-id="${escapeHtml(h.id)}">
      <div class="highlight-content">
        <div class="highlight-text">${escapeHtml(h.selectedText)}</div>
        <div class="highlight-meta">${formatTime(h.timestamp)}</div>
      </div>
      <div class="highlight-actions">
        <button class="goto-btn" data-fragment="${escapeHtml(h.fragment)}" title="Go to highlight">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path>
            <path d="M15 3h6v6"></path>
            <path d="M10 14L21 3"></path>
          </svg>
        </button>
        <button class="delete-btn" data-id="${escapeHtml(h.id)}" title="Remove highlight">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
  `
    )
    .join("");

  // Attach navigate handlers
  elements.highlightsList.querySelectorAll(".goto-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const element = e.currentTarget as HTMLElement;
      const fragment = element.dataset.fragment;
      if (fragment) handlers.onNavigate(fragment);
    });
  });

  // Attach delete handlers
  elements.highlightsList.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const element = e.currentTarget as HTMLElement;
      const id = element.dataset.id;
      if (id) handlers.onDelete(id);
    });
  });
}
