---
name: hermes-skill-creator
description: Skill meta-cognitiva inspirada no closed learning loop do Hermes. O agente analisa tarefas complexas executadas com sucesso e as converte automaticamente em novas sub-skills reutilizaveis. Use quando o usuario pedir "crie uma nova skill", "gere um manifesto A2A", "abstraia essa tarefa em uma skill" ou interagir com o fluxo Discover & Collaborate do frontend.
version: 1.0.0
license: Proprietary
compatibility: Claude Code, Codex, OpenClaw
metadata: {"category":"autonomous-creation","author":"MIND","tags":"hermes,skill-creation,a2a,spins,seo-bot"}
---

# Hermes Autonomous Skill Creator

Esta skill atua como o motor de backend para o fluxo "Discover & Collaborate" do MIND Orchestrator. Ela automatiza a criação de novas capacidades (Agent Cards) garantindo que elas sejam nativamente otimizadas para o ecossistema A2A (SEO para Bots).

## Objetivos e Capacidades
- **Autonomous Skill Creation:** Abstrair pedidos em linguagem natural para código estruturado.
- **Procedural Memory Generation:** Criar documentações no formato SPINS (`.md`).
- **A2A SEO Manifests:** Gerar arquivos de interoperabilidade (`.json`) com `pib_agentico_fee` e endpoints.

## Regras Inegociáveis (VSC Economy & Policy)
1. **Zero Emojis:** Nunca utilize emojis na geração de código, logs ou respostas diretas desta rotina.
2. **Formato SPINS Obrigatório:** Todo arquivo markdown gerado deve seguir a arquitetura SPINS (Structured Prompt Information System).
3. **Assinatura e Custos:** Todo arquivo JSON gerado deve conter o bloco `agent_identity` com a moeda/taxa do protocolo (ex: `0.005_per_transaction`).
4. **Human Validation:** A skill não faz deploy automático em produção. Ela gera os artefatos locais para que o Builder faça o "Fork & Open PR".

## Fluxo de Execução (Closed Learning Loop)

Quando acionado, o Hermes deve seguir este pipeline estrito:

1. **Extração de Intenção (Intent Parsing):**
   - Analise o prompt do usuário para descobrir o nome da skill, o serviço principal e a regra de segurança.
   - Converta o nome para `snake_case` ou `kebab-case`.

2. **Geração do Manifesto A2A (.json):**
   - Crie o arquivo de definição técnica legível por máquina.
   - **Template Obrigatório:**
     ```json
     {
       "agent_identity": {
         "name": "[SKILL_NAME]_Agent",
         "version": "1.0.0",
         "protocol": "A2A_v1",
         "pib_agentico_fee": "0.005_per_transaction"
       },
       "capabilities": [
         {
           "service": "[SERVICE_TYPE]",
           "methods": ["GET", "POST"],
           "auth_required": true,
           "encryption": "AES-256"
         }
       ],
       "compliance": {
         "standard": "A2A_Agentic_Safety_Card",
         "guarantees": "Zero-knowledge_proofs"
       }
     }
     ```

3. **Geração do Cérebro SPINS (.md):**
   - Crie a documentação legível por LLMs detalhando as regras de operação.
   - **Template Obrigatório:**
     ```markdown
     # SPINS: [SKILL_NAME] Agent
     ## Contexto: Integre este conhecimento ao Mind Orchestrator.
     
     ### Regras de Ouro:
     - Prioridade Maxima: Integridade da Carta Agentica.
     - Protocolo: A2A_v1.
     - Restricao: Bloquear qualquer handshake sem assinatura digital valida.
     
     ### Instrucao de Processamento:
     "Se o Mind Orchestrator solicitar [SKILL_NAME], execute a rotina e valide o custo no JSON."
     ```

4. **Handoff (Entrega ao Builder):**
   - Salve os arquivos gerados no diretório `.agents/skills/[skill-name]/`.
   - Instrua o usuário a commitar as alterações e abrir um Pull Request (PR) no repositório principal do MIND.
   - Lembre o usuário de que ele pode usar o voucher `THEGARAGE` no Marketplace enquanto o PR é revisado.

## Gatilhos de Acionamento
- "Hermes, crie uma skill para..."
- "Quero publicar um novo Agent Card"
- "Abstraia meu fluxo de yield em uma skill"
- Acionamentos via frontend no painel de "Discover & Collaborate" (/start).
