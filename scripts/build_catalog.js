const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const SKILLS_DIR = path.join(ROOT_DIR, 'agent-cards', 'skills');
const OUT_FILE = path.join(ROOT_DIR, 'apps', 'landingpage', 'public', 'catalog', 'skills.json');

const sources = ['mind', 'sendaifun', 'stbr', 'frames', 'hostinger'];
const items = [];

for (const source of sources) {
  const sourceDir = path.join(SKILLS_DIR, source);
  if (!fs.existsSync(sourceDir)) continue;

  const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.json') && f.startsWith('card_'));

  for (const file of files) {
    try {
      const filePath = path.join(sourceDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Verifica se é uma carta no formato antigo (metadata) ou formato direto
      let rawName = "";
      let desc = "";
      let tags = [];
      let cat = "uncategorized";
      let isProduct = false;
      
      if (data.kind === "product" || data.kind === "skill") {
        // Novo formato (ex: card_product_solana-intel-oracle.json)
        rawName = data.name;
        desc = data.description || "";
        tags = data.tags || [];
        cat = data.category || "uncategorized";
        isProduct = data.kind === "product";
        
        const item = {
          id: data.id || file.replace('.json', ''),
          kind: data.kind,
          name: rawName,
          description: desc,
          source: source,
          category: cat,
          license: data.license || 'Proprietary',
          tags: tags,
          badges: data.badges || [],
          pricing: data.pricing || (isProduct ? { model: "subscription" } : { model: "free" }),
          performance: data.performance || undefined
        };
        
        items.push(item);
        
      } else if (data.metadata && data.metadata.name) {
        // Formato antigo
        rawName = data.metadata.name.replace(' (Skill)', '');
        desc = data.metadata.description || "";
        tags = data.metadata.tags || [];
        cat = data.metadata.category || "uncategorized";
        isProduct = file.includes("product") || file.includes("vps") || file.includes("hostinger");
        
        const item = {
          id: file.replace('.json', '').replace('card_', '').replace('skill_', '').replace('product_', ''),
          kind: isProduct ? "product" : "skill",
          name: rawName,
          description: desc,
          source: source,
          category: cat,
          license: 'Proprietary',
          tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : []),
          badges: [],
          pricing: isProduct ? { model: "subscription" } : { model: "free" }
        };
        
        items.push(item);
      } else {
        console.warn(`Skipping invalid card: ${file}`);
      }
    } catch (e) {
      console.error(`Failed to parse ${file}: ${e.message}`);
    }
  }
}

const catalog = {
  as_of: new Date().toISOString(),
  items: items
};

fs.writeFileSync(OUT_FILE, JSON.stringify(catalog, null, 2));
console.log(`Generated ${OUT_FILE} with ${items.length} skills.`);
