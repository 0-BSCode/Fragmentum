// Fragmentum Popup
// Main entry point - orchestrates popup UI and user interactions

import { MAX_DISPLAY_TEXT_LENGTH } from "@/constants";
import type { IHighlight } from "@/contracts";
import { generateUUID } from "@/services/compile.service";
import { parseFragmentUrl } from "@/services/fragment-parser";
import {
  addHighlight,
  clearAllHighlightsGlobal,
  clearHighlights,
  compileHighlights,
  loadHighlights,
  navigateToFragment,
  removeHighlight,
} from "@/services/highlight";

import { renderHighlightsList } from "./components/highlights-list.component";
import {
  hideEmptyState,
  hideLoading,
  showEmptyState,
  showLoading,
  showToast,
  updateCount,
} from "./components/ui-states.component";
import {
  createPopupState,
  getCurrentPageUrl,
  initializeElements,
  type PopupState,
} from "./popup.state";

let state: PopupState;

/**
 * Initialize popup
 */
async function init(): Promise<void> {
  const elements = initializeElements();
  state = createPopupState(elements);

  // Attach event listeners
  state.elements.compileBtn.addEventListener("click", handleCompile);
  state.elements.clearBtn.addEventListener("click", handleClearAll);
  state.elements.addBtn.addEventListener("click", handleAddHighlight);
  state.elements.urlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleAddHighlight();
  });

  // Menu event listeners
  state.elements.menuBtn.addEventListener("click", toggleMenu);
  state.elements.clearAllGlobalBtn.addEventListener(
    "click",
    handleClearAllGlobal
  );
  document.addEventListener("click", handleClickOutside);

  showLoading(state.elements);

  try {
    const pageUrl = await getCurrentPageUrl();
    if (!pageUrl) {
      showEmptyState(state.elements);
      updateCount(state.elements, 0);
      return;
    }

    state.currentPageUrl = pageUrl;
    await refreshHighlights();
  } catch (error) {
    console.error("Fragmentum popup error:", error);
    showEmptyState(state.elements);
    updateCount(state.elements, 0);
  }
}

/**
 * Refresh and render highlights
 */
async function refreshHighlights(): Promise<void> {
  state.highlights = await loadHighlights(state.currentPageUrl);
  renderHighlights();
}

/**
 * Render current highlights state
 */
function renderHighlights(): void {
  hideLoading(state.elements);

  if (state.highlights.length === 0) {
    showEmptyState(state.elements);
    updateCount(state.elements, 0);
    return;
  }

  hideEmptyState(state.elements);
  updateCount(state.elements, state.highlights.length);

  renderHighlightsList(state.elements, state.highlights, {
    onNavigate: handleNavigate,
    onDelete: handleDelete,
  });
}

/**
 * Handle compile button click
 */
async function handleCompile(): Promise<void> {
  if (state.highlights.length === 0) return;

  state.elements.compileBtn.disabled = true;

  try {
    const { url, count } = await compileHighlights(state.currentPageUrl);
    await navigator.clipboard.writeText(url);
    showToast(
      state.elements,
      `Copied! ${count} highlight${count !== 1 ? "s" : ""} compiled.`,
      "success",
    );
  } catch (error) {
    console.error("Compile error:", error);
    showToast(state.elements, "Failed to compile highlights", "error");
  } finally {
    state.elements.compileBtn.disabled = state.highlights.length === 0;
  }
}

/**
 * Handle navigate to highlight
 */
async function handleNavigate(fragment: string): Promise<void> {
  try {
    await navigateToFragment(state.currentPageUrl, fragment);
    window.close();
  } catch (error) {
    console.error("Navigate error:", error);
    showToast(state.elements, "Failed to navigate to highlight", "error");
  }
}

/**
 * Handle delete highlight
 */
async function handleDelete(id: string): Promise<void> {
  try {
    await removeHighlight(id, state.currentPageUrl);
    state.highlights = state.highlights.filter((h) => h.id !== id);
    renderHighlights();
    showToast(state.elements, "Highlight removed", "success");
  } catch (error) {
    console.error("Delete error:", error);
    showToast(state.elements, "Failed to remove highlight", "error");
  }
}

/**
 * Handle clear all highlights
 */
async function handleClearAll(): Promise<void> {
  if (state.highlights.length === 0) return;

  try {
    await clearHighlights(state.currentPageUrl);
    state.highlights = [];
    renderHighlights();
    showToast(state.elements, "All highlights cleared", "success");
  } catch (error) {
    console.error("Clear error:", error);
    showToast(state.elements, "Failed to clear highlights", "error");
  }
}

/**
 * Handle add highlight from pasted URL
 */
async function handleAddHighlight(): Promise<void> {
  const url = state.elements.urlInput.value.trim();

  if (!url) {
    showToast(state.elements, "Please paste a link to highlight", "error");
    return;
  }

  const parsed = parseFragmentUrl(url);

  if (!parsed) {
    showToast(
      state.elements,
      "Invalid link format. Use 'Copy link to highlight'",
      "error",
    );
    return;
  }

  if (parsed.pageUrl !== state.currentPageUrl) {
    showToast(state.elements, "Link must be for this page", "error");
    return;
  }

  try {
    const highlight: IHighlight = {
      id: generateUUID(),
      pageUrl: parsed.pageUrl,
      fragment: parsed.fragment,
      selectedText: parsed.selectedText.substring(0, MAX_DISPLAY_TEXT_LENGTH),
      timestamp: Date.now(),
    };

    await addHighlight(highlight);
    state.elements.urlInput.value = "";
    await refreshHighlights();
    showToast(state.elements, "Highlight added!", "success");
  } catch (error) {
    console.error("Add highlight error:", error);
    showToast(state.elements, "Failed to add highlight", "error");
  }
}

/**
 * Toggle menu dropdown visibility
 */
function toggleMenu(e: Event): void {
  e.stopPropagation();
  state.elements.menuDropdown.classList.toggle("visible");
}

/**
 * Close menu when clicking outside
 */
function handleClickOutside(e: Event): void {
  const target = e.target as HTMLElement;
  if (
    !state.elements.menuBtn.contains(target) &&
    !state.elements.menuDropdown.contains(target)
  ) {
    state.elements.menuDropdown.classList.remove("visible");
  }
}

/**
 * Handle clear all highlights globally
 */
async function handleClearAllGlobal(): Promise<void> {
  state.elements.menuDropdown.classList.remove("visible");

  try {
    const count = await clearAllHighlightsGlobal();
    state.highlights = [];
    renderHighlights();
    showToast(
      state.elements,
      `Cleared ${count} highlight${count !== 1 ? "s" : ""} from all pages`,
      "success"
    );
  } catch (error) {
    console.error("Clear all global error:", error);
    showToast(state.elements, "Failed to clear all highlights", "error");
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", init);
