import React from 'react';

export const MeshNetwork = () => {
  // Define node positions based on the reference image (asymmetric decentralized layout)
  const nodes = [
    { id: 1, x: 150, y: 150 }, // Top Left (Far)
    { id: 2, x: 400, y: 100 }, // Top Center-Left
    { id: 3, x: 650, y: 50 },  // Top Right
    { id: 4, x: 850, y: 250 }, // Mid Right (Outer)
    { id: 5, x: 700, y: 500 }, // Center Right
    { id: 6, x: 800, y: 750 }, // Bottom Right
    { id: 7, x: 450, y: 650 }, // Bottom Center
    { id: 8, x: 100, y: 500 }, // Bottom Left
  ];

  // Define connections to form a decentralized web (not fully connected, more organic)
  const connections = [
    // Outer perimeter
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0],
    
    // Inner cross-connections
    [0, 4], [1, 7], [2, 5], [1, 4], [4, 7], [0, 6], [2, 7]
  ];

  return (
    <div className="absolute inset-0 z-0 flex justify-center items-center opacity-30 pointer-events-none">
      {/* Background Image (Wireframe Head) */}
      <img 
        src="/mind_bg.png" 
        alt="MIND Wireframe" 
        className="absolute w-full max-w-[800px] object-contain opacity-50 invert mix-blend-screen animate-pulse duration-1000"
      />
      
      <svg viewBox="0 0 1000 800" className="absolute inset-0 w-full h-full max-w-[1200px] mx-auto">
        <defs>
          <filter id="mesh-glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Draw connections first so they appear behind nodes */}
        <g stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.3">
          {connections.map(([startIdx, endIdx], i) => {
            const start = nodes[startIdx];
            const end = nodes[endIdx];
            return (
              <line 
                key={`line-${i}`} 
                x1={start.x} 
                y1={start.y} 
                x2={end.x} 
                y2={end.y} 
              />
            );
          })}
        </g>

        {/* Animated Data Flow (Arrows/Particles) */}
        <g stroke="#aa3bff" strokeWidth="2" strokeOpacity="0.8" fill="none">
          {connections.map(([startIdx, endIdx], i) => {
            const start = nodes[startIdx];
            const end = nodes[endIdx];
            const pathId = `flow-path-${i}`;
            
            // We only animate some lines to avoid visual clutter
            if (i % 2 !== 0) return null;

            return (
              <React.Fragment key={`anim-${i}`}>
                <path 
                  id={pathId}
                  d={`M ${start.x} ${start.y} L ${end.x} ${end.y}`} 
                  stroke="none"
                />
                <circle r="3" fill="#aa3bff" filter="url(#mesh-glow)">
                  <animateMotion 
                    dur={`${3 + (i % 3)}s`} 
                    repeatCount="indefinite"
                    path={`M ${start.x} ${start.y} L ${end.x} ${end.y}`}
                  />
                </circle>
                {/* Reverse direction flow */}
                <circle r="3" fill="#ffffff" filter="url(#mesh-glow)" opacity="0.6">
                  <animateMotion 
                    dur={`${4 + (i % 2)}s`} 
                    repeatCount="indefinite"
                    path={`M ${end.x} ${end.y} L ${start.x} ${start.y}`}
                  />
                </circle>
              </React.Fragment>
            );
          })}
        </g>
      </svg>

      {/* Draw Nodes using HTML/React components positioned over the SVG */}
      <div className="absolute inset-0 max-w-[1200px] mx-auto w-full h-full" style={{ aspectRatio: '1000/800' }}>
        {nodes.map((node) => (
          <div 
            key={`node-${node.id}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center animate-float"
            style={{ 
              left: `${(node.x / 1000) * 100}%`, 
              top: `${(node.y / 800) * 100}%`,
              animationDelay: `${node.id * 0.5}s` 
            }}
          >
            {/* The simple dot node */}
            <div className="w-3 h-3 bg-white/20 rounded-full flex items-center justify-center relative shadow-[0_0_10px_rgba(255,255,255,0.2)]">
              {/* Subtle pulsing dot to show activity */}
              {node.id % 2 === 0 ? (
                <div className="absolute w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(170,59,255,1)]" />
              ) : (
                <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse shadow-[0_0_5px_rgba(255,255,255,1)]" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
