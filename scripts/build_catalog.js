const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, 'agent-cards', 'skills');
const OUT_FILE = path.join(__dirname, 'apps', 'landingpage', 'public', 'catalog', 'skills.json');

const sources = ['mind', 'sendaifun', 'stbr', 'frames'];
const items = [];

for (const source of sources) {
  const sourceDir = path.join(SKILLS_DIR, source);
  if (!fs.existsSync(sourceDir)) continue;

  const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(sourceDir, file), 'utf8'));
      
      let rawName = data.metadata.name.replace(' (Skill)', '');
      
      const item = {
        id: `skill_${rawName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
        kind: 'skill',
        name: rawName,
        description: data.metadata.description,
        source: source,
        category: data.discovery?.category || 'utility',
        license: data.metadata.license || 'Proprietary',
        tags: data.metadata.tags || [],
      };

      if (data.pricing) {
        item.pricing = {
          model: data.pricing.model,
          currency: data.pricing.currency,
          price: data.pricing.price
        };
      }
      
      if (data.skill && Array.isArray(data.skill.install)) {
        item.install = data.skill.install;
      } else if (source === 'sendaifun') {
        item.install = [
          `/plugin marketplace add sendaifun/skills`,
          `/plugin install ${rawName}`,
          `npx skills add sendaifun/skills`
        ];
      }

      items.push(item);
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
