#!/usr/bin/env bash

# ==============================================================================
# MIND PROTOCOL - SCRIPT DE MODO PERFORMANCE (SAFE KILL & RESTART)
# ==============================================================================
# Objetivo: Parar execuções locais desorganizadas (liberar memória) sem perder 
# código, banco de dados ou volumes persistentes.
# ==============================================================================

set -e

echo "============================================"
echo "⚡️ Iniciando MIND Performance Mode"
echo "============================================"
echo ""

echo "🛑 [1/3] Parando containers Docker (Safe Down)..."
# Mantém os volumes e não apaga dados. Apenas para os containers.
docker compose down || true
# Parar qualquer outro container órfão ativo (opcional, mas recomendado)
# docker stop $(docker ps -q) 2>/dev/null || true

echo "🛑 [2/3] Matando processos soltos (Node, APIs, Bots, Scripts)..."
# pkill encerra processos baseados no nome do comando ou argumento (-f)
pkill -f node || echo "Nenhum processo Node ativo."
pkill -f python || echo "Nenhum processo Python ativo."

echo "🛑 [3/3] Matando túneis (Localtunnel, Ngrok)..."
pkill -f localtunnel || echo "Nenhum localtunnel ativo."
pkill -f ngrok || echo "Nenhum ngrok ativo."

echo ""
echo "✅ Todos os processos pesados foram encerrados."
echo "✅ Seu código e dados (DB) estão intactos."
echo ""
echo "🧠 Processos são descartáveis. Código é permanente."
echo ""
echo "Para subir tudo novamente com estado limpo, rode:"
echo "👉 pnpm run dev:services"
echo "============================================"
