// Select the essential elements from the HTML
const downloadForm = document.getElementById('download-form');
const videoUrlInput = document.getElementById('video-url');
const downloadBtn = document.getElementById('download-btn');
const messageArea = document.getElementById('message-area');

// --- Monetag Ad Integration (Conceptual) ---
function triggerMonetagAd() {
    console.log("Monetag ad would be triggered here.");
    // Example: monetag.triggerAd(); 
}

// Listen for the form submission event
downloadForm.addEventListener('submit', handleFormSubmit);

// --- UPDATED FUNCTION ---
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
        // Step 1: Fetch the video INFORMATION from our new '/download-info' endpoint
        const response = await fetch('http://localhost:3000/download-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: videoURL })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // SUCCESS: Backend returned the video details
            showMessage('Success! Your download will begin now.', 'success');
            
            triggerMonetagAd();

            // Step 2: Construct the URL for our NEW proxy endpoint.
            // We must encode the components to ensure they are passed correctly.
            const proxyUrl = `http://localhost:3000/proxy-download?title=${encodeURIComponent(data.title)}&url=${encodeURIComponent(data.downloadUrl)}`;
            
            // Step 3: Trigger the download by navigating to the proxy URL.
            // The browser will download the file streamed from our server.
            window.location.href = proxyUrl;
            
        } else {
            // ERROR: Backend returned an error message
            showMessage(data.error || 'An unknown error occurred on the server.', 'error');
        }

    } catch (error) {
        // CATCH: Network error or server is down
        console.error('Fetch error:', error);
        showMessage('Could not connect to the server. Please ensure it is running.', 'error');
    } finally {
        // Add a delay before resetting the form to allow the download to start
        setTimeout(() => {
            resetFormState();
        }, 2000);
    }
}

// The old startDownload function is no longer needed and has been removed.

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