const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname);
const SKILLS_DIR = path.join(ROOT_DIR, 'agent-cards', 'skills');

const dirsToCheck = ['mind', 'stbr'];
let updatedCount = 0;

for (const dirName of dirsToCheck) {
  const dirPath = path.join(SKILLS_DIR, dirName);
  if (!fs.existsSync(dirPath)) continue;

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    let hasBadge = false;

    // Verificar se tem a badge 'The Garage Premium' ou 'Superteam BR'
    const badges = data.provenance?.badges || data.metadata?.badges || [];
    const origin = data.provenance?.origin || data.metadata?.origin || "";

    if (
      badges.includes('The Garage Premium') ||
      badges.includes('Superteam BR') ||
      origin.includes('Superteam') ||
      origin.includes('The Garage')
    ) {
      hasBadge = true;
    }

    if (hasBadge) {
      data.pricing = {
        model: "free",
        currency: "USDC",
        price: 0
      };
      
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`Updated pricing to FREE for ${file}`);
      updatedCount++;
    }
  }
}

console.log(`\nTotal of ${updatedCount} agent cards updated to FREE to boost community traction.`);
