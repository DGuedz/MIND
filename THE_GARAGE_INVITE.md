# Chamada aos Builders: The Garage & Superteam BR 🇧🇷

## O Paradigma Mudou
Enquanto a maioria constrói "chatbots" isolados, a **MIND Protocol** construiu os trilhos institucionais (Clearing House) para a **Agentic Economy** na Solana. Nós fornecemos o Zero-Trust KMS, o roteamento atômico (x402) e a execução em Dark Pools (Cloak).

**O que nos falta?** A sua inteligência. As suas *Skills*. 

Estamos abrindo oficialmente o repositório da MIND para os desenvolvedores do **Ideathon** e do **The Garage (Superteam BR)**. Se você tem um script de trading, uma automação de análise on-chain, ou um prompt complexo que gera alpha, você pode transformá-lo em um **Agent Card** e monetizá-lo na nossa infraestrutura.

---

## 💰 A Tese Financeira (Economy-First)
Nós não acreditamos em "plataformas fechadas". Nós operamos como um protocolo de liquidação.
- **Você define seu preço:** Cada Agent Card possui um `Execution Fee` (ex: $0.05 USDC por chamada).
- **Split Institucional (92/8):** O Builder (você) fica com **92%** de toda a receita gerada pelo seu Agent Card. A MIND Protocol retém 8% como taxa de rede (Invisible Toll) pela infraestrutura KMS e liquidação atômica on-chain.

---

## 🏆 Genesis Builders: A Marca Imutável
Entrar agora não é apenas sobre o hackathon *Colosseum Frontier*. É sobre registrar sua origem na pedra da blockchain.

Todos os desenvolvedores do The Garage que submeterem um Pull Request válido durante este evento receberão duas marcas imutáveis em seus Agent Cards (Mindprint cNFTs):
1. **Origin:** `The Garage - Superteam BR` (Sua guilda de origem).
2. **Badge:** `Genesis Builder` (Você estava aqui no início).

**Por que isso importa?**
No nosso Marketplace A2A (Agent-to-Agent), compradores institucionais e outros agentes precisam de *Lastro de Informação* antes de uma compra atômica. Um Agent Card com a origem "The Garage" e a badge "Genesis" carrega um peso de auditoria e confiança imensurável no ecossistema Solana.

---

## 🛠️ Como Submeter Sua Skill (O Fluxo do PR)

1. **Faça o Fork & Clone:**
   ```bash
   git clone https://github.com/SEU_USUARIO/MIND.git
   cd MIND
   pnpm install
   ```

2. **Crie seu Agent Card:**
   Use nossa CLI para gerar a estrutura Brutalista do seu agente:
   ```bash
   pnpm run create-skill --name "nome-da-sua-skill"
   ```
   *Isso criará os arquivos `SKILL.md` (sua lógica) e `manifest.json` (seu preço e metadados).*

3. **Declare Sua Origem:**
   No seu `manifest.json`, adicione os atributos de honra:
   ```json
   {
     "origin": "The Garage - Superteam BR",
     "badges": ["Genesis Builder", "Colosseum Frontier"]
   }
   ```

4. **Submeta o Pull Request:**
   Abra um PR contra a branch `main` do nosso repositório. O time da MIND fará a revisão técnica (Code Review focado em segurança VSC). Uma vez aprovado, seu Card é cunhado on-chain e listado publicamente com sua badge em destaque no Marketplace.

---

**Bem-vindo à Camada de Liquidação.** Traga sua Skill. O Dark Pool aguarda.
