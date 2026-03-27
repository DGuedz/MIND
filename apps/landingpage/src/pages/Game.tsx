import { useState, useEffect, useRef } from "react";
import { Zap, ShieldAlert, Gift, Send, Settings, Box } from "lucide-react";

interface MevTarget {
  id: number;
  x: number;
  y: number;
  size: number;
  createdAt: number;
}

export function GamePage() {
  const [xp, setXp] = useState(0);
  const [mevsDestroyed, setMevsDestroyed] = useState(0);
  const [targets, setTargets] = useState<MevTarget[]>([]);
  const [userId] = useState<string>("telegram_demo_user_" + Math.floor(Math.random() * 10000));
  const [activeTab, setActiveTab] = useState<"earn" | "learn" | "fun" | "socials">("earn");
  
  const pendingSync = useRef({ xp: 0, mevs: 0 });

  // Backend URL config
  const API_URL = import.meta.env.VITE_GAME_API_URL || "http://localhost:3010";

  // Init user
  useEffect(() => {
    const initUser = async () => {
      try {
        const res = await fetch(`${API_URL}/v1/game/init`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telegram_id: userId, username: "Commander" })
        });
        const data = await res.json();
        if (data.user) {
          setXp(data.user.xp);
          setMevsDestroyed(data.user.mevs_destroyed);
        }
      } catch (e) {
        console.warn("Backend not running, using local state");
      }
    };
    initUser();
  }, [userId]);

  // Sync with backend every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (pendingSync.current.xp > 0 || pendingSync.current.mevs > 0) {
        const payload = {
          telegram_id: userId,
          xp_gained: pendingSync.current.xp,
          mevs_destroyed: pendingSync.current.mevs
        };
        pendingSync.current = { xp: 0, mevs: 0 };
        try {
          await fetch(`${API_URL}/v1/game/sync-xp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        } catch (e) {}
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  // Spawn MEVs ONLY if active tab is "earn"
  useEffect(() => {
    if (activeTab !== "earn") {
      setTargets([]);
      return;
    }

    const spawnInterval = setInterval(() => {
      if (Math.random() > 0.4) {
        const newTarget: MevTarget = {
          id: Date.now(),
          x: 15 + Math.random() * 70, // percentage
          y: 20 + Math.random() * 50, // percentage
          size: 60 + Math.random() * 40, // 60-100px (bigger for brutalist style)
          createdAt: Date.now()
        };
        setTargets(prev => [...prev, newTarget]);
      }
    }, 1200);

    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setTargets(prev => prev.filter(t => now - t.createdAt < 2000));
    }, 500);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(cleanupInterval);
    };
  }, [activeTab]);

  const handleTap = (id: number) => {
    setTargets(prev => prev.filter(t => t.id !== id));
    const xpGained = 100; // Brutalist numbers feel better when large
    setXp(prev => prev + xpGained);
    setMevsDestroyed(prev => prev + 1);
    
    pendingSync.current.xp += xpGained;
    pendingSync.current.mevs += 1;

    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
  };

  // Section Component
  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-2xl font-black uppercase tracking-tight mb-4">{children}</h2>
  );

  return (
    <div className="fixed inset-0 bg-black text-white font-sans overflow-y-auto overflow-x-hidden selection:bg-white/20 pb-28">
      
      {/* Background Effect to ensure it's not pure pitch black */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.03] via-black to-black -z-10 pointer-events-none" />

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <span className="font-bold tracking-tight text-lg">MIND</span>
        </div>
        <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* DYNAMIC CONTENT AREA */}
      <div className="p-4 space-y-12 mt-6">
        
        {/* EARN/PLAY SECTION (Bento Box Style) */}
        {activeTab === "earn" && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end mb-4">
              <SectionTitle>DEFEND</SectionTitle>
              <span className="text-3xl font-black tracking-tighter">${xp.toLocaleString()}</span>
            </div>

            <div className="relative w-full aspect-[4/3] bg-zinc-900 rounded-3xl border border-white/10 overflow-hidden mb-4">
              {/* Radar Grid Pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
              
              <div className="absolute top-4 left-4 z-10">
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Target</p>
                <p className="text-xl font-black">MEV Bots</p>
              </div>

              {/* Game Area */}
              {targets.map(target => (
                <button
                  key={target.id}
                  onClick={() => handleTap(target.id)}
                  className="absolute rounded-full flex items-center justify-center bg-white text-black animate-in zoom-in spin-in-12 duration-200 active:scale-90 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                  style={{
                    left: target.x + '%',
                    top: target.y + '%',
                    width: target.size,
                    height: target.size,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <Zap className="w-1/2 h-1/2 pointer-events-none" />
                </button>
              ))}

              {targets.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-zinc-500 font-medium animate-pulse">Scanning mempool...</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900 rounded-3xl border border-white/10 p-5">
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">Destroyed</p>
                <p className="text-2xl font-black">{mevsDestroyed}</p>
              </div>
              <div className="bg-zinc-900 rounded-3xl border border-white/10 p-5">
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">Status</p>
                <p className="text-2xl font-black text-green-400">SAFE</p>
              </div>
            </div>
          </section>
        )}

        {/* LEARN SECTION */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <SectionTitle>LEARN</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-900 rounded-3xl border border-white/10 p-6 flex flex-col justify-between aspect-square md:aspect-auto">
              <div>
                <h3 className="text-2xl font-black mb-1">What is MIND?</h3>
                <p className="text-zinc-400 font-medium">Intro</p>
              </div>
              <div className="self-end mt-8">
                {/* Abstract Graphic Placeholder */}
                <div className="w-24 h-24 rounded-full border-[8px] border-zinc-800 opacity-50" />
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="bg-zinc-900 rounded-3xl border border-white/10 p-6 flex-1">
                <h3 className="text-xl font-black mb-1">Get $MIND</h3>
                <p className="text-sm text-zinc-400 font-medium">Swap cash or crypto</p>
              </div>
              <div className="bg-zinc-900 rounded-3xl border border-white/10 p-6 flex-1">
                <h3 className="text-xl font-black mb-1">Whitepaper</h3>
                <p className="text-sm text-zinc-400 font-medium">Probably Nothing</p>
              </div>
            </div>
          </div>
        </section>

        {/* SOCIALS SECTION */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <SectionTitle>SOCIALS</SectionTitle>
          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center hover:bg-zinc-800 transition-colors">
                <Send className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium lowercase">community</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center hover:bg-zinc-800 transition-colors">
                <Send className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium lowercase">channel</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center hover:bg-zinc-800 transition-colors text-xl font-black">
                X
              </div>
              <span className="text-xs font-medium lowercase">x</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center hover:bg-zinc-800 transition-colors">
                <Box className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium lowercase">github</span>
            </div>
          </div>
        </section>
      </div>

      {/* BOTTOM NAVIGATION (Pill) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-full p-2 flex items-center justify-between z-50">
        <button 
          onClick={() => setActiveTab("earn")}
          className={`flex-1 py-3 rounded-full flex items-center justify-center transition-all ${activeTab === "earn" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}
        >
          <ShieldAlert className="w-6 h-6" />
        </button>
        <button 
          onClick={() => setActiveTab("fun")}
          className={`flex-1 py-3 rounded-full flex items-center justify-center transition-all text-xl font-black ${activeTab === "fun" ? "text-white" : "text-zinc-500 hover:text-white"}`}
        >
          ${xp > 1000 ? (xp/1000).toFixed(1) + 'k' : xp}
        </button>
        <button 
          onClick={() => setActiveTab("learn")}
          className={`flex-1 py-3 rounded-full flex items-center justify-center transition-all ${activeTab === "learn" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}
        >
          <Gift className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
}