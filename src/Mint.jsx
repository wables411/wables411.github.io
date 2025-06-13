// /Users/wables/wables411.github.io/src/Mint.jsx
import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useConfig } from 'wagmi';
import { readContract, writeContract, sendTransaction } from 'wagmi/actions';
import { erc20Abi, maxUint256 } from 'viem';
import './style.css';

const SCATTER_API_URL = 'https://api.scatter.art/v1';
const COLLECTION_SLUG = 'pixelawbs';

function MintListItem({ inviteList, collection, address, config, mintNFT, mintStatus }) {
  const mintedData = useReadContract({
    abi: collection?.abi,
    address: collection?.address,
    functionName: 'minted',
    chainId: 1,
    args: inviteList ? [address, inviteList.root] : undefined,
  });

  const listSupplyData = useReadContract({
    abi: collection?.abi,
    address: collection?.address,
    functionName: 'listSupply',
    chainId: 1,
    args: inviteList ? [address, inviteList.root] : undefined,
  });

  return (
    <div key={inviteList.id} className="mint-section">
      <h3>{inviteList.name}</h3>
      <p>Price: {inviteList.token_price === '0' ? 'FREE' : `${inviteList.token_price} ${inviteList.currency_symbol}`}</p>
      {inviteList.wallet_limit !== 4294967295 && (
        <p>
          Wallet Limit: {mintedData.data ?? '?'} / {inviteList.wallet_limit}
        </p>
      )}
      {inviteList.list_limit !== 4294967295 && (
        <p>
          List Limit: {listSupplyData.data ?? '?'} / {inviteList.list_limit}
        </p>
      )}
      <button
        onClick={() => mintNFT(inviteList.id)}
        disabled={mintStatus.includes('Minting') || collection?.num_items >= collection?.max_items}
        className={mintStatus.includes('Minting') || collection?.num_items >= collection?.max_items ? 'minted-out' : ''}
      >
        {mintStatus.includes('Minting') ? 'Minting...' : 'Mint'}
      </button>
    </div>
  );
}

function Mint() {
  const { address, isConnected } = useAccount();
  const config = useConfig();
  const [collection, setCollection] = useState(null);
  const [inviteLists, setInviteLists] = useState([]);
  const [mintStatus, setMintStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchCollectionData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${SCATTER_API_URL}/collection/${COLLECTION_SLUG}`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch collection data');
      }
      const data = await response.json();
      if (data.chain_id !== 1) {
        throw new Error(`Invalid chain ID: ${data.chain_id}. Expected 1 (Ethereum mainnet)`);
      }
      setCollection({ ...data, abi: JSON.parse(data.abi) });
    } catch (error) {
      console.error('Error fetching collection:', error);
      setMintStatus(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInviteLists = async (minterAddress) => {
    try {
      setIsLoading(true);
      const url = `${SCATTER_API_URL}/collection/${COLLECTION_SLUG}/eligible-invite-lists${minterAddress ? `?minterAddress=${minterAddress}` : ''}`;
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch invite lists');
      }
      const data = await response.json();
      if (!data.length) {
        throw new Error('No invite lists found');
      }
      setInviteLists(data);
    } catch (error) {
      console.error('Error fetching invite lists:', error);
      setMintStatus(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const mintNFT = async (listId) => {
    if (!address) {
      setMintStatus('Please connect your wallet');
      return;
    }
    setMintStatus('Minting...');
    try {
      const response = await fetch(`${SCATTER_API_URL}/mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionAddress: collection.address,
          chainId: 1,
          minterAddress: address,
          lists: [{ id: listId, quantity: 1 }],
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to generate mint transaction');
      }
      const { mintTransaction, erc20s } = await response.json();

      for (const erc20 of erc20s || []) {
        const allowance = await readContract(config, {
          abi: erc20Abi,
          address: erc20.address,
          functionName: 'allowance',
          chainId: 1,
          args: [address, collection.address],
        });
        if (allowance < BigInt(erc20.amount)) {
          await writeContract(config, {
            abi: erc20Abi,
            address: erc20.address,
            functionName: 'approve',
            chainId: 1,
            args: [collection.address, maxUint256],
          });
        }
      }

      await sendTransaction(config, {
        account: address,
        to: mintTransaction.to,
        value: BigInt(mintTransaction.value || 0),
        data: mintTransaction.data,
        chainId: 1,
      });

      setMintStatus('Mint successful!');
      fetchCollectionData();
      fetchInviteLists(address);
    } catch (error) {
      console.error('Minting failed:', error);
      setMintStatus(`Minting failed: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchCollectionData();
    if (isConnected && address) {
      fetchInviteLists(address);
    }
  }, [isConnected, address]);

  return (
    <div className="container">
      <h1>PIXELAWBSTERS</h1>
      <p>Pixelawbsters seem nice but a human controlled by a pixelated lobster would never amount to anything without a roadmap. Inspired by Pixelady Maker. I lawb you.</p>
      <p>CONNECT ETH WALLET TO CHECK ELIGIBILITY + MINT</p>
      <w3m-button />
      {isConnected && (
        <div className="mint-section">
          <p>Connected: {address.slice(0, 4)}...{address.slice(-4)}</p>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <>
              {collection && (
                <div>
                  <p>Progress: {collection.num_items} / {collection.max_items}</p>
                  <progress className="progress" value={(collection.num_items / collection.max_items) * 100} max="100" />
                </div>
              )}
              {inviteLists.length > 0 ? (
                inviteLists.map((inviteList) => (
                  <MintListItem
                    key={inviteList.id}
                    inviteList={inviteList}
                    collection={collection}
                    address={address}
                    config={config}
                    mintNFT={mintNFT}
                    mintStatus={mintStatus}
                  />
                ))
              ) : (
                <p className="error">No invite lists available.</p>
              )}
              {mintStatus && <p className="error">{mintStatus}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Mint;