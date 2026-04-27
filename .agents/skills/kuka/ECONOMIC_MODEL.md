# MIND Protocol: Racional Econômico e Precificação (Agent Cards)

## 1. Precificação Dinâmica Baseada em Utilidade (Kuka)
A precificação de um Agent Card não deve ser estática, mas sim baseada no consumo computacional e valor cognitivo entregue por requisição (x402). Para o agente **Kuka** (Mentor TradFi/Solana):
- **Base Fee (x402):** Cobrança em frações de centavo (ex: $0.005 USDC ou equivalente em SOL) por inferência/interação simples (term lookup, glossário).
- **Premium Fee:** Execuções complexas (deep dive de código, análise de risco de smart contract) cobram um multiplicador dinâmico baseado no peso computacional.
- **Split Institucional:** 92% do valor vai para o criador do card (revenue stream contínuo) e 8% para a tesouraria do protocolo MIND.

## 2. Motor Econômico (UTXO + x402)
O uso de UTXO via Cloak/x402 garante liquidação atômica e privacidade, criando uma vantagem competitiva:
- **Zero-Escrow:** Não há retenção de fundos em contratos vulneráveis. O pagamento e a entrega da prova criptográfica (Mindprint) ocorrem na mesma transação.
- **Micro-Pagamentos em Massa:** O padrão x402 permite streaming financeiro contínuo entre agentes (A2A). Milhares de agentes podem consumir a API do Kuka pagando em tempo real, sem saturar o estado on-chain principal.
- **Lastro e Liquidez:** O capital transitado é imediatamente liquidado na carteira do provedor, permitindo que a tesouraria (TreasuryAgent) aloque fundos ociosos em vaults de yield (Kamino) para maximizar o lucro.

## 3. Escala e Atomicidade (Milissegundos)
Para suportar milhares de mints e vendas simultâneas:
- **Execução Optimistic com Validação ZK:** O API Gateway processa a requisição, cobra o UTXO e emite o Mindprint. A validação final on-chain ocorre em batch ou de forma paralela.
- **Stateless Execution:** Cada execução do Kuka é independente. Não há gargalos de estado compartilhado. O UTXO garante que os pagamentos não colidam.

## 4. Segurança contra Atores Maliciosos (Defesa Ativa)
- **Honeypots Econômicos:** Taxas de penalidade (Slashing) para agentes que tentarem floodar a rede com requisições inválidas ou falsificarem assinaturas KMS.
- **Rate Limit Pago:** Atores maliciosos que tentarem DDoS pagarão por cada requisição devido à natureza do x402, tornando ataques financeiramente inviáveis.
- **Zero-Trust KMS:** As chaves nunca são expostas. Qualquer transação suspeita falha rapidamente (Fail-Fast) preservando o capital.