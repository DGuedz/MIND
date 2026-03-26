import React, { useEffect, useState } from 'react';

export const MiniLogo = () => {
  const [svgContent, setSvgContent] = useState<React.ReactNode[]>([]);
  
  useEffect(() => {
    // Reduzimos o tamanho base e a densidade das linhas para ficar nítido em tamanho pequeno
    const cx = 50;
    const cy = 50;
    const numLines = 12; // Menos linhas para evitar borrão
    const maxRadius = 35;
    const paths = [];

    for (let i = 1; i <= numLines; i++) {
      const progress = i / numLines;
      const r = progress * maxRadius;
      const numPoints = 60;
      let pathD = '';

      for (let j = 0; j <= numPoints; j++) {
        const angle = (j / numPoints) * Math.PI * 2;
        let x = Math.cos(angle) * r;
        let y = Math.sin(angle) * r;
        
        y *= 1.3;
        
        if (y > 0) {
          const pinchFactor = Math.max(0.6, 1 - (y / (maxRadius * 1.3)) * 0.4);
          x *= pinchFactor;
        }
        
        if (y < 0) {
          const bulgeFactor = 1 + Math.abs(y / (maxRadius * 1.3)) * 0.1;
          x *= bulgeFactor;
        }
        
        // Reduzido o ruído na versão mini
        const noise = Math.sin(angle * 6) * (progress * 1) * (y > 0 ? 1 : 0.2);
        const finalX = cx + x;
        const finalY = cy + y + noise;

        if (j === 0) {
          pathD += `M ${finalX} ${finalY} `;
        } else {
          pathD += `L ${finalX} ${finalY} `;
        }
      }
      pathD += 'Z';
      
      const strokeWidth = 0.5 + (1 - progress) * 1;
      const opacity = 0.6 + progress * 0.4;

      paths.push(
        <path 
          key={i} 
          d={pathD} 
          strokeWidth={strokeWidth} 
          opacity={opacity} 
        />
      );
    }
    setSvgContent(paths);
  }, []);

  return (
    <svg 
      viewBox="0 0 100 100" 
      className="w-full h-full drop-shadow-[0_0_2px_rgba(255,255,255,0.2)]"
    >
      <defs>
        <filter id="mini-glow">
          <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <g fill="none" stroke="#e0e0e0" strokeWidth="1" opacity="0.9">
        {svgContent}
      </g>

      <g transform="translate(0, 5)">
        <circle cx="50" cy="55" r="2" fill="#ffffff" filter="url(#mini-glow)" />
        <path d="M 49 50 L 51 50 L 50.5 55 L 49.5 55 Z" fill="#ffffff" />
      </g>
    </svg>
  );
};
