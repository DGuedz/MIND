import fs from 'fs';
import path from 'path';

const log = {
  info: (msg: string) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  success: (msg: string) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  neural: (msg: string) => console.log(`\x1b[35m[NEURAL]\x1b[0m ${msg}`),
};

const BRAND_COLORS = {
  bg: '#050505',
  white: '#ffffff',
  zinc400: '#a1a1aa',
  zinc700: '#3f3f46',
  zinc900: '#18181b',
};

/**
 * 1. Dexter (Data Agent) - The Grid of Truth
 */
function generateDexterSVG(): string {
  let dots = '';
  for (let i = 0; i < 15; i++) {
    for (let j = 0; j < 15; j++) {
      const x = 50 + i * 30;
      const y = 50 + j * 30;
      const opacity = Math.random() > 0.8 ? 0.8 : 0.1;
      const r = opacity > 0.5 ? 1.5 : 0.8;
      dots += `<circle cx="${x}" cy="${y}" r="${r}" fill="${BRAND_COLORS.white}" opacity="${opacity}" />\n`;
      
      // Linhas aleatórias conectando pontos brilhantes
      if (opacity > 0.5 && Math.random() > 0.5) {
        dots += `<line x1="${x}" y1="${y}" x2="${x + 60}" y2="${y + 30}" stroke="${BRAND_COLORS.white}" stroke-width="0.2" opacity="0.1" />\n`;
      }
    }
  }

  return `
<svg width="500" height="667" viewBox="0 0 500 667" xmlns="http://www.w3.org/2000/svg">
  <rect width="500" height="667" fill="${BRAND_COLORS.bg}" />
  <g opacity="0.6">
    ${dots}
  </g>
  <text x="50" y="600" font-family="monospace" font-size="12" fill="${BRAND_COLORS.zinc400}" letter-spacing="4">DEXTER // DATA_GRID</text>
</svg>`.trim();
}

/**
 * 2. Volan (Yield Agent) - The Multi-Layered Growth
 */
function generateVolanSVG(): string {
  let spirals = '';
  for (let i = 0; i < 12; i++) {
    const r = 20 + i * 20;
    const dash = 10 + i * 5;
    spirals += `<circle cx="250" cy="300" r="${r}" fill="none" stroke="${BRAND_COLORS.white}" stroke-width="0.5" stroke-dasharray="${dash}" opacity="${0.8 - i * 0.06}" />\n`;
  }

  return `
<svg width="500" height="667" viewBox="0 0 500 667" xmlns="http://www.w3.org/2000/svg">
  <rect width="500" height="667" fill="${BRAND_COLORS.bg}" />
  <g opacity="0.7">
    ${spirals}
  </g>
  <text x="50" y="600" font-family="monospace" font-size="12" fill="${BRAND_COLORS.zinc400}" letter-spacing="4">VOLAN // YIELD_STACK</text>
</svg>`.trim();
}

/**
 * 3. Krios (Risk Agent) - The Intent Firewall
 */
function generateKriosSVG(): string {
  let layers = '';
  for (let i = 0; i < 8; i++) {
    const y = 100 + i * 50;
    layers += `<line x1="50" y1="${y}" x2="450" y2="${y}" stroke="${BRAND_COLORS.white}" stroke-width="0.5" opacity="0.2" />\n`;
    
    // Formas geométricas "filtradas"
    if (i % 2 === 0) {
      layers += `<rect x="${100 + i * 20}" y="${y - 10}" width="20" height="20" fill="none" stroke="${BRAND_COLORS.white}" stroke-width="0.5" transform="rotate(45 ${110 + i * 20} ${y})" opacity="0.5" />\n`;
    }
  }

  return `
<svg width="500" height="667" viewBox="0 0 500 667" xmlns="http://www.w3.org/2000/svg">
  <rect width="500" height="667" fill="${BRAND_COLORS.bg}" />
  <g opacity="0.8">
    ${layers}
  </g>
  <text x="50" y="600" font-family="monospace" font-size="12" fill="${BRAND_COLORS.zinc400}" letter-spacing="4">KRIOS // RISK_FIREWALL</text>
</svg>`.trim();
}

/**
 * 4. Sentinel (Security Agent) - The Cryptographic Shield
 */
function generateSentinelSVG(): string {
  let hexes = '';
  const size = 40;
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 6; j++) {
      const x = 100 + i * size * 1.75;
      const y = 100 + j * size * 1.5 + (i % 2) * size * 0.75;
      hexes += `<polygon points="${x},${y-size} ${x+size},${y-size/2} ${x+size},${y+size/2} ${x},${y+size} ${x-size},${y+size/2} ${x-size},${y-size/2}" fill="none" stroke="${BRAND_COLORS.white}" stroke-width="0.5" opacity="0.15" />\n`;
    }
  }

  return `
<svg width="500" height="667" viewBox="0 0 500 667" xmlns="http://www.w3.org/2000/svg">
  <rect width="500" height="667" fill="${BRAND_COLORS.bg}" />
  <g opacity="0.7">
    ${hexes}
    <circle cx="250" cy="300" r="80" fill="none" stroke="${BRAND_COLORS.white}" stroke-width="1" opacity="0.4" />
    <circle cx="250" cy="300" r="10" fill="${BRAND_COLORS.white}" opacity="0.8" />
  </g>
  <text x="50" y="600" font-family="monospace" font-size="12" fill="${BRAND_COLORS.zinc400}" letter-spacing="4">SENTINEL // KMS_SHIELD</text>
</svg>`.trim();
}

async function forge() {
  const outputDir = path.join(process.cwd(), 'apps', 'landingpage', 'public');
  
  const assets = [
    { name: 'card_dexter.svg', content: generateDexterSVG() },
    { name: 'card_volan.svg', content: generateVolanSVG() },
    { name: 'card_krios.svg', content: generateKriosSVG() },
    { name: 'card_sentinel.svg', content: generateSentinelSVG() },
  ];

  log.neural('Forjando Ativos Visuais Procedurais para MIND Agent Cards...');

  for (const asset of assets) {
    const filePath = path.join(outputDir, asset.name);
    fs.writeFileSync(filePath, asset.content);
    log.success(`Ativo gerado: ${asset.name}`);
  }

  log.info('Processo concluído. Ativos prontos para visualização.');
}

forge().catch(console.error);
