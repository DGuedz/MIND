import fs from "fs";
import path from "path";

const SRC_DIR = path.join(process.cwd(), "agent-engine", "agent-cards");
const DEST_DIR = path.join(process.cwd(), "agent-cards", "skills", "hermes");

if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true });
}

const files = fs.readdirSync(SRC_DIR).filter(f => f.startsWith("hermes-") && f.endsWith(".json"));

files.forEach(file => {
  const content = JSON.parse(fs.readFileSync(path.join(SRC_DIR, file), "utf-8"));
  
  const catalogItem = {
    id: file.replace(".json", ""),
    kind: "skill",
    name: content.name,
    description: content.description,
    source: "nous",
    category: "cognition",
    license: "MIT",
    tags: content.capabilities.map(c => c.toLowerCase().replace(/ /g, "-")),
    pricing: content.pricing,
    badges: ["HERMES-AWARE", "A2A-READY"]
  };

  fs.writeFileSync(
    path.join(DEST_DIR, `card_skill_${file}`),
    JSON.stringify(catalogItem, null, 2)
  );
  console.log(`Convertido e copiado: ${file}`);
});
