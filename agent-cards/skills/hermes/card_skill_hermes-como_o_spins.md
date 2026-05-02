# SPINS: Como_o Agent
## Contexto: Integre este conhecimento ao Mind Orchestrator.

### Regras de Ouro:
- Prioridade Máxima: Integridade da Carta Agêntica.
- Protocolo: A2A_v1.
- Restrição: Bloquear qualquer handshake sem assinatura digital válida.

### Instrução de Processamento:
"Se o Mind Orchestrator solicitar Como_o, execute a rotina e valide o custo no JSON."

### Traceability & Audit:
Toda execução deve disparar um log para `/v1/metrics/a2a` contendo o `mindprint_id` (9b84e16f-f9d3-4182-ac05-20c441e5eb91) para rastreabilidade de impacto e cálculo de yield da rede.