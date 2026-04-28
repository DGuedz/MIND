import * as React from "react"
import { useState } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { 
  Settings, 
  Terminal, 
  Home as HomeIcon,
  Search,
  Globe,
  Shield,
  Presentation
} from "lucide-react"
import { Logo } from "../components/Logo"

interface MainLayoutProps {
  children?: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [activeTab, setActiveTab] = useState("home");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const navItems = [
    { id: "home", label: "Home", icon: HomeIcon, path: "/" },
    { id: "discover", label: "Marketplace", icon: Search, path: "/marketplace" },
    { id: "infrastructure", label: "Infrastructure", icon: Globe, path: "/infrastructure" },
    { id: "features", label: "Features", icon: Shield, path: "/features" },
    { id: "pitchdeck", label: "Pitchdeck", icon: Presentation, path: "/pitchdeck" },
    { id: "terminal", label: "Builders", icon: Terminal, path: "/contribute" },
  ];

  // Sync activeTab with current route
  React.useEffect(() => {
    const currentPath = location.pathname || "/";
    const match = navItems.find((item) => item.path === currentPath);
    if (match) {
      setActiveTab(match.id);
      return;
    }
    setActiveTab(currentPath === "/" ? "home" : currentPath.split("/")[1] || "home");
  }, [location.pathname]);

  return (
    <div className="landing-container subtle-noise min-h-screen flex flex-col bg-zinc-950">
      {/* Top Navigation Overlay - Floria Style */}
      <header 
        className="absolute top-0 left-0 right-0 z-50 flex justify-center"
        style={{ perspective: "2000px" }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        {/* Glow de fundo seguindo o mouse */}
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-500 z-0"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.02), transparent 40%)`
          }}
        />

        {/* Borda inferior glow que ilumina com o mouse */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[1px] pointer-events-none transition-opacity duration-500 z-10"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.25), transparent 100%)`
          }}
        />

        <div 
          className="container mx-auto px-6 h-32 flex items-center justify-between gap-8 relative z-20 transition-transform duration-500 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: isHovered 
              ? `rotateX(${(mousePos.y - 64) * -0.05}deg) rotateY(${(mousePos.x - (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2) * 0.01}deg)` 
              : 'rotateX(0deg) rotateY(0deg)'
          }}
        >
          <div 
            className="flex min-w-0 items-center gap-8 xl:gap-12 transition-transform duration-300"
            style={{ transform: isHovered ? `translateZ(20px)` : `translateZ(0px)` }}
          >
            <div className="cursor-pointer group" onClick={() => navigate("/")}>
              <div className="transition-transform duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                <Logo />
              </div>
            </div>

            <nav className="hidden lg:flex min-w-0 items-center gap-5 xl:gap-7">
              {navItems.map((item) => (
                <div 
                  key={item.id}
                  className={`flex shrink-0 items-center gap-3 whitespace-nowrap text-[10px] font-mono uppercase tracking-[0.2em] xl:tracking-[0.26em] transition-all duration-500 cursor-pointer ${activeTab === item.id ? "text-white opacity-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" : "text-zinc-600 hover:text-zinc-300 opacity-60 hover:opacity-100"}`}
                  onClick={() => navigate(item.path)}
                  style={{ transform: isHovered && activeTab === item.id ? `translateZ(30px)` : `translateZ(10px)` }}
                >
                  {item.label}
                </div>
              ))}
            </nav>
          </div>

          <div 
            className="flex shrink-0 items-center gap-6 transition-transform duration-300"
            style={{ transform: isHovered ? `translateZ(20px)` : `translateZ(0px)` }}
          >
            <div 
              className="group hidden 2xl:flex items-center gap-4 whitespace-nowrap text-[9px] font-mono uppercase tracking-[0.4em] cursor-pointer transition-all duration-300 text-zinc-600 hover:text-white hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
              onClick={() => navigate("/pitchdeck")}
              title="View MIND Pitchdeck"
            >
              Pitchdeck <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all" /> Lean Canvas
            </div>
            <button
              type="button"
              className="hidden xl:inline whitespace-nowrap text-[9px] text-zinc-600 hover:text-white transition-all duration-500 font-mono uppercase tracking-[0.32em] 2xl:tracking-[0.4em] hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
              onClick={() => navigate("/#github")}
            >
              Repository
            </button>
            <div 
              className="text-zinc-600 hover:text-white transition-all duration-500 cursor-pointer hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]"
              onClick={() => navigate("/contribute")}
            >
              <Settings className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children || <Outlet />}
      </main>

      {/* Footer - Solana Foundation Inspired */}
      <footer className="border-t border-white/20 py-16 mt-auto bg-black">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
            
            {/* Col 1: Logo */}
            <div className="col-span-1 flex justify-start">
              <Logo />
            </div>

            {/* Col 2: Ecosystem Intel */}
            <div>
              <h4 className="text-zinc-400 text-lg mb-6">Ecosystem</h4>
              <ul className="space-y-4 text-zinc-300 text-sm">
                <li><a href="https://mcp.solana.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Solana Developer MCP</a></li>
                <li><a href="https://github.com/DGuedz/MIND/blob/main/.agents/skills/solana-defi-ecosystem-intel/SKILL.md" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">DeFi Ecosystem Intel</a></li>
                <li><a href="https://github.com/DGuedz/MIND/blob/main/.agents/skills/colosseum-copilot/SKILL.md" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Colosseum Copilot</a></li>
              </ul>
            </div>

            {/* Col 3: Governance */}
            <div>
              <h4 className="text-zinc-400 text-lg mb-6">Governance</h4>
              <ul className="space-y-4 text-zinc-300 text-sm">
                <li><a href="https://github.com/DGuedz/MIND/blob/main/governance/spec_runtime/skills_map.md" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Skills Map</a></li>
                <li><a href="https://github.com/DGuedz/MIND/blob/main/governance/spec_runtime/README.md" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Spec Runtime</a></li>
                <li><a href="/contribute" className="hover:text-white transition-colors">Agentic Builder Access</a></li>
              </ul>
            </div>

            {/* Col 4: Community */}
            <div>
              <h4 className="text-zinc-400 text-lg mb-6">Community</h4>
              <ul className="space-y-4 text-zinc-300 text-sm">
                <li><a href="https://github.com/DGuedz/MIND" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub Repository</a></li>
                <li><a href="https://twitter.com/mind_protocol" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">X (Twitter)</a></li>
                <li><a href="/links" className="hover:text-white transition-colors">Useful Links</a></li>
              </ul>
            </div>

          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/20 gap-4">
            <span className="text-zinc-600 text-[10px] font-mono tracking-[0.3em] uppercase">
              © 2026 MIND Protocol. All rights reserved.
            </span>
            <a 
              href="https://arena.colosseum.org/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-zinc-600 hover:text-white text-[10px] font-mono uppercase tracking-[0.3em] transition-colors"
            >
              Built for Colosseum Frontier
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
