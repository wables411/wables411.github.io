// Define the collections
const collections = {
    "Lawbsters": "https://raw.githubusercontent.com/wables411/wables411.github.io/main/images/collections/Lawbsters/",
    "LawbStation": "https://raw.githubusercontent.com/wables411/wables411.github.io/main/images/collections/LawbStation/",
    "Halloween": "https://raw.githubusercontent.com/wables411/wables411.github.io/main/images/collections/Halloween/",
    "Lawbstarz": "https://raw.githubusercontent.com/wables411/wables411.github.io/main/images/collections/Lawbstarz/"
};

// Load collections into the selector
function loadCollections() {
    const selector = document.getElementById('collection-selector');
    if (selector) {
        console.log('Selector found:', selector);
        Object.keys(collections).forEach(key => {
            console.log('Adding option:', key);
            const option = document.createElement('option');
            option.value = key;
            option.textContent = key;
            selector.appendChild(option);
        });
    } else {
        console.error('Collection selector not found.');
    }
}

// Fetch a random image or a specific image number
async function fetchImage() {
    const collectionSelector = document.getElementById('collection-selector');
    const imageNumberInput = document.getElementById('image-number');
    
    if (!collectionSelector) {
        throw new Error('Collection selector not found.');
    }

    const selectedCollectionKey = collectionSelector.value;
    if (!selectedCollectionKey) {
        throw new Error('No collection selected. Please select a collection.');
    }

    const selectedCollection = collections[selectedCollectionKey];
    if (!selectedCollection) {
        throw new Error(`Invalid collection: ${selectedCollectionKey}`);
    }

    const maxImages = 100; // Assuming all collections have 100 images

    let imageNumber;
    if (imageNumberInput && imageNumberInput.value) {
        imageNumber = parseInt(imageNumberInput.value);
        if (isNaN(imageNumber) || imageNumber < 1 || imageNumber > maxImages) {
            throw new Error(`Invalid image number. Please enter a number between 1 and ${maxImages}.`);
        }
    } else {
        imageNumber = Math.floor(Math.random() * maxImages) + 1;
    }

    const imagePath = `${selectedCollection}${selectedCollectionKey}${imageNumber}.jpg`;
    console.log('Fetching image:', imagePath);

    try {
        const response = await fetch(imagePath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error('Error fetching image:', error);
        throw error;
    }
}

// Apply deep fry effect
function applyDeepFryEffect(imageData) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        // Increase saturation
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i] + (data[i] - avg) * 2;     // Red
        data[i + 1] = data[i + 1] + (data[i + 1] - avg) * 2; // Green
        data[i + 2] = data[i + 2] + (data[i + 2] - avg) * 2; // Blue

        // Increase contrast
        data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 1.5 + 128));
        data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * 1.5 + 128));
        data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * 1.5 + 128));

        // Sharpen (simple implementation)
        if (i > 0 && i < data.length - 4) {
            data[i] = Math.min(255, Math.max(0, data[i] * 2 - (data[i - 4] + data[i + 4]) / 2));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * 2 - (data[i - 3] + data[i + 5]) / 2));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * 2 - (data[i - 2] + data[i + 6]) / 2));
        }
    }
    return imageData;
}

// Generate the meme
function generateMeme(imageUrl, topText, bottomText, applyDeepFry = false) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";  // This is important for CORS
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Clear the canvas and draw the image
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            
            if (applyDeepFry) {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const deepFriedImageData = applyDeepFryEffect(imageData);
                ctx.putImageData(deepFriedImageData, 0, 0);
            }

            // Configure text
            const fontSize = 80;
            ctx.font = `${fontSize}px Impact`;
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;

            // Function to wrap text
            function wrapText(text, maxWidth) {
                let words = text.split(' ');
                let lines = [];
                let currentLine = words[0];

                for (let i = 1; i < words.length; i++) {
                    let testLine = currentLine + ' ' + words[i];
                    let metrics = ctx.measureText(testLine);
                    let testWidth = metrics.width;

                    if (testWidth > maxWidth) {
                        lines.push(currentLine);
                        currentLine = words[i];
                    } else {
                        currentLine = testLine;
                    }
                }
                lines.push(currentLine);
                return lines;
            }

            // Draw top text
            let topLines = wrapText(topText, canvas.width - 20);
            topLines.forEach((line, index) => {
                ctx.fillText(line, canvas.width / 2, fontSize + (index * fontSize));
                ctx.strokeText(line, canvas.width / 2, fontSize + (index * fontSize));
            });

            // Draw bottom text
            let bottomLines = wrapText(bottomText, canvas.width - 20);
            bottomLines.reverse().forEach((line, index) => {
                ctx.fillText(line, canvas.width / 2, canvas.height - 10 - (index * fontSize));
                ctx.strokeText(line, canvas.width / 2, canvas.height - 10 - (index * fontSize));
            });

            resolve(canvas.toDataURL());
        };
        img.onerror = reject;
        img.src = imageUrl;
    });
}

// Event listeners
window.onload = () => {
    console.log('Window loaded');
    loadCollections();
    
    const fetchImageButton = document.getElementById('fetch-image');
    const generateMemeButton = document.getElementById('generate-meme');
    const deepFryButton = document.getElementById('deep-fry');
    let originalImageUrl = null;
    let isDeepFried = false;

    if (fetchImageButton) {
        fetchImageButton.addEventListener('click', async () => {
            try {
                originalImageUrl = await fetchImage();
                const img = document.getElementById('generated-meme');
                if (img) {
                    img.src = originalImageUrl;
                    img.style.display = 'block';
                } else {
                    console.error('Generated meme image element not found.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert(error.message);
            }
        });
    } else {
        console.error('Fetch image button not found.');
    }

    if (generateMemeButton) {
        generateMemeButton.addEventListener('click', async () => {
            const topText = document.getElementById('top-text')?.value || '';
            const bottomText = document.getElementById('bottom-text')?.value || '';
            const img = document.getElementById('generated-meme');

            if (!originalImageUrl) {
                alert('Please fetch an image first.');
                return;
            }

            try {
                const memeUrl = await generateMeme(originalImageUrl, topText, bottomText, isDeepFried);
                img.src = memeUrl;
            } catch (error) {
                console.error('Error generating meme:', error);
                alert('Error generating meme. Please try again.');
            }
        });
    } else {
        console.error('Generate meme button not found.');
    }

    if (deepFryButton) {
        deepFryButton.addEventListener('click', async () => {
            if (!originalImageUrl) {
                alert('Please fetch an image first.');
                return;
            }

            const topText = document.getElementById('top-text')?.value || '';
            const bottomText = document.getElementById('bottom-text')?.value || '';
            const img = document.getElementById('generated-meme');

            isDeepFried = !isDeepFried;
            deepFryButton.textContent = isDeepFried ? 'Remove Deep Fry' : 'Deep Fry';

            try {
                const memeUrl = await generateMeme(originalImageUrl, topText, bottomText, isDeepFried);
                img.src = memeUrl;
            } catch (error) {
                console.error('Error applying deep fry effect:', error);
                alert('Error applying deep fry effect. Please try again.');
            }
        });
    } else {
        console.error('Deep fry button not found.');
    }
};
