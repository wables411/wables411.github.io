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
    const filename = 'example.jpg'; // Replace with actual logic to fetch a random file
    const imagePath = `${randomCollection}${filename}`;
    document
