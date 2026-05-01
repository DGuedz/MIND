# Tasks
- [x] Task 1: Hardening de bootstrap e autenticacao do API Gateway.
  - [x] SubTask 1.1: Implementar bloqueio de inicializacao sem `API_GATEWAY_API_KEY` em `prod/stage`.
  - [x] SubTask 1.2: Garantir cobertura de testes/smoke para cenarios com e sem chave.

- [x] Task 2: Hardening de voucher em `/v1/payment/x402`.
  - [x] SubTask 2.1: Definir storage server-side para voucher claim com chave composta (`voucherCode + builderHandle + marketplaceItemId`).
  - [x] SubTask 2.2: Implementar validacao de expiracao e de uso unico antes da emissao de recibo `sponsored`.
  - [x] SubTask 2.3: Retornar contrato de decisao com `reason_codes` em casos de bloqueio.

- [x] Task 3: Remover fallback local de sucesso no frontend.
  - [x] SubTask 3.1: Ajustar `Marketplace.tsx` para nunca marcar claim como `success` sem recibo backend.
  - [x] SubTask 3.2: Exibir estado `error` com acao de retry quando o backend falhar.

- [x] Task 4: Endurecer `identity/a2a/proxy`.
  - [x] SubTask 4.1: Implementar allowlist de dominios e bloqueio de URL fora da politica.
  - [x] SubTask 4.2: Remover uso de token mock e falhar com `INSUFFICIENT_EVIDENCE` quando KMS nao responder.

- [x] Task 5: Endurecer `vercel/execute`.
  - [x] SubTask 5.1: Remover bypass `isSettled = true`.
  - [x] SubTask 5.2: Integrar verificacao real de settlement x402 ou bloquear por padrao.

- [x] Task 6: Observabilidade e validacao final para abertura de trafego.
  - [x] SubTask 6.1: Incluir logs auditaveis minimos (decisao, reason codes, evidence id, timestamp) nos fluxos sensiveis.
  - [x] SubTask 6.2: Executar smoke tests de seguranca e build de frontend/backend para gate de release.

- [ ] Task 7: Bloquear bootstrap do API Gateway sem chave em `prod/stage`.
  - [ ] SubTask 7.1: Implementar fail-fast no startup quando `API_GATEWAY_API_KEY` estiver ausente em ambiente critico.
  - [ ] SubTask 7.2: Adicionar teste/smoke cobrindo startup bloqueado e startup permitido.

- [ ] Task 8: Uniformizar trilha auditavel minima nos caminhos sensiveis.
  - [ ] SubTask 8.1: Garantir contrato consistente (`decision`, `reason_codes`, `evidence`, `timestamp`) nos caminhos de `payment`, `identity/proxy` e `vercel/execute`.
  - [ ] SubTask 8.2: Revisar logs para evitar lacunas de auditoria em respostas de erro e sucesso.

- [ ] Task 9: Fortalecer validacao de release com smoke de seguranca ampliado.
  - [ ] SubTask 9.1: Incluir cenarios de `identity/proxy` (allowlist/token ausente) e `vercel/execute` (settlement ausente/nao confirmado).
  - [ ] SubTask 9.2: Consolidar evidencias de build/backend frontend e smoke em saida unica para gate de go-live.

# Task Dependencies
- Task 2 depende de Task 1.
- Task 3 pode rodar em paralelo com Task 2.
- Task 4 e Task 5 podem rodar em paralelo apos Task 1.
- Task 6 depende de Task 2, Task 3, Task 4 e Task 5.
- Task 7 depende de Task 1.
- Task 8 depende de Task 2, Task 4 e Task 5.
- Task 9 depende de Task 7 e Task 8.
