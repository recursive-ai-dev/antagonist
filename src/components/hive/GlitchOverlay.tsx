/**
 * Glitch Overlay Component
 *
 * Reality corruption effects that manifest when the simulation destabilizes.
 * Visual glitches, screen tearing, and chromatic aberration.
 */

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface GlitchOverlayProps {
  intensity?: number;
  glitchLevel?: number;
  active?: boolean;
  className?: string;
}

export function GlitchOverlay({
  intensity = 0.5,
  glitchLevel = 0,
  active = false,
  className
}: GlitchOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  useEffect(() => {
    if (!active || glitchLevel <= 0) return;

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
    };

    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      timeRef.current += 0.016;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      // Glitch intensity based on level
      const effectiveIntensity = Math.min(1, glitchLevel * intensity);
      const glitchChance = effectiveIntensity * 0.3;

      // Random horizontal slices
      if (Math.random() < glitchChance) {
        const sliceHeight = Math.random() * height * 0.1;
        const sliceY = Math.random() * height;
        const offset = (Math.random() - 0.5) * effectiveIntensity * 40;

        try {
          const imageData = ctx.getImageData(0, sliceY, width, sliceHeight);
          // Shift RGB channels for chromatic aberration
          ctx.putImageData(imageData, offset, sliceY);
        } catch (e) {
          // Ignore cross-origin errors
        }
      }

      // Chromatic aberration overlay
      if (Math.random() < glitchChance * 0.5) {
        const aberrationIntensity = effectiveIntensity * 0.3;
        
        // Red channel shift
        ctx.fillStyle = `rgba(255, 0, 0, ${aberrationIntensity * 0.3})`;
        ctx.fillRect(
          (Math.random() - 0.5) * effectiveIntensity * 20,
          0,
          width,
          height
        );

        // Blue channel shift
        ctx.fillStyle = `rgba(0, 0, 255, ${aberrationIntensity * 0.3})`;
        ctx.fillRect(
          (Math.random() - 0.5) * effectiveIntensity * 20,
          0,
          width,
          height
        );
      }

      // Scan lines
      ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + Math.sin(timeRef.current * 10) * 0.05})`;
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1);
      }

      // Noise overlay
      const noiseDensity = effectiveIntensity * 0.1;
      for (let i = 0; i < 100 * noiseDensity; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const brightness = Math.random() * 255;
        ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, 0.5)`;
        ctx.fillRect(x, y, 2, 2);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [active, glitchLevel, intensity]);

  if (!active || glitchLevel <= 0) return null;

  return (
    <>
      {/* Canvas-based glitch effects */}
      <motion.canvas
        ref={canvasRef}
        className={cn(
          'fixed inset-0 w-full h-full pointer-events-none z-50',
          className
        )}
        style={{
          mixBlendMode: 'screen',
          opacity: Math.min(0.8, glitchLevel * 0.6),
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: Math.min(0.8, glitchLevel * 0.6) }}
        aria-hidden="true"
      />

      {/* CSS-based glitch overlay */}
      <motion.div
        className={cn(
          'fixed inset-0 pointer-events-none z-40',
          'glitch-overlay'
        )}
        style={{
          background: `
            repeating-linear-gradient(
              0deg,
              rgba(0, 255, 255, ${glitchLevel * 0.05}),
              rgba(0, 255, 255, ${glitchLevel * 0.05}) 1px,
              transparent 1px,
              transparent 2px
            )
          `,
          opacity: glitchLevel * 0.3,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: glitchLevel * 0.3 }}
      />

      {/* Vignette distortion */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-30"
        style={{
          background: `radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, ${glitchLevel * 0.3}) 100%)`,
          boxShadow: `inset 0 0 ${glitchLevel * 100}px rgba(${255 * glitchLevel}, 0, ${255 * glitchLevel}, ${glitchLevel * 0.2})`,
        }}
        animate={{
          boxShadow: [
            `inset 0 0 ${glitchLevel * 100}px rgba(${255 * glitchLevel}, 0, ${255 * glitchLevel}, ${glitchLevel * 0.2})`,
            `inset 0 0 ${glitchLevel * 150}px rgba(0, ${255 * glitchLevel}, ${255 * glitchLevel}, ${glitchLevel * 0.2})`,
            `inset 0 0 ${glitchLevel * 100}px rgba(${255 * glitchLevel}, 0, ${255 * glitchLevel}, ${glitchLevel * 0.2})`,
          ],
        }}
        transition={{
          duration: 2 / (glitchLevel || 1),
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </>
  );
}

/**
 * Glitch Text Component
 *
 * Individual text elements that glitch and corrupt.
 */

interface GlitchTextProps {
  children: string;
  intensity?: number;
  className?: string;
}

export function GlitchText({
  children,
  intensity = 0.5,
  className
}: GlitchTextProps) {
  const glitchChars = '!@#$%^&*<>?/\\|~`';
  const [display, setDisplay] = useState(children);

  useEffect(() => {
    if (intensity <= 0) {
      setDisplay(children);
      return;
    }

    const glitchInterval = setInterval(() => {
      if (Math.random() < intensity * 0.3) {
        const chars = children.split('');
        const glitchCount = Math.floor(intensity * 3);
        
        for (let i = 0; i < glitchCount; i++) {
          const idx = Math.floor(Math.random() * chars.length);
          chars[idx] = glitchChars[Math.floor(Math.random() * glitchChars.length)];
        }
        
        setDisplay(chars.join(''));
        
        setTimeout(() => setDisplay(children), 100);
      }
    }, 1000 / (intensity || 1));

    return () => clearInterval(glitchInterval);
  }, [children, intensity]);

  return (
    <span
      className={cn('glitch-text', className)}
      style={{
        textShadow: `
          ${intensity * 2}px 0 rgba(255, 0, 0, ${intensity * 0.5}),
          ${-intensity * 2}px 0 rgba(0, 255, 255, ${intensity * 0.5})
        `,
      }}
    >
      {display}
    </span>
  );
}
