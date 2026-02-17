console.log('Navigator Content Script Active');

// simple listener to confirm it's working
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scrape_page') {
        const bodyText = document.body.innerText;
        sendResponse({ success: true, text: bodyText });
    }
});
