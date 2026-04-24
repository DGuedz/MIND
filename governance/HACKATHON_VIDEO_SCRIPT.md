# MIND Hackathon Video Script (High Impact)

## Objetivo
Demonstrar, em poucos minutos, que MIND é:
1. Control plane institucional para a Economia de Agentes (Agentic Economy).
2. Infraestrutura de liquidação determinística on-chain (Solana x402 A2A Micropayments).
3. Sistema seguro com Human-in-the-Loop (HitL) via Telegram para aprovação de operações críticas.

## Duração Recomendada
- 2m30s a 3m00s

## Pre-Flight (antes de gravar)
1. Abrir `https://landingpage-dgs-projects-ac3c4a7c.vercel.app` no desktop.
2. Abrir Telegram com o bot MIND Neural Chat limpo (sem mensagens anteriores).
3. Garantir que a carteira Solana do agente tem saldo suficiente (~0.05 SOL).
4. Deixar o terminal aberto e rodando o `mock_noahai_server.ts` (ou o serviço equivalente).

## Roteiro por Tempo

### 00:00 - 00:20 | Hook & Dashboard (O Produto)
**Fala:**
"O MIND Protocol não é apenas uma interface; é o gateway institucional para a Economia de Agentes na Solana. Ele permite que agentes autônomos negociem dados e inteligência entre si, garantindo liquidação atômica e controle soberano humano."
**Ação:**
- Mostrar a Home (`/`) navegando fluidamente pelo design system minimalista.
- Ir para o Dashboard (`/app`) e mostrar os gráficos alimentados pela API da Covalent e os saldos da treasury do agente.

### 00:20 - 00:50 | O Problema & A Solução (x402 A2A)
**Fala:**
"Hoje, agentes de IA não têm como pagar uns aos outros de forma nativa e segura. Nós resolvemos isso com micropagamentos x402 on-chain. Quando nosso Agente de Execução precisa de uma análise de risco do Agente OpenClaw, ele solicita a inteligência, mas a transação só ocorre mediante aprovação humana."
**Ação:**
- Mostrar a arquitetura no site ou no terminal.
- Disparar a intenção de compra de dados via Telegram ou script de teste.

### 00:50 - 01:40 | Human-in-the-Loop (Telegram) & Liquidação
**Fala:**
"Aqui entra o nosso 'Intent Firewall'. O agente levanta a intenção de pagar 0.001 SOL pelo relatório de risco. O usuário recebe a notificação no Telegram com contexto total. Ao clicar em 'Aprovar x402', o MIND executa uma transação atômica na Mainnet da Solana. Sem intermediários, liquidação determinística."
**Ação:**
- Mostrar a mensagem chegando no Telegram.
- Clicar em " Aprovar x402".
- Mostrar o bot processando e retornando o `txHash` da Solana Mainnet.
- Mostrar a confirmação visual da transação (pode ser o link do Solscan).

### 01:40 - 02:10 | Entrega de Valor (AI Oracle)
**Fala:**
"Com o hash da transação como prova criptográfica (Proof of Payment), o agente envia o recibo para o Oráculo de IA, que valida a transação on-chain e libera os dados criptografados. O ciclo se fecha: inteligência comprada, pagamento liquidado na Solana, e o humano sempre no controle."
**Ação:**
- Mostrar o log do servidor (OpenClaw) validando o `txHash` e retornando o payload de dados.
- O bot do Telegram avisa que a operação foi concluída com sucesso.

### 02:10 - 02:30 | Fechamento & TRL 7
**Fala:**
"O MIND Protocol já opera em TRL 7 – provado em ambiente real (Mainnet). Nós unimos a velocidade de máquinas da Solana com a governança inegociável exigida por instituições. MIND: Machine-speed execution, human-sovereign control."
**Ação:**
- Voltar para o Dashboard (`/app`) via botão do Telegram.
- Mostrar a interface atualizada.
- Fim do vídeo.

## Erros de Pitch a Evitar
1. Não focar apenas na UI; mostrar que a transação acontece de verdade na rede Solana.
2. Não gastar muito tempo explicando a teoria sem mostrar a execução do bot.
3. Não esquecer de frisar que a liquidação é feita em Mainnet (isso aumenta muito o peso do projeto).
