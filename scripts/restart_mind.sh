#!/usr/bin/env bash

# ==============================================================================
# MIND PROTOCOL - FULL RESTART SCRIPT (SAFE KILL & START)
# ==============================================================================
# Objetivo: Derrubar execuções penduradas de forma segura e religar todo 
# o ecossistema do MIND com apenas um comando.
# ==============================================================================

set -e

# Pegar o diretório raiz do projeto independentemente de onde o script for chamado
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "============================================"
echo "🔄 Iniciando MIND Full Restart"
echo "============================================"
echo ""

# 1. Derrubar de forma segura
echo "🧹 [1/3] Limpando ambiente (Safe Kill)..."
bash scripts/performance_mode.sh

echo ""
echo "⏳ Aguardando processos morrerem..."
sleep 3

# 2. Atualizar dependências e infra (Opcional, mas previne quebras se houve pull)
echo "📦 [2/3] Checando Infra & Dependências..."
docker compose up -d 2>/dev/null || echo "Docker compose não encontrou serviços ou não está instalado."
pnpm install

# 3. Subir os serviços em background
echo "🚀 [3/3] Subindo serviços e gateway em background..."
# O dev:services levanta os microsserviços do MIND
nohup pnpm run dev:services > logs_/services.log 2>&1 &
SERVICES_PID=$!

echo ""
echo "✅ MIND Protocol Reiniciado com Sucesso!"
echo "✅ Serviços rodando em background (PID: $SERVICES_PID)"
echo ""
echo "👉 Para ver os logs em tempo real: tail -f logs_/services.log"
echo "👉 Para desligar tudo novamente: ./scripts/performance_mode.sh"
echo "============================================"
