import { defineConfig } from 'vite'
import reactPlugin from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

const react = reactPlugin;

function copyPublicAllowlist() {
  const publicDir = path.resolve(__dirname, 'public')
  const outputDir = path.resolve(__dirname, 'dist')

  const allowlist = [
    'favicon.svg',
    'icons.svg',
    'logo_hero.svg',
    'mind_fingerprint_head.svg',
    'mind_logo.png',
    'mind_logo_profile.png',
    'sanduiche_rev_mind_solana_core.mp4',
    'catalog/skills.json',
    'catalog/products.json'
  ]

  const copyFile = (relativePath: string) => {
    const source = path.join(publicDir, relativePath)
    const target = path.join(outputDir, relativePath)
    if (!fs.existsSync(source)) {
      throw new Error(`[public-copy] missing required public asset: ${relativePath}`)
    }
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.copyFileSync(source, target)
  }

  return {
    name: 'copy-public-allowlist',
    closeBundle() {
      for (const relPath of allowlist) copyFile(relPath)
    },
  }
}

function localSkillGenerator() {
  return {
    name: 'local-skill-generator',
    configureServer(server: any) {
      server.middlewares.use('/api/generate-skill', async (req: any, res: any) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk.toString();
          });
          req.on('end', async () => {
            try {
              const { prompt } = JSON.parse(body);
              if (!prompt) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing prompt' }));
                return;
              }

              // Extract basic info from prompt as fallback
              const cleaned = prompt.replace(/[^a-zA-Z0-9_ ]/g, '').trim();
              const words = cleaned.split(" ");
              const skillName = words.slice(0, 2).join("_") || "Custom_Skill";
              const slug = skillName.toLowerCase();
              const mindprintId = crypto.randomUUID();

              // Call Anthropic API to generate real content
              const anthropicKey = process.env.ANTHROPIC_API_KEY;
              
              let jsonCode = "";
              let mdCode = "";

              if (anthropicKey) {
                try {
                  const systemPrompt = `You are Hermes, the MIND Protocol Skill Creator.
Generate a valid A2A Agent Card (JSON) and SPINS rulebook (Markdown) for the following user request.
Respond ONLY with a JSON object containing exactly two string fields: "jsonCode" and "mdCode".
No markdown blocks wrapping the outer JSON, no other text.

Requirements for jsonCode:
- Must follow A2A_v1 protocol schema
- agent_identity.name must be based on the prompt
- pib_agentico_fee must be "0.005_per_transaction"
- capabilities must reflect the prompt intent
- compliance standard must be "A2A_Agentic_Safety_Card"
- MUST include a "traceability" block with the following exactly:
  - "mindprint_id": "${mindprintId}"
  - "lineage_prompt": "${prompt.substring(0, 100).replace(/"/g, '\\"')}"
  - "telemetry_endpoint": "/v1/metrics/a2a"
  - "execution_audit_log": "required"

Requirements for mdCode:
- Must be a Markdown file starting with "# SPINS: <Name> Agent"
- Include sections: Contexto, Regras de Ouro, Instrução de Processamento, Traceability & Audit
- Must enforce A2A digital signature and Zero-knowledge proofs
- In the "Traceability & Audit" section, explicitly state that all executions must log the mindprint_id (${mindprintId}) to the telemetry endpoint for impact and yield calculation.`;

                  const response = await fetch("https://api.anthropic.com/v1/messages", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "x-api-key": anthropicKey,
                      "anthropic-version": "2023-06-01"
                    },
                    body: JSON.stringify({
                      model: "claude-3-haiku-20240307",
                      max_tokens: 1500,
                      system: systemPrompt,
                      messages: [{ role: "user", content: `Create a skill for this request: "${prompt}"` }]
                    })
                  });

                  if (response.ok) {
                    const aiData: any = await response.json();
                    const aiContent = aiData.content[0].text;
                    try {
                      const parsedContent = JSON.parse(aiContent);
                      jsonCode = parsedContent.jsonCode;
                      mdCode = parsedContent.mdCode;
                    } catch (parseErr) {
                      console.error("Failed to parse AI JSON response, falling back to mock.");
                    }
                  } else {
                    console.error("Anthropic API error:", await response.text());
                  }
                } catch (aiErr) {
                  console.error("AI Generation failed:", aiErr);
                }
              }

              // Fallback to static mock if AI fails or no key
              if (!jsonCode || !mdCode) {
                jsonCode = `{
  "agent_identity": {
    "name": "${skillName}_Agent",
    "version": "1.0.0",
    "protocol": "A2A_v1",
    "pib_agentico_fee": "0.005_per_transaction"
  },
  "capabilities": [
    {
      "service": "${slug}_execution",
      "methods": ["GET", "POST"],
      "auth_required": true,
      "encryption": "AES-256"
    }
  ],
  "compliance": {
    "standard": "A2A_Agentic_Safety_Card",
    "guarantees": "Zero-knowledge_proofs"
  },
  "traceability": {
    "mindprint_id": "${mindprintId}",
    "lineage_prompt": "${prompt.substring(0, 100).replace(/"/g, '\\"')}",
    "telemetry_endpoint": "/v1/metrics/a2a",
    "execution_audit_log": "required"
  }
}`;
                mdCode = `# SPINS: ${skillName} Agent
## Contexto: Integre este conhecimento ao Mind Orchestrator.

### Regras de Ouro:
- Prioridade Máxima: Integridade da Carta Agêntica.
- Protocolo: A2A_v1.
- Restrição: Bloquear qualquer handshake sem assinatura digital válida.

### Instrução de Processamento:
"Se o Mind Orchestrator solicitar ${skillName}, execute a rotina e valide o custo no JSON."

### Traceability & Audit:
Toda execução deve disparar um log para \`/v1/metrics/a2a\` contendo o \`mindprint_id\` (${mindprintId}) para rastreabilidade de impacto e cálculo de yield da rede.`;
              }

              // Generate cryptographic hashes for the Mindprint
              const jsonHash = crypto.createHash('sha256').update(jsonCode).digest('hex');
              const mdHash = crypto.createHash('sha256').update(mdCode).digest('hex');

              const mindprintCode = JSON.stringify({
                "asset_id": `metaplex_core_sim_${mindprintId.split('-')[0]}`,
                "checksums": {
                  "manifest_json": jsonHash,
                  "spins_md": mdHash
                },
                "lineage": {
                  "parent_hash": "genesis",
                  "prompt_vector": crypto.createHash('sha256').update(prompt).digest('hex')
                },
                "zk_proof_ready": true,
                "timestamp": new Date().toISOString()
              }, null, 2);

              const x402Code = `# X402 Atomic Settlement Policy
policy_id: "x402_${mindprintId.split('-')[0]}"
mindprint_ref: "${mindprintId}"
split:
  creator: 0.92
  protocol: 0.08
settlement_layer: "Cloak_Darkpool"
trigger: "on_execution_success"
currency: "SOL"
enforcement: "strict"`;

              // Path to hermes folder
              const hermesDir = path.resolve(__dirname, '../../agent-cards/skills/hermes');
              if (!fs.existsSync(hermesDir)) {
                fs.mkdirSync(hermesDir, { recursive: true });
              }

              const jsonPath = path.join(hermesDir, `card_skill_hermes-${slug}.json`);
              const mdPath = path.join(hermesDir, `card_skill_hermes-${slug}_spins.md`);
              const mindprintPath = path.join(hermesDir, `card_skill_hermes-${slug}.mindprint`);
              const x402Path = path.join(hermesDir, `card_skill_hermes-${slug}.x402`);

              fs.writeFileSync(jsonPath, jsonCode, 'utf-8');
              fs.writeFileSync(mdPath, mdCode, 'utf-8');
              fs.writeFileSync(mindprintPath, mindprintCode, 'utf-8');
              fs.writeFileSync(x402Path, x402Code, 'utf-8');

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                success: true, 
                skillName,
                slug,
                jsonCode,
                mdCode,
                mindprintCode,
                x402Code
              }));
            } catch (err) {
              console.error('[Skill Generator] Error:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to generate files' }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end('Method not allowed');
        }
      });
    }
  };
}

