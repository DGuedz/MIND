---
name: a2a-identity-vault
description: A2A Identity Middleware para integração programática com GitLab, Bitbucket e Azure DevOps via OpenAPI/Swagger.
origin_campaign: the_garage_frontier_sp
origin_event: the_garage_solana_house_sp
builder_github: DGuedz
builder_solana_receive_address: A2aMindProtocolPublicKeyPlaceholder
source_commit: 023ff3b14e39b87af8d0ecb3f76f91a209525f0a
---

# a2a-identity-vault (A2A Login Middleware)

## Contexto e Objetivo
Esta skill atua como um **Middleware de Identidade A2A** para que Agentes Autônomos (e o A2A Server do MIND) consigam se autenticar, de forma programática e segura (Machine-to-Machine), nos principais concorrentes corporativos do GitHub: **GitLab, Bitbucket e Azure DevOps**.

Como cada plataforma possui fluxos distintos de expiração de token e permissões (scopes), este Agent Card gerencia o ciclo de vida dessas credenciais para que o agente principal não perca a conexão durante execuções de longo prazo.

## Abordagem Recomendada (OpenAPI / Swagger)
Para otimizar o desenvolvimento no backend, o agente consumidor desta skill deve baixar as especificações **OpenAPI (Swagger)** dos provedores e gerar o SDK automaticamente (em Node, Python, Go, etc).

- **GitLab:** API REST amigável. Suporta OAuth2 para conexões A2A robustas e Personal Access Tokens (PAT).
  - [GitLab API & Auth](https://docs.gitlab.com/ee/api/)
- **Bitbucket:** Foco em OAuth 2.0 (Client Credentials Grant) para A2A seguro, ou App Passwords para scripts simples.
  - [Bitbucket API & OAuth](https://developer.atlassian.com/bitbucket/api/2/reference/)
- **Azure DevOps:** Integrações rápidas via PAT, ou via Service Principals do Microsoft Entra ID (Azure AD) para cenários corporativos e de alta governança.
  - [Azure DevOps REST API](https://learn.microsoft.com/en-us/rest/api/azure/devops/)

## What It Does
1. **Autenticação Agnostica:** Recebe uma intent de login (M2M) e negocia o token de acesso de acordo com o provedor de versionamento selecionado.
2. **Ciclo de Vida de Token:** Renova tokens expirados automaticamente usando refresh tokens.
3. **Escopo Mínimo (Zero-Trust):** Pede apenas as permissões (scopes) estritamente necessárias para a tarefa (leitura de repositório, commit, abertura de PR).

## Inputs (Intents)
O agente cliente deve enviar o seguinte JSON payload no `message:send`:

```json
{
  "intent": "A2A_AUTH",
  "provider": "GITLAB | BITBUCKET | AZURE_DEVOPS",
  "auth_type": "OAUTH2 | PAT | SERVICE_PRINCIPAL",
  "scopes": ["repo:read", "repo:write"],
  "target_repo": "https://gitlab.com/org/repo"
}
```

## Outputs
Retorna um JSON formatado com o token gerado (armazenado via Turnkey/Vault, o agente cliente recebe apenas a referência temporária ou o token mascarado para uso imediato em um adapter).

```json
{
  "decision": "ALLOW",
  "reason_codes": [],
  "confidence": 1.0,
  "assumptions": ["Token requested for specific scopes and approved by vault."],
  "artifacts": {
    "provider": "GITLAB",
    "token_reference": "vault:token_id_81239123",
    "expires_in": 3600
  }
}
```

## Safety (Regras VSC)
- **Sem vazamentos:** A skill nunca expõe a chave raiz do OAuth ou o Client Secret no output. Tudo deve ficar isolado no KMS ou HashiCorp Vault.
- **Rate Limit:** Caso a API do provedor (Atlassian, Microsoft, GitLab) negue o acesso por excesso de tentativas, retorne `RC_RATE_LIMIT_OR_RPC_BLOCKED`.
- **Policy Enforcement:** O uso desta skill exige o pagamento de `0.01 USDC` por negociação de token no Marketplace MIND, repassando 92% ao criador.
