# PRD: Integração The Garage & Superteam BR

## 1. Visão Geral
**Objetivo:** Estabelecer uma ponte direta e de baixo atrito entre o MIND Protocol e a comunidade Solana local (Superteam BR / The Garage). O foco é atrair builders para criar "Smart Assets" (skills tokenizadas) e facilitar o acesso deles às skills já existentes no Marketplace.

**Hipótese de Valor (PMF):** O MIND Protocol não constrói inteligência nativa, constrói a infraestrutura (as "estradas"). Os devs constroem a inteligência (os "carros"). Para inicializar esse ecossistema, vamos oferecer subsídios (100% free) via Voucher Codes e abstrair a complexidade de contribuição.

## 2. Manifesto / Comunicação Oficial
Abaixo está o rascunho oficial da mensagem a ser enviada no Telegram/Discord da comunidade:

> **Assunto:** [MIND Protocol] Chamada para Builders — As portas estão abertas 🚪🧠
> 
> Fala pessoal da Superteam BR / The Garage!
> 
> Aqui é o Diego (DGuedz), passando pra compartilhar um marco importante do nosso projeto pro Colosseum Hackathon.
> O MIND Protocol foi desenhado com uma tese central: nós **não** construímos inteligência artificial. Nós construímos as **estradas** on-chain (A2A, x402 settlement, Zero-Trust KMS). Quem constrói a inteligência (as Skills e Copilotos) são **vocês**.
> 
> Para celebrar e inicializar nossa rede, estamos abrindo a vitrine do MIND Marketplace para os builders daqui.
> 
> 🎁 **Presente pra comunidade:**
> Se você entrar no nosso [Marketplace (Localhost/Vercel)], vai ver que algumas skills premium (ex: Jupiter Swap, Kuka) custam USDC. 
> Mas pra galera daqui, é só usar o código **`THEGARAGE`** ou **`SUPERTEAMBR`** no checkout. O protocolo subsidia 100% da transação e você recebe o comando CLI na hora pra plugar no seu agente local (Claude Code, Cursor, etc).
> 
> 🛠️ **Como subir sua própria Skill (Tokenizada):**
> Queremos que as suas ferramentas virem "Smart Assets" na Solana. Simplificamos o fluxo de contribuição ao máximo:
> 1. `npx @mindprotocol/cli create-skill "nome-da-sua-skill"` (Gera o esqueleto local)
> 2. Edite o `SKILL.md` (sua lógica/prompt) e o `manifest.json` (seu preço em USDC).
> 3. Faça um Pull Request direto pro nosso repositório na pasta `agent-cards/skills/`.
> 
> Assim que aprovado, sua skill entra na nossa vitrine global e qualquer agente no mundo pode descobrir e te pagar por uso (A2A).
> 
> Bora construir a economia de agentes juntos. Qualquer dúvida, manda aqui!

## 3. Fluxo Abstraído de Contribuição (Dev Flow)

Para reduzir a fricção de entrada, o dev não precisa entender a complexidade do Anchor ou UTXO no primeiro dia. Ele foca na lógica.

### Passo 1: Scaffold Local
O dev usa nosso CLI (simulado via script no repo):
```bash
npx @mindprotocol/cli init
npx @mindprotocol/cli create-skill "minha-skill"
```
Isso gera uma pasta com a estrutura mínima exigida pela nossa Spec:
```text
minha-skill/
├── manifest.json
└── SKILL.md
```

### Passo 2: Definição de Preço e Lógica
No `manifest.json`, ele define a tag `pricing`:
```json
{
  "pricing": {
    "model": "per_request",
    "currency": "USDC",
    "price": 0.05
  }
}
```

### Passo 3: Deploy / Pull Request
O dev commita essa pasta e faz um Pull Request para o repositório principal do MIND (`DGuedz/MIND`), na pasta `agent-cards/skills/mind/`.
Nosso CI/CD (`scripts/generate_skill_cards.mjs`) automaticamente compila essa pasta em um Card 3D no Marketplace e gera a "Execution Proof" on-chain via Cloak/x402.

## 4. Implementação do Voucher Code (Concluída)
- **Local:** `apps/landingpage/src/pages/Marketplace.tsx`
- **Gatilho:** Inserção do código no card selecionado.
- **Lógica:** Códigos válidos (`THEGARAGE`, `SUPERTEAMBR`, `COLOSSEUM`) zeram o custo (100% subsidy).
- **UX:** O botão "Execute (x402)" muda para "Claim Access (Free)" e, ao clicar, ignora o redirecionamento pro Gateway, exibindo o comando de instalação instantaneamente.

## 5. Próximos Passos
- [x] Atualizar a UI do Marketplace para suportar os códigos.
- [ ] Enviar a comunicação oficial no canal da comunidade.
- [ ] Monitorar os primeiros Pull Requests na pasta de skills.
