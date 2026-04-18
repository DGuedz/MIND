# Integração KMS (Key Management Service) com Turnkey

## 1. Objetivo e Alinhamento VSC
Em conformidade absoluta com a **Regra 1 de Segurança e Gerenciamento de Chaves** do protocolo VSC, o MIND Protocol eliminou o uso de chaves privadas (Keypairs) injetadas diretamente no código ou expostas no servidor.

Para garantir liquidação atômica on-chain com segurança institucional, adotamos o **Turnkey** como nosso provedor de KMS.
- **Antes:** O bot do Telegram e o `a2a_payment.ts` assinavam transações usando uma variável `METAPLEX_KEYPAIR` local.
- **Agora:** O servidor constrói a transação bruta (raw transaction) e delega a assinatura para a nuvem criptográfica do Turnkey via API, garantindo que a chave privada nunca toque a memória do nosso servidor.

## 2. Arquitetura Implementada
A abstração foi feita através da interface `KmsProvider`.
1. **`TurnkeyKmsProvider`**: Classe responsável por autenticar o Agente na API do Turnkey.
2. **`a2a_payment.ts`**: O fluxo de pagamento agora invoca `provider.signTransaction()`.
3. **Auditoria Persistente**: Toda decisão de assinatura (`ALLOW` ou `BLOCK`) é imutavelmente registrada no arquivo `governance/audit_log.json` via `audit_logger.ts`.

## 3. Setup do Ambiente (Concluído)
A infraestrutura foi provisionada e conectada com sucesso em 01/04/2026.

### 3.1. Variáveis de Ambiente (Backend - `.env`)
As credenciais de acesso à API do Turnkey foram isoladas no backend:
```env
TURNKEY_ORGANIZATION_ID="deb27acf-626b-43f2-9225-152d1fbd55cd"
TURNKEY_API_PUBLIC_KEY="0384d06be5f173bc209324142af630d1f1f2f61775e9884b4ab230832337a257d4"
TURNKEY_API_PRIVATE_KEY="<oculto_por_seguranca>"
X402_AGENT_PUBLIC_KEY="EyMoTToyaKWw3dvCYYsGAg6PfE6g5f6df8p5c4ropnan"
```

### 3.2. Variáveis de Ambiente (Frontend - `apps/landingpage/.env`)
O frontend (Dashboard) consome apenas a chave pública da carteira para exibição de saldo em tempo real:
```env
VITE_AGENT_PUBLIC_KEY="EyMoTToyaKWw3dvCYYsGAg6PfE6g5f6df8p5c4ropnan"
```

## 4. Policy Enforcement (Políticas de Segurança)
Com o Turnkey, a segurança não depende apenas do código. É possível configurar **Políticas de Assinatura** diretamente no painel (Dashboard do Turnkey > Security > Policies).
Exemplos de políticas que podem ser aplicadas para endurecer o Agente:
- **Limite de Gastos:** Impedir assinaturas se o valor transferido for maior que `X` SOL por dia.
- **Allowlist:** Permitir envio de fundos apenas para endereços previamente aprovados.
- **Expiração:** Revogar automaticamente a permissão do Agente em datas específicas.

## 5. Próximos Passos Operacionais
Para que o protocolo processe liquidações reais na rede Solana (Mainnet-beta), a carteira KMS gerada precisa ser financiada:
1. **Fund the Wallet:** Enviar uma pequena quantia de SOL (ex: `0.05 SOL`) para o endereço público do Agente: `EyMoTToyaKWw3dvCYYsGAg6PfE6g5f6df8p5c4ropnan`.
2. **Health Check Contínuo:** O script `scripts/test_kms.ts` pode ser usado a qualquer momento para validar o handshake com a API do Turnkey.
