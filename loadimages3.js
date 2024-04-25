document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('imageSearch');
    const imageDisplay = document.getElementById('imageDisplay');
    const enterButton = document.getElementById('enterButton');
    const clearButton = document.getElementById('clearButton');

    enterButton.addEventListener('click', async () => {
        const imageNumber = searchInput.value;
        if (imageNumber >= 0 && imageNumber <= 1999) {  // Adjusted the range to be inclusive of 199
            imageDisplay.innerHTML = ''; // Clear current display
            try {
                const ipfsGateway = 'https://bafybeidrkdn3f4j4o5c3yy6isokujnrurkvqbip53cvqekzpud44l4fdfi.ipfs.nftstorage.link/';
                const response = await fetch(`${ipfsGateway}${imageNumber}.json`);
                const data = await response.json();
                const img = document.createElement('img');
                img.src = `${ipfsGateway}${imageNumber}.png`; 
                img.alt = data.name;
                img.style.width = '50%'; // Simplified sizing
                img.style.height = 'auto';
                imageDisplay.appendChild(img);
            } catch (error) {
                console.error('Error loading image:', error);
                imageDisplay.innerText = 'Failed to load image. Please check the console for more details.';
            }
        } else {
            imageDisplay.innerText = 'Invalid image number. Please enter a number between 1 and 199.';
        }
    });

    clearButton.addEventListener('click', () => {
        imageDisplay.innerHTML = '';
        searchInput.value = '';
    });
});