type LocalArtifact = {
  id: string
  slug: string
  title: string
  description: string
  content: string
  content_type: "markdown"
  price: string
  wallet_address: string
  created_at: string
  updated_at: string
  published_at: string
  checksum: string
}

function readRequestBody(req: any): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk: any) => {
      body += chunk.toString()
    })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function sendJson(res: any, statusCode: number, payload: unknown) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload, null, 2))
}

function normalizePrice(value: unknown): string | null {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').trim())
  if (!Number.isFinite(n) || n <= 0) return null
  return n.toFixed(6)
}

function normalizeWallet(value: unknown): string | null {
  const wallet = String(value ?? '').trim()
  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) return null
  return wallet
}

function slugify(title: string, checksum: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'mind-artifact'
  return `${base}-${checksum.slice(0, 8)}`
}

function serializeArtifact(artifact: LocalArtifact) {
  return {
    id: artifact.id,
    slug: artifact.slug,
    title: artifact.title,
    description: artifact.description,
    content_type: artifact.content_type,
    price: artifact.price,
    wallet_address: artifact.wallet_address,
    created_at: artifact.created_at,
    updated_at: artifact.updated_at,
    published_at: artifact.published_at,
    checksum: artifact.checksum,
    attachment_id: null,
    preview_image_attachment_id: null,
    settlement: {
      protocol: "x402",
      mode: "dev_challenge",
      production_status: "INSUFFICIENT_EVIDENCE"
    }
  }
}

