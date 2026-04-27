import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
// Removido import do QRCode para evitar problemas de build, substituído por um placeholder SVG estilizado
import { Link } from 'react-router-dom';

export const TheGaragePage: React.FC = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans flex items-center justify-center p-4 pt-20">
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative max-w-4xl w-full"
      >
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 shadow-[0_0_40px_rgba(0,0,0,0.8)] relative overflow-hidden">
          {/* Noise overlay */}
          <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            
            {/* Left: Message */}
            <div className="space-y-6 transform-gpu" style={{ transform: "translateZ(30px)" }}>
              <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono uppercase tracking-widest text-emerald-400 mb-2">
                Exclusive Alpha
              </div>
              
              <h1 className="text-3xl md:text-5xl font-light text-white tracking-tight">
                Fala galera da Superteam BR!
              </h1>
              <p className="text-emerald-500/80 font-mono text-sm tracking-widest uppercase">
                Direto do The Garage (Solana House, SP)
              </p>

              <div className="space-y-4 text-sm leading-relaxed text-zinc-400 font-light border-l border-white/10 pl-4 mt-6">
                <p>
                  Aqui é o DGuedz. Passando pra liberar um alpha exclusivo pra nossa comunidade local.
                </p>
                <p>
                  Nós do <strong className="text-white font-medium">MIND Protocol</strong> criamos a infraestrutura (estradas) para a Agent Economy na Solana (Zero-Trust, x402). Mas quem constrói a inteligência (os carros) são VOCÊS.
                </p>
                <p>
                  Pra provar nosso PMF e inicializar o ecossistema com os melhores builders, acabamos de plugar um sistema de Voucher no nosso Marketplace global.
                </p>
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <h3 className="text-white font-medium mb-2">🎁 O QUE TEM PRA VOCÊS:</h3>
                  <p className="text-xs">
                    Acessem o Marketplace, escolham qualquer Skill Premium e no checkout digitem <strong className="text-emerald-400 font-mono">THEGARAGE</strong> ou <strong className="text-emerald-400 font-mono">SUPERTEAMBR</strong>. 100% de subsídio do protocolo. O botão muda de "Pay" pra "Claim Free" e entrega o comando CLI na hora.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: QR Code & Actions */}
            <div className="flex flex-col items-center justify-center space-y-8 transform-gpu" style={{ transform: "translateZ(50px)" }}>
              
              <div className="relative p-6 bg-white rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center justify-center w-[240px] h-[240px]">
                {/* Stylized QR Code Placeholder - Representing the marketplace link */}
                <div className="grid grid-cols-5 grid-rows-5 gap-1 w-full h-full">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`bg-black rounded-sm ${[0, 4, 20, 24].includes(i) ? 'scale-150 rounded-md' : Math.random() > 0.4 ? 'opacity-100' : 'opacity-0'}`}
                    />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white p-2 rounded-lg">
                    <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">MIND</span>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 rounded-full text-[10px] font-mono tracking-widest border border-white/20 whitespace-nowrap">
                  SCAN TO CLAIM
                </div>
              </div>

              <div className="w-full space-y-3 mt-8">
                <Link to="/marketplace" className="block w-full">
                  <button className="w-full py-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono text-xs uppercase tracking-[0.2em] rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]">
                    Go to Marketplace
                  </button>
                </Link>
                <a href="https://github.com/DGuedz/MIND/tree/main/agent-cards" target="_blank" rel="noreferrer" className="block w-full">
                  <button className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-mono text-xs uppercase tracking-[0.2em] rounded-xl transition-all duration-300">
                    Tokenize Your Skill
                  </button>
                </a>
              </div>

            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
};
