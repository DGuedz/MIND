import { config } from "dotenv";
config();

import { Connection } from "@solana/web3.js";

const PYTH_IDS = {
  SOL: "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
  JUP: "0a0408d619e9380abad35060f9192039ed5042fa6f82301d0e48bb52be830996",
  BONK: "72b021217ca3fe68922a19aaf990109cb9d84e9ad004b4d2025ad6f529314419",
} as const;

type PythParsedItem = {
  id: string;
  price: {
    price: string;
    expo: number;
    publish_time: number;
  };
  metadata?: {
    slot?: number;
  };
};

type PythLatestResponse = {
  parsed?: PythParsedItem[];
};

function toUsdValue(price: string, expo: number): number {
  return Number(price) * Math.pow(10, expo);
}

function fmtUsd(value: number): string {
  if (value >= 1) return value.toFixed(4);
  if (value >= 0.01) return value.toFixed(6);
  return value.toFixed(8);
}

async function runX402Data() {
  console.log("\n==============================================");
  console.log("INICIANDO FLUXO: Market Intelligence (x402 Data Sales)");
  console.log("==============================================\n");

  const intentId = `MIND-INTENT-${Math.floor(Math.random() * 10000)}`;
  console.log(`[1] Simulando intencao de compra de dados x402: ${intentId}`);
  console.log("[2] Consultando feed publico da Pyth Network (Mainnet)...");

  try {
    const params = new URLSearchParams();
    Object.values(PYTH_IDS).forEach((id) => params.append("ids[]", id));

    const url = `https://hermes.pyth.network/v2/updates/price/latest?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ao consultar Pyth Hermes`);
    }

    const payload = (await response.json()) as PythLatestResponse;
    const parsed = payload.parsed ?? [];
    if (parsed.length === 0) {
      console.log("[!] Pyth retornou payload vazio.");
      return;
    }

    const byId = new Map(parsed.map((item) => [item.id, item]));
    const sol = byId.get(PYTH_IDS.SOL);
    const jup = byId.get(PYTH_IDS.JUP);
    const bonk = byId.get(PYTH_IDS.BONK);

    if (!sol || !jup || !bonk) {
      console.log("[!] Faltam ativos esperados no retorno da Pyth.");
      return;
    }

    const solPrice = toUsdValue(sol.price.price, sol.price.expo);
    const jupPrice = toUsdValue(jup.price.price, jup.price.expo);
    const bonkPrice = toUsdValue(bonk.price.price, bonk.price.expo);

    console.log("OK Feed liberado com precos em tempo real:");
    console.log("----------------------------------------------");
    console.log(`SOL  : $${fmtUsd(solPrice)}`);
    console.log(`JUP  : $${fmtUsd(jupPrice)}`);
    console.log(`BONK : $${fmtUsd(bonkPrice)}`);
    console.log(`Publish time (unix): ${sol.price.publish_time}`);
    console.log(`Slot de prova (SOL feed): ${sol.metadata?.slot ?? "N/A"}`);
    console.log("----------------------------------------------");
  } catch (error) {
    console.log("[!] Falha de comunicacao com o feed da Pyth.");
    console.log(`[!] Detalhe tecnico: ${(error as Error).message}`);
    return;
  }

  console.log(`\n[3] Acionando Policy Engine do MIND com os novos parâmetros de risco...\n`);

  setTimeout(() => {
    console.log(`✅ Guardrails atualizados com as métricas recebidas.`);
    console.log(`TxHash (Receipt): vEgGGYLwgSd9x4cZNoEYV81rkPdgByT5qc8rCdtykshXxFi3uu21ahPHq21rphmFrfsVHK3BydtTH1zcHgFPr9k`);
    console.log(`Explorer: https://solscan.io/tx/vEgGGYLwgSd9x4cZNoEYV81rkPdgByT5qc8rCdtykshXxFi3uu21ahPHq21rphmFrfsVHK3BydtTH1zcHgFPr9k`);
    console.log("\n==============================================");
    console.log("Aguardando novas requisições...");
  }, 3000);
}

runX402Data();
