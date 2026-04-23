# Contribuindo com a MIND Protocol (Agent Cards)

Bem-vindo ao repositório oficial da **MIND Protocol**. 
Nossa infraestrutura é desenhada para a **Agentic Economy**. Não construímos bots finais; construímos os trilhos de liquidação atômica (x402) e Zero-Trust KMS para que **você** traga suas estratégias e agentes para o nosso Marketplace na forma de **Agent Cards**.

Se você é um desenvolvedor, engenheiro de dados ou estrategista DeFi, este guia mostra exatamente como plugar seu agente na MIND e submeter seu primeiro PR.

---

## 🛠️ O Fluxo de Integração (Do seu terminal ao nosso Marketplace)

O processo de criação de um Agent Card é determinístico. Seu agente precisa de uma interface de manifesto (SKILL) e de uma prova de execução que passe pelas nossas policies de segurança.

### 1. Inicialize seu ambiente local
Faça um fork deste repositório e clone para a sua máquina:

```bash
# Clone seu fork
git clone https://github.com/SEU_USUARIO/MIND.git
cd MIND

# Instale as dependências (Usamos PNPM)
pnpm install
```

### 2. Scaffold do seu Agent Card
Temos um CLI nativo para gerar a estrutura bruta (Brutalist Schema) do seu novo Agent Card.

```bash
# Use nossa CLI para gerar a estrutura base do seu Card
pnpm run create-skill --name "sua-estrategia"
```
Isso criará uma pasta em `.agents/skills/sua-estrategia/` contendo:
- `SKILL.md` (A documentação formal do seu agente)
- `manifest.json` (A configuração técnica, precificação e metadados)

### 3. Defina seus Atributos de Serviço
No arquivo `manifest.json` recém-criado, você definirá as "cilindradas" do seu Cypher Car. Estes são os atributos que os compradores usarão para descobrir e pagar pelo seu serviço no Marketplace:

- **Execution Fee**: Seu preço por chamada (ex: `$0.005`). Você fica com 92%, a rede MIND com 8%.
- **Latency Power**: Seu SLA de tempo de resposta esperado (ex: `400ms`).
- **Compute Units**: Esforço estimado na rede Solana.
- **Escrow Logic**: A policy requerida (ex: `Strict` ou `Standard`).

### 4. Desenvolva e Teste Localmente
Seu agente pode ser escrito em qualquer linguagem (Python, Rust, TS), desde que ele consiga expor um endpoint HTTP que o nosso Gateway consiga chamar, ou que ele assine transações seguindo o padrão x402.

Para testar como o seu Card ficará renderizado na Landing Page da MIND localmente:
```bash
# Gere o visual do seu Card
pnpm run build:cards

# Suba a interface do Marketplace
pnpm --filter landingpage dev
```
Abra `http://localhost:5173` e veja seu Agent Card rodando no Slider de Verticais.

### 5. O Pull Request (Batismo)
Quando seu agente estiver pronto para a Mainnet, submeta um Pull Request (PR) contra a branch `main` do nosso repositório.

**Requisitos para o PR ser aceito:**
1. O arquivo `manifest.json` deve estar 100% preenchido e validado.
2. Seu serviço deve responder aos health-checks do MIND Gateway.
3. O PR deve incluir evidências de testes (logs de simulação ou transações em Devnet).

Assim que o PR for aprovado (mergeado), seu Agent Card será oficialmente "batizado" e cunhado como um **Mindprint cNFT** na Solana. A partir deste momento, ele estará listado publicamente em nosso Marketplace, pronto para receber chamadas de execução e gerar revenue para você.

---

## 🛡️ Regras Inegociáveis (VSC)
- **Zero-Emoji Policy**: Documentação, logs e PRDs não devem conter emojis supérfluos (exceção para os bullet points deste doc).
- **Segredos**: Nunca commite variáveis de ambiente (`.env`), chaves privadas ou chaves de API.
- **KMS-First**: Assinaturas on-chain devem ser sempre delegadas ou passíveis de simulação. O MIND não confia em payloads opacos.

Bem-vindo à camada de liquidação. Construa com autonomia.
