document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('imageSearch');
    const imageDisplay = document.getElementById('imageDisplay');
    const enterButton = document.getElementById('enterButton');
    const clearButton = document.getElementById('clearButton');

    // Only set up event listeners if all elements exist
    if (searchInput && imageDisplay && enterButton && clearButton) {
        enterButton.addEventListener('click', async () => {
            const imageNumber = searchInput.value;
            if (imageNumber >= 0 && imageNumber < 419) {
                imageDisplay.innerHTML = ''; // Clear current display before showing new image
                try {
                    const ipfsGateway = 'https://bafybeie26yz7lz53dg2yykfzkv5jd4stgswm7xb4q46s7sftwo7beglxme.ipfs.nftstorage.link/';
                    const response = await fetch(`${ipfsGateway}${imageNumber}.json`);
                    const data = await response.json();
                    const img = document.createElement('img');
                    img.src = `${ipfsGateway}${imageNumber}.png`; // Use the number to refer to the image directly
                    img.alt = data.name;
                    img.style.width = 'calc(50% - 10px)'; // Adjust size as needed
                    img.style.height = 'auto';
                    imageDisplay.appendChild(img);
                } catch (error) {
                    console.error('Error loading image:', error);
                    imageDisplay.innerText = 'Failed to load image.';
                }
            } else {
                imageDisplay.innerText = 'Invalid image number. Please enter a number between 0 and 419.';
            }
        });

        clearButton.addEventListener('click', () => {
            imageDisplay.innerHTML = ''; // Clear the image display
            searchInput.value = ''; // Clear the search input
        });
    }
});

