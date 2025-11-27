import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';

const HolographicMaterial = shaderMaterial(
    {
        time: 0,
        color: new THREE.Color(0.0, 1.0, 1.0),
    },
    // Vertex Shader
    `
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float time;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    // Fragment Shader
    `
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float time;
    uniform vec3 color;

    void main() {
      vec3 viewDirection = normalize(cameraPosition - vPosition);
      float fresnel = pow(1.0 - dot(viewDirection, vNormal), 2.0);
      
      // Scanline effect
      float scanline = sin(vPosition.y * 50.0 + time * 5.0) * 0.5 + 0.5;
      
      // Glitch/Noise
      float noise = fract(sin(dot(vPosition.xy ,vec2(12.9898,78.233))) * 43758.5453);
      
      float alpha = fresnel * 0.8 + scanline * 0.2;
      
      gl_FragColor = vec4(color * (1.0 + scanline * 0.5), alpha);
    }
  `
);

extend({ HolographicMaterial });

export { HolographicMaterial };
