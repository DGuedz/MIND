import { JupiterDexAdapter } from "./jupiter.js";

export const createMeteoraAdapter = () =>
  new JupiterDexAdapter("METEORA", ["Meteora", "Meteora DLMM"]);

