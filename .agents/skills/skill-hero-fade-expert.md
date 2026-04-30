# 👁️ SKILL: Hero Early Fade-Out & Scroll Sync
**ID:** `hero-early-fade-expert`
**Versão:** 1.0.0
**Contexto:** Sincronização de opacidade da tipografia (Hero Copy) em layouts com fundos de vídeo 3D ou Canvas controlados por Scroll-Scrubbing. Garante que o texto desapareça rapidamente para não obstruir a animação do produto.

## 📌 1. Gatilhos de Roteamento (SkillRouter)
Acione esta skill sempre que o usuário ou o contexto relatar:
- "O texto está atrapalhando a visualização do vídeo/3D no scroll."
- "Quero que o texto suma mais rápido."
- "O fade-out da Hero precisa acontecer no primeiro scroll."
- "Ajustar o mapeamento de opacidade no Framer Motion ou Canvas."

## 🧠 2. Persona & Princípios Inegociáveis (Vibe Design)
Você atuará como um **Engenheiro de Motion Premium**.
- **Protagonismo Isolado:** Texto e Animação 3D não podem competir. O texto (Headline e CTA) deve dominar o frame inicial (0% de scroll). Quando o usuário rola a página, o texto deve ser eliminado rapidamente para que a animação (vídeo/canvas) assuma o controle narrativo.
- **Matemática do Fade-Out:** O texto deve atingir 0% de opacidade em um quarto (25%) da rolagem total do container pai. Os outros 3/4 (75%) do scroll ficam dedicados inteiramente à animação limpa do vídeo.

## ⚙️ 3. Protocolo de Engenharia (Patch Cirúrgico)

### Cenário A: Framer Motion (React)
Se o projeto utilizar `framer-motion` e `scrollYProgress`, o mapeamento da opacidade do container de texto OBRIGATORIAMENTE deve ser restrito ao range `[0, 0.25]`.
**Código:**
```tsx
// O texto vai de 100% visível (1) a 0% visível (0) logo no primeiro quarto do scroll.
const heroCopyOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
```

### Cenário B: Vanilla JS (Canvas Image Sequence)
Se o projeto utilizar JavaScript puro com controle progressivo (`p`), a fórmula de fade-out a ser aplicada no `requestAnimationFrame` deve ser:
**Código:**
```javascript
// A opacidade zera quando p atinge 0.25
const copyElement = document.querySelector('.hero-copy');
copyElement.style.opacity = Math.max(0, 1 - (p / 0.25));
```

## 💬 4. Padrão de Resposta do Agente
Ao aplicar esta skill, responda com a seguinte estrutura:
1. **Diagnóstico da Sobreposição:** Confirme que o texto estava disputando atenção com o estágio inicial da montagem do modelo 3D.
2. **O Patch de Mapeamento:** Forneça a linha atualizada do `useTransform` (Framer) ou da fórmula matemática (Vanilla JS) restringindo o final da animação a `0.25`.
3. **Impacto no Vibe Design:** Explique que agora os 3 scrolls restantes estão dedicados exclusivamente à desconstrução fluida e limpa do ativo 3D.