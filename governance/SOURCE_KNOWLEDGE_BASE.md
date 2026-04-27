# MIND Source Knowledge Base (General)

## Objetivo
Padronizar o uso de fontes confiaveis em todo o projeto para reduzir alucinacao, overclaim e inconsistencias de narrativa tecnica.

## Camadas de Confianca
1. Tier A (maxima confianca): documentacao oficial de protocolo, padroes (RFC), repositorios oficiais.
2. Tier B (alta confianca): pesquisa academica e relatorios institucionais com metodologia explicita.
3. Tier C (contexto de mercado): dashboards e agregadores com numeros dinamicos.

## Regras de Uso
1. Toda afirmacao critica deve citar ao menos uma fonte Tier A ou Tier B.
2. Dados de mercado dinamicos (Tier C) devem trazer data explicita do snapshot.
3. Se a evidencia for incompleta, marcar como `INFERENCIA`.
4. Nao usar linguagem absoluta ("garantido", "zero risco", "100% privado") sem prova formal.
5. Em conflitos entre fontes, priorizar padrao oficial e docs de protocolo.

## Dominios Cobertos
1. Solana infra e confiabilidade RPC.
2. DeFi credito/liquidacoes.
3. MEV e riscos de execucao adversarial.
4. Interoperabilidade entre agentes (A2A).
5. Micropagamentos maquina-a-maquina (x402/HTTP 402).
6. Dados e identidade on-chain (Covalent/Metaplex).
7. Mercado de credito tokenizado (RWA).
8. DevSecOps Institucional (Zero-Trust Release / Clean Room / SPV).

## Contrato de Resposta Grounded
Quando responder sobre tese, produto ou risco:
1. separar `FATO` de `INFERENCIA`;
2. anexar links de fonte;
3. explicitar limite da tese;
4. registrar premissas operacionais.

Formato recomendado:
```text
FATOS:
- ...
INFERENCIAS:
- ...
LIMITES:
- ...
FONTES:
- ...
```

## Janela de Atualizacao
1. Tier A: revisar mensalmente ou em mudanca relevante de protocolo.
2. Tier B: revisar trimestralmente.
3. Tier C: revisar semanalmente para metrics de mercado.

## Fonte Canonica no Projeto
Arquivo estruturado para automacao e roteamento:
- `governance/SOURCE_REGISTRY.json`

Tese aplicada ao caso MIND Dark Pool:
- `governance/DARK_POOL_CREDIT_THESIS.md`
