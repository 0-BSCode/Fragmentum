// Clipboard Service
// Handles clipboard operations with fallback support

import type { IClipboardService } from '../../contracts';

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

/**
 * Copy text to clipboard using Clipboard API with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
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
 * Clipboard Service implementation
 * Implements IClipboardService contract
 */
export class ClipboardService implements IClipboardService {
  async copy(text: string): Promise<boolean> {
    return copyToClipboard(text);
  }
}

// Export singleton instance
export const clipboardService = new ClipboardService();
