// Content script for LeetCode Reminder extension
(function() {
    'use strict';

    // Wait for page to load
    function waitForElement(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector(selector);
                if (element) {
                    obs.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error('Element not found within timeout'));
            }, timeout);
        });
    }

    // Extract problem information
    function getProblemInfo() {
        // Try multiple selectors for the title
        const titleSelectors = [
            '[data-cy="question-title"]',
            'h1',
            '.text-title-large',
            '.mr-2.text-label-1',
            '[data-track-load="description_content"] h1',
            'div[data-track-load="description_content"] .mr-2'
        ];
        
        let title = 'Unknown Problem';
        for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element?.textContent?.trim()) {
                title = element.textContent.trim();
                break;
            }
        }
        
        // Try multiple selectors for difficulty
        const difficultySelectors = [
            '[diff]',
            '.text-difficulty-easy',
            '.text-difficulty-medium', 
            '.text-difficulty-hard',
            '.text-olive',
            '.text-yellow',
            '.text-pink'
        ];
        
        let difficulty = 'Unknown';
        for (const selector of difficultySelectors) {
            const element = document.querySelector(selector);
            if (element?.textContent?.trim()) {
                difficulty = element.textContent.trim();
                break;
            }
        }
        
        const url = window.location.href;
        const problemId = url.match(/\/problems\/([^\/]+)/)?.[1] || 'unknown';
        
        console.log('Problem info extracted:', { title, difficulty, url, problemId });
        
        return {
            title: title.trim(),
            difficulty: difficulty.trim(),
            url,
            problemId
        };
    }

    // Create remind me button
    function createRemindButton() {
        const button = document.createElement('button');
        button.id = 'leetcode-remind-btn';
        button.className = 'leetcode-remind-button';
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
            </svg>
            Remind Me
        `;
        
        button.addEventListener('click', handleRemindClick);
        return button;
    }

    // Handle remind button click
    async function handleRemindClick(event) {
        event.preventDefault();
        
        const button = event.currentTarget;
        const originalText = button.innerHTML;
        
        button.innerHTML = 'Setting Reminder...';
        button.disabled = true;

        try {
            const problemInfo = getProblemInfo();
            
            // Get user email from storage or prompt
            const result = await chrome.storage.sync.get(['userEmail']);
            let email = result.userEmail;
            
            if (!email) {
                email = prompt('Please enter your email for reminders:');
                if (!email) {
                    throw new Error('Email is required for reminders');
                }
                await chrome.storage.sync.set({ userEmail: email });
            }

            // Send to backend API
            const response = await fetch('https://leetcode-reminder-production.up.railway.app/api/reminders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...problemInfo,
                    email
                })
            });

            if (!response.ok) {
                throw new Error('Failed to set reminder');
            }
            
            const responseData = await response.json();

            // Check if confirmation email was sent
            if (responseData.confirmationEmail?.sent) {
                button.innerHTML = '✓ Reminder Set! Email Sent 📧';
                console.log('✅ Confirmation email sent successfully');
            } else {
                button.innerHTML = '✓ Reminder Set! (Email failed)';
                console.warn('⚠️ Reminder set but email failed:', responseData.confirmationEmail?.error);
            }
            
            button.classList.add('reminded');
            
            // Show notification
            chrome.runtime.sendMessage({
                type: 'REMINDER_SET',
                problemTitle: problemInfo.title,
                emailSent: responseData.confirmationEmail?.sent || false
            });

        } catch (error) {
            console.error('Error setting reminder:', error);
            button.innerHTML = 'Error - Try Again';
            alert('Failed to set reminder. Please try again.');
        } finally {
            setTimeout(() => {
                if (!button.classList.contains('reminded')) {
                    button.innerHTML = originalText;
                }
                button.disabled = false;
            }, 2000);
        }
    }

    // Insert button into page
    async function insertRemindButton() {
        try {
            // Check if button already exists
            if (document.getElementById('leetcode-remind-btn')) {
                console.log('Remind button already exists');
                return;
            }

            // Try multiple locations for button placement
            const locationStrategies = [
                // Strategy 1: After like/dislike buttons
                () => {
                    const likeButton = document.querySelector('[data-cy="like-button"]');
                    if (likeButton) {
                        return likeButton.parentNode;
                    }
                },
                
                // Strategy 2: Near action buttons area
                () => {
                    const actionsArea = document.querySelector('.flex.items-center.gap-2, .flex.items-center.space-x-2');
                    return actionsArea;
                },
                
                // Strategy 3: After problem title
                () => {
                    const titleSelectors = ['h1', '.text-title-large', '.mr-2.text-label-1'];
                    for (const selector of titleSelectors) {
                        const title = document.querySelector(selector);
                        if (title) {
                            return title.parentNode;
                        }
                    }
                },
                
                // Strategy 4: In the problem description area
                () => {
                    const descArea = document.querySelector('[data-track-load="description_content"]');
                    return descArea;
                },
                
                // Strategy 5: Fallback - create a container
                () => {
                    const body = document.querySelector('body');
                    if (body) {
                        const container = document.createElement('div');
                        container.style.position = 'fixed';
                        container.style.top = '10px';
                        container.style.right = '10px';
                        container.style.zIndex = '9999';
                        body.appendChild(container);
                        return container;
                    }
                }
            ];

            let targetElement = null;
            let strategy = 0;
            
            for (const getTarget of locationStrategies) {
                strategy++;
                targetElement = getTarget();
                if (targetElement) {
                    console.log(`Using strategy ${strategy} for button placement`);
                    break;
                }
            }

            if (!targetElement) {
                console.log('Could not find any suitable location for remind button');
                return;
            }

            const button = createRemindButton();
            targetElement.appendChild(button);

            console.log('✅ Remind button inserted successfully using strategy', strategy);
            
        } catch (error) {
            console.error('❌ Error inserting remind button:', error);
        }
    }

    // Initialize
    function init() {
        console.log('🧠 LeetCode Reminder: Initializing...');
        
        // Try multiple initialization strategies
        const initStrategies = [
            // Strategy 1: Wait for h1
            () => waitForElement('h1', 3000),
            
            // Strategy 2: Wait for any title element
            () => waitForElement('.text-title-large, .mr-2.text-label-1', 3000),
            
            // Strategy 3: Wait for description area
            () => waitForElement('[data-track-load="description_content"]', 3000),
            
            // Strategy 4: Just wait for body
            () => waitForElement('body', 1000)
        ];
        
        async function tryInit() {
            for (let i = 0; i < initStrategies.length; i++) {
                try {
                    console.log(`Trying initialization strategy ${i + 1}...`);
                    await initStrategies[i]();
                    console.log(`✅ Strategy ${i + 1} succeeded, inserting button...`);
                    
                    // Wait a bit for page to stabilize
                    setTimeout(() => {
                        insertRemindButton();
                        
                        // Try again after 2 seconds in case of dynamic loading
                        setTimeout(insertRemindButton, 2000);
                    }, 500);
                    
                    return; // Success, exit
                } catch (error) {
                    console.log(`Strategy ${i + 1} failed:`, error.message);
                }
            }
            
            console.log('⚠️ All initialization strategies failed, but trying button insertion anyway...');
            setTimeout(insertRemindButton, 1000);
        }
        
        tryInit();
    }

    // Run when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Handle navigation changes (SPA)
    let currentUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== currentUrl) {
            currentUrl = location.href;
            if (location.href.includes('/problems/')) {
                setTimeout(init, 1000);
            }
        }
    }).observe(document, { subtree: true, childList: true });

})(); 