function localPaywalledArtifactGateway() {
  const artifacts = new Map<string, LocalArtifact>()

  return {
    name: 'local-paywalled-artifact-gateway',
    configureServer(server: any) {
      server.middlewares.use('/api/mind-artifact', async (req: any, res: any) => {
        try {
          const url = new URL(req.url || '/', 'http://localhost')
          const parts = url.pathname.split('/').filter(Boolean)

          if (req.method === 'POST' && parts[0] === 'upload') {
            const rawBody = await readRequestBody(req)
            const body = JSON.parse(rawBody || '{}')
            const title = String(body.title ?? '').trim()
            const description = String(body.description ?? '').trim()
            const content = String(body.content ?? '').trim()
            const price = normalizePrice(body.price)
            const walletAddress = normalizeWallet(body.walletAddress)

            if (!title || !content || !price || !walletAddress) {
              sendJson(res, 400, {
                error: "title, content, positive price, and 0x walletAddress are required"
              })
              return
            }

            const checksum = crypto
              .createHash('sha256')
              .update(JSON.stringify({ title, description, content, price, walletAddress }))
              .digest('hex')
            const slug = slugify(title, checksum)
            const now = new Date().toISOString()
            const artifact: LocalArtifact = {
              id: crypto.randomUUID(),
              slug,
              title,
              description,
              content,
              content_type: "markdown",
              price,
              wallet_address: walletAddress,
              created_at: now,
              updated_at: now,
              published_at: now,
              checksum
            }

            artifacts.set(slug, artifact)
            sendJson(res, 201, serializeArtifact(artifact))
            return
          }

          if (req.method === 'GET' && parts.length === 0) {
            const search = (url.searchParams.get('search') || '').toLowerCase()
            const limit = Math.min(Number(url.searchParams.get('limit') || 20), 100)
            const list = Array.from(artifacts.values())
              .filter((artifact) => {
                if (!search) return true
                return `${artifact.title} ${artifact.description}`.toLowerCase().includes(search)
              })
              .slice(0, limit)
              .map(serializeArtifact)
            sendJson(res, 200, { artifacts: list, page: 1, limit })
            return
          }

          const slug = parts[0]
          const artifact = slug ? artifacts.get(slug) : undefined
          if (!slug || !artifact) {
            sendJson(res, 404, { error: "artifact not found" })
            return
          }

          if (req.method === 'GET' && parts.length === 1) {
            sendJson(res, 200, serializeArtifact(artifact))
            return
          }

          if (req.method === 'GET' && parts[1] === 'price') {
            sendJson(res, 200, {
              price: Number(artifact.price),
              currency: "USDC",
              protocol: "x402"
            })
            return
          }

          if (req.method === 'GET' && parts[1] === 'content') {
            const proof = req.headers['x-mind-payment-proof'] || url.searchParams.get('proof')
            if (proof !== 'dev-paid') {
              sendJson(res, 402, {
                error: "Payment required",
                protocol: "x402",
                status: "PAYMENT_REQUIRED",
                production_status: "INSUFFICIENT_EVIDENCE",
                challenge: {
                  amount: artifact.price,
                  currency: "USDC",
                  recipient: artifact.wallet_address,
                  chain: url.searchParams.get('chain') || "solana-devnet",
                  artifact: artifact.slug,
                  checksum: artifact.checksum
                },
                dev_unlock: {
                  header: "x-mind-payment-proof: dev-paid",
                  warning: "local development only; not an on-chain settlement proof"
                }
              })
              return
            }

            res.statusCode = 200
            res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
            res.setHeader('X-MIND-Artifact-Slug', artifact.slug)
            res.setHeader('X-MIND-Artifact-Checksum', artifact.checksum)
            res.setHeader('X-MIND-Settlement-Mode', 'dev-simulated')
            res.end(artifact.content)
            return
          }

          sendJson(res, 405, { error: "method not allowed" })
        } catch (err) {
          console.error('[Local Artifact Gateway] Error:', err)
          sendJson(res, 500, { error: "local artifact gateway failed" })
        }
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyPublicAllowlist(), localSkillGenerator(), localPaywalledArtifactGateway()],
  build: {
    copyPublicDir: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    watch: {
      ignored: ['**/node_modules 2/**']
    }
  }
})
