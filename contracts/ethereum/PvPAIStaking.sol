// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title PvPAIStaking
 * @dev Escrow contract for PvP AI Battle Royale game stakes
 * @notice Handles deposits, withdrawals, and automated payouts
 */
contract PvPAIStaking is ReentrancyGuard, Ownable, Pausable {

    // Fixed stake amount ($5 equivalent in wei - update based on ETH price)
    // For example, if ETH = $2500, then $5 = 0.002 ETH
    uint256 public constant FIXED_STAKE = 0.002 ether;

    // Fixed platform fee per player ($1 equivalent in wei)
    // For example, if ETH = $2500, then $1 = 0.0004 ETH
    uint256 public constant PLATFORM_FEE_PER_PLAYER = 0.0004 ether;

    // Amount that goes into game pot per player
    uint256 public constant GAME_STAKE_PER_PLAYER = 0.0016 ether; // $4

    // Platform fee recipient
    address public platformFeeRecipient;

    // Game server address (authorized to trigger payouts)
    address public gameServer;

    // Player stakes mapping
    mapping(address => uint256) public stakes;
    mapping(address => uint256) public totalWagered;
    mapping(address => uint256) public totalWon;

    // Game tracking
    mapping(bytes32 => Game) public games;

    struct Game {
        bytes32 gameId;
        address[] players;
        uint256[] playerStakes;
        uint256 totalPot;
        address winner;
        bool completed;
        uint256 createdAt;
    }

    // Events
    event StakeDeposited(address indexed player, uint256 amount, bytes32 indexed gameId);
    event GameCreated(bytes32 indexed gameId, uint256 playerCount, uint256 totalPot);
    event GameCompleted(bytes32 indexed gameId, address indexed winner, uint256 winnings);
    event PayoutProcessed(address indexed winner, uint256 amount, uint256 platformFee);
    event StakeWithdrawn(address indexed player, uint256 amount);
    event GameServerUpdated(address indexed oldServer, address indexed newServer);

    modifier onlyGameServer() {
        require(msg.sender == gameServer, "Only game server can call this");
        _;
    }

    constructor(address _platformFeeRecipient, address _gameServer) {
        require(_platformFeeRecipient != address(0), "Invalid fee recipient");
        require(_gameServer != address(0), "Invalid game server");

        platformFeeRecipient = _platformFeeRecipient;
        gameServer = _gameServer;
    }

    /**
     * @dev Deposit stake for a game ($5 fixed entry)
     * @param gameId Unique game identifier
     */
    function depositStake(bytes32 gameId) external payable nonReentrant whenNotPaused {
        require(msg.value == FIXED_STAKE, "Must stake exactly $5 equivalent");
        require(gameId != bytes32(0), "Invalid game ID");

        // Split: $1 to platform, $4 to game pot
        stakes[msg.sender] += GAME_STAKE_PER_PLAYER;
        totalWagered[msg.sender] += msg.value;

        // Immediately send platform fee
        (bool success, ) = platformFeeRecipient.call{value: PLATFORM_FEE_PER_PLAYER}("");
        require(success, "Platform fee transfer failed");

        emit StakeDeposited(msg.sender, msg.value, gameId);
    }

    /**
     * @dev Create a new game (called by game server)
     * @param gameId Unique game identifier
     * @param players Array of player addresses
     * @param playerStakes Array of player stake amounts
     */
    function createGame(
        bytes32 gameId,
        address[] calldata players,
        uint256[] calldata playerStakes
    ) external onlyGameServer {
        require(gameId != bytes32(0), "Invalid game ID");
        require(games[gameId].gameId == bytes32(0), "Game already exists");
        require(players.length == playerStakes.length, "Arrays length mismatch");
        require(players.length >= 2 && players.length <= 10, "Invalid player count");

        uint256 totalPot = 0;
        for (uint256 i = 0; i < players.length; i++) {
            require(stakes[players[i]] >= playerStakes[i], "Insufficient stake");
            stakes[players[i]] -= playerStakes[i];
            totalPot += playerStakes[i];
        }

        games[gameId] = Game({
            gameId: gameId,
            players: players,
            playerStakes: playerStakes,
            totalPot: totalPot,
            winner: address(0),
            completed: false,
            createdAt: block.timestamp
        });

        emit GameCreated(gameId, players.length, totalPot);
    }

    /**
     * @dev Process payout to winner (called by game server)
     * @param gameId Game identifier
     * @param winner Winner address
     */
    function payout(bytes32 gameId, address winner) external nonReentrant onlyGameServer {
        Game storage game = games[gameId];

        require(game.gameId != bytes32(0), "Game does not exist");
        require(!game.completed, "Game already completed");
        require(winner != address(0), "Invalid winner address");

        // Verify winner was in the game
        bool validWinner = false;
        for (uint256 i = 0; i < game.players.length; i++) {
            if (game.players[i] == winner) {
                validWinner = true;
                break;
            }
        }
        require(validWinner, "Winner was not in game");

        // Winner gets entire pot (platform fees already collected on deposit)
        uint256 winnings = game.totalPot;

        // Mark game as completed
        game.winner = winner;
        game.completed = true;

        // Update winner stats
        totalWon[winner] += winnings;

        // Transfer all winnings to winner
        (bool successWinner, ) = winner.call{value: winnings}("");
        require(successWinner, "Winner payout failed");

        emit GameCompleted(gameId, winner, winnings);
        emit PayoutProcessed(winner, winnings, 0);
    }

    /**
     * @dev Cancel game and refund players (emergency function)
     * @param gameId Game identifier
     */
    function cancelGame(bytes32 gameId) external onlyGameServer {
        Game storage game = games[gameId];

        require(game.gameId != bytes32(0), "Game does not exist");
        require(!game.completed, "Game already completed");

        // Refund all players
        for (uint256 i = 0; i < game.players.length; i++) {
            stakes[game.players[i]] += game.playerStakes[i];
        }

        // Mark as completed (cancelled)
        game.completed = true;
    }

    /**
     * @dev Withdraw available stake (not in active games)
     */
    function withdrawStake() external nonReentrant {
        uint256 amount = stakes[msg.sender];
        require(amount > 0, "No stake to withdraw");

        stakes[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdrawal failed");

        emit StakeWithdrawn(msg.sender, amount);
    }

    /**
     * @dev Update game server address (only owner)
     */
    function updateGameServer(address newGameServer) external onlyOwner {
        require(newGameServer != address(0), "Invalid game server");
        address oldServer = gameServer;
        gameServer = newGameServer;
        emit GameServerUpdated(oldServer, newGameServer);
    }

    /**
     * @dev Update platform fee recipient (only owner)
     */
    function updatePlatformFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid recipient");
        platformFeeRecipient = newRecipient;
    }

    /**
     * @dev Get fixed stake amount (for frontend display)
     */
    function getFixedStake() external pure returns (uint256 total, uint256 platformFee, uint256 gamePot) {
        return (FIXED_STAKE, PLATFORM_FEE_PER_PLAYER, GAME_STAKE_PER_PLAYER);
    }

    /**
     * @dev Pause contract (emergency only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Get player stats
     */
    function getPlayerStats(address player) external view returns (
        uint256 availableStake,
        uint256 totalWageredAmount,
        uint256 totalWonAmount
    ) {
        return (stakes[player], totalWagered[player], totalWon[player]);
    }

    /**
     * @dev Get game details
     */
    function getGame(bytes32 gameId) external view returns (
        address[] memory players,
        uint256[] memory playerStakes,
        uint256 totalPot,
        address winner,
        bool completed
    ) {
        Game storage game = games[gameId];
        return (
            game.players,
            game.playerStakes,
            game.totalPot,
            game.winner,
            game.completed
        );
    }

    // Fallback to receive ETH
    receive() external payable {}
}
