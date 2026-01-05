# Background Color Changer - Chrome Extension

A simple Chrome extension that allows users to change the background color of any webpage.

## Features

- Custom color picker for selecting any color
- Quick preset colors for common backgrounds
- Reset button to restore original background
- Clean, modern UI with gradient design

## Installation

1. Clone this repository or download the files
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the extension directory

## Usage

1. Click the extension icon in your Chrome toolbar
2. Choose a color using:
   - The color picker for custom colors
   - Quick preset color buttons
3. Click "Change Background" to apply the color
4. Click "Reset" to restore the original background

## Files

- `manifest.json` - Extension configuration
- `popup.html` - Extension popup UI
- `popup.js` - Extension functionality
- `styles.css` - Popup styling

## Permissions

- `activeTab` - Access to the currently active tab
- `scripting` - Ability to inject scripts to change background color

## Version

1.0.0 - Initial release
