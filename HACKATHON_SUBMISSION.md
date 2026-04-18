# MIND Protocol - Hackathon Technical Submission

## 1. Visão Geral
O **MIND Protocol** atua como uma infraestrutura de coordenação financeira ("Pedágio Invisível") para a economia de agentes na Solana. Ele garante segurança institucional através de liquidação atômica e gerenciamento de chaves Zero-Trust via **Turnkey KMS**.

## 2. Artefatos de Validação (Runbook de Demonstração "One-Click")

Para testar e validar toda a infraestrutura E2E em runtime, execute as instruções abaixo:

### Passo 1: Inicializar a Infraestrutura
Levante todos os 9 microsserviços simultaneamente (Gateway + Serviços de Domínio) e aguarde o "Server listening" de todos:
```bash
pnpm run dev:services
```

### Passo 2: Validação de Health e Banco de Dados (PostgreSQL/Supabase)
Em um novo terminal, garanta que o roteamento e as conexões ESM (`import.meta.url`) estão operantes para todos os módulos do protocolo:
```bash
# Checar status dos serviços
curl -s http://localhost:3000/v1/health/services | jq .

# Checar status das conexões com o DB
curl -s http://localhost:3000/v1/health/db | jq .
```
*Resultado Esperado:* Todos os serviços e DBs devem retornar `"status": "ok"` ou `"not_required"`.

### Passo 3: Fluxo Human-in-the-Loop (HITL) via Telegram
Simula a violação de uma policy de risco e o pedido de aprovação humana via webhook do Telegram.
```bash
npx tsx scripts/e2e_hitl_simulation.ts
```
*Resultado Esperado:* O contexto transicionará para `ACCEPTED` após a aprovação simulada do usuário no Telegram (Webhook -> Approval Gateway -> A2A Server).

### Passo 4: Execução On-Chain com Assinatura Zero-Trust (Turnkey KMS)
Prova criptográfica final. O Agente constrói a transação Solana na memória (`execution-service`), mas **NÃO** possui a chave privada. O `signer-service` delega a assinatura (Ed25519) ao Turnkey KMS de forma assíncrona.
```bash
npx tsx scripts/smoke_test_kms.ts
```

#### Evidência Final (On-Chain Mainnet Solana):
*   **Rede:** Solana Mainnet (Helius RPC)
*   **TxHash Registrada (Exemplo Válido):** `PeYPPJF5CyXb71afSG5BtdXFPCnNb6edboDfSXMm1QFvt1kqrXV57TjRgU3zzQUxDDtiikSX66rVJ5YwdZjDWQz`
*   **Explorer:** [Ver Transação no Solscan](https://solscan.io/tx/PeYPPJF5CyXb71afSG5BtdXFPCnNb6edboDfSXMm1QFvt1kqrXV57TjRgU3zzQUxDDtiikSX66rVJ5YwdZjDWQz)

---

## 3. Ressalva de Arquitetura: `hero-flow` Mock

O endpoint principal da demonstração, `POST /v1/hero-flow/run` (disponível no API Gateway), unifica a intenção e a execução dos agentes.

Para fins de segurança da demonstração, previsibilidade financeira e proteção do capital institucional (conforme nossas *Policies* do Hackathon), a ação de Swap no roteador de execução foi projetada como um `TRANSFER` seguro de dust no `execution-service`.

**O que isso significa:**
1. A rota de execução de fato passa pelo Gateway, valida políticas (`intent-service`), solicita dados on-chain (`market-context`) e chega à montagem da transação.
2. O fluxo de assinatura criptográfica é **real**, solicitando a prova do Turnkey KMS para o signer.
3. Isso prova que a infraestrutura é escalável, modular e que a transação bruta é gerada e assinada respeitando nossa tese de segurança, sem risco de esgotamento desnecessário do saldo da treasury da demo.