// Backend Connection Module
// Add this script to index.html before the game logic

const BACKEND_URL = 'https://pvpai-backend.onrender.com';
let socket = null;
let backendConnected = false;

// Initialize Socket.IO connection
function initBackendConnection() {
    console.log('Connecting to backend:', BACKEND_URL);
    
    socket = io(BACKEND_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
    });

    socket.on('connect', () => {
        console.log('✅ Connected to backend');
        backendConnected = true;
    });

    socket.on('disconnect', () => {
        console.log('❌ Disconnected from backend');
        backendConnected = false;
    });

    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
    });

    return socket;
}

// Fetch lobbies from backend
async function fetchLobbies() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/lobbies`);
        const data = await response.json();
        
        if (data.success) {
            return data.lobbies;
        }
        return [];
    } catch (error) {
        console.error('Error fetching lobbies:', error);
        return [];
    }
}

// Create new lobby
async function createLobby(wallet, chain, stake, signature) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/lobbies/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet, chain, stake, signature })
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating lobby:', error);
        return { success: false, error: error.message };
    }
}

// Join existing lobby
async function joinLobby(lobbyId, wallet, chain, stake, signature) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/lobbies/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lobbyId, wallet, chain, stake, signature })
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error joining lobby:', error);
        return { success: false, error: error.message };
    }
}

// Authenticate with backend
function authenticateBackend(wallet, chain, signature) {
    if (!socket) return;
    
    socket.emit('authenticate', { wallet, chain, signature });
    
    return new Promise((resolve) => {
        socket.once('authenticated', (data) => {
            resolve(data.success);
        });
    });
}

// Join game
function joinGame(lobbyId) {
    if (!socket) return;
    socket.emit('join_game', { lobbyId });
}

// Send player movement
function sendPlayerMove(position, velocity) {
    if (!socket || !backendConnected) return;
    socket.emit('player_move', { position, velocity });
}

// Send player rotation
function sendPlayerRotate(rotation) {
    if (!socket || !backendConnected) return;
    socket.emit('player_rotate', { rotation });
}

// Send shoot action
function sendPlayerShoot(position, direction) {
    if (!socket || !backendConnected) return;
    socket.emit('player_shoot', { position, direction });
}

// Collect coin
function sendCoinCollect(coinId) {
    if (!socket || !backendConnected) return;
    socket.emit('collect_coin', { coinId });
}

