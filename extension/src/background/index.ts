console.log('Navigator Background Service Worker Active');

chrome.runtime.onInstalled.addListener(() => {
    console.log('Navigator Extension Installed');
});
