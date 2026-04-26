const fs = require('fs');
const path = require('path');

const hostingerSkills = [
  {
    id: "hostinger-vps-manager",
    name: "Hostinger VPS Manager",
    desc: "Provision, start, stop, restart, and monitor Hostinger Virtual Private Servers (VPS).",
    category: "Infra"
  },
  {
    id: "hostinger-firewall-manager",
    name: "Hostinger Firewall Manager",
    desc: "Manage Hostinger VPS firewalls, attach/detach, and configure security rules.",
    category: "Security"
  },
  {
    id: "hostinger-dns-manager",
    name: "Hostinger DNS Manager",
    desc: "Manage DNS zones, records, snapshots, and domain forwarding.",
    category: "Infra"
  },
  {
    id: "hostinger-domain-availability",
    name: "Hostinger Domain Availability",
    desc: "Check the availability of domain names across multiple TLDs.",
    category: "Utility"
  },
  {
    id: "hostinger-wordpress-deploy",
    name: "Hostinger WordPress Deploy",
    desc: "Import and deploy complete WordPress websites, plugins, and themes automatically.",
    category: "Web2"
  },
  {
    id: "hostinger-malware-scanner",
    name: "Hostinger Malware Scanner",
    desc: "Install, uninstall, and run malware scans on Hostinger VPS instances.",
    category: "Security"
  },
  {
    id: "hostinger-billing-catalog",
    name: "Hostinger Billing & Catalog",
    desc: "Access service plans, subscription options, and manage payment methods.",
    category: "Finance"
  },
  {
    id: "hostinger-email-marketing",
    name: "Hostinger Reach (Email Marketing)",
    desc: "List and manage email contacts, profiles, and segments for email marketing.",
    category: "Marketing"
  }
];

const targetDir = path.join(__dirname, '..', 'agent-cards', 'skills', 'hostinger');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

hostingerSkills.forEach(skill => {
  const manifest = {
    "$schema": "https://mindprotocol.ai/schemas/agent-card/v1.json",
    "metadata": {
      "name": skill.name,
      "version": "1.0.0",
      "description": skill.desc,
      "tags": [
        "hostinger",
        "api",
        "mcp",
        skill.category.toLowerCase()
      ],
      "license": "Proprietary",
      "author": {
        "name": "MIND",
        "contact": "https://github.com/DGuedz/MIND"
      }
    },
    "discovery": {
      "intent": "infrastructure_management",
      "category": skill.category.toLowerCase(),
      "keywords": [
        "hostinger",
        "vps",
        "domain",
        "dns",
        "infrastructure"
      ],
      "compatibleFrameworks": [
        "claude-code",
        "cursor",
        "trae"
      ]
    },
    "data": {
      "type": "service",
      "format": "agent-skill",
      "schema": {
        "fields": []
      },
      "samples": [],
      "qualityScore": 0.90
    },
    "access": {
      "authentication": "mcp_token",
      "endpoints": {
        "discovery": "https://github.com/DGuedz/MIND",
        "metadata": "https://github.com/DGuedz/MIND",
        "data": "https://github.com/DGuedz/MIND"
      },
      "rateLimit": {
        "requests": 60,
        "per": "minute"
      }
    },
    "pricing": {
      "model": "free",
      "currency": "USDC",
      "price": 0
    },
    "provenance": {
      "source": "MIND/agent-cards/skills/hostinger",
      "createdAt": new Date().toISOString(),
      "updatedAt": new Date().toISOString(),
      "signature": "unsigned",
      "origin": "The Garage - Superteam BR",
      "badges": [
        "The Garage Premium",
        "Superteam BR"
      ]
    },
    "skill": {
      "source_url": "https://github.com/DGuedz/MIND",
      "repo_path": `agent-cards/skills/hostinger/${skill.id}.json`,
      "install": [
        `npx skills add hostinger/${skill.id}`
      ]
    }
  };

  fs.writeFileSync(path.join(targetDir, `${skill.id}.json`), JSON.stringify(manifest, null, 2));
  
  // Create SKILL.md
  const mdDir = path.join(__dirname, '..', '.agents', 'skills', skill.id);
  if (!fs.existsSync(mdDir)) fs.mkdirSync(mdDir, { recursive: true });
  
  const mdContent = `# ${skill.name}

## Diagnóstico
**Contexto Operacional:** ${skill.desc}
Esta skill conecta o Trae IDE e agentes autônomos diretamente à infraestrutura da Hostinger via MCP (Model Context Protocol).

## Intent Workflow
1. **Intent:** Agente despacha a intenção de uso para a infraestrutura da Hostinger.
2. **Credential Gate:** O MIND Gateway valida a credencial (Hostinger API Token).
3. **Execution:** Invocação segura do servidor MCP local (\`hostinger-api-mcp\`).
4. **Proof:** Emissão do \`Mindprint\` (Recibo criptográfico nativo na Solana).

## MCP Integration
Esta skill opera baseada nas ferramentas expostas pelo servidor MCP da Hostinger:
- **Server:** \`hostinger-api-mcp\`
- **Transport:** \`stdio\`
- **Auth:** \`API_TOKEN\` (via environment variables)

## Exemplo de Uso
\`\`\`bash
# Listar VPS (exemplo para o Trae)
"Liste todos os meus servidores VPS na Hostinger e mostre seus status atuais."
\`\`\`
`;
  fs.writeFileSync(path.join(mdDir, 'SKILL.md'), mdContent);
  // Copy manifest to .agents too
  fs.writeFileSync(path.join(mdDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
});

console.log(`Geradas ${hostingerSkills.length} skills da Hostinger.`);
