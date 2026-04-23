use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("M1NDSession111111111111111111111111111111111");

#[program]
pub mod mind_a2a_session {
    use super::*;

    /// Initialize a new Session Key (AgentPolicy)
    /// This instruction is signed by the main wallet (Solflare/Authority)
    pub fn initialize_session(
        ctx: Context<InitializeSession>,
        vertical_id: u8,
        valid_until: i64,
        max_spend: u64,
    ) -> Result<()> {
        let policy = &mut ctx.accounts.policy;
        policy.authority = ctx.accounts.authority.key();
        policy.session_key = ctx.accounts.session_key.key();
        policy.vertical_id = vertical_id;
        policy.valid_until = valid_until;
        policy.max_spend = max_spend;
        policy.total_spent = 0;
        policy.bump = ctx.bumps.policy;

        msg!("MIND Protocol: Agent Session Initialized");
        msg!("Authority: {}", policy.authority);
        msg!("Session Key: {}", policy.session_key);
        Ok(())
    }

    /// Execute an A2A Payment atomically (Signed by Session Key)
    /// Performs the 92/8 split
    pub fn execute_a2a_payment(
        ctx: Context<ExecuteA2APayment>,
        amount: u64,
    ) -> Result<()> {
        let policy = &mut ctx.accounts.policy;

        // 1. Time Check
        let clock = Clock::get()?;
        require!(clock.unix_timestamp <= policy.valid_until, MindError::SessionExpired);

        // 2. Spend Limit Check
        let new_total = policy.total_spent.checked_add(amount).unwrap();
        require!(new_total <= policy.max_spend, MindError::SpendLimitExceeded);

        // 3. The 92/8 Split Logic
        let protocol_fee = amount.checked_mul(8).unwrap().checked_div(100).unwrap();
        let provider_payout = amount.checked_sub(protocol_fee).unwrap();

        // 4. Transfer to Provider (92%)
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.authority.to_account_info(),
                    to: ctx.accounts.provider.to_account_info(),
                },
            ),
            provider_payout,
        )?;

        // 5. Transfer to Protocol Treasury (8%)
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.authority.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
            ),
            protocol_fee,
        )?;

        // Update policy state
        policy.total_spent = new_total;

        msg!("MIND Protocol: x402 A2A Payment Executed");
        msg!("Provider Received: {}", provider_payout);
        msg!("Protocol Fee: {}", protocol_fee);
        
        Ok(())
    }

    /// Revoke a session manually (Signed by Authority)
    pub fn revoke_session(_ctx: Context<RevokeSession>) -> Result<()> {
        msg!("MIND Protocol: Session Revoked and Account Closed");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeSession<'info> {
    #[account(mut)]
    pub authority: Signer<'info>, // Solflare wallet

    /// CHECK: Just the public key of the ephemeral keypair
    pub session_key: UncheckedAccount<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + std::mem::size_of::<AgentPolicy>(),
        seeds = [b"policy", authority.key().as_ref(), session_key.key().as_ref()],
        bump
    )]
    pub policy: Account<'info, AgentPolicy>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteA2APayment<'info> {
    pub session_key: Signer<'info>, // Agent signs here

    #[account(
        mut,
        seeds = [b"policy", authority.key().as_ref(), session_key.key().as_ref()],
        bump = policy.bump,
        has_one = authority,
        has_one = session_key,
    )]
    pub policy: Account<'info, AgentPolicy>,

    #[account(mut)]
    pub authority: Signer<'info>, // Needs to be passed as signer in CPI if funds are moved directly, or PDA logic must be used if funds are stored in PDA.
    // NOTE: In a real scenario, funds might sit IN the PDA or the PDA delegates CPI. For simplicity, assuming the authority signs or funds are in PDA.
    // Let's assume funds are stored IN the PDA for autonomous spending.
    
    #[account(mut)]
    /// CHECK: Receiver of 92%
    pub provider: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Receiver of 8%
    pub treasury: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevokeSession<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        close = authority,
        seeds = [b"policy", authority.key().as_ref(), session_key.key().as_ref()],
        bump = policy.bump,
        has_one = authority,
    )]
    pub policy: Account<'info, AgentPolicy>,

    /// CHECK: Used for seeds
    pub session_key: UncheckedAccount<'info>,
}

#[account]
pub struct AgentPolicy {
    pub authority: Pubkey,
    pub session_key: Pubkey,
    pub vertical_id: u8,
    pub valid_until: i64,
    pub max_spend: u64,
    pub total_spent: u64,
    pub bump: u8,
}

#[error_code]
pub enum MindError {
    #[msg("The agent session has expired.")]
    SessionExpired,
    #[msg("The agent has exceeded its authorized spend limit.")]
    SpendLimitExceeded,
}
