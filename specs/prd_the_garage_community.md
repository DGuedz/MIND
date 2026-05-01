# PRD: Integração The Garage & Superteam BR

## 1. Visão Geral
**Objetivo:** Estabelecer uma ponte direta e de baixo atrito entre o MIND Protocol e a comunidade Solana local (Superteam BR / The Garage). O foco é atrair builders para criar "Smart Assets" (skills tokenizadas) e facilitar o acesso deles às skills já existentes no Marketplace.

**Hipótese de Valor (PMF):** O MIND Protocol não constrói inteligência nativa, constrói a infraestrutura (as "estradas"). Os devs constroem a inteligência (os "carros"). Para inicializar esse ecossistema, a fase The Garage usa acesso patrocinado via Voucher Codes. O backend emite recibo auditável de subsídio comunitário e não exige liquidação x402 real durante a fase de tração.

**Contrato de fases:** o x402 real só abre na fase `open_interest`, depois que a comunidade abastecer o MIND com skills, os fluxos comunitários forem testados, e a validação de policy/proof estiver demonstrada. O sistema já carrega o preset de validação em `.json` e `.md`; a cunhagem cNFT/Mindprint deve usar esses campos quando a fase paga for habilitada.

## 2. Manifesto / Comunicação Oficial
Abaixo está o rascunho oficial da mensagem a ser enviada no Telegram/Discord da comunidade:

> **Assunto:** [MIND Protocol] Chamada para Builders - As portas estão abertas
> 
> Fala pessoal da Superteam BR / The Garage!
> 
> Aqui é o Diego (DGuedz), passando pra compartilhar um marco importante do nosso projeto pro Colosseum Hackathon.
> O MIND Protocol foi desenhado com uma tese central: nós **não** construímos inteligência artificial. Nós construímos as **estradas** on-chain (A2A, x402 settlement, Zero-Trust KMS). Quem constrói a inteligência (as Skills e Copilotos) são **vocês**.
> 
> Para celebrar e inicializar nossa rede, estamos abrindo a vitrine do MIND Marketplace para os builders daqui.
> 
> **Presente pra comunidade:**
> Se você entrar no nosso [Marketplace (Localhost/Vercel)], vai ver que algumas skills premium (ex: Jupiter Swap, Kuka) custam USDC. 
> Mas pra galera daqui, é só usar o código **`THEGARAGE`**, **`SUPERTEAMBR`** ou **`COLOSSEUM`** no checkout. O protocolo subsidia 100% do acesso nesta fase e o backend emite um recibo de tração comunitária, sem broadcast on-chain.
> 
> **Como subir sua própria Skill (Tokenizada):**
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
No `manifest.json`, ele define a tag `pricing`. Durante a fase The Garage, o marketplace pode aplicar `community_free` para remover fricção de onboarding sem apagar o preço original planejado para a fase paga.
```json
{
  "pricing": {
    "model": "community_free",
    "currency": "USDC",
    "price": 0,
    "originalModel": "per_request",
    "originalPrice": 0.05,
    "sponsoredBy": "MIND Protocol",
    "phase": "the_garage_community",
    "eligibleVoucherCodes": ["THEGARAGE", "SUPERTEAMBR", "COLOSSEUM"],
    "settlementRequired": false
  },
  "lifecycle": {
    "currentPhase": "the_garage_community",
    "nextPhase": "open_interest",
    "x402RealSettlementEnabled": false,
    "activationGates": [
      "minimum_builder_supply_reached",
      "community_flows_tested",
      "policy_check_passed",
      "kms_wallet_ready",
      "x402_payment_verified",
      "proof_bundle_verified"
    ]
  },
  "validation": {
    "policy": {
      "requiredChecks": [
        "hash_integrity",
        "builder_identity",
        "payout_wallet_present",
        "policy_gate",
        "voucher_or_x402_reference",
        "proof_bundle"
      ],
      "decisionContract": "governance/spec_runtime/x402_phase_contract.json"
    }
  },
  "cnftPreset": {
    "standard": "Metaplex Core",
    "mintPhase": "open_interest",
    "currentPhaseDelivery": "metadata_preset_only"
  }
}
```

### Passo 3: Deploy / Pull Request
O dev commita essa pasta e faz um Pull Request para o repositório principal do MIND (`DGuedz/MIND`), na pasta `agent-cards/skills/mind/`.
Nosso pipeline compila essa pasta em um Card no Marketplace. Nesta fase, o claim comunitário gera recibo de subsídio; Execution Proof on-chain via Cloak/x402 fica reservado para o fluxo pago validado.

### Passo 4: Fase Open Interest
Quando houver supply suficiente de builders e testes comunitários, o mesmo card muda de `community_free` para `per_request`.
Gates obrigatórios antes de liberar x402 real:
1. skills aprovadas com `manifest.json` e `SKILL.md` completos
2. hash de manifesto e rulebook verificados
3. wallet/payout do builder presente
4. policy gate retornando `ALLOW`
5. pagamento x402 confirmado on-chain
6. proof bundle e Mindprint/cNFT emitidos com `mind_x402_phase_contract_v1`

## 4. Implementação do Voucher Code
- **Local:** `apps/landingpage/src/pages/Marketplace.tsx`
- **Gatilho:** Inserção do código no card selecionado.
- **Backend:** `apps/api-gateway/src/index.ts` reconhece voucher comunitário em `metadata` e retorna recibo `sponsored` sem chamar o serviço de pagamento.
- **Lógica:** Códigos válidos (`THEGARAGE`, `SUPERTEAMBR`, `COLOSSEUM`) aplicam `community_free` com recibo de subsídio.
- **UX:** O botão muda para "Claim Access (Free)" e exibe o comando de contribuição depois do recibo.
- **Fase seguinte:** recibos `sponsored` incluem `nextPhase: open_interest`, gates de ativação e evidências exigidas para x402 real.

## 5. Próximos Passos
- [x] Atualizar a UI do Marketplace para suportar os códigos.
- [x] Atualizar backend para recibo de tração comunitária sem x402 real.
- [x] Atualizar catálogo de produtos para `community_free`.
- [x] Criar contrato de fases em `governance/spec_runtime/x402_phase_contract.json`.
- [x] Pré-setar validação e cNFT metadata em `manifest.json`/Agent Cards.
- [ ] Enviar a comunicação oficial no canal da comunidade.
- [ ] Monitorar os primeiros Pull Requests na pasta de skills.
