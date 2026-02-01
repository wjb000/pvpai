use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;

declare_id!("YourProgramIDHere11111111111111111111111111");

#[program]
pub mod pvpai_staking {
    use super::*;

    /// Initialize the staking program
    pub fn initialize(
        ctx: Context<Initialize>,
    ) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.authority = ctx.accounts.authority.key();
        state.game_server = ctx.accounts.game_server.key();
        state.platform_fee_recipient = ctx.accounts.platform_fee_recipient.key();
        // Fixed $5 stake = ~0.02 SOL (update based on SOL price)
        state.fixed_stake = 20_000_000; // 0.02 SOL in lamports
        // Fixed $1 platform fee = ~0.004 SOL
        state.platform_fee_per_player = 4_000_000; // 0.004 SOL in lamports
        // $4 game pot = ~0.016 SOL
        state.game_stake_per_player = 16_000_000; // 0.016 SOL in lamports
        state.total_games = 0;
        state.total_volume = 0;
        state.paused = false;
        Ok(())
    }

    /// Deposit stake for a game (fixed $5 entry)
    pub fn deposit_stake(ctx: Context<DepositStake>, game_id: String) -> Result<()> {
        let state = &ctx.accounts.state;
        require!(!state.paused, ErrorCode::ContractPaused);

        let player_account = &mut ctx.accounts.player_account;
        let fixed_stake = state.fixed_stake;
        let platform_fee = state.platform_fee_per_player;
        let game_stake = state.game_stake_per_player;

        // Transfer full $5 from player to escrow
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.player.key(),
            &ctx.accounts.escrow_account.key(),
            fixed_stake,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.player.to_account_info(),
                ctx.accounts.escrow_account.to_account_info(),
            ],
        )?;

        // Immediately send $1 platform fee
        **ctx.accounts.escrow_account.to_account_info().try_borrow_mut_lamports()? -= platform_fee;
        **ctx.accounts.platform_fee_recipient.to_account_info().try_borrow_mut_lamports()? += platform_fee;

        // $4 goes to player's available stake for games
        player_account.wallet = ctx.accounts.player.key();
        player_account.available_stake += game_stake;
        player_account.total_wagered += fixed_stake;

        emit!(StakeDeposited {
            player: ctx.accounts.player.key(),
            amount: fixed_stake,
            game_id: game_id.clone(),
        });

        Ok(())
    }

    /// Create a new game
    pub fn create_game(
        ctx: Context<CreateGame>,
        game_id: String,
        players: Vec<Pubkey>,
        stakes: Vec<u64>,
    ) -> Result<()> {
        let state = &mut ctx.accounts.state;
        require!(!state.paused, ErrorCode::ContractPaused);
        require!(
            ctx.accounts.game_server.key() == state.game_server,
            ErrorCode::Unauthorized
        );
        require!(players.len() == stakes.len(), ErrorCode::ArrayLengthMismatch);
        require!(players.len() >= 2 && players.len() <= 10, ErrorCode::InvalidPlayerCount);

        let game = &mut ctx.accounts.game;
        let total_pot: u64 = stakes.iter().sum();

        game.game_id = game_id.clone();
        game.players = players;
        game.stakes = stakes;
        game.total_pot = total_pot;
        game.winner = Pubkey::default();
        game.completed = false;
        game.created_at = Clock::get()?.unix_timestamp;

        state.total_games += 1;
        state.total_volume += total_pot;

        emit!(GameCreated {
            game_id,
            player_count: game.players.len() as u8,
            total_pot,
        });

        Ok(())
    }

    /// Process payout to winner (platform fees already collected)
    pub fn payout(ctx: Context<Payout>, game_id: String) -> Result<()> {
        let state = &ctx.accounts.state;
        require!(!state.paused, ErrorCode::ContractPaused);
        require!(
            ctx.accounts.game_server.key() == state.game_server,
            ErrorCode::Unauthorized
        );

        let game = &mut ctx.accounts.game;
        require!(!game.completed, ErrorCode::GameAlreadyCompleted);
        require!(game.game_id == game_id, ErrorCode::InvalidGameId);

        // Verify winner was in the game
        let winner_key = ctx.accounts.winner.key();
        require!(
            game.players.contains(&winner_key),
            ErrorCode::InvalidWinner
        );

        // Winner gets entire pot (platform fees already collected on deposit)
        let winnings = game.total_pot;

        // Transfer all winnings to winner
        **ctx.accounts.escrow_account.to_account_info().try_borrow_mut_lamports()? -= winnings;
        **ctx.accounts.winner.to_account_info().try_borrow_mut_lamports()? += winnings;

        // Update game state
        game.winner = winner_key;
        game.completed = true;

        // Update winner stats
        let player_account = &mut ctx.accounts.winner_account;
        player_account.total_won += winnings;
        player_account.games_won += 1;

        emit!(PayoutProcessed {
            game_id,
            winner: winner_key,
            winnings,
            platform_fee: 0,
        });

        Ok(())
    }

    /// Withdraw available stake
    pub fn withdraw_stake(ctx: Context<WithdrawStake>, amount: u64) -> Result<()> {
        let player_account = &mut ctx.accounts.player_account;
        require!(
            player_account.available_stake >= amount,
            ErrorCode::InsufficientStake
        );

        player_account.available_stake -= amount;

        // Transfer SOL from escrow to player
        **ctx.accounts.escrow_account.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.player.to_account_info().try_borrow_mut_lamports()? += amount;

        emit!(StakeWithdrawn {
            player: ctx.accounts.player.key(),
            amount,
        });

        Ok(())
    }

    /// Update game server (admin only)
    pub fn update_game_server(ctx: Context<UpdateAuthority>, new_game_server: Pubkey) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.game_server = new_game_server;
        Ok(())
    }

    /// Pause contract (admin only)
    pub fn pause(ctx: Context<UpdateAuthority>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.paused = true;
        Ok(())
    }

    /// Unpause contract (admin only)
    pub fn unpause(ctx: Context<UpdateAuthority>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.paused = false;
        Ok(())
    }
}

