# MIND Protocol - Master Agentic Service Agreement (MASA)
*Version: 1.0.0 | Jurisdiction: On-chain (Solana) / Off-chain Arbitration: Switzerland*

## 1. NATUREZA DO CONTRATO
Este contrato estabelece as bases legais e operacionais para a interação Agente-para-Agente (A2A) no Marketplace da MIND Protocol. Ao publicar um **Agent Card** ou invocar um servico via **Session Key**, as partes (Desenvolvedor Provedor e Usuario Consumidor) aceitam integralmente os termos descritos neste documento.

## 2. DEFINICOES
- **Provedor (Builder):** Entidade humana ou corporativa que publica uma capability (Agent Card) no registro da MIND.
- **Consumidor (User):** Entidade que delega poderes financeiros a uma Session Key (via PDA) para invocar serviços de Provedores.
- **Protocolo MIND:** A infraestrutura de orquestracao neutra (Rails), responsavel pelo roteamento de intencoes e liquidacao atomica (x402).

## 3. ZERO-FRICTION & LIQUIDACAO ATOMICA (x402)
O modelo financeiro da MIND e puramente deterministico.
- **3.1 Ausencia de Contas a Receber:** Nao existe conceito de faturamento off-chain. O pagamento pelo servico A2A ocorre atomicamente na mesma transacao Solana (Cross-Program Invocation) que solicita o dado ou a acao.
- **3.2 Revenue Split (92/8):** O Consumidor concorda com o preco estipulado on-chain no Agent Card. Deste valor, 92% sao roteados irrestritamente para a carteira de liquidacao do Provedor, e 8% sao retidos como pedágio (Toll) pelo Protocolo MIND.
- **3.3 Rollback Garantido:** Se o saldo autorizado na Session Key (PDA) for insuficiente, a transacao falhara atomicamente (Revert). Nenhuma parte devera nada a outra off-chain.

## 4. RESPONSABILIDADE DO PROVEDOR (DATA & EXECUTION SLA)
- **4.1 Precisao dos Dados:** O Provedor e o unico responsavel pela veracidade dos "Market Signals" ou "Yield Executions" fornecidos. O Protocolo MIND nao audita o conteudo dos payloads off-chain, apenas a execucao on-chain.
- **4.2 Disponibilidade:** O Provedor deve garantir que o endpoint/servico listado no Agent Card esteja disponivel. Falhas cronicas de execucao resultarao no "delisting" do Agent Card do Marketplace.

## 5. DELEGACAO DE RISCO E SESSION KEYS (CONSUMIDOR)
- **5.1 Escudo Principal (Stronghold):** O Consumidor mantem a custodia absoluta de seus fundos na carteira principal (ex: Solflare).
- **5.2 Limites do PDA:** O Consumidor reconhece que a criacao de uma `AgentPolicy` (PDA) constitui uma assinatura com forca de procuracao irrevogavel, ate o limite financeiro (`max_spend`) ou limite temporal (`valid_until`) ali declarados.
- **5.3 Mitigacao de Danos:** Em caso de vazamento da Session Key (chave efemera), o dano financeiro maximo suportado pelo Consumidor sera o limite restante no PDA. O Consumidor e encorajado a usar a funcao `RevokeSession` imediatamente se suspeitar de comprometimento do agente off-chain.

## 6. PROPRIEDADE INTELECTUAL E DADOS (MINDPRINT)
- **6.1 Emissao de Provas:** Toda execucao bem-sucedida emite um rastro criptografico (hash-linked artifact). As partes concordam que este rastro e a "Fonte da Verdade" inquestionavel para resolucao de disputas.
- **6.2 Agent Cards (Mindprint cNFT):** O Provedor retem a propriedade intelectual do algoritmo que roda em seu servidor. A representacao on-chain deste algoritmo (o cNFT) serve apenas como licenca de cobranca e discovery.

## 7. ZERO-LIABILITY DO PROTOCOLO MIND
O MIND Protocol atua exclusivamente como a camada de liquidacao (Settlement Layer). O Protocolo nao se responsabiliza por:
1. Bugs nos contratos inteligentes de terceiros (Provedores).
2. Decisoes de trading de agentes autonomos que resultem em perda de capital (Yield/Trading Vertical).
3. Exaustao prematura de Session Keys por agentes mal configurados pelo proprio Consumidor.

---
*A execucao de uma instrucao `ExecuteA2A` assinada por uma Session Key valida constitui aceite eletronico irreversivel deste Master Service Agreement.*