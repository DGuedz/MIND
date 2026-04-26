import { JupiterDexAdapter } from "./jupiter.js";

export const createOrcaAdapter = () =>
  new JupiterDexAdapter("ORCA", ["Orca V2", "Orca Whirlpool"]);

