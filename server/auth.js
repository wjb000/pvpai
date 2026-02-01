const { ethers } = require('ethers');
const nacl = require('tweetnacl');
const bs58 = require('bs58');

/**
 * Verify wallet signature for authentication
 * @param {string} wallet - Wallet address
 * @param {string} chain - Blockchain (eth, sol, base, polygon)
 * @param {string} signature - Signature from wallet
 * @returns {boolean} - Is signature valid
 */
async function verifyWalletSignature(wallet, chain, signature) {
  try {
    const message = `Sign this message to authenticate with PvP AI Battle Royale.\n\nWallet: ${wallet}\nTimestamp: ${Date.now()}`;

    if (chain === 'sol') {
      // Verify Solana signature
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = bs58.decode(signature);
      const publicKeyBytes = bs58.decode(wallet);

      return nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes
      );
    } else {
      // Verify EVM signature (ETH, Base, Polygon)
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === wallet.toLowerCase();
    }
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Generate authentication message for wallet signing
 * @param {string} wallet - Wallet address
 * @returns {string} - Message to sign
 */
function generateAuthMessage(wallet) {
  return `Sign this message to authenticate with PvP AI Battle Royale.\n\nWallet: ${wallet}\nTimestamp: ${Date.now()}\n\nThis signature will not cost any gas.`;
}

module.exports = {
  verifyWalletSignature,
  generateAuthMessage
};
