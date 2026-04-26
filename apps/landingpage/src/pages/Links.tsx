import { Link } from "react-router-dom";
import { ArrowRight, Box, Globe, BookOpen, ExternalLink, Code } from "lucide-react";
import { motion } from "framer-motion";

export const LinksPage = () => {
  const links = [
    {
      title: "Solana MCP",
      description: "Solana Developer Model Context Protocol documentation and server for Claude.",
      url: "https://mcp.solana.com/",
      icon: <Code className="w-5 h-5" />,
      tag: "Development"
    },
    {
      title: "MIND Protocol GitHub",
      description: "Official repository for MIND Protocol smart contracts and agent services.",
      url: "https://github.com/DGuedz/MIND",
      icon: <Box className="w-5 h-5" />,
      tag: "Source"
    },
    {
      title: "Documentation",
      description: "Architecture, integration guides, and API references.",
      url: "/docs",
      icon: <BookOpen className="w-5 h-5" />,
      tag: "Learn",
      internal: true
    },
    {
      title: "X (Twitter)",
      description: "Follow us for ecosystem updates and announcements.",
      url: "https://twitter.com/mind_protocol",
      icon: <Globe className="w-5 h-5" />,
      tag: "Community"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            Useful <span className="italic font-light opacity-60">Links.</span>
          </h2>
          <p className="text-zinc-500 leading-relaxed font-light">
            Official resources, documentation, and community channels for the MIND ecosystem.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {links.map((link, i) => (
            <motion.div
              key={link.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              {link.internal ? (
                <Link to={link.url} className="block group h-full">
                  <LinkCard link={link} />
                </Link>
              ) : (
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="block group h-full">
                  <LinkCard link={link} />
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const LinkCard = ({ link }: { link: any }) => (
  <div className="h-full bg-zinc-900/50 border border-white/20 rounded-xl p-6 transition-all duration-300 group-hover:bg-zinc-800/50 group-hover:border-white/20 flex flex-col relative overflow-hidden">
    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
      {link.internal ? <ArrowRight className="w-5 h-5 text-white/50" /> : <ExternalLink className="w-5 h-5 text-white/50" />}
    </div>
    
    <div className="flex items-center space-x-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/80">
        {link.icon}
      </div>
      <div>
        <h3 className="font-semibold text-lg">{link.title}</h3>
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">{link.tag}</span>
      </div>
    </div>
    <p className="text-zinc-400 text-sm flex-grow">{link.description}</p>
  </div>
);
