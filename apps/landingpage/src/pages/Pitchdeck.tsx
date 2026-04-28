import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";
import { ArrowRight, ArrowLeft, ChevronRight, Terminal, Layers, Cpu } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Componente Customizado SVG: FingerprintBot
const FingerprintBot = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Core Robot Eye/Chip */}
    <rect x="9" y="8" width="6" height="8" rx="1" />
    <path d="M12 11v2" />
    {/* Digital Connection Nodes */}
    <path d="M12 3v5" />
    <path d="M12 16v5" />
    <path d="M5 12h4" />
    <path d="M15 12h4" />
    {/* Surrounding Fingerprint/Radar Arcs */}
    <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 12 0c0 3 .5 6 1 7.5" />
    <path d="M2 12a10 10 0 0 1 20 0" />
  </svg>
);

const slides = [
  {
    title: "MIND Protocol",
    subtitle: "A Camada de Liquidação A2A",
    content: (
      <ul className="space-y-4 list-none pl-0">
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Apresentação baseada no modelo Lean Canvas.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Focada na economia de agentes.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Arquitetura <em className="not-italic text-white">Zero-Trust</em> para execução autônoma.</li>
      </ul>
    ),
    step: "Intro",
    icon: FingerprintBot,
    bgEffect: "radial-gradient(800px circle at 50% 50%, rgba(255,255,255,0.06), transparent 60%)"
  },
  {
    title: "1. O Problema",
    content: (
      <ul className="space-y-4 list-none pl-0">
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> <strong className="text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">50%</strong> do tráfego web já é originado por Agentes autonomos.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> <strong className="text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">37%</strong> dos sites bloqueiam agentes hoje.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> A economia A2A sofre com APIs fragmentadas.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Faltam trilhos nativos para monetização contínua.</li>
      </ul>
    ),
    step: "Lean Canvas",
    icon: Layers,
    bgEffect: "radial-gradient(600px circle at 10% 10%, rgba(255,255,255,0.05), transparent 70%)"
  },
  {
    title: "2. A Solução",
    content: (
      <ul className="space-y-4 list-none pl-0">
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Transformamos <strong className="text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">+100</strong> skills em <em className="not-italic text-white">Agent Cards</em>.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Padronizamos veículos de execução agêntica.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> O protocolo exige credenciais de identidade.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> <em className="not-italic text-white">Intent Firewall</em> checa regras e liquida na hora.</li>
      </ul>
    ),
    step: "Lean Canvas",
    icon: Cpu,
    bgEffect: "radial-gradient(700px circle at 90% 90%, rgba(255,255,255,0.04), transparent 80%)"
  },
  {
    title: "3. Proposta de Valor",
    content: (
      <ul className="space-y-4 list-none pl-0">
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Ferramentas soltas viram operações soberanas.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Operações A2A guiadas por segurança <em className="not-italic text-white">Zero-Trust</em>.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Liquidação atômica com latência <strong className="text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">&lt; 400ms</strong>.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Execução gera recibo imutável (<em className="not-italic text-white">Mindprint</em>/cNFT).</li>
      </ul>
    ),
    step: "Lean Canvas",
    icon: Terminal,
    bgEffect: "radial-gradient(900px circle at 80% 20%, rgba(255,255,255,0.05), transparent 50%)"
  },
  {
    title: "4. Vantagem Injusta",
    content: (
      <ul className="space-y-4 list-none pl-0">
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Arquitetura <em className="not-italic text-white">Solana-first</em> projetada para escala.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Rede robusta: <strong className="text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">100%</strong> de uptime nos últimos <strong className="text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">16 meses</strong>.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> <strong className="text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">US$ 1 bilhão</strong> em receita de apps por trimestre.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Infraestrutura perfeita para nanopagamentos x402.</li>
      </ul>
    ),
    step: "Lean Canvas",
    icon: FingerprintBot,
    bgEffect: "radial-gradient(700px circle at 20% 80%, rgba(255,255,255,0.06), transparent 60%)"
  },
  {
    title: "5. Segmentos de Clientes",
    content: (
      <ul className="space-y-4 list-none pl-0">
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Foco nos <strong className="text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">+3.200 devs ativos</strong> ao mês na Solana.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Carteiras de autocustódia como a Solflare.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Base de <strong className="text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">+4 milhões</strong> de usuários ativados.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Facilidade de delegação através de <em className="not-italic text-white">Session Keys</em>.</li>
      </ul>
    ),
    step: "Lean Canvas",
    icon: Layers,
    bgEffect: "radial-gradient(800px circle at 50% 20%, rgba(255,255,255,0.05), transparent 60%)"
  },
  {
    title: "6. Canais de Distribuição",
    content: (
      <ul className="space-y-4 list-none pl-0">
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> GitHub como vitrine e garagem de descoberta A2A.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Sinergia com plataformas como o ClawHub.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Demanda validada com <strong className="text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">180 mil</strong> usuários ativos.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> <strong className="text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">12 milhões</strong> de downloads de ferramentas IA.</li>
      </ul>
    ),
    step: "Lean Canvas",
    icon: Terminal,
    bgEffect: "radial-gradient(600px circle at 20% 50%, rgba(255,255,255,0.04), transparent 70%)"
  },
  {
    title: "7. Estrutura de Receitas",
    content: (
      <ul className="space-y-4 list-none pl-0">
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> <em className="not-italic text-white">Atomic Settlement</em> puro sem escrows complexos.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Viabiliza nanopagamentos menores que <strong className="text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">US$ 0,05</strong>.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Split automático: <strong className="text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">92%</strong> vai direto para o dev.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Take rate: <strong className="text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">8%</strong> de pedágio vai para o protocolo.</li>
      </ul>
    ),
    step: "Lean Canvas",
    icon: Cpu,
    bgEffect: "radial-gradient(700px circle at 80% 50%, rgba(255,255,255,0.05), transparent 60%)"
  },
  {
    title: "8. Métricas-Chave",
    content: (
      <ul className="space-y-4 list-none pl-0">
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Quantidade de <em className="not-italic text-white">Agent Cards</em> listados e ativos.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Volume financeiro (TPV) processado em USDC.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Total de <em className="not-italic text-white">Mindprints</em> (cNFTs) emitidos on-chain.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Validação constante de operações M2M.</li>
      </ul>
    ),
    step: "Lean Canvas",
    icon: Layers,
    bgEffect: "radial-gradient(900px circle at 50% 80%, rgba(255,255,255,0.06), transparent 50%)"
  },
  {
    title: "Pronto para Operar?",
    subtitle: "Inicie a Liquidação Atômica",
    content: (
      <div className="text-center">
        Acesse nosso Marketplace de Agentes ou registre-se como um Builder para implantar seus próprios <em className="not-italic text-white">Agent Cards</em>.
      </div>
    ),
    step: "CTA",
    isCta: true,
    icon: Terminal,
    bgEffect: "radial-gradient(1000px circle at 50% 50%, rgba(255,255,255,0.08), transparent 70%)"
  }
];

