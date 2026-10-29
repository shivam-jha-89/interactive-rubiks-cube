import { useRef } from 'react';
import { shaderMaterial, Sparkles } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ReactThreeFiber } from '@react-three/fiber';

// --- SHARED NOISE ---
const noiseGLSL = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute( permute( permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }
`;

// --- NEON RED SHADER (Player X) - Cute Neon Pink/Purple ---
const NeonRedShaderMaterial = shaderMaterial(
  {
    time: 0,
    colorStart: new THREE.Color('#ff00cc'), // Hot Pink / Magenta
    colorEnd: new THREE.Color('#aa00ff'),   // Electric Violet
    opacity: 1.0,
  },
  // Vertex
  `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float time;
  ${noiseGLSL}
  void main() {
    vUv = uv;
    vPosition = position;
    vec3 pos = position;
    // Smoother, more fluid electric movement
    float noiseVal = snoise(vec3(pos.x * 2.5, pos.y * 2.5 + time * 1.0, pos.z * 2.5));
    pos += normal * noiseVal * 0.1;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
  `,
  // Fragment
  `
  uniform float time;
  uniform vec3 colorStart;
  uniform vec3 colorEnd;
  uniform float opacity;
  varying vec2 vUv;
  varying vec3 vPosition;
  ${noiseGLSL}
  void main() {
    // Soft neon pattern
    float n = snoise(vec3(vPosition.x * 4.0, vPosition.y * 4.0 - time * 1.0, vPosition.z * 4.0));
    float n2 = snoise(vec3(vPosition.x * 8.0, vPosition.y * 8.0 + time * 2.0, vPosition.z * 8.0));
    float combinedNoise = n * 0.6 + n2 * 0.4;
    
    // Softer cutoff for cute neon feel
    float intensity = smoothstep(0.3, 0.7, combinedNoise + 0.5);
    
    vec3 finalColor = mix(colorStart, colorEnd, intensity);
    
    // Soft glow
    float glow = max(0.0, combinedNoise + 0.4);
    finalColor += vec3(0.3, 0.1, 0.4) * glow;

    gl_FragColor = vec4(finalColor, opacity);
  }
  `
);

// --- NEON BLUE SHADER (Player O) - Cute Neon Mint/Cyan ---
const NeonBlueShaderMaterial = shaderMaterial(
  {
    time: 0,
    colorStart: new THREE.Color('#00ffff'), // Cyan
    colorEnd: new THREE.Color('#00ffaa'),   // Mint Green
    opacity: 1.0,
  },
  // Vertex
  `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float time;
  ${noiseGLSL}
  void main() {
    vUv = uv;
    vPosition = position;
    vec3 pos = position;
    // Gentle wave movement
    float noiseVal = snoise(vec3(pos.x * 2.0, pos.y * 2.0 + time * 1.5, pos.z * 2.0));
    pos += normal * noiseVal * 0.08; 
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
  `,
  // Fragment
  `
  uniform float time;
  uniform vec3 colorStart;
  uniform vec3 colorEnd;
  uniform float opacity;
  varying vec2 vUv;
  varying vec3 vPosition;
  ${noiseGLSL}
  void main() {
    // Bubbbly/cloudy effect
    float n = snoise(vec3(vPosition.x * 3.0 + time * 0.5, vPosition.y * 3.0 + time * 0.5, vPosition.z * 3.0));
    float n2 = snoise(vec3(vPosition.x * 6.0 - time * 1.0, vPosition.y * 6.0 + time * 1.0, vPosition.z * 6.0));
    
    float combinedNoise = n * 0.6 + n2 * 0.4;
    
    // Mix colors
    vec3 finalColor = mix(colorStart, colorEnd, combinedNoise * 0.5 + 0.5);
    
    // Soft highlights
    float highlight = smoothstep(0.6, 0.9, combinedNoise);
    finalColor += vec3(0.8, 1.0, 0.9) * highlight * 0.6;

    gl_FragColor = vec4(finalColor, opacity * 0.9);
  }
  `
);

extend({ NeonRedShaderMaterial, NeonBlueShaderMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      neonRedShaderMaterial: ReactThreeFiber.Object3DNode<THREE.ShaderMaterial, typeof NeonRedShaderMaterial>;
      neonBlueShaderMaterial: ReactThreeFiber.Object3DNode<THREE.ShaderMaterial, typeof NeonBlueShaderMaterial>;
    }
  }
}

interface MaterialProps {
  opacity?: number;
  offset?: number;
}

export function NeonXMaterial({ opacity = 1.0, offset = 0 }: MaterialProps) {
  const ref = useRef<THREE.ShaderMaterial>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.uniforms.time.value = state.clock.getElapsedTime() + offset;
      ref.current.uniforms.opacity.value = opacity;
    }
  });
  return (
    <>
      <neonRedShaderMaterial ref={ref} transparent={true} />
      <Sparkles 
        count={12}
        scale={1.2}
        size={4}
        speed={0.3}
        opacity={0.8 * opacity}
        color="#ffccff"
        position={[0, 0, 0]}
      />
    </>
  );
}

export function NeonOMaterial({ opacity = 1.0, offset = 0 }: MaterialProps) {
  const ref = useRef<THREE.ShaderMaterial>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.uniforms.time.value = state.clock.getElapsedTime() + offset;
      ref.current.uniforms.opacity.value = opacity;
    }
  });

  return (
    <>
      <neonBlueShaderMaterial ref={ref} transparent={true} />
      
      {/* Minty sparkles */}
      <Sparkles 
        count={12}
        scale={1.1}
        size={3}
        speed={0.3}
        opacity={0.7 * opacity}
        color="#ccffff"
        position={[0, 0, 0]}
        noise={0.1}
      />
    </>
  );
}
