document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('imageSearch');
    const imageDisplay = document.getElementById('imageDisplay');
    const enterButton = document.getElementById('enterButton');
    const clearButton = document.getElementById('clearButton');
    const baseURL = 'https://nftstorage.link/ipfs/bafybeif3xrtpeonao3fkiezshu5pehyr27gqxkgjt5w2oanetotdmjnqam/';

    enterButton.addEventListener('click', async () => {
        const imageNumber = searchInput.value;
        if (imageNumber >= 0 && imageNumber < 420) {
            imageDisplay.innerHTML = ''; // Clear current display before showing new image
            try {
                const response = await fetch(baseURL + imageNumber + '.json');
                const data = await response.json();
                const img = document.createElement('img');
                img.src = baseURL + data.image;
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

