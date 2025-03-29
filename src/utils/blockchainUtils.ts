
import { ethers } from 'ethers';

// Testnet RPC endpoints
const NETWORKS = {
  ETHEREUM_GOERLI: {
    name: 'Ethereum Goerli',
    rpcUrl: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', // Public Infura endpoint
    chainId: 5,
    symbol: 'ETH',
    blockExplorer: 'https://goerli.etherscan.io'
  },
  POLYGON_MUMBAI: {
    name: 'Polygon Mumbai',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    chainId: 80001,
    symbol: 'MATIC',
    blockExplorer: 'https://mumbai.polygonscan.com'
  }
};

// Default to Ethereum Goerli
let currentNetwork = NETWORKS.ETHEREUM_GOERLI;

// Get provider for current network
export const getProvider = () => {
  return new ethers.JsonRpcProvider(currentNetwork.rpcUrl);
};

// Set current network
export const setNetwork = (networkKey: keyof typeof NETWORKS) => {
  currentNetwork = NETWORKS[networkKey];
  return currentNetwork;
};

// Get current network details
export const getCurrentNetwork = () => {
  return currentNetwork;
};

// Get all available networks
export const getAvailableNetworks = () => {
  return NETWORKS;
};

// Create wallet from private key
export const createWalletFromPrivateKey = (privateKey: string) => {
  return new ethers.Wallet(privateKey, getProvider());
};

// Generate a new random wallet
export const generateNewWallet = () => {
  return ethers.Wallet.createRandom().connect(getProvider());
};

// Get wallet balance
export const getWalletBalance = async (address: string) => {
  const provider = getProvider();
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
};

// Send transaction
export const sendTransaction = async (
  privateKey: string, 
  toAddress: string, 
  amount: string
) => {
  try {
    const wallet = new ethers.Wallet(privateKey, getProvider());
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: ethers.parseEther(amount)
    });
    
    return {
      success: true,
      hash: tx.hash,
      blockExplorer: `${currentNetwork.blockExplorer}/tx/${tx.hash}`
    };
  } catch (error) {
    console.error('Transaction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Get transaction details
export const getTransaction = async (txHash: string) => {
  const provider = getProvider();
  return await provider.getTransaction(txHash);
};

// Get recent transactions for an address
export const getRecentTransactions = async (address: string, limit = 10) => {
  try {
    // This is a simplified implementation
    // In a real app, you would use a block explorer API or index transactions yourself
    const provider = getProvider();
    const blockNumber = await provider.getBlockNumber();
    
    // This is inefficient for production but works for a testnet demo
    const transactions = [];
    
    for (let i = 0; i < limit; i++) {
      if (blockNumber - i < 0) break;
      
      const block = await provider.getBlock(blockNumber - i, true);
      if (!block || !block.transactions) continue;
      
      for (const tx of block.transactions) {
        // Check if the transaction has the required properties
        if (typeof tx === 'object' && tx !== null) {
          const txObj = tx as any; // Type assertion to access properties
          
          if (txObj.from?.toLowerCase() === address.toLowerCase() || 
              txObj.to?.toLowerCase() === address.toLowerCase()) {
            transactions.push({
              hash: txObj.hash,
              from: txObj.from,
              to: txObj.to,
              value: txObj.value ? ethers.formatEther(txObj.value) : '0',
              timestamp: block.timestamp ? new Date(block.timestamp * 1000).toISOString() : '',
              isReceived: txObj.to?.toLowerCase() === address.toLowerCase(),
              displayAmount: txObj.to?.toLowerCase() === address.toLowerCase() 
                ? `+${txObj.value ? ethers.formatEther(txObj.value) : '0'}` 
                : `-${txObj.value ? ethers.formatEther(txObj.value) : '0'}`
            });
            
            if (transactions.length >= limit) break;
          }
        }
      }
      
      if (transactions.length >= limit) break;
    }
    
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

// Export the network types
export type NetworkKey = keyof typeof NETWORKS;
export type Network = typeof NETWORKS[NetworkKey];
