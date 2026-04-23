import { Request, Response } from 'express';
import { executeA2APaymentInDarkPool } from '../services/cloak.service';

export const shieldPayController = async (req: Request, res: Response) => {
  try {
    const { intentId, recipientPubkey, amountLamports } = req.body;
    const sessionKeyStr = req.headers.authorization?.split(' ')[1]; // The Agent's Ephemeral Key

    if (!intentId || !recipientPubkey || !amountLamports) {
      return res.status(400).json({
        decision: "BLOCK",
        reason_codes: ["RC_MISSING_EVIDENCE"],
        message: "Missing intentId, recipientPubkey, or amountLamports."
      });
    }

    if (!sessionKeyStr) {
      return res.status(401).json({
        decision: "BLOCK",
        reason_codes: ["RC_UNTRUSTED_OVERRIDE_ATTEMPT"],
        message: "Missing Agent Session Key."
      });
    }

    // Call the Dark Pool Engine (Cloak SDK wrapper)
    const result = await executeA2APaymentInDarkPool({
      intentId,
      recipientPubkey,
      amountLamports: BigInt(amountLamports),
      sessionKeyStr
    });

    return res.status(200).json({
      decision: "ALLOW",
      evidence: [
        { type: "CLOAK_ZKP_SIGNATURE", hash: result.signature },
        { type: "CLOAK_MERKLE_ROOT", hash: result.root },
        { type: "MINDPRINT_CNFT", status: "minted_successfully" }
      ],
      data: {
        noteNullifier: result.nullifier,
        // In a real scenario, this viewing key would be encrypted or returned securely to the caller
        viewingKey: "vk_live_demo_12345" 
      }
    });

  } catch (error: any) {
    console.error("[CLOAK_ENGINE_ERROR]", error);
    
    // Catch Policy Violations (e.g. amount > maxSpend)
    if (error.message.includes("Policy")) {
      return res.status(403).json({
        decision: "BLOCK",
        reason_codes: ["RC_POLICY_VIOLATION"],
        message: error.message
      });
    }

    return res.status(500).json({
      decision: "BLOCK",
      reason_codes: ["RC_TOOL_FAILURE"],
      message: "Shielded execution failed.",
      error: error.message
    });
  }
};
