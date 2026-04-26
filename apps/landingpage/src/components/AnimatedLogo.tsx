import { motion } from "framer-motion";

interface AnimatedLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showGlow?: boolean;
}

export const AnimatedLogo = ({ className = "", size = "lg", showGlow = true }: AnimatedLogoProps) => {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24", 
    lg: "w-32 h-32",
    xl: "w-48 h-48"
  };

  return (
    <motion.div 
      className={`relative ${sizeClasses[size]} ${className}`}
      animate={{
        scale: [1, 1.02, 1],
        filter: showGlow ? [
          "drop-shadow(0 0 15px rgba(255,255,255,0.2)) brightness(1)",
          "drop-shadow(0 0 30px rgba(255,255,255,0.4)) brightness(1.2)",
          "drop-shadow(0 0 15px rgba(255,255,255,0.2)) brightness(1)"
        ] : "none",
        y: ["0px", "-4px", "0px"]
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <div className="hologram-glitch w-full h-full">
        <div
          style={{
            backgroundImage: "url('/mind_new_logo.png')",
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            width: "100%",
            height: "100%",
          }}
        />
        
        <div className="energy-sweep-container">
          <div className="energy-beam"></div>
        </div>

        <div className="hologram-glitch-overlay"></div>
      </div>

      {size !== "sm" && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              animate={{
                rotate: [0, 360],
                scale: [0.8, 1.2, 0.8],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5
              }}
              style={{
                top: "50%",
                left: "50%",
                x: "-50%",
                y: "-50%",
                transformOrigin: `0 ${size === "xl" ? 60 : 40}px`
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
