// Define the collections
const collections = {
    "Lawbsters": "https://raw.githubusercontent.com/wables411/wables411.github.io/main/images/collections/Lawbsters/",
    "LawbStation": "https://raw.githubusercontent.com/wables411/wables411.github.io/main/images/collections/LawbStation/",
    "Halloween": "https://raw.githubusercontent.com/wables411/wables411.github.io/main/images/collections/Halloween/"
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
    const selectedCollection = collections[selectedCollectionKey];
    const maxImages = 100; // Assuming all collections have 100 images

    let imageNumber;
    if (imageNumberInput.value) {
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

// Generate the meme
function generateMeme(imageUrl, topText, bottomText) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";  // This is important for CORS
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw image
            ctx.drawImage(img, 0, 0);
            
            // Configure text
            ctx.font = '30px Impact';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;

            // Draw top text
            ctx.fillText(topText, canvas.width / 2, 40);
            ctx.strokeText(topText, canvas.width / 2, 40);

            // Draw bottom text
            ctx.fillText(bottomText, canvas.width / 2, canvas.height - 20);
            ctx.strokeText(bottomText, canvas.width / 2, canvas.height - 20);

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
    
    document.getElementById('fetch-image').addEventListener('click', async () => {
        try {
            const imageUrl = await fetchImage();
            const img = document.getElementById('generated-meme');
            img.src = imageUrl;
            img.style.display = 'block';
        } catch (error) {
            console.error('Error:', error);
            alert(error.message);
        }
    });

    document.getElementById('generate-meme').addEventListener('click', async () => {
        const topText = document.getElementById('top-text').value;
        const bottomText = document.getElementById('bottom-text').value;
        const img = document.getElementById('generated-meme');

        if (!img.src) {
            alert('Please fetch an image first.');
            return;
        }

        try {
            const memeUrl = await generateMeme(img.src, topText, bottomText);
            img.src = memeUrl;
        } catch (error) {
            console.error('Error generating meme:', error);
            alert('Error generating meme. Please try again.');
        }
    });
};
