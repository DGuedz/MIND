import { useState, useEffect, useRef } from "react";
import { Crosshair, ShieldAlert, Zap } from "lucide-react";

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
  
  const pendingSync = useRef({ xp: 0, mevs: 0 });

  // Init user with backend
  useEffect(() => {
    const initUser = async () => {
      try {
        const res = await fetch("http://localhost:3010/v1/game/init", {
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
        
        // Reset local counters immediately
        pendingSync.current = { xp: 0, mevs: 0 };

        try {
          await fetch("http://localhost:3010/v1/game/sync-xp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        } catch (e) {
          console.warn("Failed to sync XP");
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  // Spawn MEVs randomly
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      if (Math.random() > 0.3) { // 70% chance to spawn every second
        const newTarget: MevTarget = {
          id: Date.now(),
          x: 10 + Math.random() * 80, // percentage 10-90
          y: 20 + Math.random() * 60, // percentage 20-80
          size: 40 + Math.random() * 30, // 40-70px
          createdAt: Date.now()
        };
        setTargets(prev => [...prev, newTarget]);
      }
    }, 1000);

    // Remove old MEVs (missed)
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setTargets(prev => prev.filter(t => now - t.createdAt < 3000)); // Disappear after 3s
    }, 500);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(cleanupInterval);
    };
  }, []);

  const handleTap = (id: number) => {
    setTargets(prev => prev.filter(t => t.id !== id));
    
    const xpGained = 15;
    setXp(prev => prev + xpGained);
    setMevsDestroyed(prev => prev + 1);
    
    pendingSync.current.xp += xpGained;
    pendingSync.current.mevs += 1;

    // Haptic feedback for mobile
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden font-mono text-white select-none touch-none">
      {/* Radar Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[200vw] max-w-[800px] max-h-[800px] rounded-full border border-green-500/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] max-w-[600px] max-h-[600px] rounded-full border border-green-500/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] max-w-[400px] max-h-[400px] rounded-full border border-green-500/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-green-500/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-full bg-green-500/20" />
      </div>

      {/* Header HUD */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div>
          <h1 className="text-green-400 font-bold text-sm tracking-widest flex items-center gap-2">
            <Crosshair className="w-4 h-4 animate-pulse" />
            MEV DEFENDER
          </h1>
          <p className="text-xs text-gray-500 mt-1">Protecting Agent SolClaw</p>
        </div>
        <div className="text-right">
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg px-3 py-2 flex flex-col items-end">
            <span className="text-[10px] text-gray-400 uppercase">Total XP</span>
            <span className="text-xl font-bold text-white flex items-center gap-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              {xp}
            </span>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="absolute inset-0 z-20">
        {targets.map(target => (
          <button
            key={target.id}
            onClick={() => handleTap(target.id)}
            className="absolute rounded-full flex items-center justify-center bg-red-500/20 border-2 border-red-500 text-red-400 animate-in zoom-in spin-in-12 duration-300 hover:bg-red-500/40 active:scale-90 transition-transform"
            style={{
              left: target.x + '%',
              top: target.y + '%',
              width: target.size,
              height: target.size,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <ShieldAlert className="w-1/2 h-1/2 pointer-events-none" />
          </button>
        ))}
      </div>

      {/* Bottom HUD */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10 bg-gradient-to-t from-black to-transparent pointer-events-none">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] text-gray-500 uppercase mb-1">Threats Eliminated</p>
            <p className="text-2xl font-light">{mevsDestroyed}</p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-green-500/10 border border-green-500/30 text-green-400 text-[10px]">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Agent Safe
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}