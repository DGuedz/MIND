import * as React from "react"
import { useState } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { 
  Terminal, 
  Home as HomeIcon,
  Search,
  Globe,
  Shield,
  Presentation,
  Store
} from "lucide-react"
import { Logo } from "../components/Logo"
import { motion } from "framer-motion"

interface MainLayoutProps {
  children?: React.ReactNode;
  heroCopyOpacity?: any;
  heroCopyVisibility?: any;
}

export function MainLayout({ children, heroCopyOpacity, heroCopyVisibility }: MainLayoutProps) {
  const [activeTab, setActiveTab] = useState("home");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    { id: "marketplace", label: "Marketplace", icon: Store, path: "/marketplace" },
    { id: "discover", label: "Discovery", icon: Search, path: "/start" },
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
        <motion.header 
          className="absolute top-0 left-0 right-0 z-50 flex justify-center"
          style={{ 
            perspective: "2000px", 
            opacity: heroCopyOpacity !== undefined ? heroCopyOpacity : 1, 
            visibility: heroCopyVisibility !== undefined ? heroCopyVisibility as any : "visible" 
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
        >
        {/* Glow de fundo seguindo o mouse */}
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-500 z-0"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(20,241,149,0.05), transparent 40%)`
          }}
        />

        {/* Borda inferior glow que ilumina com o mouse (Linha mais visível) */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[2px] pointer-events-none transition-opacity duration-500 z-10"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(153,69,255,0.8), rgba(20,241,149,0.4) 40%, transparent 80%)`
          }}
        />

        <div 
          className="container mx-auto px-6 h-24 md:h-32 flex items-center justify-between relative z-20 transition-transform duration-500 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: isHovered 
              ? `rotateX(${(mousePos.y - 64) * -0.05}deg) rotateY(${(mousePos.x - (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2) * 0.01}deg)` 
              : 'rotateX(0deg) rotateY(0deg)'
          }}
        >
          <div 
            className="flex w-full items-center justify-between transition-transform duration-300"
            style={{ transform: isHovered ? `translateZ(20px)` : `translateZ(0px)` }}
          >
            <div className="cursor-pointer group flex-shrink-0" onClick={() => navigate("/")}>
              <div className="transition-transform duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                <Logo />
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex min-w-0 flex-1 justify-center items-center gap-5 xl:gap-8 mx-8">
              {navItems.map((item) => (
                <div 
                  key={item.id}
                  className={`flex shrink-0 items-center gap-3 whitespace-nowrap text-[10px] font-mono uppercase tracking-[0.2em] xl:tracking-[0.26em] transition-all duration-500 cursor-pointer ${activeTab === item.id ? "text-white opacity-100 drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]" : "text-zinc-600 hover:text-white opacity-60 hover:opacity-100 hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"}`}
                  onClick={() => navigate(item.path)}
                  style={{ transform: isHovered && activeTab === item.id ? `translateZ(30px)` : `translateZ(10px)` }}
                >
                  {item.label}
                </div>
              ))}
            </nav>
            
            {/* Mobile Hamburger Menu Button */}
            <div className="lg:hidden flex items-center justify-end flex-shrink-0" style={{ transform: isHovered ? `translateZ(20px)` : `translateZ(0px)` }}>
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-zinc-400 hover:text-white focus:outline-none z-50 relative p-2"
                aria-label="Toggle menu"
              >
                <div className="w-6 h-4 flex flex-col justify-between items-end">
                  <span className={`block h-[1px] bg-current transition-all duration-300 ease-out ${isMobileMenuOpen ? 'w-6 rotate-45 translate-y-[7px]' : 'w-6'}`}></span>
                  <span className={`block h-[1px] bg-current transition-all duration-300 ease-out ${isMobileMenuOpen ? 'opacity-0' : 'w-4'}`}></span>
                  <span className={`block h-[1px] bg-current transition-all duration-300 ease-out ${isMobileMenuOpen ? 'w-6 -rotate-45 -translate-y-[7px]' : 'w-5'}`}></span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div 
          className={`fixed inset-0 bg-black/95 backdrop-blur-md z-40 lg:hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex flex-col h-full justify-center px-8">
            <nav className="flex flex-col gap-8">
              {navItems.map((item, i) => (
                <div 
                  key={item.id}
                  className={`flex items-center gap-4 cursor-pointer transition-all duration-500 ${
                    isMobileMenuOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                  }`}
                  style={{ transitionDelay: `${isMobileMenuOpen ? i * 50 : 0}ms` }}
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <span className={`text-xs font-mono uppercase tracking-[0.3em] ${activeTab === item.id ? "text-white" : "text-zinc-500"}`}>
                    0{i + 1}
                  </span>
                  <span className={`text-[16px] md:text-[20px] font-mono uppercase tracking-[0.2em] md:tracking-[0.3em] ${activeTab === item.id ? "text-white" : "text-zinc-400"}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </nav>
            
            <div 
              className={`mt-16 border-t border-white/10 pt-8 transition-all duration-500 delay-500 ${
                isMobileMenuOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
            >
              <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.3em]">
                MIND Protocol // Agent Economy
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1">
        {children || <Outlet />}
      </main>

      <footer className="relative mt-auto overflow-hidden border-t border-zinc-300/15 bg-[#070708] py-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-200/50 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_at_top,rgba(212,212,216,0.12),transparent_65%)]" />

        <div className="container relative mx-auto px-6">
          <div className="mb-14 grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-8">
            <div className="col-span-1">
              <div className="mb-6 inline-flex rounded-xl border border-zinc-300/10 bg-gradient-to-b from-zinc-800/70 to-zinc-950/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_24px_80px_rgba(0,0,0,0.35)]">
                <Logo />
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-zinc-500">
                Private agent checkout, priced Agent Cards, and verifiable execution rails for the agent economy.
              </p>
            </div>

            <div>
              <h4 className="mb-6 bg-gradient-to-b from-zinc-100 via-zinc-300 to-zinc-600 bg-clip-text text-sm font-medium uppercase tracking-[0.24em] text-transparent">
                Ecosystem
              </h4>
              <ul className="space-y-4 text-sm text-zinc-400">
                <li><a href="https://mcp.solana.com/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-zinc-100">Solana Developer MCP</a></li>
                <li><a href="https://github.com/DGuedz/MIND/blob/main/.agents/skills/solana-defi-ecosystem-intel/SKILL.md" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-zinc-100">DeFi Ecosystem Intel</a></li>
                <li><a href="https://github.com/DGuedz/MIND/blob/main/.agents/skills/colosseum-copilot/SKILL.md" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-zinc-100">Colosseum Copilot</a></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-6 bg-gradient-to-b from-zinc-100 via-zinc-300 to-zinc-600 bg-clip-text text-sm font-medium uppercase tracking-[0.24em] text-transparent">
                Governance
              </h4>
              <ul className="space-y-4 text-sm text-zinc-400">
                <li><a href="https://github.com/DGuedz/MIND/blob/main/governance/spec_runtime/skills_map.md" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-zinc-100">Skills Map</a></li>
                <li><a href="https://github.com/DGuedz/MIND/blob/main/governance/spec_runtime/README.md" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-zinc-100">Spec Runtime</a></li>
                <li><a href="/contribute" className="transition-colors hover:text-zinc-100">Agentic Builder Access</a></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-6 bg-gradient-to-b from-zinc-100 via-zinc-300 to-zinc-600 bg-clip-text text-sm font-medium uppercase tracking-[0.24em] text-transparent">
                Community
              </h4>
              <ul className="space-y-4 text-sm text-zinc-400">
                <li><a href="https://github.com/DGuedz/MIND" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-zinc-100">GitHub Repository</a></li>
                <li><a href="https://twitter.com/mind_protocol" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-zinc-100">X (Twitter)</a></li>
                <li><a href="/links" className="transition-colors hover:text-zinc-100">Useful Links</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-4 border-t border-zinc-300/10 pt-8 md:flex-row md:items-center">
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600">
              © 2026 MIND Protocol. All rights reserved.
            </span>
            <a
              href="https://arena.colosseum.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-zinc-600 via-zinc-300 to-zinc-600 bg-clip-text text-[10px] font-mono uppercase tracking-[0.3em] text-transparent transition-opacity hover:opacity-80"
            >
              Built for Colosseum Frontier
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
