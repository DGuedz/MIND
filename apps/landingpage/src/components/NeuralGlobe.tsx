import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Malha Neural
function ParticleSphere() {
  const groupRef = useRef<THREE.Group>(null);
  const pulsesRef = useRef<THREE.LineSegments>(null);
  
  const count = 300; // Quantidade de particulas (nodes) base
  const maxDistance = 0.8; // Distância máxima para conectar os nodes
  const pulseCount = 60; // Quantidade de pulsos elétricos simultâneos

  const { positions, nodeColors, linesPositions, colors, edges } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const nodeColors = new Float32Array(count * 3);
    const vectors: THREE.Vector3[] = [];

    // Cores para os tipos de nodes (Referência: Esfera Verde)
    const colorBase = new THREE.Color("#10b981"); // Green (Emerald 500)
    const colorAgent = new THREE.Color("#059669"); // Darker Green (Emerald 600)
    const colorLiquidity = new THREE.Color("#34d399"); // Lighter Green (Emerald 400)

    // 1. Gerar os pontos
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(Math.random() * 2 - 1);
      // Espalhar um pouco mais o raio para ocupar melhor o espaço
      const r = 2.2 + Math.random() * 0.8; 
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      vectors.push(new THREE.Vector3(x, y, z));

      // Determinar o tipo do nó
      const rand = Math.random();
      let nodeColor = colorBase;
      if (rand < 0.1) {
        nodeColor = colorLiquidity;
      } else if (rand < 0.3) {
        nodeColor = colorAgent;
      }

      nodeColors[i * 3] = nodeColor.r;
      nodeColors[i * 3 + 1] = nodeColor.g;
      nodeColors[i * 3 + 2] = nodeColor.b;
    }

    // 2. Conectar os pontos próximos
    const lines: number[] = [];
    const colorArray: number[] = [];
    const edgesList: { start: THREE.Vector3, end: THREE.Vector3, startIndex: number, endIndex: number }[] = [];
    const colorLine = new THREE.Color("#064e3b"); // Deep Green para a rede

    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dist = vectors[i].distanceTo(vectors[j]);
        if (dist < maxDistance) {
          lines.push(
            vectors[i].x, vectors[i].y, vectors[i].z,
            vectors[j].x, vectors[j].y, vectors[j].z
          );
          edgesList.push({ start: vectors[i].clone(), end: vectors[j].clone(), startIndex: i, endIndex: j });
          
          const alpha = 1.0 - (dist / maxDistance);
          const mixedColor = colorBase.clone().lerp(colorLine, alpha);
          
          colorArray.push(mixedColor.r, mixedColor.g, mixedColor.b);
          colorArray.push(mixedColor.r, mixedColor.g, mixedColor.b);
        }
      }
    }

    return { 
      positions, 
      nodeColors,
      linesPositions: new Float32Array(lines),
      colors: new Float32Array(colorArray),
      edges: edgesList
    };
  }, []);

  // Para LineSegments, cada linha tem 2 pontos (start, end) = 6 valores (x,y,z * 2)
  const pulsePositions = useMemo(() => new Float32Array(pulseCount * 6), []);
  const pulseColors = useMemo(() => {
    const arr = new Float32Array(pulseCount * 6);
    const colorTail = new THREE.Color("#000000"); // invisível
    const colorHead = new THREE.Color("#38bdf8"); // Ciano elétrico (A2A Pulse)
    
    for (let i = 0; i < pulseCount; i++) {
      // Tail color
      arr[i * 6] = colorTail.r;
      arr[i * 6 + 1] = colorTail.g;
      arr[i * 6 + 2] = colorTail.b;
      // Head color
      arr[i * 6 + 3] = colorHead.r;
      arr[i * 6 + 4] = colorHead.g;
      arr[i * 6 + 5] = colorHead.b;
    }
    return arr;
  }, []);
  
  const nodesRef = useRef<THREE.Points>(null);

  // Estado mutável para os pulsos elétricos (Money Moves)
  const pulseData = useRef(
    Array.from({ length: pulseCount }).map(() => ({
      edge: edges[Math.floor(Math.random() * edges.length)],
      progress: Math.random(),
      speed: 0.01 + Math.random() * 0.02, // Rápido, sutil
      length: 0.15 + Math.random() * 0.15 // Tamanho do pulso
    }))
  );

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y -= delta * 0.05;
      groupRef.current.rotation.x -= delta * 0.02;
    }

    // Array para os tamanhos/opacidades dinâmicos dos nodes (sinapses)
    const currentColors = new Float32Array(count * 3);
    currentColors.set(nodeColors);

    // Animar pulsos pelas rotas A2A
    if (pulsesRef.current && edges.length > 0) {
      const posArray = pulsesRef.current.geometry.attributes.position.array as Float32Array;
      
      pulseData.current.forEach((pulse, i) => {
        pulse.progress += pulse.speed * delta * 60;

        if (pulse.progress >= 1.0 + pulse.length) {
          pulse.progress = 0;
          pulse.edge = edges[Math.floor(Math.random() * edges.length)];
          pulse.speed = 0.01 + Math.random() * 0.02;
        }

        const { start, end, endIndex } = pulse.edge;
        
        // Calcular cabeça e cauda do pulso
        const headProgress = Math.min(1.0, pulse.progress);
        const tailProgress = Math.max(0.0, pulse.progress - pulse.length);
        
        // Posição da Cauda (Start do Segmento)
        posArray[i * 6] = start.x + (end.x - start.x) * tailProgress;
        posArray[i * 6 + 1] = start.y + (end.y - start.y) * tailProgress;
        posArray[i * 6 + 2] = start.z + (end.z - start.z) * tailProgress;

        // Posição da Cabeça (End do Segmento)
        posArray[i * 6 + 3] = start.x + (end.x - start.x) * headProgress;
        posArray[i * 6 + 4] = start.y + (end.y - start.y) * headProgress;
        posArray[i * 6 + 5] = start.z + (end.z - start.z) * headProgress;

        // Efeito de Sinapse (Flash de Cor) quando o pulso chega perto do destino
        if (headProgress > 0.8) {
          const intensity = (headProgress - 0.8) * 5; // 0 a 1
          // Flash branco brilhante
          currentColors[endIndex * 3] = Math.max(currentColors[endIndex * 3], intensity);
          currentColors[endIndex * 3 + 1] = Math.max(currentColors[endIndex * 3 + 1], intensity);
          currentColors[endIndex * 3 + 2] = Math.max(currentColors[endIndex * 3 + 2], intensity);
        }
      });

      pulsesRef.current.geometry.attributes.position.needsUpdate = true;
    }

    if (nodesRef.current) {
      nodesRef.current.geometry.setAttribute('color', new THREE.BufferAttribute(currentColors, 3));
    }
  });

  return (
    <group ref={groupRef}>
      {/* Base Nodes (Dark Pool, Agents, Liquidity) */}
      <Points ref={nodesRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[nodeColors, 3]}
          />
        </bufferGeometry>
        {/* Custom shader material is required for per-vertex sizing, but PointMaterial doesn't support size arrays natively without shader modifications.
            Since we're using PointMaterial, we will rely on color for identity and use a uniform size.
            To achieve the synapse flash size effect without custom shaders, we will just use color and opacity.
            Actually, let's just render the nodes with varying colors.
        */}
        <PointMaterial 
          vertexColors={true} 
          transparent 
          size={0.06} 
          sizeAttenuation={true} 
          depthWrite={false} 
          opacity={1.0} 
          blending={THREE.AdditiveBlending}
        />
      </Points>
      
      {/* Base A2A Edges (Faint) */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linesPositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial 
          vertexColors={true} 
          transparent 
          opacity={0.15} 
          depthWrite={false} 
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Electrical Pulses (Money Moves) */}
      <lineSegments ref={pulsesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[pulsePositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[pulseColors, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial 
          vertexColors={true} 
          transparent 
          opacity={0.8} 
          depthWrite={false} 
          blending={THREE.AdditiveBlending}
          linewidth={2}
        />
      </lineSegments>
    </group>
  );
}

// Ondas Concêntricas Baseadas no "mind_concept_4"
function ConcentricRings() {
   const ref = useRef<THREE.Group>(null);
   useFrame((_state, delta) => {
     if (ref.current) ref.current.rotation.z += delta * 0.05;
   });
   
   return (
     <group ref={ref}>
       {[1, 1.3, 1.6, 1.9, 2.2, 2.5, 2.8, 3.1].map((radius, i) => (
         <mesh key={i}>
           <ringGeometry args={[radius, radius + 0.005, 128]} />
           <meshBasicMaterial color="#ffffff" transparent opacity={0.15 - (i * 0.015)} side={THREE.DoubleSide} />
         </mesh>
       ))}
     </group>
   )
}

export const NeuralGlobe = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-auto">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        
        {/* Camada 1: Ripples/Ondas Baseadas no Conceito 4 */}
        <ConcentricRings />
        
        {/* Camada 2: Nuvem de Nodes */}
        <ParticleSphere />
      </Canvas>
    </div>
  );
};