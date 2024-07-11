chrome.runtime.onInstalled.addListener(() => {
    // initialize any necessary data in storage
    chrome.storage.sync.set({ unit: 'in', measurements: {} });
  });
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'openPopup') {
      chrome.action.openPopup();
    }
  });