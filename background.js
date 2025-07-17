// Background service worker for LeetCode Reminder extension

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'REMINDER_SET') {
        // Show notification when reminder is set
        const emailStatus = message.emailSent ? 
            'Confirmation email sent! 📧' : 
            'Reminder set (email may have failed)';
            
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon-48.png',
            title: 'LeetCode Reminder Set!',
            message: `${message.problemTitle}\n${emailStatus}`
        });
    }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('LeetCode Reminder extension installed');
});

// Handle storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.userEmail) {
        console.log('User email updated:', changes.userEmail.newValue);
    }
}); 