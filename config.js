// Backend Configuration
// Update this after deploying your backend to Render
const CONFIG = {
    // Your Render backend URL (update after deployment)
    // Example: 'https://pvpai-backend-abc123.onrender.com'
    BACKEND_URL: 'http://localhost:3000', // Change this to your Render URL

    // Fixed stake amount ($5 USD)
    FIXED_STAKE_USD: 5,
    PLATFORM_FEE_USD: 1, // $1 goes to platform
    GAME_POT_USD: 4, // $4 goes to game

    // Approximate crypto amounts (update based on current prices)
    FIXED_STAKE: {
        ETH: 0.002,  // ~$5 worth of ETH
        SOL: 0.05,   // ~$5 worth of SOL
        BASE: 0.002, // ~$5 worth of ETH on Base
        POLYGON: 0.002 // ~$5 worth of MATIC
    },

    // Enable debug mode for testing
    DEBUG: false,

    // Use mock backend for local testing (no server needed)
    USE_MOCK_BACKEND: false
};

// Export for use in index.html
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
