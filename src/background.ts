// Fragmentum - Background Service Worker
// Handles context menu creation and communication with content script

// Create context menu on extension install/update
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'fragmentum-generate',
    title: 'Fragmentum: Generate fragment',
    contexts: ['selection'], // Only show when text is selected
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'fragmentum-generate' && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'generateFragment' });
  }
});
