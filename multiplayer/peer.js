// multiplayer/peer.js
// Basic stub to fix the missing export error

export function broadcastPlayerState(state) {
  console.log('[peer] Broadcasting player state:', state);
  // TODO: Implement actual P2P or server broadcast logic
  // e.g. using WebRTC data channels, Socket.io, or your backend
  if (typeof window !== 'undefined' && window.peerConnections) {
    // Example: send to all peers
    Object.values(window.peerConnections).forEach(conn => {
      if (conn && conn.send) {
        conn.send({ type: 'playerState', payload: state });
      }
    });
  }
  return true; // success
}

// Add other exports if needed by the game

export function connectToPeer(peerId) {
  console.log('[peer] Connecting to peer:', peerId);
  // TODO: implement connection
}

export function disconnectPeer(peerId) {
  console.log('[peer] Disconnecting peer:', peerId);
}

// Default export if needed
export default { broadcastPlayerState, connectToPeer, disconnectPeer };
