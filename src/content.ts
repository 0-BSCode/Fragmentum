// Fragmentum - Text Fragment Generation Content Script
// Monitors text selections and generates shareable URL fragments

// ============================================================================
// Types and Interfaces
// ============================================================================

interface FragmentParts {
  prefix?: string;
  textStart: string;
  textEnd?: string;
  suffix?: string;
}

interface SelectionContext {
  prefix: string;
  suffix: string;
}

type FeedbackType = 'success' | 'error';

// ============================================================================
// State Management
// ============================================================================

let floatingButton: HTMLDivElement | null = null;
let feedbackTimeout: ReturnType<typeof setTimeout> | null = null;
let selectionDebounceTimeout: ReturnType<typeof setTimeout> | null = null;

const DEBOUNCE_DELAY = 200;
const FEEDBACK_DURATION = 2000;
const MIN_SELECTION_LENGTH = 3;
const LONG_SELECTION_THRESHOLD = 300;
const CONTEXT_WORDS = 3;

// ============================================================================
// Initialization
// ============================================================================

function init(): void {
  createFloatingButton();
  attachEventListeners();
  attachMessageListener();
}

/**
 * Listen for messages from background script (context menu)
 */
function attachMessageListener(): void {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'generateFragment') {
      // Ensure button is visible for feedback
      showFragmentButton();
      handleFragmentGeneration();
    }
  });
}

// ============================================================================
// UI Management
// ============================================================================

/**
 * Create the floating button element and inject into DOM
 */
function createFloatingButton(): void {
  if (floatingButton) return;

  const container = document.createElement('div');
  container.id = 'fragmentum-button-container';
  container.className = 'fragmentum-button-container';
  container.innerHTML = `
    <button
      id="fragmentum-button"
      class="fragmentum-button"
      aria-label="Copy link to text"
      title="Copy link to selected text"
    >
      <svg class="fragmentum-icon-link" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
      </svg>
      <svg class="fragmentum-icon-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </button>
    <div class="fragmentum-feedback" id="fragmentum-feedback"></div>
  `;

  document.body.appendChild(container);
  floatingButton = container;

  // Add click handler to button
  const button = container.querySelector('#fragmentum-button');
  if (button) {
    button.addEventListener('click', handleFragmentGeneration);
  }
}

/**
 * Show the floating button near the text selection
 */
function showFragmentButton(): void {
  if (!floatingButton) return;

  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  positionButton(rect);
  floatingButton.classList.add('fragmentum-visible');
}

/**
 * Hide the floating button with animation
 */
function hideFragmentButton(): void {
  if (!floatingButton) return;

  floatingButton.classList.remove('fragmentum-visible');
  resetButtonState();
}

/**
 * Position the button intelligently based on selection bounds and viewport
 */
function positionButton(selectionRect: DOMRect): void {
  if (!floatingButton) return;

  const buttonWidth = 40;
  const buttonHeight = 40;
  const margin = 8;

  let top = selectionRect.top + window.scrollY - buttonHeight - margin;
  let left = selectionRect.right + window.scrollX - buttonWidth;

  // If off-screen top, position below selection
  if (selectionRect.top < buttonHeight + margin) {
    top = selectionRect.bottom + window.scrollY + margin;
  }

  // If off-screen right, align to right edge
  if (left + buttonWidth > window.innerWidth) {
    left = window.innerWidth - buttonWidth - margin;
  }

  // If off-screen left, align to left edge
  if (left < margin) {
    left = margin;
  }

  floatingButton.style.top = `${top}px`;
  floatingButton.style.left = `${left}px`;
}

/**
 * Reset button to default state (link icon, default color)
 */
function resetButtonState(): void {
  if (!floatingButton) return;

  const button = floatingButton.querySelector('#fragmentum-button');
  const linkIcon = floatingButton.querySelector('.fragmentum-icon-link');
  const checkIcon = floatingButton.querySelector('.fragmentum-icon-check');

  if (button) {
    button.classList.remove('fragmentum-success');
  }
  if (linkIcon instanceof HTMLElement) {
    linkIcon.style.display = 'block';
  }
  if (checkIcon instanceof HTMLElement) {
    checkIcon.style.display = 'none';
  }
}

/**
 * Show success state (checkmark icon, green background)
 */
