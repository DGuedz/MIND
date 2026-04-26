const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'agent-cards', 'skills', 'mind');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (!data.provenance) data.provenance = {};
  
  data.provenance.origin = "The Garage - Superteam BR";
  data.provenance.badges = [
    "The Garage Premium",
    "Superteam BR"
  ];

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Updated badges for ${file}`);
});
