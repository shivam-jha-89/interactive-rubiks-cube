import { useState, useMemo, useRef } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import { Edges, RoundedBox, Box } from '@react-three/drei';
import React from 'react'; // Needed for React.createRef
import { Player } from '../types';
import { NeonXMaterial, NeonOMaterial } from './PlayerMaterials';
import * as THREE from 'three';

interface CellProps {
  position: [number, number, number]; // [x, y, z] in 3D space
  value: Player | null;
  onClick: () => void;
  disabled: boolean;
  dimmed?: boolean;
  isExploding?: boolean;
  showEmpty?: boolean;
  showLayerEdges?: boolean;
  isClickable?: boolean;
}

export function Cell({ position, value, onClick, disabled, dimmed = false, isExploding = false, showEmpty = true, showLayerEdges = false, isClickable = false }: CellProps) {
  const [hovered, setHover] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  
  // Generate a random time offset for this cell to desynchronize animations
  const timeOffset = useMemo(() => Math.random() * 100, []);

  // Generate random "greebles" (small protruding voxels)
  const greebles = useMemo(() => {
    const count = Math.floor(Math.random() * 3) + 2; // 2 to 4 bumps
    const items = [];
    for (let i = 0; i < count; i++) {
      const face = Math.floor(Math.random() * 6);
      const mainSize = 0.9;
      const offset = mainSize / 2; 
      const bumpSize = 0.15 + Math.random() * 0.1;
      
      // Initial static position on the face
      const u = (Math.random() - 0.5) * 0.5;
      const v = (Math.random() - 0.5) * 0.5;
      
      let pos: [number, number, number] = [0,0,0];
      
      if (face === 0) pos = [offset, u, v];
      else if (face === 1) pos = [-offset, u, v];
      else if (face === 2) pos = [u, offset, v];
      else if (face === 3) pos = [u, -offset, v];
      else if (face === 4) pos = [u, v, offset];
      else if (face === 5) pos = [u, v, -offset];
      
      // Each greeble gets a random orbit speed and axis
      const speed = (Math.random() * 0.5 + 0.2) * (Math.random() > 0.5 ? 1 : -1);
      const axis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();

      items.push({ 
        initialPos: new THREE.Vector3(...pos), 
        size: [bumpSize, bumpSize, bumpSize] as [number, number, number],
        speed,
        axis,
        ref: React.createRef<THREE.Mesh>() // Ref to animate individually
      });
    }
    return items;
  }, []);

  // Animation loop
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Smooth position interpolation for "explosion" effect
      // Lerp current position towards target position
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, position[0], delta * 5);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, position[1], delta * 5);
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, position[2], delta * 5);

      // Explosion Logic
      if (isExploding) {
        groupRef.current.scale.x += delta * 5;
        groupRef.current.scale.y += delta * 5;
        groupRef.current.scale.z += delta * 5;
      } else {
        groupRef.current.scale.set(1, 1, 1);
      }
    }

    // Orbiting Greebles Logic
    if (value) {
      const time = state.clock.getElapsedTime();
      greebles.forEach(g => {
        if (g.ref.current) {
          // Orbit logic: rotate initial position around center (0,0,0)
          // We use applyAxisAngle on a copy of the initial vector
          const angle = time * g.speed;
          const currentPos = g.initialPos.clone().applyAxisAngle(g.axis, angle);
          g.ref.current.position.copy(currentPos);
          g.ref.current.rotation.x += delta * g.speed;
          g.ref.current.rotation.y += delta * g.speed;
        }
      });
    }
  });

  // Colors matches CSS & PlayerMaterials
  // X: #ff00cc (Hot Pink)
  // O: #00ffaa (Mint Green)
  // Empty: Dark Violet Void
  const baseColor = '#1a0b2e';
  const xColor = '#ff00cc';
  const oColor = '#00ffaa';
  
  // If occupied, solid. If empty, very transparent, but more visible on hover.
  let opacity = value ? 1.0 : (hovered && !disabled ? 0.5 : 0.15);
  
  if (dimmed) {
    opacity = value ? 0.3 : 0.05;
  }
  
  if (isExploding) {
    opacity = 0.8; 
  }
  
  if (!showEmpty && !value) {
    // When grid is "hidden", make non-hovered empty cells almost invisible
    opacity = hovered && !disabled ? 0.3 : 0.02; 
  }
  
  // If layer is active (exploded view), make cells lighter/more visible
  if (showLayerEdges && !value) {
    opacity = 0.6; // Lighter/more solid
  }

  
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!disabled) {
      onClick();
    }
  };

  const handlePointerOver = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation(); 
    if (!disabled) setHover(true);
  };

  const handlePointerOut = () => setHover(false);

  const eventHandlers = dimmed ? {} : {
    onClick: handleClick,
    onPointerOver: handlePointerOver,
    onPointerOut: handlePointerOut
  };

  return (
    <group ref={groupRef}>
      {/* Main Block */}
      <RoundedBox
        args={[0.9, 0.9, 0.9]}
        radius={0.05} // Boxy, Minecraft style
        smoothness={4}
        {...eventHandlers}
      >
        {value === 'X' ? (
          <NeonXMaterial opacity={opacity} offset={timeOffset} />
        ) : value === 'O' ? (
          <NeonOMaterial opacity={opacity} offset={timeOffset} />
        ) : (
          <meshStandardMaterial
            color={baseColor}
            transparent
            opacity={opacity}
            depthWrite={false} 
            roughness={0.3}
            metalness={0.6}
            emissive="#2a1b3e"
            emissiveIntensity={0.3}
          />
        )}

        {/* Show edges for empty cells so the grid is visible.
            When showLayerEdges is true (exploded active layer), we hide these standard edges
            in favor of the "lighter cube" look, per user request. */}
        {!value && !showLayerEdges && (
          <Edges
            scale={1}
            threshold={15} // Display edges only when angle > 15 degrees
            color="#00ffff" // Bright Cyan Neon Grid
            opacity={!showEmpty && !hovered ? 0.1 : (dimmed ? 0.1 : 0.8)} // Much more visible
            renderOrder={1000}
          />
        )}
        
        {/* Removed the white wireframe box for active layer per user request ("remove edges") */}
        
        {/* Highlight edges on hover */}
        {hovered && isClickable && !value && (
          <mesh scale={[1.08, 1.08, 1.08]}>
             <boxGeometry args={[0.9, 0.9, 0.9]} />
             <meshBasicMaterial 
               color="#ffff00" 
               wireframe 
               toneMapped={false}
             />
          </mesh>
        )}
      </RoundedBox>

      {/* Extra "Voxel" Details (Orbiting Greebles) */}
      {value && greebles.map((g, i) => (
        <Box key={i} ref={g.ref} args={g.size}>
          <meshStandardMaterial 
            color={value === 'X' ? xColor : oColor} 
            emissive={value === 'X' ? xColor : oColor}
            emissiveIntensity={0.5}
            toneMapped={false}
          />
        </Box>
      ))}
    </group>
  );
}
