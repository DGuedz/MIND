import { motion } from 'framer-motion';

export const MindFingerprint = () => {
  return (
    <div className="absolute lg:right-[2%] top-1/2 -translate-y-1/2 z-20 flex justify-center items-center w-full lg:w-[40%] pointer-events-none">
      {/* Máscara negra para esconder o grafo 3D que passa atrás do rosto */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.95)_20%,_transparent_70%)] -z-10" />
      
      <motion.img 
        src="/mind_fingerprint_head.svg" 
        alt="MIND Fingerprint Head" 
        initial={{ opacity: 0, scale: 0.96 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 1.2, ease: "easeOut" }} 
        className="w-[820px] max-w-[120vw] lg:max-w-none h-auto drop-shadow-[0_0_28px_rgba(255,255,255,0.15)] relative z-10"
      />
      {/* Glow pulse behind the image */}
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-white/10 rounded-full blur-[120px] -z-20"
        animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
};