function showSuccessState(): void {
  if (!floatingButton) return;

  const button = floatingButton.querySelector('#fragmentum-button');
  const linkIcon = floatingButton.querySelector('.fragmentum-icon-link');
  const checkIcon = floatingButton.querySelector('.fragmentum-icon-check');

  if (button) {
    button.classList.add('fragmentum-success');
  }
  if (linkIcon instanceof HTMLElement) {
    linkIcon.style.display = 'none';
  }
  if (checkIcon instanceof HTMLElement) {
    checkIcon.style.display = 'block';
  }

  // Auto-hide after success
  setTimeout(() => {
    hideFragmentButton();
  }, FEEDBACK_DURATION);
}

/**
 * Display feedback message to user
 */
function showFeedback(message: string, type: FeedbackType = 'success'): void {
  if (!floatingButton) return;

  const feedback = floatingButton.querySelector('#fragmentum-feedback');
  if (!(feedback instanceof HTMLElement)) return;

  feedback.textContent = message;
  feedback.className = `fragmentum-feedback fragmentum-feedback-${type}`;
  feedback.style.display = 'block';

  if (feedbackTimeout) {
    clearTimeout(feedbackTimeout);
  }
  feedbackTimeout = setTimeout(() => {
    feedback.style.display = 'none';
  }, FEEDBACK_DURATION);
}

// ============================================================================
// Event Handling
// ============================================================================

/**
 * Attach all event listeners
 */
function attachEventListeners(): void {
  document.addEventListener('mouseup', handleSelection);
  document.addEventListener('touchend', handleSelection);
  document.addEventListener('keydown', handleKeyboardShortcut);
  document.addEventListener('click', handleClickOutside);
}

/**
 * Handle text selection events (debounced)
 */
function handleSelection(e: MouseEvent | TouchEvent): void {
  // Don't trigger if clicking on the button itself
  if (floatingButton && e.target instanceof Node && floatingButton.contains(e.target)) {
    return;
  }

  if (selectionDebounceTimeout) {
    clearTimeout(selectionDebounceTimeout);
  }
  selectionDebounceTimeout = setTimeout(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? '';

    if (isValidSelection(text)) {
      showFragmentButton();
    } else {
      hideFragmentButton();
    }
  }, DEBOUNCE_DELAY);
}

/**
 * Handle keyboard shortcut (Ctrl+Shift+L or Cmd+Shift+L)
 */
function handleKeyboardShortcut(e: KeyboardEvent): void {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
    e.preventDefault();
    handleFragmentGeneration();
  }
}

/**
 * Handle clicks outside button to hide it
 */
function handleClickOutside(e: MouseEvent): void {
  if (!floatingButton || (e.target instanceof Node && floatingButton.contains(e.target))) {
    return;
  }

  const selection = window.getSelection();
  if (!selection?.toString().trim()) {
    hideFragmentButton();
  }
}

/**
 * Main handler for fragment generation and clipboard copy
 */
async function handleFragmentGeneration(): Promise<void> {
  const selection = window.getSelection();
  const text = selection?.toString().trim() ?? '';

  if (!isValidSelection(text)) {
    showFeedback('Please select some text', 'error');
    return;
  }

  try {
    if (!selection) {
      showFeedback('No selection available', 'error');
      return;
    }

    const fragmentURL = generateTextFragment(selection);
    const success = await copyToClipboard(fragmentURL);

    if (success) {
      showSuccessState();
      showFeedback('Copied!', 'success');
    }
  } catch (error) {
    console.error('Fragmentum error:', error);
    showFeedback('Failed to copy', 'error');
  }
}

// ============================================================================
// Text Fragment Generation
// ============================================================================

/**
 * Validate if selection meets requirements
 */
function isValidSelection(text: string): boolean {
  if (!text || text.length < MIN_SELECTION_LENGTH) {
    return false;
  }

  // Ignore whitespace-only selections
  if (!/\S/.test(text)) {
    return false;
  }

  return true;
}

/**
 * Generate a Text Fragment URL from the current selection
 * Format: #:~:text=[prefix-,]textStart[,textEnd][,-suffix]
 */