// Account structures
#[account]
pub struct State {
    pub authority: Pubkey,
    pub game_server: Pubkey,
    pub platform_fee_recipient: Pubkey,
    pub fixed_stake: u64, // ~$5 in lamports
    pub platform_fee_per_player: u64, // ~$1 in lamports
    pub game_stake_per_player: u64, // ~$4 in lamports
    pub total_games: u64,
    pub total_volume: u64,
    pub paused: bool,
}

#[account]
pub struct PlayerAccount {
    pub wallet: Pubkey,
    pub available_stake: u64,
    pub total_wagered: u64,
    pub total_won: u64,
    pub games_played: u32,
    pub games_won: u32,
}

#[account]
pub struct Game {
    pub game_id: String,
    pub players: Vec<Pubkey>,
    pub stakes: Vec<u64>,
    pub total_pot: u64,
    pub winner: Pubkey,
    pub completed: bool,
    pub created_at: i64,
}

// Context structures
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 200)]
    pub state: Account<'info, State>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: Game server public key
    pub game_server: AccountInfo<'info>,
    /// CHECK: Platform fee recipient
    pub platform_fee_recipient: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositStake<'info> {
    #[account(mut)]
    pub state: Account<'info, State>,
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(init_if_needed, payer = player, space = 8 + 200, seeds = [b"player", player.key().as_ref()], bump)]
    pub player_account: Account<'info, PlayerAccount>,
    /// CHECK: Escrow account to hold stakes
    #[account(mut)]
    pub escrow_account: AccountInfo<'info>,
    /// CHECK: Platform fee recipient
    #[account(mut)]
    pub platform_fee_recipient: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateGame<'info> {
    #[account(mut)]
    pub state: Account<'info, State>,
    pub game_server: Signer<'info>,
    #[account(init, payer = game_server, space = 8 + 1000)]
    pub game: Account<'info, Game>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Payout<'info> {
    #[account(mut)]
    pub state: Account<'info, State>,
    pub game_server: Signer<'info>,
    #[account(mut)]
    pub game: Account<'info, Game>,
    /// CHECK: Winner account
    #[account(mut)]
    pub winner: AccountInfo<'info>,
    #[account(mut, seeds = [b"player", winner.key().as_ref()], bump)]
    pub winner_account: Account<'info, PlayerAccount>,
    /// CHECK: Escrow account
    #[account(mut)]
    pub escrow_account: AccountInfo<'info>,
    /// CHECK: Platform fee recipient
    #[account(mut)]
    pub platform_fee_recipient: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawStake<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut, seeds = [b"player", player.key().as_ref()], bump)]
    pub player_account: Account<'info, PlayerAccount>,
    /// CHECK: Escrow account
    #[account(mut)]
    pub escrow_account: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateAuthority<'info> {
    #[account(mut, has_one = authority)]
    pub state: Account<'info, State>,
    pub authority: Signer<'info>,
}

// Events
#[event]
pub struct StakeDeposited {
    pub player: Pubkey,
    pub amount: u64,
    pub game_id: String,
}

#[event]
pub struct GameCreated {
    pub game_id: String,
    pub player_count: u8,
    pub total_pot: u64,
}

#[event]
pub struct PayoutProcessed {
    pub game_id: String,
    pub winner: Pubkey,
    pub winnings: u64,
    pub platform_fee: u64,
}

#[event]
pub struct StakeWithdrawn {
    pub player: Pubkey,
    pub amount: u64,
}

// Error codes
#[error_code]
pub enum ErrorCode {
    #[msg("Contract is paused")]
    ContractPaused,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Array length mismatch")]
    ArrayLengthMismatch,
    #[msg("Invalid player count")]
    InvalidPlayerCount,
    #[msg("Game already completed")]
    GameAlreadyCompleted,
    #[msg("Invalid game ID")]
    InvalidGameId,
    #[msg("Invalid winner")]
    InvalidWinner,
    #[msg("Insufficient stake")]
    InsufficientStake,
}
