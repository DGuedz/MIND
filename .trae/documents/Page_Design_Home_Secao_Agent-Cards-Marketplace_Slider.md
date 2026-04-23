# Page Design — Home (Seção “Agent Cards Marketplace”)

## Layout
- Abordagem desktop-first com container central e grade consistente com a Home atual.
- Layout híbrido: Grid para estrutura macro (título/controles/conteúdo) e Flexbox para trilho horizontal de verticais.
- Espaçamento por múltiplos fixos (ex.: 4/8/12/16/24/32) alinhados ao ritmo visual atual.

## Meta Information
- Title: “Home” (manter padrão atual)
- Description: manter padrão atual
- Open Graph: manter padrão atual (sem novos assets)

## Global Styles
- Tipografia: monoespaçada (manter família atual; hierarquia com variação de peso/tamanho, não com ícones).
- Paleta: alto contraste e cores atuais (não introduzir nova paleta).
- Componentes: bordas marcadas, cantos preferencialmente retos, separadores visíveis.
- Botões/links: estados de hover/focus com sublinhado, inversão de contraste ou outline; sem ícones.

## Page Structure (Home)
- Mantém composição existente da Home.
- Substitui apenas a experiência interna da seção “Agent Cards Marketplace” para: cabeçalho + trilho de verticais + área de cards.

## Sections & Components

### 1) Seção “Agent Cards Marketplace” (container)
- Bloco com título e descrição (se já existir) preservados.
- Borda/grade e espaçamentos idênticos ao padrão das demais seções da Home.

### 2) Cabeçalho da seção
- Esquerda: Título “Agent Cards Marketplace”.
- Direita: Controles do slider (texto).
  - Botão “Anterior” e “Próximo” (texto, sem setas).
  - Indicador textual opcional “Vertical X de Y” (apenas texto).

### 3) Trilho de verticais (slider)
- Lista horizontal rolável com nomes das verticais em texto.
- Item selecionado:
  - Estilo de seleção por underline forte, inversão de fundo, ou outline (escolher o padrão já usado no site).
- Interações:
  - Clique para selecionar vertical.
  - Navegação por teclado: Tab entre itens; Enter/Espaço seleciona (foco visível e contrastante).

### 4) Área de conteúdo — Agent Cards por vertical
- Região que mostra os Agent Cards correspondentes à vertical selecionada.
- Layout recomendado:
  - Desktop: grid de cards (2–4 colunas conforme largura disponível), mantendo dimensões e tipografia atuais.
  - Os cards preservam a identidade atual e não introduzem ícones.

### 5) Responsividade (essencial)
- Desktop: trilho de verticais com rolagem horizontal se necessário.
- Tablet: reduzir colunas do grid de cards.
- Mobile: trilho de verticais com snap/scroll e cards em 1 coluna (sem alterar a linguagem visual).

### 6) Estados e acessibilidade (essencial)
- Foco visível em todos os controles e itens de vertical.
- Sem dependência de ícones para comunicar estado; usar texto/contraste/underline.
- Alvos de clique confortáveis para itens de vertical e botões textuais.
