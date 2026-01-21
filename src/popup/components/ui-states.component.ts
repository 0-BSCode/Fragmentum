// UI States Component
// Manages loading and empty state visibility

import type { PopupElements } from "../popup.state";

/**
 * Show loading state
 */
export function showLoading(elements: PopupElements): void {
  elements.loadingState.classList.add("visible");
  elements.highlightsList.style.display = "none";
  elements.emptyState.classList.remove("visible");
}

/**
 * Hide loading state
 */
export function hideLoading(elements: PopupElements): void {
  elements.loadingState.classList.remove("visible");
  elements.highlightsList.style.display = "flex";
}

/**
 * Show empty state
 */
export function showEmptyState(elements: PopupElements): void {
  elements.emptyState.classList.add("visible");
  elements.highlightsList.style.display = "none";
}

/**
 * Hide empty state
 */
export function hideEmptyState(elements: PopupElements): void {
  elements.emptyState.classList.remove("visible");
  elements.highlightsList.style.display = "flex";
}

/**
 * Show toast notification
 */
export function showToast(
  elements: PopupElements,
  message: string,
  type: "success" | "error" = "success"
): void {
  elements.toastMessage.textContent = message;
  elements.toast.className = `toast visible ${type}`;

  setTimeout(() => {
    elements.toast.classList.remove("visible");
  }, 2500);
}

/**
 * Update highlight count display and button states
 */
export function updateCount(elements: PopupElements, count: number): void {
  elements.highlightCount.textContent = `${count} highlight${count !== 1 ? "s" : ""}`;
  elements.compileBtn.disabled = count === 0;
  elements.clearBtn.disabled = count === 0;
}
