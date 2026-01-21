// Popup State Management
// Centralized state for the popup UI

import type { IHighlight } from "@/contracts";

/**
 * DOM element references for the popup
 */
export interface PopupElements {
  highlightsList: HTMLElement;
  emptyState: HTMLElement;
  loadingState: HTMLElement;
  highlightCount: HTMLElement;
  compileBtn: HTMLButtonElement;
  clearBtn: HTMLButtonElement;
  urlInput: HTMLInputElement;
  addBtn: HTMLButtonElement;
  toast: HTMLElement;
  toastMessage: HTMLElement;
  menuBtn: HTMLButtonElement;
  menuDropdown: HTMLElement;
  clearAllGlobalBtn: HTMLButtonElement;
}

/**
 * Popup application state
 */
export interface PopupState {
  currentPageUrl: string;
  highlights: IHighlight[];
  elements: PopupElements;
}

/**
 * Initialize DOM element references
 * @throws Error if any required element is missing
 */
export function initializeElements(): PopupElements {
  return {
    highlightsList: document.getElementById("highlights-list")!,
    emptyState: document.getElementById("empty-state")!,
    loadingState: document.getElementById("loading-state")!,
    highlightCount: document.getElementById("highlight-count")!,
    compileBtn: document.getElementById("compile-btn") as HTMLButtonElement,
    clearBtn: document.getElementById("clear-btn") as HTMLButtonElement,
    urlInput: document.getElementById("url-input") as HTMLInputElement,
    addBtn: document.getElementById("add-btn") as HTMLButtonElement,
    toast: document.getElementById("toast")!,
    toastMessage: document.getElementById("toast-message")!,
    menuBtn: document.getElementById("menu-btn") as HTMLButtonElement,
    menuDropdown: document.getElementById("menu-dropdown")!,
    clearAllGlobalBtn: document.getElementById(
      "clear-all-global-btn"
    ) as HTMLButtonElement,
  };
}

/**
 * Create initial popup state
 */
export function createPopupState(elements: PopupElements): PopupState {
  return {
    currentPageUrl: "",
    highlights: [],
    elements,
  };
}

/**
 * Get the current page URL (without fragment)
 */
export async function getCurrentPageUrl(): Promise<string | null> {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (
    !tab?.url ||
    tab.url.startsWith("chrome://") ||
    tab.url.startsWith("chrome-extension://")
  ) {
    return null;
  }

  const url = new URL(tab.url);
  return url.origin + url.pathname + url.search;
}
