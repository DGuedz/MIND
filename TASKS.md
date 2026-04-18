Tarefas Iniciais Priorizadas

P0
- Implementar schemas e contratos da Intent
- Subir intent-service e approval-gateway-service
- Integrar Telegram via OpenClaw para approve/reject
- Registrar decisão em Approval e emitir evento append-only
- Gerar proof básico com hash encadeado

P1
- Enriquecimento de Intent via MarketContext
- Adapter inicial Covalent/GoldRush
- Registry de agentes com Metaplex

P2
- Execução simulada controlada
- Observabilidade mínima por intent_id

KMS DeFi Execution Track (Telegram -> Real On-chain)

P0
- Introduzir interface KmsProvider no signer-service
- Remover caminho de assinatura real via chave crua no tg_neural_chat
- Implementar idempotencia + expiracao de aprovacao no approval-gateway
- Adicionar policy engine local (allowlist de programas, limites diarios, teto por intent)

P1
- Integrar Turnkey adapter para create wallet + sign transaction
- Persistir wallet_id/public_key/policy_id e trilha de auditoria
- Integrar execution-service para montar txs reais (Jupiter/Kamino/Meteora) em modo guarded
- Registrar evidence bundle completo (intent_id, provider_request_id, txHash, explorerUrl)

P2
- Rodar bateria de testes reais (devnet + mainnet de baixo notional)
- Adicionar dashboards SLO (approval->submit, submit->confirm, block reasons)
- Implementar provider secundario (Privy) atras da mesma interface
