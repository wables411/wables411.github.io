const collections = {
    "Lawbsters": "https://raw.githubusercontent.com/wables411/wables411.github.io/main/images/collections/Lawbsters/",
    "LawbStation": "https://raw.githubusercontent.com/wables411/wables411.github.io/main/images/collections/LawbStation/",
    "Halloween": "https://raw.githubusercontent.com/wables411/wables411.github.io/main/images/collections/Halloween/"
};

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

function fetchRandomImage() {
    const collectionSelector = document.getElementById('collection-selector');
    if (!collectionSelector) {
        console.error('Collection selector not found.');
        return;
    }

    const selectedCollectionKey = collectionSelector.value;
    const selectedCollection = collections[selectedCollectionKey];

    const maxImages = {
        "Lawbsters": 100,
        "LawbStation": 100,
        "Halloween": 100
    };

    const imageNumberInput = document.getElementById('image-number').value;
    const imageNumber = imageNumberInput ? imageNumberInput : Math.floor(Math.random() * maxImages[selectedCollectionKey]) + 1;
    
    const imagePath = `${selectedCollection}${selectedCollectionKey}${imageNumber}.jpg`;

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

function generateMeme() {
    const topText = document.getElementById('top-text').value;
    const bottomText = document.getElementById('bottom-text').value;
    const img = document.getElementById('generated-meme');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (img.complete && img.naturalWidth > 0) {
        console.log('Image already loaded, drawing meme');
        drawMeme(img, topText, bottomText, canvas, ctx);
    } else {
        img.onload = () => {
            console.log('Image loaded, drawing meme');
            drawMeme(img, topText, bottomText, canvas, ctx);
        };
        img.onerror = (err) => {
            console.error('Failed to load image:', err);
        };
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
    // Removing the attempt to use toDataURL due to tainted canvas error
    // img.src = canvas.toDataURL();
}

window.onload = () => {
    console.log('Window loaded');
    loadCollections();
    document.getElementById('fetch-image').addEventListener('click', fetchRandomImage);
    document.getElementById('generate-meme').addEventListener('click', generateMeme);
};
