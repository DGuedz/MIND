const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const SKILLS_DIR = path.join(ROOT_DIR, 'agent-cards', 'skills');
const PRODUCTS_DIR = path.join(ROOT_DIR, 'agent-cards', 'products');
const OUT_SKILLS_FILE = path.join(ROOT_DIR, 'apps', 'landingpage', 'public', 'catalog', 'skills.json');
const OUT_PRODUCTS_FILE = path.join(ROOT_DIR, 'apps', 'landingpage', 'public', 'catalog', 'products.json');

const sources = ['mind', 'sendaifun', 'stbr', 'frames', 'hostinger', 'colosseum-sponsors'];
const providerTypeBySource = {
  mind: 'internal',
  sendaifun: 'external',
  stbr: 'external',
  frames: 'external',
  nous: 'external',
  hostinger: 'vendor',
  'colosseum-sponsors': 'sponsor'
};
const skillItems = [];

const ensureCatalogDir = () => {
  const dir = path.dirname(OUT_SKILLS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const inferProductCategory = ({ tags = [], discovery = null }) => {
  if (discovery && typeof discovery.intent === 'string' && discovery.intent.trim()) {
    return discovery.intent.trim().toLowerCase().replace(/_/g, '-');
  }
  if (discovery && typeof discovery.category === 'string' && discovery.category.trim()) {
    return discovery.category.trim().toLowerCase().replace(/_/g, '-');
  }

  const t = Array.isArray(tags) ? tags : [];
  const s = new Set(t.map(x => String(x).toLowerCase()));

  if (s.has('oracle') || s.has('price-feed') || s.has('price_feed')) return 'oracle';
  if (s.has('signals') || s.has('signal') || s.has('alpha')) return 'signals';
  if (s.has('swap') || s.has('routing') || s.has('execution') || s.has('router')) return 'execution';
  if (s.has('risk') || s.has('scoring') || s.has('security') || s.has('compliance')) return 'risk';
  if (s.has('orchestration') || s.has('autonomous')) return 'orchestration';
  if (s.has('analytics') || s.has('intelligence') || s.has('research') || s.has('data')) return 'data-analysis';

  return 'uncategorized';
};

const inferDocKind = ({ isV1 = false, docExt = null }) => {
  if (isV1) return 'agent-card-v1';
  if (docExt === '.md') return 'skill-md';
  return 'manifest-json';
};

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
          providerType: data.providerType || data.sourceType || providerTypeBySource[source] || 'external',
          category: cat,
          docExt: data.docExt || (isProduct ? '.json' : '.md'),
          docKind: data.docKind || (data.discovery && data.discovery.docKind) || inferDocKind({ isV1: false, docExt: data.docExt || (isProduct ? '.json' : '.md') }),
          license: data.license || 'Proprietary',
          tags: tags,
          badges: data.badges || [],
          pricing: data.pricing || (isProduct ? { model: "subscription" } : { model: "free" }),
          performance: data.performance || undefined
        };
        
        skillItems.push(item);
        
      } else if (data.metadata && data.metadata.name) {
        // Formato antigo
        rawName = data.metadata.name.replace(' (Skill)', '');
        desc = data.metadata.description || "";
        tags = data.metadata.tags || [];
        cat = data.metadata.category || (data.discovery && data.discovery.category) || "uncategorized";
        isProduct = file.includes("product") || file.includes("vps") || file.includes("hostinger");
        
        const item = {
          id: file.replace('.json', '').replace('card_', '').replace('skill_', '').replace('product_', ''),
          kind: isProduct ? "product" : "skill",
          name: rawName,
          description: desc,
          source: source,
          providerType: providerTypeBySource[source] || 'external',
          category: cat,
          docExt: isProduct ? '.json' : '.md',
          docKind: inferDocKind({ isV1: false, docExt: isProduct ? '.json' : '.md' }),
          license: 'Proprietary',
          tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : []),
          badges: [],
          pricing: isProduct ? { model: "subscription" } : { model: "free" }
        };
        
        skillItems.push(item);
      } else {
        console.warn(`Skipping invalid card: ${file}`);
      }
    } catch (e) {
      console.error(`Failed to parse ${file}: ${e.message}`);
    }
  }
}

const skillsCatalog = {
  as_of: new Date().toISOString(),
  items: skillItems
};

const productItems = [];
if (fs.existsSync(PRODUCTS_DIR)) {
  const files = fs.readdirSync(PRODUCTS_DIR).filter(f => f.endsWith('.json'));

  for (const file of files) {
    try {
      const filePath = path.join(PRODUCTS_DIR, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      const isV1 = !!(data && data.metadata && typeof data.metadata.name === 'string');
      const id = data.id || file.replace('.json', '');
      const name = isV1 ? data.metadata.name : (data.name || id);
      const description = isV1 ? (data.metadata.description || '') : (data.description || '');
      const tags = isV1 ? (data.metadata.tags || []) : (data.tags || []);
      const license = isV1 ? (data.metadata.license || 'Proprietary') : 'Proprietary';
      const pricing = data.pricing || { model: 'subscription' };

      const source = data.source || 'mind';
      const providerType = (data.provenance && (data.provenance.providerType || data.provenance.sourceType)) || (data.providerType || data.sourceType) || (providerTypeBySource[source] || 'internal');
      const docExt = (data.discovery && data.discovery.docExt) || data.docExt || '.json';
      const docKind = (data.discovery && data.discovery.docKind) || data.docKind || inferDocKind({ isV1, docExt });
      const category = inferProductCategory({ tags, discovery: data.discovery || null });

      productItems.push({
        id,
        kind: 'product',
        name,
        description,
        source,
        providerType,
        category,
        docExt,
        docKind,
        license,
        tags: Array.isArray(tags) ? tags : [],
        pricing
      });
    } catch (e) {
      console.error(`Failed to parse product ${file}: ${e.message}`);
    }
  }
}

const productsCatalog = {
  as_of: new Date().toISOString(),
  items: productItems
};

ensureCatalogDir();
fs.writeFileSync(OUT_SKILLS_FILE, JSON.stringify(skillsCatalog, null, 2));
console.log(`Generated ${OUT_SKILLS_FILE} with ${skillItems.length} skills.`);
fs.writeFileSync(OUT_PRODUCTS_FILE, JSON.stringify(productsCatalog, null, 2));
console.log(`Generated ${OUT_PRODUCTS_FILE} with ${productItems.length} products.`);