export function PitchdeckPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse Tracking for Parallax & Glow
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
  
  // Light 3D effects (reduced from [10, -10] to [4, -4])
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [4, -4]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-4, 4]), springConfig);
  
  const mouseGlowX = useSpring(mouseX, { damping: 40, stiffness: 200 });
  const mouseGlowY = useSpring(mouseY, { damping: 40, stiffness: 200 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      
      // Normalize mouse coordinates between -0.5 and 0.5
      const normX = (e.clientX - rect.left) / rect.width - 0.5;
      const normY = (e.clientY - rect.top) / rect.height - 0.5;
      
      mouseX.set(normX);
      mouseY.set(normY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex]);

  const nextSlide = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const currentSlide = slides[currentIndex];
  const Icon = currentSlide.icon;

  return (
    <div 
      ref={containerRef}
      className="min-h-screen pt-32 pb-16 px-6 flex flex-col items-center justify-center relative overflow-hidden bg-zinc-950 text-white"
      style={{ perspective: "1500px" }}
    >
      {/* Dynamic Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Slide-Specific Dynamic Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${currentIndex}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 pointer-events-none z-0"
          style={{ background: currentSlide.bgEffect }}
        />
      </AnimatePresence>

      {/* Global Mouse Tracking Glow Overlay */}
      <motion.div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: useMotionTemplate`radial-gradient(800px circle at ${useTransform(mouseGlowX, x => (x + 0.5) * 100)}% ${useTransform(mouseGlowY, y => (y + 0.5) * 100)}%, rgba(255,255,255,0.03), transparent 40%)`
        }}
      />

      <div className="w-full max-w-5xl relative z-10 h-full flex flex-col justify-between">
        
        {/* Top HUD Navigation */}
        <div className="flex justify-between items-center mb-8 relative z-20">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-300 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
              SYS_PITCHDECK_V1 <span className="text-zinc-500">|</span> {currentSlide.step}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-[10px] font-mono text-zinc-300 tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
              {(currentIndex + 1).toString().padStart(2, '0')} / {slides.length.toString().padStart(2, '0')}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={prevSlide}
                disabled={currentIndex === 0}
                className="p-2 rounded border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-500 hover:bg-zinc-900 disabled:opacity-20 disabled:hover:border-zinc-800 disabled:hover:bg-transparent hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all"
              >
                <ArrowLeft className="w-3 h-3 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" />
              </button>
              <button 
                onClick={nextSlide}
                disabled={currentIndex === slides.length - 1}
                className="p-2 rounded border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-500 hover:bg-zinc-900 disabled:opacity-20 disabled:hover:border-zinc-800 disabled:hover:bg-transparent hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all"
              >
                <ArrowRight className="w-3 h-3 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" />
              </button>
            </div>
          </div>
        </div>

        {/* 3D Main Slide Card */}
        <div className="flex-1 flex items-center justify-center py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95, z: -100 }}
              animate={{ opacity: 1, scale: 1, z: 0 }}
              exit={{ opacity: 0, scale: 1.05, z: 100 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
              className="w-full relative"
            >
              {/* Card Container with Glassmorphism */}
              <div className="p-12 md:p-16 border border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative group">
                
                {/* Inner Glow corresponding to mouse */}
                <motion.div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: useMotionTemplate`radial-gradient(600px circle at ${useTransform(mouseGlowX, x => (x + 0.5) * 100)}% ${useTransform(mouseGlowY, y => (y + 0.5) * 100)}%, rgba(255,255,255,0.03), transparent 60%)`
                  }}
                />

                {/* Floating Elements (TranslateZ creates 3D depth) */}
                <div style={{ transform: "translateZ(50px)", transformStyle: "preserve-3d" }}>
                  <div className="flex items-start justify-between mb-8">
                    {currentSlide.subtitle && (
                      <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-[0.3em] border border-zinc-800 px-3 py-1 bg-zinc-900/50 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] group-hover:text-zinc-300 group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.5)] transition-all duration-500">
                        {currentSlide.subtitle}
                      </div>
                    )}
                    <Icon className="w-6 h-6 text-zinc-300 opacity-80 drop-shadow-[0_0_12px_rgba(255,255,255,0.6)] group-hover:text-white group-hover:opacity-100 group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,1)] transition-all duration-500" />
                  </div>
                  
                  <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] group-hover:drop-shadow-[0_0_25px_rgba(255,255,255,0.8)] transition-all duration-500"
                    style={{ transform: "translateZ(80px)" }}
                  >
                    {currentSlide.title}
                  </motion.h2>
                  
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="text-xl md:text-2xl text-zinc-300 leading-relaxed font-light max-w-3xl drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] group-hover:text-zinc-100 group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] transition-all duration-500"
                    style={{ transform: "translateZ(40px)" }}
                  >
                    {currentSlide.content}
                  </motion.div>

                  {/* Call to Action Buttons */}
                  {currentSlide.isCta && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.5 }}
                      className="mt-16 flex flex-col sm:flex-row gap-6"
                      style={{ transform: "translateZ(60px)" }}
                    >
                      <button 
                        onClick={() => navigate("/marketplace")}
                        className="px-8 py-4 bg-white text-black font-mono uppercase tracking-[0.2em] text-[10px] font-bold hover:bg-zinc-200 shadow-[0_0_15px_rgba(255,255,255,0.6)] hover:shadow-[0_0_25px_rgba(255,255,255,0.9)] transition-all flex items-center justify-center gap-3"
                      >
                        Marketplace <ChevronRight className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => navigate("/contribute")}
                        className="px-8 py-4 border border-zinc-700 bg-zinc-900/50 text-zinc-200 font-mono uppercase tracking-[0.2em] text-[10px] hover:bg-zinc-800 hover:text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] transition-all flex items-center justify-center gap-3"
                      >
                        Builders Terminal <Terminal className="w-4 h-4 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* Decorative Tech Corner Marks */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-zinc-700 opacity-50" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-zinc-700 opacity-50" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-zinc-700 opacity-50" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-zinc-700 opacity-50" />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Progress Bar HUD */}
        <div className="mt-8 relative z-20">
          <div className="w-full h-[2px] bg-zinc-900 overflow-hidden relative">
            <motion.div 
              className="absolute top-0 left-0 h-full bg-white shadow-[0_0_15px_rgba(255,255,255,1)]"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-4">
            <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-zinc-400 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
              VSC_COMPLIANT
            </span>
            <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-zinc-400 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
              MIND_NETWORK
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
