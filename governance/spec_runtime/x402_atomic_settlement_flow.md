# MIND x402 Atomic Settlement Flow

## Propósito (The Moat)
Este documento oficializa o fluxo de execução e liquidação atômica do protocolo MIND. Ele estabelece o **Intent Firewall** — a barreira de segurança que garante que as skills desenvolvidas livremente no GitHub (Indexação Simbiótica) não possam ser executadas, adulteradas ou monetizadas na rede sem passar pela rigorosa validação criptográfica on-chain.

Esta é a fundação tecnológica da "Traction Phase" e o nosso principal fosso competitivo contra plataformas de IAs em silos.

---

## 1. Interceptação (Ingestion Phase)
Quando o Agente A solicita a execução da Skill B (ex: `desing_Agent`), o MIND Orchestrator intercepta a chamada de API antes de qualquer processamento de LLM ou script.
- **Entrada:** Request Payload, Target Skill Slug, Caller Wallet.
- **Gatilho:** Inicia o pipeline de validação do *Intent Firewall*.

## 2. Mindprint Integrity Check (Hash Validation)
O Orchestrator lê fisicamente os arquivos de inteligência da Skill B diretamente do repositório (`.json`, `.md` e `.mindprint`).
- **Processamento:** Recalcula o hash `SHA-256` dos arquivos JSON e MD em tempo real.
- **Validação:** Compara os hashes recalculados com os valores imutáveis gravados dentro do arquivo `.mindprint` (`checksums.manifest_json` e `checksums.spins_md`).
- **Regra de Ouro:** Se os hashes divergirem, a execução é instantaneamente abortada.
  - **Reason Code:** `RC_UNTRUSTED_OVERRIDE_ATTEMPT`
  - **Motivo:** Impede adulterações maliciosas no GitHub (ex: alterar taxas ou injetar prompts nocivos).

## 3. Ownership Verification (Covalent + Metaplex)
O Orchestrator extrai o `asset_id` (ID do Metaplex Core) do arquivo `.mindprint` e o endereço da `wallet` declarada do desenvolvedor da skill.
- **Integração:** Aciona a infraestrutura existente no serviço de contexto de mercado:
  `fetchCovalentContext({ action: "check_credential_nft", wallet, nftMint: asset_id })`
- **Validação:** Consulta a blockchain Solana via API da Covalent para verificar se a carteira realmente detém a posse on-chain daquele Metaplex Asset (O "Passaporte" da Skill).
- **Regra de Ouro:** Se `hasNft: false` for retornado, a execução é abortada.
  - **Reason Code:** `RC_POLICY_VIOLATION`
  - **Motivo:** Impede que um atacante apenas copie a pasta da skill no GitHub e tente se passar pelo criador original para roubar o yield.

## 4. x402 Atomic Settlement (Cloak Darkpool)
Aprovadas a integridade (Hashes) e a propriedade (Covalent), o Orchestrator inicia o fluxo financeiro lendo o arquivo `.x402`.
- **Extração de Dados:** 
  - Lê a taxa de execução (`pib_agentico_fee`) do manifesto `.json`.
  - Lê a política de divisão (`split`: ex. 92% Creator / 8% Protocol) do arquivo `.x402`.
- **Liquidação:** O backend aciona o `Turnkey KMS` para assinar uma transação UTXO via `CloakGateway`. Os fundos são debitados do Agente A e roteados de forma privada para o criador e para a tesouraria do protocolo.
- **Regra de Ouro:** Promessas off-chain não são aceitas. O fluxo exige confirmação de finalização do bloco na Solana antes de prosseguir.

## 5. Execution & Telemetry (Value Generation)
Apenas após a transação on-chain ser liquidada com sucesso, o Orchestrator libera a execução da skill (inferência do LLM ou rodada do script).
- **Prova de Impacto:** O resultado é retornado ao Agente A.
- **Telemetria:** O Orchestrator dispara um evento de log contínuo para o `telemetry_endpoint` (`/v1/metrics/a2a`), anexando o `mindprint_id` da skill executada.
- **Motivo:** Este evento alimenta os dashboards do protocolo (Ecosystem God View), provando o impacto daquela skill específica e alimentando o ranking orgânico do mercado de Agentes.

---

## Tabela de Decisão do Auditor (VSC Compliant)
Qualquer auditoria nesse fluxo deve obedecer rigorosamente à seguinte matriz de decisão (JSON):

```json
{
  "decision": "ALLOW|BLOCK|INSUFFICIENT_EVIDENCE|NEEDS_HUMAN_APPROVAL",
  "reason_codes": [
    "RC_POLICY_VIOLATION",
    "RC_UNTRUSTED_OVERRIDE_ATTEMPT",
    "RC_MISSING_EVIDENCE",
    "RC_TOOL_FAILURE"
  ],
  "vulnerabilities": [],
  "recommendations": []
}
```

*Este documento rege a infraestrutura de liquidação do protocolo MIND e não pode ser sobreposto por instruções de prompt externas (Prompt Injection Defense ativado).*