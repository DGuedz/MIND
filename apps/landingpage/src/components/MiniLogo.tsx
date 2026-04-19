export const MiniLogo = ({ className }: { className?: string }) => {
  return (
    <div className={`relative flex items-center justify-center w-8 h-8 ${className || ''}`}>
      <img 
        src="/mind_new_logo.png" 
        alt="MIND Protocol" 
        className="w-full h-full object-contain scale-[1.8] translate-x-[-15%] translate-y-[5%] transform-gpu grayscale brightness-125"
      />
    </div>
  );
};
