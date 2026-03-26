import { MiniLogo } from './MiniLogo';

export const MindzGroup = () => {
  return (
    <div className="relative flex items-center mb-6">
      {/* Conexão Traseira (Linhas) */}
      <div className="absolute top-1/2 left-4 w-32 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-white/20 -translate-y-1/2 z-0" />
      <div className="absolute top-1/2 left-12 w-24 h-12 border-l border-b border-white/20 rounded-bl-xl -translate-y-1/2 translate-y-6 z-0" />
      <div className="absolute top-1/2 left-12 w-24 h-12 border-l border-t border-white/20 rounded-tl-xl -translate-y-full -translate-y-2 z-0" />
      
      {/* Mindz 1 (Menor, Topo) */}
      <div className="absolute left-20 -top-8 w-6 h-6 rounded-full border border-white/10 bg-black/80 backdrop-blur-md flex items-center justify-center p-0.5 z-10 shadow-[0_0_10px_rgba(170,59,255,0.2)] animate-float">
        <MiniLogo />
        <div className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
      </div>

      {/* Mindz 2 (Menor, Base) */}
      <div className="absolute left-24 top-14 w-7 h-7 rounded-full border border-white/10 bg-black/80 backdrop-blur-md flex items-center justify-center p-0.5 z-10 shadow-[0_0_10px_rgba(255,255,255,0.1)] animate-float-delayed">
        <MiniLogo />
      </div>

      {/* Mindz Principal (Centro, Maior) */}
      <div className="relative left-0 w-10 h-10 rounded-full border border-white/30 bg-white/5 backdrop-blur-xl flex items-center justify-center p-1 z-20 shadow-[0_0_15px_rgba(255,255,255,0.15)]">
        <MiniLogo />
        {/* Pulse effect on main node */}
        <div className="absolute inset-0 rounded-full border border-white/20 animate-pulse-ring" />
      </div>

      {/* Text Label */}
      <div className="ml-28 flex flex-col z-10">
        <span className="text-xs font-medium tracking-widest text-white/90 uppercase">MINDZ Cluster</span>
        <span className="text-[10px] text-gray-500 tracking-wider">A2A Authorized</span>
      </div>
    </div>
  );
};
