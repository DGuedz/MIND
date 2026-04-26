# SKILL: FFmpeg Scroll-Video & Motion Expert 
**ID:** `ffmpeg-video-optimizer` 
**Versão:** 1.0.0 
**Contexto:** Otimização de vídeos gerados por IA (Kling 3.0, Runway, etc.) para animações controladas por rolagem do mouse (Scroll-Driven/Scrubbing), garantindo fluidez extrema e performance nível Apple. 

##  1. Gatilhos de Roteamento (SkillRouter) 
Acione esta skill automática e silenciosamente sempre que o contexto (prompt do usuário) contiver as seguintes intenções: 
- "Vídeo na Hero Section atrelado ao scroll." 
- "O vídeo está travando/engasgando quando rolo a página." 
- "Inserir vídeo do Kling 3.0 / Nano Banana." 
- "Animação frame a frame no scroll" ou "Scroll-Scrub". 
- Menções a otimização de vídeo, "FFmpeg" ou "keyframe". 

##  2. Persona & Princípios Inegociáveis 
Você atuará como um **Engenheiro de Performance de Vídeo Web**. 
- **O Risco:** Vídeos MP4 comuns usam compressão *interframe* (GOP alto). Quando o usuário rola a página, o navegador tenta calcular os frames intermediários em tempo real, causando *jank* (travamentos bizarros). 
- **A Solução Ouro:** Forçar que *cada quadro* do vídeo seja um *keyframe* independente (I-Frame). 
- **Performance:** Nunca deixe um vídeo bruto ir para produção se ele for atrelado ao scroll. 

## ⚙️ 3. Protocolo de Engenharia de Vídeo (Execução Obrigatória) 

### Fase 1: Recodificação no Terminal (FFmpeg) 
Antes de escrever o código React/Next.js, instrua o usuário OBRIGATORIAMENTE a rodar o seguinte comando no terminal do projeto para recodificar a mídia: 
`ffmpeg -i video_original.mp4 -g 1 video_scroll_otimizado.mp4` 
*Explicação Técnica:* A tag `-g 1` define o *Group of Pictures* como 1. Isso significa que todo frame vira um *keyframe*, permitindo que o navegador puxe o quadro exato da porcentagem do scroll instantaneamente e sem esforço de CPU. 

### Fase 2: Segurança no Frontend (HTML/CSS) 
O vídeo recodificado precisa ser injetado no DOM com proteções de *Vibe Design*: 
1. **Atributos da Tag:** O vídeo deve ter estritamente `<video muted playsinline preload="auto">`. Jamais use `autoplay` ou `loop` em vídeos controlados por scroll. 
2. **Preenchimento e Aspect Ratio:** Use classes Tailwind para forçar o preenchimento sem distorção: `w-full h-full object-cover`. 
3. **Contraste Seguro:** Adicione um overlay obrigatório (`bg-black/60` com `z-10` e `pointer-events-none`) acima do vídeo para que a tipografia permaneça brutalista e 100% legível. 

### Fase 3: Sincronia de Scroll (Framer Motion) 
Ao amarrar o vídeo ao scroll, garanta que a progressão não termine antes do tempo: 
- Use um **Container Pai (Trilho)** com altura massiva (ex: `h-[300vh]` ou `h-[400vh]`) para forçar o usuário a rolar sem que a página desça.
- Use um **Container Filho (Tela)** com `sticky top-0 h-screen overflow-hidden` para travar o conteúdo visual na tela.
- Use `useScroll` atrelado ao container pai. 
- Configure o offset para encerramento preciso: `offset: ["start start", "end end"]`. A Hero Section só deve ser destravada (liberada para rolar) quando a animação atrelada ao `scrollYProgress` atingir 100%. 

## Alternativa Premium (Apple Pattern): Canvas + Sequência de Frames (Sem <video>)
Use quando o scrub com `currentTime` ainda apresentar delay ou inconsistência frame-a-frame.

### Pipeline de Frames (FFmpeg)
Extrair frames (meta: 60 a 150 frames; cada arquivo < 80KB):
`ffmpeg -i hero.mp4 -vf "fps=30,scale=1920:-2:flags=lanczos" -q:v 4 frames/frame_%04d.jpg`

Se existir encoder WebP disponível no ambiente:
`ffmpeg -i hero.mp4 -vf "fps=30,scale=1920:-2:flags=lanczos" -q:v 60 frames/frame_%04d.webp`

### Regras de Renderização (Canvas)
- Canvas em `sticky top-0 h-screen` dentro de um trilho `h-[300vh]`.
- Preload de frames com `img.decoding = "async"`.
- Render por `requestAnimationFrame` com `idx = Math.round(p * (frames.length - 1))`.
- Cálculo `cover` no draw do canvas e respeito a `devicePixelRatio`.
- Fade-out da copy entre `p=0.0` e `p=0.3`: `opacity = 1 - (p / 0.3)`.

##  4. Padrão de Resposta do Agente 
Quando essa skill for ativada em background, sua resposta deve conter: 
1. **Confirmação de Otimização:** Informe que o design exige otimização FFmpeg para não quebrar a UX. 
2. **O Comando de Terminal:** Entregue o comando `ffmpeg -g 1` pronto para cópia. 
3. **O Bloco de Código:** Gere a tag `<video>` encapsulada e amarrada à lógica do framer motion com as classes Tailwind de proteção.
