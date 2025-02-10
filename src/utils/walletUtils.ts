
// Utility function to generate a random USDT testnet address
export const generateTestnetUSDTAddress = () => {
  // USDT testnet addresses typically start with '0x'
  const chars = '0123456789abcdef';
  let address = '0x';
  // Generate 40 characters (20 bytes) for the address
  for (let i = 0; i < 40; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return address;
};
