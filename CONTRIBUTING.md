# Contribuindo com o MIND Protocol (Builder Pass)

Bem-vindo ao repositório oficial do **MIND Protocol**.

Se você está aqui pelo **The Garage / Superteam BR**, você já entendeu a visão: o futuro da Solana não é sobre quem cria o melhor bot isolado, mas sobre como agentes autônomos se comunicam, colaboram e pagam uns aos outros com fluidez e segurança.

O MIND constrói os trilhos (liquidação atômica x402 e Zero-Trust KMS). **Você** traz a inteligência.

Menos teoria, mais código rodando. Seu trabalho tem valor, e o MIND garante que ele seja precificado, descoberto e liquidado on-chain. Aqui, suas skills se transformam em **Agent Cards** — ativos inteligentes que outros agentes e usuários podem consumir no nosso Marketplace.

---

## Como Consumir Agent Cards (Marketplace)

Não quer construir agora, mas precisa de inteligência pro seu projeto? Perfeito.
O MIND expõe um ecossistema de skills prontas para uso.

1. **Descubra**: Acesse o [MIND Marketplace](https://mind-protocol.vercel.app/marketplace) e explore os Agent Cards disponíveis (ex: Análise de Risco, Oráculos de DeFi, Copilotos de Código).
2. **Integre**: Cada Card possui uma interface clara e determinística detalhada em seu `SKILL.md`.
3. **Pague pelo Uso (x402)**: Esqueça assinaturas mensais. Seus agentes pagam apenas pelos ciclos de inteligência que consumirem, via micro-transações atômicas roteadas pelo protocolo.

---

## Como Construir e Monetizar (The Garage Track)

Você tem um script de trading, um analisador de dados, ou um agente de IA útil? Transforme isso em um Agent Card e passe a monetizar sua execução. O processo é determinístico e focado na experiência do builder.

### 1. Prepare o Terreno
Faça um fork deste repositório e instale as dependências:

```bash
git clone https://github.com/SEU_USUARIO/MIND.git
cd MIND
pnpm install
```

### 2. Gere o Scaffold do seu Agent Card
Crie a estrutura base da sua skill usando nosso CLI interno. Isso garante que todos os metadados de proveniência (tracking) sejam preenchidos automaticamente.

```bash
pnpm run create-skill --name "nome-da-sua-skill" --builder "Seu Nome" --github "seu-github" --wallet "SUA_WALLET_SOLANA"
```

Isso vai gerar uma pasta em `agent-cards/skills/community/nome-da-sua-skill/` contendo:
- `SKILL.md`: A alma do seu agente. Instruções em linguagem natural, restrições e guias de uso para LLMs.
- `manifest.json`: O "motor" do seu card. Aqui você define preço, atributos técnicos e regras de liquidação.

### 3. Defina seu Preço e Regras (manifest.json)
Você está no controle. O MIND retém apenas 8% da taxa de roteamento; **92% da receita vai direto para a wallet que você definiu**.

- **Execution Fee**: Seu preço por chamada (ex: `$0.005`).
- **Latency Power**: Seu SLA de tempo de resposta esperado (ex: `400ms`).
- **Escrow Logic**: O nível de segurança exigido pela sua skill.

### 4. Valide o Rastreio (Initial Traction)
Durante a fase inicial (The Garage / Superteam BR), nós subsidiamos a descoberta dos melhores cards. Revise os campos gerados no seu `manifest.json` para garantir que sua wallet e campanha estão corretos:

```json
{
  "origin": {
    "campaign": "the_garage_frontier_sp",
    "community": "superteam_br"
  },
  "builder": {
    "displayName": "Seu Nome",
    "github": "seu-github"
  },
  "payout": {
    "currency": "USDC",
    "chain": "solana",
    "recipientAddress": "SUA_WALLET_SOLANA",
    "providerShareBps": 9200
  },
  "provenance": {
    "sourceCommit": "hash-do-seu-commit"
  }
}
```

### 5. O Pull Request (Seu Passaporte)
Tudo pronto? Abra um Pull Request (PR) contra a branch `main` deste repositório.

**Checklist de Aprovação:**
1. O `manifest.json` está preenchido e com a sua wallet Solana correta.
2. O `SKILL.md` explica claramente o que a skill faz e como um agente deve consumi-la.
3. Você descreveu no PR o valor prático que essa skill traz para o ecossistema.

Assim que aprovado, seu Agent Card será indexado no Marketplace. Ele ganha a badge **"The Garage Premium"** e recebe prioridade de liquidez no roteamento do MIND.

---

## Regras Inegociáveis da Comunidade (VSC)

- **A regra de ouro**: Segurança > Funcionalidade. Economia > Performance.
- **Segredos**: NUNCA commite `.env`, chaves privadas ou tokens de API. Chaves vazadas resultam em bloqueio imediato do PR.
- **KMS-First**: Assinaturas on-chain devem ser sempre delegadas. O MIND não confia em payloads opacos.

Bem-vindo à camada de inteligência da Solana. Construa com autonomia e garanta seu espaço no protocolo.
