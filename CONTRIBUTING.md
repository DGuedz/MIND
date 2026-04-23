# Contribuindo com a MIND Protocol (Agent Cards)

Bem-vindo ao repositório oficial da **MIND Protocol**. 
Nossa infraestrutura é desenhada para a **Agentic Economy**. Não construímos bots finais; construímos os trilhos de liquidação atômica (x402) e Zero-Trust KMS para que **você** traga suas estratégias e agentes para o nosso Marketplace na forma de **Agent Cards**.

Se você é um desenvolvedor que já possui scripts, automações ou skills de IA no seu projeto, este guia mostra exatamente como plugar sua inteligência na MIND e submeter seu primeiro PR. Ao transformar seu script em um Agent Card, você passa a monetizar sua execução através dos nossos rails seguros.

> 🏆 **Special Track: The Garage & Colosseum Frontier**
> Durante o hackathon da Solana em São Paulo, todos os PRs aprovados que transformarem skills locais em Agent Cards receberão a badge on-chain **"The Garage Premium"**. Essa badge garante destaque de liquidez e prioridade de roteamento no nosso marketplace.

---

## 🛠️ O Fluxo de Integração (Do seu repo ao nosso Marketplace)

O processo de criação de um Agent Card é determinístico. Seu agente precisa de uma interface de manifesto (SKILL) e de uma prova de execução que passe pelas nossas policies de segurança.

### 1. Inicialize seu ambiente local
Faça um fork deste repositório e clone para a sua máquina:

```bash
git clone https://github.com/SEU_USUARIO/MIND.git
cd MIND
pnpm install
```

### 2. Transforme sua Skill em um Agent Card
Se você já tem um script de trading, um analisador de dados ou um bot no seu projeto, você só precisa encapsulá-lo no nosso formato (Brutalist Schema).

```bash
# Use nossa CLI para gerar a estrutura base do seu Card
pnpm run create-skill --name "nome-da-sua-skill"
```
Isso criará uma pasta em `.agents/skills/nome-da-sua-skill/` contendo:
- `SKILL.md` (A documentação formal do seu agente e instruções para LLMs)
- `manifest.json` (A configuração técnica, precificação e metadados)

### 3. Defina seus Atributos de Serviço e Preço
No arquivo `manifest.json`, você definirá as "cilindradas" do seu Card (como se fosse um Cypher Car). Estes são os atributos que outros agentes e humanos usarão para descobrir e pagar pelo seu serviço:

- **Execution Fee**: Seu preço por chamada (ex: `$0.005`). Você fica com 92%, a rede MIND com 8%.
- **Latency Power**: Seu SLA de tempo de resposta esperado (ex: `400ms`).
- **Escrow Logic**: A policy requerida (ex: `Strict` ou `Standard`).

### 4. Valide a Badge "The Garage Premium"
Para garantir que seu card receba o boost de tração do hackathon, adicione a tag de campanha no seu `manifest.json`:
```json
{
  "campaign": "the_garage_frontier_sp"
}
```

### 5. O Pull Request (Liquidação de Tração)
Quando seu manifesto e documentação estiverem prontos, submeta um Pull Request (PR) contra a branch `main` do nosso repositório.

**Requisitos para o PR ser aceito:**
1. O arquivo `manifest.json` deve estar 100% preenchido e validado.
2. Seu serviço deve responder aos health-checks (se for uma API ativa) ou ter o `SKILL.md` claro.
3. O PR deve incluir a motivação e o valor que essa skill traz para a rede Solana.

Assim que o PR for aprovado, seu Agent Card será oficialmente "batizado" e cunhado como um **Mindprint cNFT** na Solana, ganhando a badge **The Garage Premium**. A partir deste momento, ele estará listado publicamente no Slider do nosso Marketplace, provando tração real e validação do MIND como infraestrutura base.

---

## 🛡️ Regras Inegociáveis (VSC)
- **Segredos**: Nunca commite variáveis de ambiente (`.env`), chaves privadas ou chaves de API.
- **KMS-First**: Assinaturas on-chain devem ser sempre delegadas ou passíveis de simulação. O MIND não confia em payloads opacos.

Bem-vindo à camada de liquidação. Construa com autonomia e garanta seu espaço no Dark Pool.

