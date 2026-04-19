import * as React from "react"
import { useState } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { 
  Settings, 
  Terminal, 
  Home as HomeIcon,
  Search,
  Globe,
  Shield
} from "lucide-react"
import { Logo } from "../components/Logo"
import { MiniLogo } from "../components/MiniLogo"

interface MainLayoutProps {
  children?: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [activeTab, setActiveTab] = useState("home");
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: "home", label: "Home", icon: HomeIcon, path: "/" },
    { id: "discover", label: "Marketplace", icon: Search, path: "/app" },
    { id: "infrastructure", label: "Infrastructure", icon: Globe, path: "/infrastructure" },
    { id: "features", label: "Features", icon: Shield, path: "/features" },
    { id: "terminal", label: "Builders", icon: Terminal, path: "/register" },
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
      <header className="absolute top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-6 h-32 flex items-center justify-between">
          <div className="flex items-center gap-16">
            <div className="cursor-pointer" onClick={() => navigate("/")}>
              <Logo />
            </div>

            <nav className="hidden lg:flex items-center gap-10">
              {navItems.map((item) => (
                <div 
                  key={item.id}
                  className={`flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.3em] transition-all duration-500 cursor-pointer ${activeTab === item.id ? "text-white opacity-100" : "text-zinc-600 hover:text-zinc-400 opacity-60 hover:opacity-100"}`}
                  onClick={() => navigate(item.path)}
                >
                  {item.label}
                </div>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-10">
            <div className="hidden md:flex items-center gap-4 text-[9px] text-zinc-800 font-mono uppercase tracking-[0.4em]">
              Frontier 1.0.1 <span className="w-1 h-1 rounded-full bg-zinc-900" /> Operational
            </div>
            <button
              type="button"
              className="hidden md:inline text-[9px] text-zinc-600 hover:text-white transition-all duration-500 font-mono uppercase tracking-[0.4em]"
              onClick={() => navigate("/#github")}
            >
              Repository
            </button>
            <div 
              className="text-zinc-600 hover:text-white transition-all duration-500 cursor-pointer"
              onClick={() => navigate("/register")}
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
      <footer className="border-t border-white/5 py-16 mt-auto bg-black">
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
                <li><a href="/docs/solana-defi-ecosystem-intel" className="hover:text-white transition-colors">DeFi Ecosystem Intel</a></li>
                <li><a href="/docs/colosseum-copilot" className="hover:text-white transition-colors">Colosseum Copilot</a></li>
              </ul>
            </div>

            {/* Col 3: Governance */}
            <div>
              <h4 className="text-zinc-400 text-lg mb-6">Governance</h4>
              <ul className="space-y-4 text-zinc-300 text-sm">
                <li><a href="/docs/skills-map" className="hover:text-white transition-colors">Skills Map</a></li>
                <li><a href="/docs/spec-runtime" className="hover:text-white transition-colors">Spec Runtime</a></li>
                <li><a href="/register" className="hover:text-white transition-colors">Agentic Builder Access</a></li>
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

          <div className="flex items-center justify-center pt-8 border-t border-white/5">
            <span className="text-zinc-600 text-xs font-mono tracking-widest uppercase">
              © 2026 MIND Protocol. All rights reserved.
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
