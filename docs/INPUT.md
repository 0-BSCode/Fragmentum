# Manual Text Fragment Input

This document describes the workflow for adding text fragment highlights to Fragmentum using the browser's native "Copy link to highlight" feature.

## Overview

As of January 2026, Fragmentum has pivoted from automatic text fragment generation to manual input. This change improves reliability by leveraging the browser's built-in text fragment generation, which is more robust and well-tested.

## Workflow

### Step 1: Select Text on a Webpage

Navigate to any webpage and select the text you want to highlight.

### Step 2: Copy Link to Highlight

Right-click on the selected text and choose **"Copy link to highlight"** from the context menu.

> **Note**: This is a native browser feature available in Chrome, Edge, and other Chromium-based browsers. The browser will generate a URL with a text fragment (e.g., `#:~:text=your%20selected%20text`).

### Step 3: Open Fragmentum Popup

Click the Fragmentum extension icon in your browser toolbar to open the popup.

### Step 4: Paste the Link

Paste the copied link into the input field at the top of the popup.

### Step 5: Add the Highlight

Click the **"Add"** button (or press Enter) to save the highlight.

The popup will:
- Validate that the URL is for the current page
- Extract and decode the text fragment
- Save the highlight to your collection
- Display the highlight in the list

## Compilation

Once you have collected multiple highlights on a page:

1. Open the Fragmentum popup
2. Review your highlights in the list
3. Click **"Compile & Copy"** to generate a single URL with all highlights
4. Share the compiled URL - recipients will see all highlighted passages

## URL Format

Text fragment URLs follow the W3C Text Fragment specification:

```
https://example.com/page#:~:text=[prefix-,]textStart[,textEnd][,-suffix]
```

Examples:
- Simple: `https://example.com#:~:text=hello%20world`
- With range: `https://example.com#:~:text=start%20text,end%20text`
- With context: `https://example.com#:~:text=prefix-,main%20text,-suffix`

## Validation Rules

When adding a highlight, Fragmentum validates:

1. **URL must contain `#:~:text=`** - Ensures it's a valid text fragment URL
2. **URL must match current page** - Prevents adding highlights for different pages
3. **Fragment must be decodable** - The text portion must be valid URL-encoded text

## Deprecation Notice

The following features have been deprecated:

- **Automatic fragment generation** - Previously generated fragments from text selection
- **Keyboard shortcut (Ctrl+Shift+L)** - No longer active
- **Context menu integration** - "Fragmentum: Add link to highlights" removed
- **Content script** - No longer injected into pages

These features are preserved in the codebase (commented out with `@deprecated` annotations) for reference and potential future use.

## Why This Change?

The automatic text fragment generation was complex and prone to edge cases:
- Unicode normalization issues
- Word boundary detection challenges
- Uniqueness validation complexity
- Cross-browser compatibility concerns

By using the browser's native "Copy link to highlight" feature, we leverage:
- Battle-tested implementation
- Consistent behavior across sites
- Better handling of edge cases
- Native browser support and maintenance

## Browser Support

The "Copy link to highlight" feature is available in:
- Google Chrome 90+
- Microsoft Edge 90+
- Other Chromium-based browsers

Firefox does not currently support text fragments natively but can still navigate to text fragment URLs.
