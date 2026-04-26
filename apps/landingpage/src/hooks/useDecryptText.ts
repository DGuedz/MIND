import { useState, useEffect } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';

export function useDecryptText(text: string | number, duration = 1000) {
  const [display, setDisplay] = useState('');
  const strText = String(text);

  useEffect(() => {
    let start = Date.now();
    let frameId: number;

    const tick = () => {
      const now = Date.now();
      const progress = Math.min((now - start) / duration, 1);
      
      if (progress === 1) {
        setDisplay(strText);
        return;
      }

      const scrambled = strText.split('').map((char, index) => {
        if (char === ' ' || char === '.' || char === ',') return char;
        // Reveal from left to right
        if (index < strText.length * progress) {
          return strText[index];
        }
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      }).join('');

      setDisplay(scrambled);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [strText, duration]);

  return display;
}
