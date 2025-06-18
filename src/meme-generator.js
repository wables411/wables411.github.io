document.addEventListener('DOMContentLoaded', () => {
  console.log('meme-generator.js running');
  const collections = [
    { name: 'Lawbsters', path: '/images/collections/Lawbsters/Lawbsters', count: 100 },
    { name: 'LawbStation', path: '/images/collections/LawbStation/LawbStation', count: 100 },
    { name: 'Halloween', path: '/images/collections/Halloween/Halloween', count: 99 },
    { name: 'Lawbstarz', path: '/images/collections/Lawbstarz/Lawbstarz', count: 100 }
  ];

  const selector = document.getElementById('collection-selector'); // Change from 'collectionSelector'
  const imageContainer = document.getElementById('imageContainer');

  if (selector && imageContainer) {
    console.log('Selector found');
    collections.forEach(collection => {
      const option = document.createElement('option');
      option.value = collection.path;
      option.textContent = collection.name;
      selector.appendChild(option);
    });

    selector.addEventListener('change', () => {
      const selectedPath = selector.value;
      const selectedCollection = collections.find(col => col.path === selectedPath);
      if (selectedCollection) {
        console.log(`Loading ${selectedCollection.name} images`);
        imageContainer.innerHTML = '';
        for (let i = 1; i <= selectedCollection.count; i++) {
          const img = document.createElement('img');
          img.src = `${selectedCollection.path}${i}.jpg`;
          img.alt = `${selectedCollection.name} ${i}`;
          img.className = 'meme-image';
          img.onerror = () => console.error(`Failed to load ${img.src}`);
          imageContainer.appendChild(img);
        }
      }
    });

    // Trigger initial load
    selector.dispatchEvent(new Event('change'));
  } else {
    console.error('Collection selector or image container not found:', { selector, imageContainer });
  }
});