const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const dir = path.join(ROOT_DIR, 'agent-cards', 'skills', 'mind');
const prices = {
  'card_skill_kuka.json': 0.01,
  'card_skill_colosseum_copilot.json': 0.05,
  'card_skill_render_validation_expert.json': 0.02,
  'card_skill_solana_defi_ecosystem_intel.json': 0.03,
  'card_skill_unicorn_vps.json': 0.10
};

for (const [file, price] of Object.entries(prices)) {
  const filePath = path.join(dir, file);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    data.pricing = {
      model: "per_call",
      currency: "USDC",
      price: price
    };
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated pricing for ${file} to ${price} USDC`);
  } else {
    console.log(`File ${file} not found.`);
  }
}
