# Fragmentum - Chrome Extension

A powerful Chrome extension that generates shareable URL fragments from text selections and allows customization of webpage backgrounds.

## Features

### Text Fragment Generation
- **Select & Share**: Highlight any text on a webpage and generate a shareable URL that links directly to that text
- **Smart Floating Button**: Non-intrusive button appears near your selection
- **One-Click Copy**: Instantly copy the fragment URL to your clipboard
- **Keyboard Shortcut**: Use `Ctrl+Shift+L` (or `Cmd+Shift+L` on Mac) for quick access
- **Context-Aware**: Automatically adds prefix/suffix context for precise text highlighting
- **Long Selection Support**: Intelligently handles selections of any length

### Background Color Customization
- **Custom Color Picker**: Select any color for webpage backgrounds
- **Quick Preset Colors**: One-click access to common background colors
- **Easy Reset**: Restore original background with a single click
- **Clean Modern UI**: Intuitive popup interface

## Installation

1. Clone this repository or download the files
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked"
5. Select the extension directory

## Usage

### Generating Text Fragment URLs

1. **Select Text**: Highlight any text on a webpage
2. **Click the Button**: A floating link button will appear near your selection
3. **URL Copied**: The fragment URL is automatically copied to your clipboard
4. **Share**: Paste the URL anywhere to share the exact text location

**Alternative Method**: Select text and press `Ctrl+Shift+L` (or `Cmd+Shift+L` on Mac)

**What happens when someone opens your link?**
- The browser will navigate to the page and automatically scroll to and highlight the selected text
- Works on Chrome 80+, Edge 80+, and Brave 1.20+

### Changing Background Colors

1. Click the Fragmentum extension icon in your Chrome toolbar
2. Choose a color using:
   - The color picker for custom colors
   - Quick preset color buttons
3. Click "Change Background" to apply the color
4. Click "Reset" to restore the original background

## How Text Fragments Work

Text Fragments use a special URL syntax to link to specific text on a page:

```
https://example.com/page#:~:text=selected%20text
```

The extension automatically generates the optimal fragment format:
- **Simple selections**: `#:~:text=selected text`
- **With context**: `#:~:text=prefix-,selected text,-suffix`
- **Long selections**: `#:~:text=start text,end text`

This ensures the browser can accurately locate and highlight your selected text.

## Browser Compatibility

### Text Fragments
- Chrome 80+ (Full support)
- Edge 80+ (Full support)
- Brave 1.20+ (Full support)
- Safari (URLs copy correctly but won't highlight text)
- Firefox (URLs copy correctly but won't highlight text)

### Background Color Feature
- All Chromium-based browsers (Chrome, Edge, Brave, Opera, etc.)

## Files

- `manifest.json` - Extension configuration and permissions
- `popup.html` - Extension popup UI
- `popup.js` - Background color functionality
- `styles.css` - Popup styling
- `content.js` - Text fragment generation logic
- `content.css` - Floating button styling
- `icon16.png`, `icon48.png`, `icon128.png` - Extension icons

## Permissions

- `activeTab` - Access to the currently active tab
- `scripting` - Ability to inject scripts for background color changes
- `clipboardWrite` - Copy generated URLs to clipboard
- `storage` - Store user preferences (future enhancement)

## Privacy Considerations

- **Local Processing**: All text fragment generation happens locally in your browser
- **No Data Collection**: The extension does not collect, store, or transmit any user data
- **No External Servers**: No external API calls or server communication
- **URL Content**: Generated URLs contain the selected text, so be mindful when sharing sensitive information

## Known Limitations

- Text fragments may not work in iframes or shadow DOM elements
- Some dynamically loaded content may not be accessible
- Browser support for Text Fragments varies (see Browser Compatibility)
- Very short selections (< 3 characters) are ignored for better precision

## Keyboard Shortcuts

- `Ctrl+Shift+L` (Windows/Linux) or `Cmd+Shift+L` (Mac) - Generate and copy text fragment URL

## Version History

**2.0.0** - Text Fragment Generation
- Added text selection and URL fragment generation
- Implemented floating button UI
- Added keyboard shortcut support
- Updated extension branding to "Fragmentum"

**1.0.0** - Initial Release
- Background color changer functionality

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - feel free to use and modify as needed.
