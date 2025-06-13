// /Users/wables/wables411.github.io/src/appKit.js
import { createAppKit } from '@reown/appkit';
import { mainnet } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error('VITE_WALLET_CONNECT_PROJECT_ID is not set in .env');
}

const metadata = {
  name: 'Lawb.xyz',
  description: 'Lawbster NFT Platform',
  url: import.meta.env.MODE === 'development' ? 'http://localhost:3001' : 'https://lawb.xyz',
  icons: ['https://lawb.xyz/favicon.ico'],
};

const networks = [mainnet];

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  themeMode: 'dark',
  features: {
    analytics: false,
  },
});

export { wagmiAdapter };