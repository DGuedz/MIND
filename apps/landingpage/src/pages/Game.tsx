import { useState, useEffect, useRef } from 'react';

// Tipagem global para o SDK do Telegram
declare global {
  interface Window {
    Telegram: any;
  }
}

export function GamePage() {
  const [totalXp, setTotalXp] = useState(0);
  const [botPos, setBotPos] = useState({ top: 50, left: 50 });
  const [isActive, setIsActive] = useState(true);
  const xpQueue = useRef(0);
  const mevsQueue = useRef(0);
  
  // Telegram User Mock (caso rode fora do Telegram)
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() || "DEV_USER_" + Math.floor(Math.random() * 10000);
  const API_URL = import.meta.env.VITE_GAME_API_URL || "http://localhost:3010";

  // Inicializa o Telegram WebApp e busca dados iniciais
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.expand();
      window.Telegram.WebApp.setHeaderColor('#000000');
    }

    const initUser = async () => {
      try {
        const res = await fetch(`${API_URL}/v1/game/init`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telegram_id: tgUser, username: window.Telegram?.WebApp?.initDataUnsafe?.user?.username || "Commander" })
        });
        const data = await res.json();
        if (data.user) {
          setTotalXp(data.user.xp);
        }
      } catch (e) {
        console.warn("Backend not running, using local state");
      }
    };
    
    initUser();
    spawnBot();
  }, [tgUser, API_URL]);

  // Motor de Batching (Roda a cada 5 segundos)
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      if (xpQueue.current > 0) {
        const xpToSend = xpQueue.current;
        const mevsToSend = mevsQueue.current;
        
        // Limpa a fila otimisticamente
        xpQueue.current = 0;
        mevsQueue.current = 0;

        try {
          const res = await fetch(`${API_URL}/v1/game/sync-xp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              telegram_id: tgUser,
              xp_gained: xpToSend,
              mevs_destroyed: mevsToSend
            }),
          });
          const data = await res.json();
          if (data.user) {
            setTotalXp(data.user.xp); // Atualiza com o valor real do servidor
          }
        } catch (error) {
          // Se falhar, devolve para a fila
          xpQueue.current += xpToSend;
          mevsQueue.current += mevsToSend;
          console.error("Falha ao sincronizar, retentando no próximo batch...");
        }
      }
    }, 5000);

    return () => clearInterval(syncInterval);
  }, [tgUser, API_URL]);

  // Lógica de Spawn do MEV Bot
  const spawnBot = () => {
    const top = Math.floor(Math.random() * 80) + 10; // 10% a 90%
    const left = Math.floor(Math.random() * 80) + 10;
    setBotPos({ top, left });
    setIsActive(true);
  };

  // Ação de Tap
  const handleTap = () => {
    if (!isActive) return;
    
    // Haptic Feedback nativo do Telegram
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
    }

    setIsActive(false);
    xpQueue.current += 100;
    mevsQueue.current += 1;
    setTotalXp((prev) => prev + 100); // Atualização otimista na UI

    // Spawn instantâneo do próximo alvo
    setTimeout(spawnBot, 300);
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono p-4 flex flex-col select-none touch-none overflow-hidden">
      
      {/* HEADER BENTO BOX */}
      <div className="border border-white/20 p-4 rounded-2xl mb-4 flex justify-between items-center bg-zinc-950 shadow-lg">
        <div>
          <p className="text-[10px] text-white/50 tracking-widest uppercase mb-1">Guard Status</p>
          <h1 className="text-xl font-black tracking-tighter flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            ACTIVE
          </h1>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/50 tracking-widest uppercase mb-1">Total XP</p>
          <h2 className="text-3xl font-black text-emerald-400 tracking-tighter">{totalXp.toLocaleString()}</h2>
        </div>
      </div>

      {/* RADAR BENTO BOX (Área de Jogo) */}
      <div className="flex-1 border border-white/20 rounded-2xl bg-[#0a0a0a] relative overflow-hidden flex flex-col">
        <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur px-3 py-1.5 rounded-full border border-red-500/30">
          <p className="text-[10px] text-red-500 animate-pulse tracking-widest font-bold">⚠️ DESTROY MEV BOTS</p>
        </div>
        
        {/* Grid de Fundo do Radar */}
        <div className="absolute inset-0 opacity-10"
             style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>

        {/* Efeito de Scanner (Linha varrendo) */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-full w-full animate-[float_4s_ease-in-out_infinite]" />

        {/* O MEV BOT (Alvo) */}
        {isActive && (
          <button
            onClick={handleTap}
            style={{ top: `${botPos.top}%`, left: `${botPos.left}%` }}
            className="absolute w-20 h-20 bg-white rounded-full flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 active:scale-75 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.6)] z-20"
          >
            <div className="w-8 h-8 bg-black rounded-full" />
          </button>
        )}
      </div>

      {/* FOOTER BENTO BOX */}
      <div className="border border-white/20 p-4 rounded-2xl mt-4 bg-zinc-950 flex items-center justify-between">
        <p className="text-xs text-white/40 tracking-widest uppercase">
          SYNC STATUS
        </p>
        <div className={`text-xs font-bold tracking-widest px-2 py-1 rounded ${xpQueue.current > 0 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
          {xpQueue.current > 0 ? 'PENDING BATCH' : 'SECURED'}
        </div>
      </div>

    </div>
  );
}