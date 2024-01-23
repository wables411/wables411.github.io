document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('imageSearch');
    const imageDisplay = document.getElementById('imageDisplay');
    const enterButton = document.getElementById('enterButton');
    const clearButton = document.getElementById('clearButton');

    enterButton.addEventListener('click', async () => {
        const imageNumber = searchInput.value;
        if (imageNumber >= 0 && imageNumber < 420) {
            imageDisplay.innerHTML = ''; // Clear current display before showing new image
            try {
                const ipfsGateway = 'https://nftstorage.link/ipfs/';
                const response = await fetch(`${ipfsGateway}bafybeie26yz7lz53dg2yykfzkv5jd4stgswm7xb4q46s7sftwo7beglxme/${imageNumber}.json`);
                const data = await response.json();
                const img = document.createElement('img');
                img.src = data.image.startsWith('ipfs://') ? data.image.replace('ipfs://', ipfsGateway) : data.image;
                img.alt = data.name;
                img.style.width = 'calc(50% - 10px)'; // Adjust size as needed
                img.style.height = 'auto';
                imageDisplay.appendChild(img);
            } catch (error) {
                console.error('Error loading image:', error);
            }
        }
    });

    clearButton.addEventListener('click', () => {
        imageDisplay.innerHTML = ''; // Clear the image display
    });
});

