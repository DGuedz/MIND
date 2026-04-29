export const MiniLogo = ({ className }: { className?: string }) => {
  return (
    <div className={`relative flex items-center justify-center w-8 h-8 ${className || ''}`}>
      <img 
        src="/mind_logo_profile.png" 
        alt="MIND Protocol" 
        className="w-full h-full object-cover rounded-full shadow-md"
      />
    </div>
  );
};
