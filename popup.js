// Popup script for LeetCode Reminder extension

document.addEventListener('DOMContentLoaded', async () => {
    const emailInput = document.getElementById('email');
    const saveButton = document.getElementById('save-email');
    const statusDiv = document.getElementById('status');

    // Load saved email
    try {
        const result = await chrome.storage.sync.get(['userEmail']);
        if (result.userEmail) {
            emailInput.value = result.userEmail;
        }
    } catch (error) {
        console.error('Error loading email:', error);
    }

    // Save email function
    async function saveEmail() {
        const email = emailInput.value.trim();
        
        if (!email) {
            showStatus('Please enter an email address', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showStatus('Please enter a valid email address', 'error');
            return;
        }

        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';

        try {
            await chrome.storage.sync.set({ userEmail: email });
            showStatus('Email saved successfully!', 'success');
            
            // Optional: Test backend connection
            try {
                const response = await fetch('http://localhost:3001/api/test', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                
                if (response.ok) {
                    console.log('Backend connection successful');
                } else {
                    console.warn('Backend connection failed');
                }
            } catch (backendError) {
                console.warn('Backend not running:', backendError);
            }
            
        } catch (error) {
            console.error('Error saving email:', error);
            showStatus('Error saving email', 'error');
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = 'Save Email';
        }
    }

    // Show status message
    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
        
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }

    // Validate email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Event listeners
    saveButton.addEventListener('click', saveEmail);
    
    emailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveEmail();
        }
    });

    // Focus email input
    emailInput.focus();
}); 