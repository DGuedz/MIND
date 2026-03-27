import { Outlet } from "react-router-dom";
import { MiniLogo } from "../components/MiniLogo";
import { Button } from "../components/ui/button";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when screen resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `transition-colors ${isActive ? "text-white font-medium" : "text-gray-400 hover:text-white"}`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-2xl font-light transition-colors ${isActive ? "text-white" : "text-gray-500 hover:text-gray-300"}`;

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden font-sans relative selection:bg-white/20">
      <div className="noise" />
      
      {/* Navbar (Desktop) */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 items-center justify-between px-8 py-4 bg-black/40 backdrop-blur-xl border-b border-white/5">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center bg-transparent overflow-hidden p-0.5">
            <MiniLogo />
          </div>
          <span className="text-sm font-medium tracking-widest">MIND</span>
        </Link>

        {/* Desktop Menu */}
        <div className="flex items-center gap-6 text-sm">
          <NavLink to="/" className={navLinkClass}>Home</NavLink>
          <NavLink to="/app" className={navLinkClass}>App</NavLink>
          <NavLink to="/features" className={navLinkClass}>Features</NavLink>
          <NavLink to="/infrastructure" className={navLinkClass}>Infrastructure</NavLink>
          <a href="https://github.com/DGuedz/MIND" target="_blank" rel="noopener noreferrer" className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white text-xs flex items-center gap-2 cursor-pointer hover:bg-white/10 transition-colors">
            GitHub <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">↗</span>
          </a>
        </div>

        <div>
          <Link to="/register">
            <Button variant="outline" className="rounded-full bg-transparent border-white/20 hover:bg-white/10 text-white">
              Create Account
            </Button>
          </Link>
        </div>
      </nav>

      {/* Topbar (Mobile Minimal) */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-xl border-b border-white/5">
        <Link to="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center bg-transparent overflow-hidden p-0.5">
            <MiniLogo />
          </div>
          <span className="text-sm font-medium tracking-widest">MIND</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
            <Button variant="outline" size="sm" className="h-8 text-xs rounded-full bg-white/5 border-white/10 text-white">
              Connect
            </Button>
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Fullscreen Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/95 backdrop-blur-3xl pt-24 px-8 flex flex-col">
          <div className="flex flex-col gap-8 mt-8">
            <NavLink to="/" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>Home</NavLink>
            <NavLink to="/app" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>App</NavLink>
            <NavLink to="/features" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>Features</NavLink>
            <NavLink to="/infrastructure" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>Infrastructure</NavLink>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10">
            <a href="https://github.com/DGuedz/MIND" target="_blank" rel="noopener noreferrer" className="inline-flex px-4 py-2 rounded-full border border-white/10 bg-white/5 text-white text-sm items-center justify-center gap-2">
              GitHub Repository <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">↗</span>
            </a>
          </div>
        </div>
      )}

      {/* Content Rendered Here */}
      <main className="pt-16 md:pt-20">
        <Outlet />
      </main>

      {/* Global Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-black pt-16 pb-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand Column */}
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center bg-transparent overflow-hidden p-0.5">
                  <MiniLogo />
                </div>
                <span className="text-lg font-medium tracking-widest">MIND</span>
              </Link>
              <p className="text-gray-400 text-sm max-w-sm mb-6">
                The Bloomberg of Agents on Solana. Real-time liquidity rails, intent defense, and seamless A2A onboarding for autonomous ecosystems.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/30 transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.95H5.078z"></path></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/30 transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path></svg>
                </a>
              </div>
            </div>

            {/* Links Column 1 */}
            <div>
              <h4 className="font-medium mb-4 text-white">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/app" className="hover:text-white transition-colors">App Dashboard</Link></li>
                <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/infrastructure" className="hover:text-white transition-colors">Infrastructure</Link></li>
                <li><a href="#" className="hover:text-white transition-colors flex items-center gap-2">Connect Agent <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /></a></li>
              </ul>
            </div>

            {/* Links Column 2 */}
            <div>
              <h4 className="font-medium mb-4 text-white">Developers</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="https://github.com/DGuedz/MIND" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="https://github.com/DGuedz/MIND" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub Repo</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Hackathon Guide</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-gray-500">
            <div className="flex flex-col md:flex-row items-center gap-3 text-center md:text-left">
              <p>© 2026 MIND. Built for the Agent Economy.</p>
              <div className="px-2 py-0.5 rounded border border-purple-500/20 bg-purple-500/10 text-purple-400 font-medium whitespace-nowrap">
                Built for Solana Agent Economy Hackathon
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <span className="font-mono">SOLANA</span>
              <span className="font-mono">METAPLEX</span>
              <span className="font-mono">COVALENT</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
