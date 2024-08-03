const collections = {
    "Lawbsters": "ipfs://bafybeibvgwjwuosoov6cfgwoyyrt7vocalqoprjayni6rfepda7bi2jdse/",
    "Lawbstarz": "ipfs://QmPLgnmY2poaPtoEbnB9m7cv5FdiMXwEpxDjjQ23n5tQDs/",
    "Lawb Halloween": "ipfs://bafybeiak4wu7ta6gwqlsrdkz23y2pesfara5tarkyxeqq7ilelaf2epauu/",
    "LawbStation": "ipfs://bafkreifzpik5pvnoo6phgf4uaohufo227lxacnzdfnnivk67bxd2tupidu/",
    "LawbNexus": "ipfs://QmNsxQaZuEA8pLpp3u5ansz3TwobwTLHxv8LSdxm2jiBz7/"
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
    
    if (img.complete) {
        drawMeme(img, topText, bottomText, canvas, ctx);
    } else {
        img.onload = () => drawMeme(img, topText, bottomText, canvas, ctx);
    }
}

function drawMeme(img, topText, bottomText, canvas, ctx) {
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
    img.src = canvas.toDataURL();
}

window.onload = () => {
    console.log('Window loaded');
    loadCollections();
    document.getElementById('fetch-image').addEventListener('click', fetchRandomImage);
    document.getElementById('generate-meme').addEventListener('click', generateMeme);
};
