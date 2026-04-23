# Page Design — Home (Hero Slider por Scroll)

## Layout
- Base desktop-first.
- Hero com **trilho vertical** (seção alta, ex.: `~300vh`) e **viewport sticky** (`top: 0; height: 100vh`) para manter o canvas fixo enquanto você rola.
- Grid principal do Hero: **CSS Grid 12 colunas** (no `lg`), com copy à esquerda e canvas à direita; no mobile vira coluna única com reordenação.
- Espaçamento: ritmo editorial (gaps grandes), bordas suaves, overlays com transparência.

## Meta Information
- Title: “MIND Protocol — Solana is now the A2A Settlement Layer”
- Description: “Landing page com demonstração scroll-driven do Hero e CTAs para explorar o registry e publicar Agent Cards.”
- Open Graph: imagem/preview deve refletir o frame inicial do pack (frame_0001) para consistência visual.

## Global Styles (tokens práticos)
- Background: `#000` / zinc-950; ruído sutil no container.
- Texto primário: branco; secundário: zinc-400/500.
- Tipografia: mono/uppercase (títulos) + fonte leve (parágrafos).
- Botões: pill/rounded-full; primário branco; secundário outline com blur e fundo translúcido.
- Badges: outline, uppercase, tracking alto.

## Page Structure
1. Header overlay (nav) acima do Hero.
2. **Hero Slider (prioridade máxima)**: copy + canvas; indicador de scroll.
3. Conteúdo pós-hero (seções seguintes) continua em scroll normal.

## Sections & Components

### 1) Hero Slider (Scroll-Scrub com frames)
- Container: `section#hero` com altura expandida (trilho).
- Sticky viewport: wrapper `sticky` com `overflow-hidden`.
- **Canvas** (layer base): `<canvas class="absolute inset-0 w-full h-full" />` desenhando frames.
- **Pack de frames**: arquivos em `/frames/<pack>/frame_0001.jpg...` (gerados via FFmpeg).
- Lógica de scrub:
  - Mapear o scroll do trilho para progresso `p∈[0,1]` e selecionar `idx = round(p*(N-1))`.
  - Suportar **scroll down e scroll up** (reversível) mantendo correspondência 1:1 com o progresso.
  - Renderizar com `requestAnimationFrame` para evitar jank.
- Carregamento:
  - Overlay “Loading Frames” até o primeiro frame estar pronto.
  - Preload progressivo (priorizar frame 0 e amostrar o restante) para acelerar primeiro paint.
- Copy (layer superior):
  - Badge + H1 com tratamento “metallic” e variação sutil com progresso.
  - **Fade-out** da copy no início do scrub (ex.: p 0→0.3) para priorizar o visual.
- CTAs:
  - Primário: “Publish Agent Card”.
  - Secundário: “Explore Registry”.
- Acessibilidade:
  - `prefers-reduced-motion`: mostrar apenas frame estático (sem scrub).

### 2) Indicador de Scroll
- Posicionado no rodapé do sticky viewport.
- Texto “Scroll Down” + ícone; animação vertical suave.
- Clique rola para a próxima seção (âncora).

## Responsivo
- `lg+`: grid 12 col, copy esquerda / canvas direita.
- `<lg`: empilhar; manter canvas com altura clampada para legibilidade e performance.

## Transições
- Transições longas e discretas (700–1000ms) para loading/fade; sem efeitos que alterem a identidade atual.