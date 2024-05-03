const collections = {
    "Lawbsters": "ipfs://bafybeibvgwjwuosoov6cfgwoyyrt7vocalqoprjayni6rfepda7bi2jdse/",
    "Lawbstarz": "ipfs://QmPLgnmY2poaPtoEbnB9m7cv5FdiMXwEpxDjjQ23n5tQDs/",
    "Lawb Halloween": "ipfs://bafybeiak4wu7ta6gwqlsrdkz23y2pesfara5tarkyxeqq7ilelaf2epauu/",
    "LawbStation": "ipfs://bafkreifzpik5pvnoo6phgf4uaohufo227lxacnzdfnnivk67bxd2tupidu/",
    "LawbNexus": "ipfs://QmNsxQaZuEA8pLpp3u5ansz3TwobwTLHxv8LSdxm2jiBz7/"
};

function loadCollections() {
    const selector = document.getElementById('collection-selector');
    Object.keys(collections).forEach(key => {
        const option = document.createElement('option');
        option.value = collections[key];
        option.textContent = key;
        selector.appendChild(option);
    });
}

function fetchRandomImage() {
    const collectionKeys = Object.keys(collections);
    const randomKey = collectionKeys[Math.floor(Math.random() * collectionKeys.length)];
    const randomCollection = collections[randomKey].replace('ipfs://', 'https://ipfs.io/ipfs/');
    // Assuming you know the structure of files or have a specific file to display, example:
    const filename = 'example.jpg'; // You should adjust this part
    const imagePath = `${randomCollection}${filename}`;
    document.getElementById('generated-meme').src = imagePath;
    document.getElementById('generated-meme').style.display = 'block';
}

function generateMeme() {
    const topText = document.getElementById('top-text').value;
    const bottomText = document.getElementById('bottom-text').value;
    const imgSrc = document.getElementById('generated-meme').src;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
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

        document.getElementById('generated-meme').src = canvas.toDataURL();
    };
    img.src = imgSrc;
}

window.onload = loadCollections;
