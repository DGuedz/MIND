import React, { useEffect, useState } from 'react';

export const Logo = () => {
  const [svgContent, setSvgContent] = useState<React.ReactNode[]>([]);
  
  useEffect(() => {
    const cx = 400;
    const cy = 400;
    const numLines = 32;
    const maxRadius = 240;
    const paths = [];

    for (let i = 1; i <= numLines; i++) {
      const progress = i / numLines;
      const r = progress * maxRadius;
      const numPoints = 120;
      let pathD = '';

      for (let j = 0; j <= numPoints; j++) {
        const angle = (j / numPoints) * Math.PI * 2;
        let x = Math.cos(angle) * r;
        let y = Math.sin(angle) * r;
        
        y *= 1.3; // Stretch vertically
        
        // Pinch bottom
        if (y > 0) {
          const pinchFactor = Math.max(0.6, 1 - (y / (maxRadius * 1.3)) * 0.4);
          x *= pinchFactor;
        }
        
        // Bulge top
        if (y < 0) {
          const bulgeFactor = 1 + Math.abs(y / (maxRadius * 1.3)) * 0.1;
          x *= bulgeFactor;
        }
        
        const noise = Math.sin(angle * 6) * (progress * 2) * (y > 0 ? 1.5 : 0.5);
        const finalX = cx + x;
        const finalY = cy + y + noise;

        if (j === 0) {
          pathD += `M ${finalX} ${finalY} `;
        } else {
          pathD += `L ${finalX} ${finalY} `;
        }
      }
      pathD += 'Z';
      
      const strokeWidth = 1.5 + (1 - progress) * 2;
      const opacity = 0.5 + progress * 0.5;

      paths.push(
        <path 
          id={`neural-path-${i}`}
          key={`line-${i}`} 
          d={pathD} 
          strokeWidth={strokeWidth} 
          opacity={opacity} 
        />
      );
    }
    setSvgContent(paths);
  }, []);

  return (
    <div className="w-full max-w-[500px] aspect-square relative flex justify-center items-center">
      <svg 
        viewBox="0 0 800 800" 
        className="w-full h-full drop-shadow-[0_0_10px_rgba(255,255,255,0.05)]"
      >
        <defs>
          <mask id="text-mask">
            <rect x="0" y="0" width="800" height="800" fill="white" />
            <rect x="220" y="340" width="380" height="80" rx="40" fill="black" />
          </mask>
          
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <g mask="url(#text-mask)" fill="none" stroke="#e0e0e0" strokeWidth="2.5" opacity="0.9">
          {svgContent}
        </g>

        {/* Center Keyhole */}
        <g transform="translate(0, 25)">
          <circle cx="400" cy="420" r="5" fill="#ffffff" filter="url(#glow)" />
          <path d="M 398 410 L 402 410 L 401 420 L 399 420 Z" fill="#ffffff" />
        </g>

        <text 
          x="410" 
          y="380" 
          fontFamily="'Inter', 'SF Pro Display', sans-serif"
          fontSize="52"
          fontWeight="300"
          fill="#ffffff"
          letterSpacing="0.35em"
          textAnchor="middle"
          dominantBaseline="central"
          filter="url(#glow)"
        >
          MIND
        </text>
      </svg>
    </div>
  );
};
