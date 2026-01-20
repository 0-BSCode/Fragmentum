// Fragmentum Popup
// Displays highlight collection and compile functionality
// Supports manual input of "Copy link to highlight" URLs

import { ACTIONS } from "@/constants";
import type { IHighlight } from "@/contracts";

// Constants
const MAX_DISPLAY_TEXT_LENGTH = 100;

// DOM Elements
let highlightsList: HTMLElement;
let emptyState: HTMLElement;
let loadingState: HTMLElement;
let highlightCount: HTMLElement;
let compileBtn: HTMLButtonElement;
let clearBtn: HTMLButtonElement;
let urlInput: HTMLInputElement;
let addBtn: HTMLButtonElement;
let toast: HTMLElement;
let toastMessage: HTMLElement;

// Current page URL
let currentPageUrl: string = "";

// Current highlights
let highlights: IHighlight[] = [];

/**
 * Initialize popup
 */
async function init(): Promise<void> {
  // Get DOM elements
  highlightsList = document.getElementById("highlights-list")!;
  emptyState = document.getElementById("empty-state")!;
  loadingState = document.getElementById("loading-state")!;
  highlightCount = document.getElementById("highlight-count")!;
  compileBtn = document.getElementById("compile-btn") as HTMLButtonElement;
  clearBtn = document.getElementById("clear-btn") as HTMLButtonElement;
  urlInput = document.getElementById("url-input") as HTMLInputElement;
  addBtn = document.getElementById("add-btn") as HTMLButtonElement;
  toast = document.getElementById("toast")!;
  toastMessage = document.getElementById("toast-message")!;

  // Attach event listeners
  compileBtn.addEventListener("click", handleCompile);
  clearBtn.addEventListener("click", handleClearAll);
  addBtn.addEventListener("click", handleAddHighlight);
  urlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleAddHighlight();
  });

  // Show loading state
  showLoading();

  try {
    // Get current tab URL
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (
      !tab?.url ||
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://")
    ) {
      showEmptyState();
      updateCount(0);
      return;
    }

    // Parse URL to get base (without fragment)
    const url = new URL(tab.url);
    currentPageUrl = url.origin + url.pathname + url.search;

    // Load highlights for this page
    await loadHighlights();
  } catch (error) {
    console.error("Fragmentum popup error:", error);
    showEmptyState();
    updateCount(0);
  }
}

/**
 * Load highlights from storage
 */
async function loadHighlights(): Promise<void> {
  const response = await chrome.runtime.sendMessage({
    action: ACTIONS.getHighlights,
    pageUrl: currentPageUrl,
  });

  highlights = response.highlights ?? [];
  renderHighlights();
}

/**
 * Render highlights list
 */
function renderHighlights(): void {
  hideLoading();

  if (highlights.length === 0) {
    showEmptyState();
    updateCount(0);
    return;
  }

  hideEmptyState();
  updateCount(highlights.length);

  // Sort by timestamp (newest first)
  const sorted = [...highlights].sort((a, b) => b.timestamp - a.timestamp);

  highlightsList.innerHTML = sorted
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
  `,
    )
    .join("");

  // Attach navigate handlers
  highlightsList.querySelectorAll(".goto-btn").forEach((btn) => {
    btn.addEventListener("click", handleNavigate);
  });

  // Attach delete handlers
  highlightsList.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", handleDelete);
  });
}

/**
 * Handle compile button click
 */
async function handleCompile(): Promise<void> {
  if (highlights.length === 0) return;

  compileBtn.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({
      action: ACTIONS.compileHighlights,
      pageUrl: currentPageUrl,
    });

    if (response.url) {
      await navigator.clipboard.writeText(response.url);
      showToast(
        `Copied! ${response.count} highlight${response.count !== 1 ? "s" : ""} compiled.`,
        "success",
      );
    }
  } catch (error) {
    console.error("Compile error:", error);
    showToast("Failed to compile highlights", "error");
  } finally {
    compileBtn.disabled = highlights.length === 0;
  }
}

/**
 * Handle navigate to highlight button click
 * Constructs the fragment URL and navigates the current tab
 */
async function handleNavigate(e: Event): Promise<void> {
  const btn = e.currentTarget as HTMLElement;
  const fragment = btn.dataset.fragment;

  if (!fragment) return;

  try {
    // Construct full URL with text fragment
    const fullUrl = `${currentPageUrl}#:~:${fragment}`;

    // Get current tab and navigate to the fragment URL
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab?.id) {
      await chrome.tabs.update(tab.id, { url: fullUrl });
      // Close popup after navigation
      window.close();
    }
  } catch (error) {
    console.error("Navigate error:", error);
    showToast("Failed to navigate to highlight", "error");
  }
}

/**
 * Handle delete button click
 */
