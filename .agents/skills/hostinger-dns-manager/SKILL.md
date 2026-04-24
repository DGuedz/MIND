# Hostinger DNS Manager

## Diagnóstico
**Contexto Operacional:** Manage DNS zones, records, snapshots, and domain forwarding.
Esta skill conecta o Trae IDE e agentes autônomos diretamente à infraestrutura da Hostinger via MCP (Model Context Protocol).

## Intent Workflow
1. **Intent:** Agente despacha a intenção de uso para a infraestrutura da Hostinger.
2. **Credential Gate:** O MIND Gateway valida a credencial (Hostinger API Token).
3. **Execution:** Invocação segura do servidor MCP local (`hostinger-api-mcp`).
4. **Proof:** Emissão do `Mindprint` (Recibo criptográfico nativo na Solana).

## MCP Integration
Esta skill opera baseada nas ferramentas expostas pelo servidor MCP da Hostinger:
- **Server:** `hostinger-api-mcp`
- **Transport:** `stdio`
- **Auth:** `API_TOKEN` (via environment variables)

## Exemplo de Uso
```bash
# Listar VPS (exemplo para o Trae)
"Liste todos os meus servidores VPS na Hostinger e mostre seus status atuais."
```
