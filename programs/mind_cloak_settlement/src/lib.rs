use anchor_lang::prelude::*;

declare_id!("MINDcLoakSettLement111111111111111111111111");

#[program]
pub mod mind_cloak_settlement {
    use super::*;

    /// Records a Cloak ZK Nullifier on-chain to prevent double-minting of Mindprints.
    /// This instruction is called by the MIND API Gateway after a successful shielded payment.
    pub fn settle_private_intent(
        ctx: Context<SettlePrivateIntent>,
        intent_id: String,
        cloak_nullifier: String,
        cloak_root: String,
    ) -> Result<()> {
        let mindprint = &mut ctx.accounts.mindprint_record;
        let policy = &ctx.accounts.agent_policy;
        let clock = Clock::get()?;

        // 1. Policy Gate: Check if the Agent's Session Key is still valid
        require!(
            clock.unix_timestamp <= policy.valid_until,
            MindError::SessionExpired
        );

        // 2. Bind the Record
        mindprint.intent_id = intent_id;
        mindprint.cloak_nullifier = cloak_nullifier;
        mindprint.cloak_root = cloak_root;
        mindprint.settled_by = ctx.accounts.session_key.key();
        mindprint.timestamp = clock.unix_timestamp;
        
        // 3. Prevent Double Spend logic is enforced by the PDA derivation
        // The PDA is seeded by the nullifier. If the nullifier was already used, 
        // Anchor will throw an AccountAlreadyInitialized error automatically.

        msg!("Mindprint Settled! Intent: {}, Nullifier: {}", mindprint.intent_id, mindprint.cloak_nullifier);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(intent_id: String, cloak_nullifier: String)]
pub struct SettlePrivateIntent<'info> {
    /// The ephemeral session key of the agent executing the settlement
    #[account(mut)]
    pub session_key: Signer<'info>,

    /// The policy account that delegated authority to this session key
    #[account(
        constraint = agent_policy.session_key == session_key.key() @ MindError::UnauthorizedAgent
    )]
    pub agent_policy: Account<'info, AgentPolicy>,

    /// The PDA that stores the Mindprint (Note Level 2)
    /// Seeded by the unique Cloak Nullifier to prevent double-minting.
    #[account(
        init,
        payer = session_key,
        space = 8 + 32 + 64 + 64 + 32 + 8, // Discriminator + IntentId + Nullifier + Root + Pubkey + Timestamp
        seeds = [b"mindprint", cloak_nullifier.as_bytes()],
        bump
    )]
    pub mindprint_record: Account<'info, MindprintRecord>,

    pub system_program: Program<'info, System>,
}

/// The state of a settled Mindprint (Note Level 2)
#[account]
pub struct MindprintRecord {
    pub intent_id: String,       // "Pay Provider X"
    pub cloak_nullifier: String, // The ZK Nullifier from Cloak
    pub cloak_root: String,      // The Merkle Root from Cloak
    pub settled_by: Pubkey,      // The Agent's Session Key
    pub timestamp: i64,          // When it was settled
}

/// Mocking the AgentPolicy state (normally this would be imported from the `mind_a2a_session` program)
#[account]
pub struct AgentPolicy {
    pub authority: Pubkey,       // The Solflare User
    pub session_key: Pubkey,     // The Ephemeral Agent Key
    pub valid_until: i64,        // Expiration timestamp
    pub max_spend: u64,          // Spend limit
    pub total_spent: u64,        // Accumulated spend
}

#[error_code]
pub enum MindError {
    #[msg("The agent session key has expired.")]
    SessionExpired,
    #[msg("The session key does not match the agent policy.")]
    UnauthorizedAgent,
}
