import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:3000";
const API_KEY = process.env.API_GATEWAY_API_KEY || "dev_api_key_12345";

async function simulateMarketIntel() {
  console.log("[Simulation] Triggering Market Ecosystem Intelligence Update...");
  
  try {
    const response = await fetch(`${API_GATEWAY_URL}/v1/market/signals/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        intent: {
          query: "Solana DeFi Institutional",
          constraints: {
            max_items: 10,
            max_cost_usdc: 0.01,
            allow_source_types: ["blog", "docs", "changelog", "institutional_announcement"]
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log("[Simulation] Intelligence updated:", result);

    console.log("\n[Simulation] Fetching current signals from Gateway...");
    const signalsResp = await fetch(`${API_GATEWAY_URL}/v1/market/signals`);
    const signals = await signalsResp.json();
    
    console.log(`\n[MIND Feed] Received ${signals.items?.length || 0} signals:`);
    signals.items?.forEach((s: any) => {
      console.log(`   - [${s.protocol_name}] ${s.headline} (${s.confidence_score} confidence)`);
    });

  } catch (error) {
    console.error("[Simulation] Error:", error instanceof Error ? error.message : String(error));
  }
}

simulateMarketIntel();
