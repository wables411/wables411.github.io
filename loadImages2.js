document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('imageSearch');
    const imageDisplay = document.getElementById('imageDisplay');
    const enterButton = document.getElementById('enterButton');
    const clearButton = document.getElementById('clearButton');

    if (searchInput && imageDisplay && enterButton && clearButton) {
        enterButton.addEventListener('click', async () => {
            const imageNumber = parseInt(searchInput.value);
            if (imageNumber >= 0 && imageNumber <= 419) { // Adjusted to 0-419
                imageDisplay.innerHTML = '';
                try {
                    const ipfsGateway = 'https://bafybeig43f55txzftdgfkp44f6yukahnd4smc7egoagoj2qcupayryfbmy.ipfs.nftstorage.link/';
                    const response = await fetch(`${ipfsGateway}${imageNumber}.json`);
                    const data = await response.json();
                    const img = document.createElement('img');
                    img.src = `${ipfsGateway}${imageNumber}.png`;
                    img.alt = data.name || `Lawbster #${imageNumber}`;
                    img.style.width = 'calc(50% - 10px)';
                    img.style.height = 'auto';
                    img.className = 'section-image';
                    imageDisplay.appendChild(img);
                } catch (error) {
                    console.error('Error loading Lawbster image:', error);
                    imageDisplay.innerText = 'Failed to load image.';
                }
            } else {
                imageDisplay.innerText = 'Invalid image number. Please enter a number between 0 and 419.';
            }
        });

        // Add Enter key listener
        searchInput.addEventListener('keypress', async (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const imageNumber = parseInt(searchInput.value);
                if (imageNumber >= 0 && imageNumber <= 419) {
                    imageDisplay.innerHTML = '';
                    try {
                        const ipfsGateway = 'https://bafybeig43f55txzftdgfkp44f6yukahnd4smc7egoagoj2qcupayryfbmy.ipfs.nftstorage.link/';
                        const response = await fetch(`${ipfsGateway}${imageNumber}.json`);
                        const data = await response.json();
                        const img = document.createElement('img');
                        img.src = `${ipfsGateway}${imageNumber}.png`;
                        img.alt = data.name || `Lawbster #${imageNumber}`;
                        img.style.width = 'calc(50% - 10px)';
                        img.style.height = 'auto';
                        img.className = 'section-image';
                        imageDisplay.appendChild(img);
                    } catch (error) {
                        console.error('Error loading Lawbster Board image:', error);
                        imageDisplay.innerText = 'Failed to load image.';
                    }
                } else {
                    imageDisplay.innerText = 'Invalid image number. Please enter a number between 0 and 419.';
                }
            }
        });

        clearButton.addEventListener('click', () => {
            imageDisplay.innerHTML = '';
            searchInput.value = '';
        });
    } else {
        console.error('One or more Lawbster elements not found:', { searchInput, imageDisplay, enterButton, clearButton });
    }
});