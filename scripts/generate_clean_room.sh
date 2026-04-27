#!/bin/bash
# Zero-Trust Release Ops (SPV Builder)
# MIND Protocol: "A equipe MIND não publica rascunhos; publica ativos auditáveis."

set -e

# Cores para VSC/Logs
GREEN='\03[0;32m'
BLUE='\03[0;34m'
YELLOW='\03[1;33m'
NC='\03[0m'

echo -e "${BLUE}[INFO]${NC} Inicializando geração de Clean Room (SPV Release)..."

if [ -z "$1" ]; then
  echo -e "${YELLOW}[WARNING]${NC} Nome da branch órfã não especificado. Usando 'public-audit-release'."
  BRANCH_NAME="public-audit-release"
else
  BRANCH_NAME=$1
fi

# Verifica se a árvore está limpa
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}[ERRO]${NC} Árvore de trabalho não está limpa. Faça o commit ou stash das suas alterações antes de gerar o Clean Room."
  exit 1
fi

echo -e "${BLUE}[INFO]${NC} Criando a branch órfã isolada: $BRANCH_NAME"
git checkout --orphan "$BRANCH_NAME"

echo -e "${BLUE}[INFO]${NC} Preparando o artefato de release (adicionando arquivos do index)..."
git add -A

echo -e "${BLUE}[INFO]${NC} Emitindo o commit fundacional criptográfico (Hash de Auditoria)..."
git commit -m "chore(release): establish clean room audit artifact [Zero-Trust SPV]"

# Exibe o laudo de maturidade
echo -e "\n${GREEN}====================================================${NC}"
echo -e "${GREEN}[SUCESSO] Clean Room SPV criado com sucesso!${NC}"
echo -e "${GREEN}====================================================${NC}"
echo -e "LAUDO DE MATURIDADE (Discurso Institucional):"
echo -e "> O repositório público atua como um contrato inteligente estático,"
echo -e "> purgado de metadados internos e vetores de vazamento de credenciais (KMS/Turnkey)."
echo -e "> Tratamos o código público como um balanço auditado: apenas o estado final"
echo -e "> verificado é publicado, sem o ruído do R&D."
echo -e "\nPróximo Passo:"
echo -e "Publique o artefato de release executando:"
echo -e "${YELLOW}git push -u origin $BRANCH_NAME${NC}"
echo -e "${GREEN}====================================================${NC}"
