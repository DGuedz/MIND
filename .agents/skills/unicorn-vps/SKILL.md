---
name: unicorn-vps
description: Bootstrap seguro e educativo de VPS Ubuntu via Claude Code para ecossistema One Person Unicorn / Startup Factory.
version: 1.0.0
license: MIT
compatibility: Claude Code, Codex, OpenClaw
metadata: {"category":"devops","author":"Frederico Santana","tags":"vps,ubuntu,security,docker,traefik,the-garage"}
---

# unicorn-vps

Skill para padronizar setup de VPS Ubuntu com foco em segurança operacional e trilha educativa.

## Como operar
- Nunca expor segredos (tokens, chaves, passwords) em logs ou arquivos do repo.
- Preferir automação idempotente e rollback seguro.
- Registrar evidências objetivas (checks e status), evitando payloads sensíveis.

## Capacidades
### Bootstrap Seguro
- Hardening inicial (SSH, usuários, firewall, updates).
- Estrutura base para deploy (Docker/Traefik) quando aplicável.

### Diagnóstico
- Checks de conectividade, recursos e serviços.
- Identificação de falhas comuns sem alterar configuração automaticamente.

