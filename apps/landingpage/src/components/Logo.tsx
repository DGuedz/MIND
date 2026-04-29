export const Logo = ({ className }: { className?: string }) => {
  return (
    <div className={`relative flex items-center gap-4 ${className || ''}`}>
      <div className="w-12 h-12 relative flex items-center justify-center">
        <img 
          src="/mind_logo_profile.png" 
          alt="MIND Protocol" 
          className="w-full h-full object-cover rounded-full shadow-lg"
        />
      </div>
      <span className="text-xl font-bold tracking-[0.4em] text-white uppercase font-mono ml-2">MIND</span>
    </div>
  );
};
