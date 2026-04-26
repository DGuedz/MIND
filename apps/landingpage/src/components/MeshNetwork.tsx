import React, { Suspense } from 'react';

// Carregamento Lazy da Nuvem 3D para não bloquear a thread principal
const NeuralGlobe = React.lazy(() => import('./NeuralGlobe').then(mod => ({ default: mod.NeuralGlobe })));

export const MeshNetwork = () => {
  return (
    <div className="absolute inset-0 z-0 flex justify-center items-center pointer-events-auto">
      <Suspense fallback={<div className="absolute inset-0 flex justify-center items-center opacity-10 font-mono text-[10px]">INICIALIZANDO MALHA NEURAL...</div>}>
        <NeuralGlobe />
      </Suspense>
    </div>
  );
};
