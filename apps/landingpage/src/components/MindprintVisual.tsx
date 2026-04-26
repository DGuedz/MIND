import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export function MindprintVisual({ seed }: { seed: string }) {
  const [rotation, setRotation] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(r => (r + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full relative group flex items-center justify-center">
      <svg width="100%" height="100%" viewBox="0 0 200 200" className="drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Background neural rings */}
        {[1, 2, 3].map((r) => (
          <motion.circle
            key={r}
            cx="100" cy="100" r={55 + r * 15}
            fill="none" stroke="#ffffff" strokeWidth="0.2"
            initial={{ opacity: 0.05 }}
            animate={{ 
              opacity: [0.05, 0.15, 0.05],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 4, repeat: Infinity, delay: r * 0.5 }}
          />
        ))}

        {/* Procedural elements based on seed */}
        <g transform={`rotate(${rotation} 100 100)`}>
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30) * (Math.PI / 180);
            const x = 100 + Math.cos(angle) * 75;
            const y = 100 + Math.sin(angle) * 75;
            return (
              <motion.line
                key={i}
                x1="100" y1="100" x2={x} y2={y}
                stroke="#ffffff" strokeWidth="0.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.4 }}
                transition={{ duration: 2, delay: i * 0.1 }}
              />
            );
          })}
        </g>

        <circle cx="100" cy="100" r="55" fill="#050505" stroke="#ffffff" strokeWidth="1" filter="url(#glow)" />
        
        {/* Minimalist MIND Face Bot Design - Animated Entry */}
        <motion.g 
          stroke="#ffffff" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"
          initial={{ pathLength: 0, opacity: 0, scale: 0.8 }}
          animate={{ pathLength: 1, opacity: 0.9, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ transformOrigin: "100px 100px" }}
        >
          {/* Main Helmet Outline */}
          <motion.path 
            d="M 65,65 L 85,50 L 115,50 L 135,65 L 140,100 L 120,140 L 100,150 L 80,140 L 60,100 Z" 
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.2 }}
          />
          {/* Inner Face Plate & Cheek Armor */}
          <motion.path 
            d="M 70,100 L 85,135 L 100,145 L 115,135 L 130,100 M 140,100 L 120,120 L 120,135 M 60,100 L 80,120 L 80,135" opacity="0.5" 
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.5 }}
          />
          
          {/* Aggressive V-Visor */}
          <motion.path 
            d="M 70,90 L 95,100 L 105,100 L 130,90 L 130,98 L 105,110 L 95,110 L 70,98 Z" 
            strokeWidth="1" fill="rgba(255,255,255,0.05)" opacity="0.8" 
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 1 }} 
          />
          
          {/* Glowing Eyes based on procedural seed */}
          <motion.circle cx="85" cy="100" r="3" fill="#ffffff" stroke="none" filter="url(#glow)" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.5, 1] }} transition={{ duration: 2, delay: 1.5 }} />
          <motion.circle cx="115" cy="100" r="3" fill="#ffffff" stroke="none" filter="url(#glow)" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.5, 1] }} transition={{ duration: 2, delay: 1.5 }} />
          
          {/* Grill / Mouthpiece */}
          <motion.path d="M 85,125 L 115,125 M 88,132 L 112,132 M 92,139 L 108,139" strokeWidth="1.5" opacity="0.6" initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ duration: 1, delay: 1.8 }} />
          
          {/* Forehead Details */}
          <motion.path d="M 90,50 L 100,70 L 110,50 M 80,60 L 120,60" opacity="0.4" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ duration: 1, delay: 1.2 }} />
          
          {/* Central Symmetry Line */}
          <motion.line x1="100" y1="110" x2="100" y2="145" strokeWidth="0.5" strokeDasharray="2 3" opacity="0.4" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ duration: 1, delay: 1.8 }} />
        </motion.g>

        <motion.text 
          x="100" y="175" textAnchor="middle" fill="#ffffff" fontSize="8" fontFamily="monospace" letterSpacing="3" opacity="0.8"
          initial={{ opacity: 0, y: 165 }}
          animate={{ opacity: 0.8, y: 175 }}
          transition={{ duration: 1, delay: 2 }}
        >
          {seed.substring(8, 14) || "ALPHA"}
        </motion.text>
      </svg>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    </div>
  );
}
