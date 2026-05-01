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
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Protocolo nativo para a nova Economia Agêntica.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Liquidação Solana-first via nanopagamentos x402.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Execução Zero-Trust sem depender de confiança humana.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Transformando código em Ativos de Rendimento Contínuo.</li>
      </ul>
    ),
    step: "Intro",
    icon: FingerprintBot,
    bgEffect: "radial-gradient(800px circle at 50% 50%, rgba(255,255,255,0.06), transparent 60%)",
    metallicClass: "metallic-brushed-solana"
  },
  {
    title: "1. O Problema",
    content: (
      <ul className="space-y-4 list-none pl-0">
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Assinaturas SaaS (Web2) não servem para robôs autônomos.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Falta infraestrutura para compra e venda direta entre IAs.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Preço fixo ignora a eficiência e o lucro real gerado.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> É impossível auditar publicamente o impacto financeiro da IA.</li>
      </ul>
    ),
    step: "Problema",
    icon: Layers,
    bgEffect: "radial-gradient(600px circle at 10% 10%, rgba(255,255,255,0.05), transparent 70%)",
    metallicClass: "metallic-brushed-solana"
  },
  {
    title: "2. A Solução (PMF)",
    content: (
      <ul className="space-y-4 list-none pl-0">
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> PMF Validado: Skills viram Yield-Bearing Assets on-chain.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Telemetria A2A: Registramos cada milissegundo de execução.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Preço Dinâmico: Custo é ajustado pelo lucro real entregue.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Solana-first: Robôs pagam robôs atomicamente em 400ms.</li>
      </ul>
    ),
    step: "Solução",
    icon: Cpu,
    bgEffect: "radial-gradient(700px circle at 90% 90%, rgba(255,255,255,0.04), transparent 80%)",
    metallicClass: "metallic-brushed-solana"
  },
  {
    title: "3. Mercado (TAM & SOM)",
    content: (
      <ul className="space-y-4 list-none pl-0">
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> TAM: Economia Agêntica global projetada em US$ 50 Bilhões.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> SAM: Intersecção Crypto x AI e ecossistema DeFi na Solana.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> SOM: +10.000 builders ativos nas trilhas do Colosseum/Frontier.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Foco inicial: Infraestrutura nativa para hackathons e Bounties.</li>
      </ul>
    ),
    step: "Mercado",
    icon: Terminal,
    bgEffect: "radial-gradient(900px circle at 80% 20%, rgba(255,255,255,0.05), transparent 50%)",
    metallicClass: "metallic-brushed-solana"
  },
  {
    title: "4. Vantagem Injusta",
    content: (
      <ul className="space-y-4 list-none pl-0">
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Construído 100% na Solana para nanopagamentos atômicos.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Mindprints: Sistema proprietário de auditoria e telemetria.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Alinhamento Frontier: Arquitetura desenhada para escala institucional.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Blue Ocean: Única infraestrutura nativa de liquidação A2A.</li>
      </ul>
    ),
    step: "Diferencial",
    icon: FingerprintBot,
    bgEffect: "radial-gradient(700px circle at 20% 80%, rgba(255,255,255,0.06), transparent 60%)",
    metallicClass: "metallic-brushed-solana"
  },
  {
    title: "5. Go-to-Market (GTM)",
    content: (
      <ul className="space-y-4 list-none pl-0">
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> A2A SEO: Robôs encontram skills organicamente via JSON-LD.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Tração acelerada via Colosseum Frontier, Hackathons e The Garage.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Integração direta com GitHub para registro imutável on-chain.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Chat UI Onboarding converte desenvolvedores em segundos.</li>
      </ul>
    ),
    step: "GTM",
    icon: Layers,
    bgEffect: "radial-gradient(800px circle at 50% 20%, rgba(255,255,255,0.05), transparent 60%)",
    metallicClass: "metallic-brushed-solana"
  },
  {
    title: "6. Modelo de Negócios",
    content: (
      <ul className="space-y-4 list-none pl-0">
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Taxa Base + Porcentagem sobre o Lucro Real Gerado (Yield).</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Split Automático 92/8 garantido via smart contracts.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> <strong className="text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">92%</strong> direto para a carteira do criador da ferramenta.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> <strong className="text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">8%</strong> financia a segurança e expansão do protocolo MIND.</li>
      </ul>
    ),
    step: "Receita",
    icon: Cpu,
    bgEffect: "radial-gradient(700px circle at 80% 50%, rgba(255,255,255,0.05), transparent 60%)",
    metallicClass: "metallic-brushed-solana"
  },
  {
    title: "7. Tração e Métricas",
    content: (
      <ul className="space-y-4 list-none pl-0">
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Dashboard ao vivo rastreando mercado secundário A2A.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Volume total de lucro financeiro (USDC) gerado na rede.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Ciclos de processamento (Compute) poupados no mundo real.</li>
        <li className="flex items-start gap-3"><span className="text-zinc-500 mt-1">-</span> Total de carteiras recebendo royalties a cada execução.</li>
      </ul>
    ),
    step: "Métricas",
    icon: Layers,
    bgEffect: "radial-gradient(900px circle at 50% 80%, rgba(255,255,255,0.06), transparent 50%)",
    metallicClass: "metallic-brushed-solana"
  },
  {
    title: "A Nova Economia Começou",
    subtitle: "Construa sua primeira máquina de rendimento",
    content: (
      <div className="text-center">
        Explore nosso painel de telemetria ou converse com o Hermes para publicar sua primeira ferramenta A2A.
      </div>
    ),
    step: "CTA",
    isCta: true,
    icon: Terminal,
    bgEffect: "radial-gradient(1000px circle at 50% 50%, rgba(255,255,255,0.08), transparent 70%)",
    metallicClass: "metallic-brushed-solana"
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
              {/* Card Container with Glassmorphism and Metallic Premium styling */}
              <div className={`p-12 md:p-16 border border-white/20 bg-[#0a0a0a]/90 backdrop-blur-xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] overflow-hidden relative group metallic-brushed metallic-shine rounded-2xl transition-colors duration-700 ${currentSlide.metallicClass || 'metallic-brushed-sapphire'}`}>
                
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
                <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-white/20 opacity-50 rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/20 opacity-50 rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-white/20 opacity-50 rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-white/20 opacity-50 rounded-br-2xl" />
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
