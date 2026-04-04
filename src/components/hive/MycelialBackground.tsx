/**
 * Mycelial Background Component
 *
 * Living neural network that represents the colony's consciousness.
 * Pulses and reacts to player actions, awareness levels, and colony sentience.
 */

import { useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

interface MycelialBackgroundProps {
  awareness?: number;
  sentience?: number;
  glitchLevel?: number;
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  brightness: number;
  pulsePhase: number;
}

interface Connection {
  from: number;
  to: number;
  thickness: number;
  flow: number;
}

export function MycelialBackground({
  awareness = 0,
  sentience = 0,
  glitchLevel = 0
}: MycelialBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  // Generate mycelial network
  const generateNetwork = useMemo(() => (width: number, height: number) => {
    const nodeCount = Math.floor((width * height) / 15000);
    const nodes: Node[] = [];
    const connections: Connection[] = [];

    // Generate nodes with organic distribution
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = Math.sqrt(i / nodeCount) * Math.min(width, height) * 0.4;
      const x = width / 2 + Math.cos(angle) * radius * 1.5;
      const y = height / 2 + Math.sin(angle) * radius;

      nodes.push({
        x: x + (Math.random() - 0.5) * 100,
        y: y + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        radius: 2 + Math.random() * 4,
        brightness: 0.3 + Math.random() * 0.4,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    // Create connections based on proximity (mycelial growth pattern)
    const maxDistance = Math.min(width, height) * 0.15;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < maxDistance) {
          connections.push({
            from: i,
            to: j,
            thickness: (1 - distance / maxDistance) * 2,
            flow: Math.random() * 0.5 + 0.5,
          });
        }
      }
    }

    return { nodes, connections };
  }, []);

  // Initialize network
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const { nodes, connections } = generateNetwork(rect.width, rect.height);
      nodesRef.current = nodes;
      connectionsRef.current = connections;
    };

    resize();
    window.addEventListener('resize', resize);

    return () => window.removeEventListener('resize', resize);
  }, [generateNetwork]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      timeRef.current += 0.016;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      const nodes = nodesRef.current;
      const connections = connectionsRef.current;

      // Awareness affects overall brightness
      const baseBrightness = 0.3 + (awareness / 100) * 0.5;
      // Sentience affects pulse speed
      const pulseSpeed = 1 + (sentience / 100) * 2;
      // Glitch affects color shift
      const glitchShift = glitchLevel * 0.1;

      // Draw connections first (below nodes)
      connections.forEach((conn) => {
        const fromNode = nodes[conn.from];
        const toNode = nodes[conn.to];

        const flowOffset = Math.sin(timeRef.current * pulseSpeed + conn.flow * Math.PI * 2) * 0.3;
        const alpha = (fromNode.brightness + toNode.brightness) / 2 * baseBrightness * (0.5 + flowOffset * 0.5);

        // Gradient along connection
        const gradient = ctx.createLinearGradient(fromNode.x, fromNode.y, toNode.x, toNode.y);
        
        const fromColor = `rgba(184, 246, 164, ${alpha * 0.8})`;
        const toColor = `rgba(107, 167, 90, ${alpha * 0.6})`;
        
        gradient.addColorStop(0, fromColor);
        gradient.addColorStop(0.5, `rgba(160, 200, 140, ${alpha})`);
        gradient.addColorStop(1, toColor);

        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = conn.thickness;
        ctx.stroke();
      });

      // Draw nodes
      nodes.forEach((node) => {
        // Update position
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Pulse brightness
        const pulse = Math.sin(timeRef.current * pulseSpeed + node.pulsePhase) * 0.2 + 0.8;
        const brightness = node.brightness * baseBrightness * pulse;

        // Node glow
        const glowRadius = node.radius * (2 + brightness * 2);
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, glowRadius
        );

        // Color shifts with glitch level
        const r = Math.floor(184 - glitchShift * 50);
        const g = Math.floor(246 - glitchShift * 100);
        const b = Math.floor(164 - glitchShift * 30);

        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${brightness})`);
        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${brightness * 0.3})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Node core
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232, 255, 220, ${brightness * 1.2})`;
        ctx.fill();
      });

      // Glitch effects
      if (glitchLevel > 0.3) {
        const glitchChance = (glitchLevel - 0.3) * 0.5;
        if (Math.random() < glitchChance) {
          const sliceHeight = Math.random() * height * 0.1;
          const sliceY = Math.random() * height;
          const offset = (Math.random() - 0.5) * glitchLevel * 20;

          try {
            const imageData = ctx.getImageData(0, sliceY, width, sliceHeight);
            ctx.putImageData(imageData, offset, sliceY);
          } catch (e) {
            // Ignore cross-origin errors
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [awareness, sentience, glitchLevel]);

  return (
    <motion.canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{
        opacity: 0.4 + (awareness / 100) * 0.3,
        mixBlendMode: 'screen',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.4 + (awareness / 100) * 0.3 }}
      transition={{ duration: 2 }}
      aria-hidden="true"
    />
  );
}
