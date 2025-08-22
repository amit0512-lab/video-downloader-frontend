// Select the essential elements from the HTML
const downloadForm = document.getElementById('download-form');
const videoUrlInput = document.getElementById('video-url');
const downloadBtn = document.getElementById('download-btn');
const messageArea = document.getElementById('message-area');

// Listen for the form submission event
downloadForm.addEventListener('submit', handleFormSubmit);

async function handleFormSubmit(event) {
    event.preventDefault(); // Prevent the form from reloading the page
    
    const videoURL = videoUrlInput.value.trim();

    // 1. --- Client-Side Validation ---
    if (videoURL === '') {
        showMessage('Please paste a video link first.', 'error');
        return;
    }

    const platform = detectPlatform(videoURL);
    if (platform === 'Unsupported') {
        showMessage('This link is not supported. Please use a valid YouTube, Instagram Reels, or TikTok link.', 'error');
        return;
    }

    // 2. --- Provide User Feedback ---
    showMessage(`Detected ${platform} link. Processing...`, 'loading');
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Working...';
    messageArea.style.display = 'block';

    try {
        // ======== LOCAL TESTING: send to local backend ========
        // Make sure server is running on localhost:3000
        console.log('→ Sending POST to /download-info with body:', { url: videoURL });

        const response = await fetch('http://localhost:3000/download-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: videoURL })
        });

        // log status and headers
        console.log('← Response status:', response.status, response.statusText);

        const data = await response.json().catch(err => {
            console.error('Failed to parse JSON from response:', err);
            return null;
        });

        console.log('← Response body:', data);

        if (response.ok && data && data.success) {
            // SUCCESS: Backend returned the video details
            showMessage('Success! Your download will begin now.', 'success');
            
            // ======== LOCAL TESTING: use local proxy-download ========
            const proxyUrl = `http://localhost:3000/proxy-download?title=${encodeURIComponent(data.title)}&url=${encodeURIComponent(data.downloadUrl)}`;
            
            // Trigger the download by navigating to the proxy URL.
            window.location.href = proxyUrl;
            
        } else {
            // ERROR: Backend returned an error message
            const msg = (data && (data.error || data.details)) || 'An unknown error occurred on the server.';
            showMessage(msg, 'error');
        }

    } catch (error) {
        // CATCH: Network error or server is down
        console.error('Fetch error:', error);
        showMessage('Could not connect to the server. Please try again in a moment.', 'error');
    } finally {
        // Add a delay before resetting the form to allow the download to start
        setTimeout(() => {
            resetFormState();
        }, 2000);
    }
}

/**
 * Detects the video platform from a given URL using regular expressions.
 * @param {string} url The URL of the video.
 * @returns {string} The name of the platform or 'Unsupported'.
 */
function detectPlatform(url) {
    if (/youtube\.com\/shorts/i.test(url)) return 'YouTube Shorts';
    if (/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)/i.test(url)) return 'YouTube';
    if (/instagram\.com\/(?:p|reel|reels)/i.test(url)) return 'Instagram Reels';
    if (/(?:tiktok\.com|vm\.tiktok\.com)/i.test(url)) return 'TikTok';
    return 'Unsupported';
}

/**
 * Displays a message to the user in the message area.
 * @param {string} text The message to display.
 * @param {string} type The type of message ('error', 'loading', 'success').
 */
function showMessage(text, type) {
    messageArea.textContent = text;
    messageArea.className = ''; // Reset classes
    
    if (type === 'error') {
        messageArea.classList.add('message-error');
    } else if (type === 'loading') {
        messageArea.classList.add('message-loading');
    } else if (type === 'success') {
        messageArea.classList.add('message-success'); // Uses a new success style
    }
    messageArea.style.display = 'block';
}

/**
 * Resets the form and button to their original state.
 */
function resetFormState() {
    downloadBtn.disabled = false;
    downloadBtn.textContent = 'Download';
    videoUrlInput.value = ''; // Clear the input field
}
