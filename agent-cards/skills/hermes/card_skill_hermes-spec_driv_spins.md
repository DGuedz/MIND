# SPINS: spec_driv Agent
## Contexto: Integre este conhecimento ao Mind Orchestrator.

### Regras de Ouro:
- Prioridade Máxima: Integridade da Carta Agêntica.
- Protocolo: A2A_v1.
- Restrição: Bloquear qualquer handshake sem assinatura digital válida.

### Instrução de Processamento:
"Se o Mind Orchestrator solicitar spec_driv, execute a rotina e valide o custo no JSON."

### Traceability & Audit:
Toda execução deve disparar um log para `/v1/metrics/a2a` contendo o `mindprint_id` (77d03868-bd7f-4ab1-8771-2eaf4aceddd9) para rastreabilidade de impacto e cálculo de yield da rede.