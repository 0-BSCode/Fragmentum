// Fragmentum - Background Service Worker
// Handles context menu creation and communication with content script

import { ACTIONS } from './constants';

const CONTEXT_MENU_ID = 'fragmentum-generate';
const CONTEXT_MENU_TITLE = 'Fragmentum: Generate fragment';

// Create context menu on extension install/update
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: CONTEXT_MENU_TITLE,
    contexts: ['selection'], // Only show when text is selected
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_ID && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { action: ACTIONS.generateFragment });
  }
});
