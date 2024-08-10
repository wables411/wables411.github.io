const collections = {
    "Lawbsters": "images/collections/Lawbsters",
    "LawbStation": "images/collections/LawbStation",
    "Halloween": "images/collections/Halloween",
};

function loadCollections() {
    const selector = document.getElementById('collection-selector');
    if (selector) {
        console.log('Selector found:', selector);
        Object.keys(collections).forEach(key => {
            console.log('Adding option:', key);
            const option = document.createElement('option');
            option.value = key; // Store the key to identify the collection
            option.textContent = key;
            selector.appendChild(option);
        });
    } else {
        console.error('Collection selector not found.');
    }
}

function fetchRandomImage() {
    const collectionSelector = document.getElementById('collection-selector');
    if (!collectionSelector) {
        console.error('Collection selector not found.');
        return;
    }
    
    const selectedCollectionKey = collectionSelector.value;
    const selectedCollection = collections[selectedCollectionKey];
    
    const imageNumber = document.getElementById('image-number').value || '1'; // Default to '1' if no input
    const imagePath = `${selectedCollection}${imageNumber}.jpg`; // Build the image path
    const img = document.getElementById('generated-meme');
    
    if (img) {
        img.src = imagePath;
        img.style.display = 'block';
        console.log('Image path:', imagePath);
        img.onerror = () => {
            console.error('Failed to load image:', imagePath);
            img.style.display = 'none';
        };
    } else {
        console.error('Generated meme image element not found.');
    }
}

function drawMeme(img, topText, bottomText, canvas, ctx) {
    console.log('Drawing meme');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    ctx.font = '30px Impact';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.fillText(topText, canvas.width / 2, 40);
    ctx.strokeText(topText, canvas.width / 2, 40);
    ctx.fillText(bottomText, canvas.width / 2, canvas.height - 20);
    ctx.strokeText(bottomText, canvas.width / 2, canvas.height - 20);
    console.log('Meme drawn with top text:', topText, 'and bottom text:', bottomText);
    img.src = canvas.toDataURL();
}

window.onload = () => {
    console.log('Window loaded');
    loadCollections();
    document.getElementById('fetch-image').addEventListener('click', fetchRandomImage);
    document.getElementById('generate-meme').addEventListener('click', generateMeme);
};
