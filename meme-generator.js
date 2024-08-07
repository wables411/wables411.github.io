const collections = {
    "Lawbsters": "http://127.0.0.1:8080/ipfs/QmRFZ9GtqT6A8cF8ZF1x4fsysRHMhFSk1g8QGEBVn249pQ/",
    "Lawbstarz": "https://d1kgk9u8ytew77.cloudfront.net/ipfs/QmXx3YeZiupwcQCrtTPdUbrGJA232x9JsQoxmf8iRq2jN6/",
    "LawbStation": "https://gateway.pinit.io/ipfs/QmR7Sbgf6RCP1mVM6SAnK1Ghbq4iraBjpC3nrvTXFHtmyg/",
};

function loadCollections() {
    const selector = document.getElementById('collection-selector');
    if (selector) {
        console.log('Selector found:', selector);
        Object.keys(collections).forEach(key => {
            console.log('Adding option:', key);
            const option = document.createElement('option');
            option.value = collections[key];
            option.textContent = key;
            selector.appendChild(option);
        });
    } else {
        console.error('Collection selector not found.');
    }
}

function fetchRandomImage() {
    const collectionKeys = Object.keys(collections);
    const randomKey = collectionKeys[Math.floor(Math.random() * collectionKeys.length)];
    const randomCollection = collections[randomKey].replace('ipfs://', 'https://ipfs.io/ipfs/');
    const filename = 'example.jpg'; // Replace with actual logic to fetch a random file
    const imagePath = `${randomCollection}${filename}`;
    const img = document.getElementById('generated-meme');
    if (img) {
        img.src = imagePath;
        img.style.display = 'block';
        console.log('Image path:', imagePath);
    } else {
        console.error('Generated meme image element not found.');
    }
}

function generateMeme() {
    const topText = document.getElementById('top-text').value;
    const bottomText = document.getElementById('bottom-text').value;
    const img = document.getElementById('generated-meme');
    const canvas = document.getElementById('meme-canvas');
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
    img.src = canvas.toDataURL();
}

window.onload = () => {
    console.log('Window loaded');
    loadCollections();
    document.getElementById('fetch-image').addEventListener('click', fetchRandomImage);
    document.getElementById('generate-meme').addEventListener('click', generateMeme);
};
