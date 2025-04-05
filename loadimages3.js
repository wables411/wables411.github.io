document.addEventListener('DOMContentLoaded', () => {
    console.log('loadImages3.js running');
    const searchInput = document.getElementById('nexusImageSearch');
    const imageDisplay = document.getElementById('nexusImageDisplay');
    const enterButton = document.getElementById('nexusEnterButton');
    const clearButton = document.getElementById('nexusClearButton');

    if (searchInput && imageDisplay && enterButton && clearButton) {
        console.log('LawbNexus elements found');
        enterButton.addEventListener('click', async () => {
            console.log('Enter button clicked');
            const imageNumber = parseInt(searchInput.value);
            if (imageNumber >= 0 && imageNumber <= 999) { // Adjusted to 999 per your range
                imageDisplay.innerHTML = '';
                try {
                    const ipfsGateway = 'https://bafybeic6uouxkzrdj2cv4f7ssrelf6t732jwket253mc746xrlv4csml3u.ipfs.nftstorage.link/';
                    const response = await fetch(`${ipfsGateway}${imageNumber}.json`);
                    const data = await response.json();
                    const img = document.createElement('img');
                    img.src = `${ipfsGateway}${imageNumber}.png`;
                    img.alt = data.name || `LawbNexus #${imageNumber}`;
                    img.style.width = 'calc(50% - 10px)';
                    img.style.height = 'auto';
                    img.className = 'section-image';
                    imageDisplay.appendChild(img);
                    console.log(`LawbNexus #${imageNumber} loaded`);
                } catch (error) {
                    console.error('Error loading LawbNexus image:', error);
                    imageDisplay.innerText = 'Failed to load image.';
                }
            } else {
                imageDisplay.innerText = 'Invalid image number. Please enter a number between 0 and 999.';
            }
        });

        searchInput.addEventListener('keypress', async (event) => {
            if (event.key === 'Enter') {
                console.log('Enter key pressed');
                event.preventDefault();
                const imageNumber = parseInt(searchInput.value);
                if (imageNumber >= 0 && imageNumber <= 999) {
                    imageDisplay.innerHTML = '';
                    try {
                        const ipfsGateway = 'https://bafybeic6uouxkzrdj2cv4f7ssrelf6t732jwket253mc746xrlv4csml3u.ipfs.nftstorage.link/';
                        const response = await fetch(`${ipfsGateway}${imageNumber}.json`);
                        const data = await response.json();
                        const img = document.createElement('img');
                        img.src = `${ipfsGateway}${imageNumber}.png`;
                        img.alt = data.name || `LawbNexus #${imageNumber}`;
                        img.style.width = 'calc(50% - 10px)';
                        img.style.height = 'auto';
                        img.className = 'section-image';
                        imageDisplay.appendChild(img);
                        console.log(`LawbNexus #${imageNumber} loaded`);
                    } catch (error) {
                        console.error('Error loading LawbNexus image:', error);
                        imageDisplay.innerText = 'Failed to load image.';
                    }
                } else {
                    imageDisplay.innerText = 'Invalid image number. Please enter a number between 0 and 999.';
                }
            }
        });

        clearButton.addEventListener('click', () => {
            console.log('Clear button clicked');
            imageDisplay.innerHTML = '';
            searchInput.value = '';
        });
    } else {
        console.error('One or more LawbNexus elements not found:', { searchInput, imageDisplay, enterButton, clearButton });
    }
});