async function handleDelete(e: Event): Promise<void> {
  const btn = e.currentTarget as HTMLElement;
  const id = btn.dataset.id;

  if (!id) return;

  try {
    await chrome.runtime.sendMessage({
      action: ACTIONS.removeHighlight,
      id,
      pageUrl: currentPageUrl,
    });

    // Remove from local array and re-render
    highlights = highlights.filter((h) => h.id !== id);
    renderHighlights();
    showToast("Highlight removed", "success");
  } catch (error) {
    console.error("Delete error:", error);
    showToast("Failed to remove highlight", "error");
  }
}

/**
 * Handle clear all button click
 */
async function handleClearAll(): Promise<void> {
  if (highlights.length === 0) return;

  try {
    await chrome.runtime.sendMessage({
      action: ACTIONS.clearHighlights,
      pageUrl: currentPageUrl,
    });

    highlights = [];
    renderHighlights();
    showToast("All highlights cleared", "success");
  } catch (error) {
    console.error("Clear error:", error);
    showToast("Failed to clear highlights", "error");
  }
}

/**
 * Handle add highlight from pasted URL
 */
async function handleAddHighlight(): Promise<void> {
  const url = urlInput.value.trim();

  if (!url) {
    showToast("Please paste a link to highlight", "error");
    return;
  }

  // Parse the fragment URL
  const parsed = parseFragmentUrl(url);

  if (!parsed) {
    showToast("Invalid link format. Use 'Copy link to highlight'", "error");
    return;
  }

  // Validate URL matches current page
  if (parsed.pageUrl !== currentPageUrl) {
    showToast("Link must be for this page", "error");
    return;
  }

  try {
    // Create highlight object
    const highlight: IHighlight = {
      id: generateUUID(),
      pageUrl: parsed.pageUrl,
      fragment: parsed.fragment,
      selectedText: parsed.selectedText.substring(0, MAX_DISPLAY_TEXT_LENGTH),
      timestamp: Date.now(),
    };

    // Save to storage via background
    await chrome.runtime.sendMessage({
      action: ACTIONS.highlightAdded,
      data: highlight,
    });

    // Clear input and reload highlights
    urlInput.value = "";
    await loadHighlights();
    showToast("Highlight added!", "success");
  } catch (error) {
    console.error("Add highlight error:", error);
    showToast("Failed to add highlight", "error");
  }
}

/**
 * Parse a "Copy link to highlight" URL
 * Returns parsed components or null if invalid
 */
interface ParsedFragment {
  pageUrl: string;
  fragment: string;
  selectedText: string;
}

function parseFragmentUrl(url: string): ParsedFragment | null {
  // Check for text fragment marker
  const fragmentIndex = url.indexOf("#:~:text=");
  if (fragmentIndex === -1) return null;

  // Extract base URL (without fragment)
  const pageUrl = url.substring(0, fragmentIndex);

  // Extract fragment (everything after #:~:)
  const fragment = url.substring(fragmentIndex + 4); // Skip "#:~:"

  // Validate fragment starts with text=
  if (!fragment.startsWith("text=")) return null;

  // Extract the text portion for display
  const textMatch = fragment.match(/text=([^&]+)/);
  if (!textMatch) return null;

  // Decode the text portion for display
  // Handle prefix-,text,end,-suffix format
  let selectedText: string;
  try {
    selectedText = decodeURIComponent(textMatch[1]);
    // Clean up prefix/suffix markers for display
    selectedText = selectedText
      .replace(/^[^,]*-,/, "") // Remove prefix-,
      .replace(/,-[^,]*$/, "") // Remove ,-suffix
      .replace(/,/g, " ... "); // Range separator to ellipsis
  } catch {
    // If decoding fails, use raw text
    selectedText = textMatch[1];
  }

  return { pageUrl, fragment, selectedText };
}

/**
 * Generate a UUID for highlight IDs
 */
function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Update highlight count display
 */
function updateCount(count: number): void {
  highlightCount.textContent = `${count} highlight${count !== 1 ? "s" : ""}`;
  compileBtn.disabled = count === 0;
  clearBtn.disabled = count === 0;
}

/**
 * Show loading state
 */
function showLoading(): void {
  loadingState.classList.add("visible");
  highlightsList.style.display = "none";
  emptyState.classList.remove("visible");
}

/**
 * Hide loading state
 */
function hideLoading(): void {
  loadingState.classList.remove("visible");
  highlightsList.style.display = "flex";
}

/**
 * Show empty state
 */
function showEmptyState(): void {
  emptyState.classList.add("visible");
  highlightsList.style.display = "none";
}

/**
 * Hide empty state
 */
function hideEmptyState(): void {
  emptyState.classList.remove("visible");
  highlightsList.style.display = "flex";
}

/**
 * Show toast notification
 */
function showToast(
  message: string,
  type: "success" | "error" = "success",
): void {
  toastMessage.textContent = message;
  toast.className = `toast visible ${type}`;

  setTimeout(() => {
    toast.classList.remove("visible");
  }, 2500);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format timestamp to relative time
 */
function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", init);
