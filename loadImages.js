document.addEventListener('DOMContentLoaded', async () => {
    const gallery = document.getElementById('imageGallery');
    const baseURL = 'https://nftstorage.link/ipfs/bafybeihol4fqc7aqhtvt7wb6uyg5zevtpnxxdm4xdrnviwxmfbosh3jg74/';

    for (let i = 0; i < 420; i++) {
        try {
            const response = await fetch(baseURL + i + '.json');
            const data = await response.json();
            const img = document.createElement('img');
            img.src = baseURL + data.image; // Assuming 'image' contains the filename
            img.alt = data.name;
            img.style.width = 'calc(10% - 10px)';
            img.style.height = 'auto';
            gallery.appendChild(img);
        } catch (error) {
            console.error('Error loading image:', error);
        }
    }
});
