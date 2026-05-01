# PRD de Hardening de Seguranca para Go-Live

## Why
O ambiente atual possui caminhos de bypass e mocks que sao aceitaveis para fase de tracao, mas inseguros para abertura de trafego. Precisamos garantir bloqueio por padrao, validacao server-side e evidencias auditaveis antes do go-live.

## What Changes
- Exigir `API_GATEWAY_API_KEY` obrigatoria em `prod/stage` e bloquear bootstrap sem chave valida.
- Endurecer `/v1/payment/x402` com validacao de voucher no servidor, uso unico por combinacao (`voucher + builder + item`) e expiracao.
- Remover fallback de sucesso local no frontend do Marketplace; erro de backend deve resultar em estado `error`.
- Endurecer `/v1/identity/a2a/proxy` com allowlist de dominios e remocao de token mock.
- Endurecer `/v1/vercel/execute` removendo `isSettled=true`; exigir verificacao real de settlement ou responder `INSUFFICIENT_EVIDENCE`.
- Registrar evidencias minimas de seguranca e decisao para cada fluxo sensivel.
- **BREAKING**: chamadas sem API key valida em ambientes `prod/stage` passam a falhar no bootstrap/acesso.
- **BREAKING**: claims comunitarios sem voucher valido/nao-expirado/ja-utilizado passam a ser bloqueados.

## Impact
- Affected specs: API Gateway AuthN/AuthZ, x402 settlement gate, Marketplace claim flow, Identity Proxy, Vercel Gateway execution policy, observabilidade de seguranca.
- Affected code: `apps/api-gateway/src/index.ts`, `apps/landingpage/src/pages/Marketplace.tsx`, armazenamento de vouchers (novo storage/repo), validacoes de ambiente e runtime policy.

## ADDED Requirements
### Requirement: Bootstrap Seguro por Ambiente
O sistema SHALL bloquear inicializacao do API Gateway em `prod/stage` quando `API_GATEWAY_API_KEY` estiver ausente ou invalida.

#### Scenario: Bootstrap bloqueado sem segredo
- **WHEN** o processo sobe em `NODE_ENV=production` ou `stage` sem `API_GATEWAY_API_KEY`
- **THEN** o servidor nao deve iniciar e deve registrar erro de configuracao critica

#### Scenario: Bootstrap permitido com segredo
- **WHEN** o processo sobe em `prod/stage` com `API_GATEWAY_API_KEY` valida
- **THEN** o servidor inicializa e todos endpoints protegidos exigem chave

### Requirement: Voucher Community com Unicidade e Expiracao
O sistema SHALL validar voucher no backend com regras de elegibilidade, expiracao e uso unico por (`voucherCode`, `builderHandle`, `marketplaceItemId`).

#### Scenario: Voucher valido e inedito
- **WHEN** a requisicao de `/v1/payment/x402` chega com voucher valido, nao expirado e nao utilizado para a combinacao builder+item
- **THEN** o sistema emite recibo `sponsored` e persiste marca de uso

#### Scenario: Reuso ou expiracao
- **WHEN** o mesmo voucher for reutilizado para a mesma combinacao ou estiver expirado
- **THEN** a API retorna `BLOCK` com `reason_codes` apropriados e sem emitir recibo

### Requirement: Frontend sem Sucesso Local em Falha de Backend
O sistema SHALL tratar indisponibilidade do backend como erro operacional, sem gerar recibo local simulado para sucesso.

#### Scenario: Backend indisponivel
- **WHEN** o Marketplace falha ao chamar `/v1/payment/x402`
- **THEN** o estado de settlement deve ser `error`, com mensagem clara e sem claim concluido

### Requirement: Identity Proxy Restrito
O sistema SHALL permitir `/v1/identity/a2a/proxy` apenas para dominios em allowlist e usar segredo real de KMS.

#### Scenario: URL fora da allowlist
- **WHEN** a URL de destino nao pertencer a allowlist configurada
- **THEN** a API responde `BLOCK` e nao executa proxy

#### Scenario: Token indisponivel
- **WHEN** nao houver token real no cofre/KMS para `token_reference`
- **THEN** a API responde `INSUFFICIENT_EVIDENCE` sem fallback mock

### Requirement: Vercel Execute com Gate de Settlement
O sistema SHALL validar prova de settlement antes de executar sandbox/roteamento AI.

#### Scenario: Settlement nao verificado
- **WHEN** `/v1/vercel/execute` for chamado sem prova valida de x402
- **THEN** a API responde `INSUFFICIENT_EVIDENCE` e nao executa workload

#### Scenario: Settlement verificado
- **WHEN** a prova de settlement estiver confirmada
- **THEN** a API executa fluxo solicitado e retorna evidencias auditaveis

### Requirement: Evidencia e Auditoria Minimas
O sistema SHALL registrar para fluxos sensiveis: decisao, reason codes, identificador da prova/recibo e timestamp.

#### Scenario: Requisicao sensivel processada
- **WHEN** ocorrer operacao em `payment`, `identity/proxy` ou `vercel/execute`
- **THEN** deve existir trilha auditavel com campos minimos de decisao e evidencia

## MODIFIED Requirements
### Requirement: Fase community_free com seguranca reforcada
Durante `the_garage_community`, o sistema continua sem settlement on-chain real por padrao, porem sem bypass inseguro.
O recebimento de subsidio comunitario passa a depender de validacao server-side de voucher, unicidade e expiracao.

### Requirement: Politica de execucao em endpoints sensiveis
Endpoints de execucao (`identity/proxy`, `vercel/execute`) deixam de aceitar comportamento mock permissivo em runtime operacional.
Respostas de bloqueio devem usar contrato de decisao padrao com `BLOCK` ou `INSUFFICIENT_EVIDENCE`.

## REMOVED Requirements
### Requirement: Fallback local de sucesso no Marketplace
**Reason**: gera falso positivo operacional, mascara indisponibilidade de backend e enfraquece controle antifraude.
**Migration**: substituir por UX de erro/retry, mantendo claim apenas quando houver recibo backend valido.

### Requirement: Permissao implicita por `isSettled = true` no vercel execute
**Reason**: bypass de pagamento/policy em endpoint de risco.
**Migration**: integrar verificacao real de settlement; ate la, bloquear com `INSUFFICIENT_EVIDENCE`.