function generateTextFragment(selection: Selection): string {
  if (!selection.rangeCount) {
    throw new Error('No selection range available');
  }

  const range = selection.getRangeAt(0);
  const selectedText = selection.toString().trim();
  const normalizedText = normalizeText(selectedText);

  const fragmentParts: FragmentParts = {
    textStart: '',
  };

  // For long selections, use textStart,textEnd pattern
  if (normalizedText.length > LONG_SELECTION_THRESHOLD) {
    const words = normalizedText.split(/\s+/);
    const startWords = words.slice(0, CONTEXT_WORDS).join(' ');
    const endWords = words.slice(-CONTEXT_WORDS).join(' ');

    fragmentParts.textStart = encodeFragmentComponent(startWords);
    fragmentParts.textEnd = encodeFragmentComponent(endWords);
  } else {
    fragmentParts.textStart = encodeFragmentComponent(normalizedText);
  }

  // Extract context for better precision
  const context = extractContext(range, CONTEXT_WORDS, CONTEXT_WORDS);
  if (context.prefix) {
    fragmentParts.prefix = encodeFragmentComponent(context.prefix);
  }
  if (context.suffix) {
    fragmentParts.suffix = encodeFragmentComponent(context.suffix);
  }

  return buildFragmentURL(fragmentParts);
}

/**
 * Normalize text for consistent fragment matching
 * - Unicode NFKC normalization (e.g., fancy quotes → regular quotes)
 * - Remove zero-width characters that may be invisible in selection
 * - Collapse whitespace and remove line breaks
 */
function normalizeText(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '') // Zero-width chars, BOM, soft hyphen
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitize context text by removing DOM artifacts and normalizing
 */
function sanitizeContextText(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '') // Zero-width chars
    .replace(/[\x00-\x1F\x7F]/g, '') // Control characters
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validate that a word is suitable for use in context
 * Filters out DOM artifacts, very long strings, and non-text content
 */
function isValidContextWord(word: string): boolean {
  if (!word || word.length === 0) return false;
  if (word.length > 50) return false; // Unusually long "words" are likely artifacts
  if (/^[\d\W]+$/.test(word) && word.length > 10) return false; // Long non-word strings
  return true;
}

/**
 * Extract prefix and suffix context around the selection
 * Improved to handle DOM edge cases and filter artifacts
 */
function extractContext(range: Range, prefixWords: number, suffixWords: number): SelectionContext {
  const context: SelectionContext = { prefix: '', suffix: '' };

  try {
    // Get prefix context
    const prefixRange = range.cloneRange();
    prefixRange.collapse(true);
    if (range.startContainer.parentNode) {
      prefixRange.setStart(range.startContainer.parentNode, 0);
    }
    const prefixText = sanitizeContextText(prefixRange.toString());
    const prefixWordArray = prefixText.split(/\s+/).filter(isValidContextWord);
    context.prefix = prefixWordArray.slice(-prefixWords).join(' ');

    // Get suffix context
    const suffixRange = range.cloneRange();
    suffixRange.collapse(false);
    if (range.endContainer.parentNode) {
      suffixRange.setEndAfter(range.endContainer.parentNode);
    }
    const suffixText = sanitizeContextText(suffixRange.toString());
    const suffixWordArray = suffixText.split(/\s+/).filter(isValidContextWord);
    context.suffix = suffixWordArray.slice(0, suffixWords).join(' ');
  } catch (error) {
    console.warn('Could not extract context:', error);
  }

  return context;
}

/**
 * URL encode fragment component properly
 * Encodes special characters that have meaning in Text Fragments syntax
 * and characters that may cause URL parsing issues
 */
function encodeFragmentComponent(text: string): string {
  return encodeURIComponent(text)
    // Encode characters with special meaning in Text Fragments: - , ` ! ' ( ) *
    // Also encode / to prevent URL path interpretation issues
    .replace(/[!'()*\-,`\/]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

/**
 * Build the complete fragment URL
 */
function buildFragmentURL(parts: FragmentParts): string {
  const currentURL = window.location.href.split('#')[0]; // Strip existing fragment

  let fragment = '#:~:text=';

  if (parts.prefix) {
    fragment += `${parts.prefix}-,`;
  }

  fragment += parts.textStart;

  if (parts.textEnd) {
    fragment += `,${parts.textEnd}`;
  }

  if (parts.suffix) {
    fragment += `,-${parts.suffix}`;
  }

  return currentURL + fragment;
}

// ============================================================================
// Clipboard Operations
// ============================================================================

/**
 * Copy text to clipboard using Clipboard API
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback to execCommand
    return copyToClipboardFallback(text);
  } catch (error) {
    console.warn('Clipboard API failed, trying fallback:', error);
    return copyToClipboardFallback(text);
  }
}

/**
 * Fallback clipboard copy method using execCommand
 */
function copyToClipboardFallback(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.left = '-9999px';

  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch (error) {
    console.error('Fallback copy failed:', error);
    document.body.removeChild(textarea);
    return false;
  }
}

// ============================================================================
// Initialization
// ============================================================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
