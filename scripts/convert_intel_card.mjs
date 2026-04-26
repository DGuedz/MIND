import fs from "fs";
import path from "path";

const SRC_DIR = path.join(process.cwd(), "agent-engine", "agent-cards");
const DEST_DIR = path.join(process.cwd(), "agent-cards", "skills", "mind");

const intelFile = "solana-intel-oracle.json";
const content = JSON.parse(fs.readFileSync(path.join(SRC_DIR, intelFile), "utf-8"));

const catalogItem = {
  id: intelFile.replace(".json", ""),
  kind: "product",
  name: content.name,
  description: content.description,
  source: "mind",
  category: "oracle",
  license: "Proprietary",
  tags: content.capabilities.map(c => c.toLowerCase().replace(/ /g, "-")),
  pricing: content.pricing,
  performance: content.performance,
  badges: ["A2A-DATA-FEED", "VERIFIED-SOURCE"]
};

fs.writeFileSync(
  path.join(DEST_DIR, `card_product_${intelFile}`),
  JSON.stringify(catalogItem, null, 2)
);
console.log(`Convertido e copiado: ${intelFile}`);
