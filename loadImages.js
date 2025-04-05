document.addEventListener('DOMContentLoaded', () => {
    console.log('loadImages.js running');
    const searchInput = document.getElementById('stationImageSearch');
    const imageDisplay = document.getElementById('stationImageDisplay');
    const enterButton = document.getElementById('stationEnterButton');
    const clearButton = document.getElementById('stationClearButton');

    if (searchInput && imageDisplay && enterButton && clearButton) {
        console.log('LawbStation elements found');
        enterButton.addEventListener('click', async () => {
            console.log('Enter button clicked');
            const imageNumber = parseInt(searchInput.value);
            if (imageNumber >= 0 && imageNumber <= 419) {
                imageDisplay.innerHTML = '';
                try {
                    const ipfsGateway = 'https://bafybeie26yz7lz53dg2yykfzkv5jd4stgswm7xb4q46s7sftwo7beglxme.ipfs.nftstorage.link/';
                    const response = await fetch(`${ipfsGateway}${imageNumber}.json`);
                    const data = await response.json();
                    const img = document.createElement('img');
                    img.src = `${ipfsGateway}${imageNumber}.png`;
                    img.alt = data.name || `LawbStation #${imageNumber}`;
                    img.style.width = 'calc(50% - 10px)';
                    img.style.height = 'auto';
                    img.className = 'section-image';
                    imageDisplay.appendChild(img);
                    console.log(`LawbStation #${imageNumber} loaded`);
                } catch (error) {
                    console.error('Error loading LawbStation image:', error);
                    imageDisplay.innerText = 'Failed to load image.';
                }
            } else {
                imageDisplay.innerText = 'Invalid image number. Please enter a number between 0 and 419.';
            }
        });

        searchInput.addEventListener('keypress', async (event) => {
            if (event.key === 'Enter') {
                console.log('Enter key pressed');
                event.preventDefault();
                const imageNumber = parseInt(searchInput.value);
                if (imageNumber >= 0 && imageNumber <= 419) {
                    imageDisplay.innerHTML = '';
                    try {
                        const ipfsGateway = 'https://bafybeie26yz7lz53dg2yykfzkv5jd4stgswm7xb4q46s7sftwo7beglxme.ipfs.nftstorage.link/';
                        const response = await fetch(`${ipfsGateway}${imageNumber}.json`);
                        const data = await response.json();
                        const img = document.createElement('img');
                        img.src = `${ipfsGateway}${imageNumber}.png`;
                        img.alt = data.name || `LawbStation #${imageNumber}`;
                        img.style.width = 'calc(50% - 10px)';
                        img.style.height = 'auto';
                        img.className = 'section-image';
                        imageDisplay.appendChild(img);
                        console.log(`LawbStation #${imageNumber} loaded`);
                    } catch (error) {
                        console.error('Error loading LawbStation image:', error);
                        imageDisplay.innerText = 'Failed to load image.';
                    }
                } else {
                    imageDisplay.innerText = 'Invalid image number. Please enter a number between 0 and 419.';
                }
            }
        });

        clearButton.addEventListener('click', () => {
            console.log('Clear button clicked');
            imageDisplay.innerHTML = '';
            searchInput.value = '';
        });
    } else {
        console.error('One or more LawbStation elements not found:', { searchInput, imageDisplay, enterButton, clearButton });
    }
});