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
    </div>
  )
}
