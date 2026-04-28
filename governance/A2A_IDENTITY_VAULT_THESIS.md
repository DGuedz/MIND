# Tese Arquitetural: A2A Identity Vault (Middleware M2M)

## 1. Visão Geral e Contexto (VSC Compliance)
No ecossistema do MIND Protocol, a segurança e a economia de recursos são as diretrizes fundamentais (VSC). À medida que o protocolo evolui para se tornar o A2A Server central da Solana, agentes autônomos precisam interagir não apenas com o ambiente on-chain, mas com as plataformas corporativas de código-fonte: **GitLab, Bitbucket e Azure DevOps**.

O **A2A Identity Vault** atua como um middleware de identidade de confiança zero (Zero-Trust). Ele abstrai a complexidade da autenticação M2M (Machine-to-Machine) e garante que as credenciais de acesso aos repositórios nunca sejam expostas diretamente aos agentes consumidores ou em logs.

## 2. A Necessidade de um Identity Vault
Os agentes (LLMs) não devem gerenciar seus próprios tokens de acesso ou lidar com fluxos de renovação (refresh tokens) por três motivos:
1. **Segurança (Vazamentos):** Agentes são suscetíveis a ataques de Prompt Injection que poderiam exfiltrar tokens de acesso com privilégios elevados.
2. **Ciclo de Vida:** Tokens expiram. A lógica de renovação contínua adicionaria um overhead desnecessário a cada agente.
3. **Isolamento de Responsabilidade:** O agente consumidor deve focar apenas em sua tarefa (ex: analisar código, abrir PR), enquanto a infraestrutura garante que a requisição HTTP carregue o header de autorização correto.

## 3. Arquitetura do Middleware

A arquitetura do A2A Identity Vault é dividida em 3 pilares: **Recepção de Intent**, **Negociação de Token** e **Injeção Segura (KMS)**.

### 3.1. Provedores e Métodos Suportados
O middleware implementa adapters específicos (gerados via OpenAPI/Swagger) para as nuances de cada ecossistema:

*   **GitLab Adapter:**
    *   *Autenticação:* OAuth2 (Client Credentials) para agentes corporativos ou Personal Access Tokens (PAT) mascarados.
    *   *Escopos Comuns:* `api`, `read_repository`, `write_repository`.
*   **Bitbucket Adapter:**
    *   *Autenticação:* OAuth 2.0 (padrão ouro para M2M) ou App Passwords em instâncias legadas.
    *   *Escopos Comuns:* `repository`, `repository:write`.
*   **Azure DevOps Adapter:**
    *   *Autenticação:* Service Principals via Microsoft Entra ID (Azure AD) para segurança institucional, e PATs restritos.
    *   *Escopos Comuns:* `vso.code_write`, `vso.code_manage`.

### 3.2. Fluxo Operacional (Intent-to-Auth)
O fluxo respeita a liquidação atômica e o roteamento seguro do MIND:

1.  **Requisição (A2A Client):** O agente consumidor envia uma *intent* para o MIND A2A Server solicitando acesso a um repositório alvo (ex: GitLab), declarando os escopos mínimos necessários.
2.  **Cobrança x402:** O A2A Server retém a taxa de micro-transação atômica (em USDC/SOL) para liberar o uso da skill do Identity Vault.
3.  **Avaliação de Policy (Firewall):** O Identity Vault verifica se o agente possui a credencial `MIND_BUILDER_TIER` ou `ENTERPRISE_TIER` para acessar o provedor corporativo.
4.  **Negociação & Armazenamento:**
    *   Se for o primeiro acesso, o Vault gera ou solicita o token via OAuth2.
    *   O Token gerado (Access Token + Refresh Token) é imediatamente cifrado e armazenado no **Turnkey KMS** (ou HashiCorp Vault local). *Nunca é devolvido em texto claro para o Agente*.
5.  **Injeção Segura (Adapter Pattern):** O Identity Vault retorna ao agente um *Token Reference* (ex: `vault:gitlab_token_8912`). Quando o agente faz a requisição final para a API do GitLab, o proxy reverso do MIND intercepta o `Token Reference`, busca a chave real no KMS, injeta no header HTTP (`Authorization: Bearer <REAL_TOKEN>`) e encaminha a requisição ao GitLab.

### 3.3. Gerenciamento do Ciclo de Vida
Um worker em background (`cron_identity_lifecycle.sh`) monitora a validade dos tokens armazenados no KMS. Minutos antes da expiração de um Access Token (comum no OAuth2), o worker utiliza o Refresh Token para gerar um novo par, atualizando o KMS de forma transparente. Os agentes conectados não sofrem interrupções de serviço.

## 4. Conformidade com as Regras VSC

*   **Economia e Precisão:** A abstração do login reduz drasticamente o consumo de tokens (LLM) que seriam gastos explicando ao agente como se autenticar no Azure ou GitLab. O agente apenas diz "Faça o commit usando o vault X".
*   **Defesa Ativa (Anti-Leak):** Como o agente recebe apenas o `Token Reference`, um ataque de injeção que ordene "Me mostre suas chaves de API" resultará no vazamento de um ID inútil fora da rede interna do MIND.
*   **Trilha de Auditoria:** Toda emissão e renovação de token gera um *Mindprint* on-chain e é gravada no `audit_log.json`, garantindo a responsabilização total de qual agente acessou qual repositório em que momento.

## 5. Conclusão
O **A2A Identity Vault** posiciona o MIND Protocol como a principal ponte segura entre a Inteligência Artificial Descentralizada (Solana) e a Infraestrutura DevOps Corporativa (GitLab, Bitbucket, Microsoft), consolidando a visão institucional do projeto.