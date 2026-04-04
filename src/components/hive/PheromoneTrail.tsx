/**
 * Pheromone Trail Component
 *
 * Visualizes command history as fading pheromone trails.
 * Commands leave traces that slowly dissipate over time.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

interface PheromoneTrailProps {
  commands: string[];
  maxTrails?: number;
  className?: string;
}

interface Trail {
  id: number;
  command: string;
  timestamp: number;
  x: number;
  y: number;
}

export function PheromoneTrail({
  commands,
  maxTrails = 5,
  className
}: PheromoneTrailProps) {
  const [trails, setTrails] = useState<Trail[]>([]);
  const trailIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (commands.length === 0) return;

    const lastCommand = commands[commands.length - 1];
    const prevCommand = commands[commands.length - 2];

    // Only add new trail if command changed
    if (lastCommand !== prevCommand) {
      const rect = containerRef.current?.getBoundingClientRect();
      
      setTrails(prev => {
        const newTrail: Trail = {
          id: trailIdRef.current++,
          command: lastCommand,
          timestamp: Date.now(),
          x: Math.random() * 20,
          y: Math.random() * 10 - 5,
        };

        const updated = [...prev, newTrail].slice(-maxTrails);
        return updated;
      });
    }
  }, [commands, maxTrails]);

  // Clean up old trails
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setTrails(prev => prev.filter(trail => now - trail.timestamp < 3000));
    }, 500);

    return () => clearInterval(cleanup);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('pheromone-trail-container relative', className)}
    >
      <AnimatePresence>
        {trails.map((trail, index) => {
          const age = Date.now() - trail.timestamp;
          const opacity = 1 - (age / 3000);
          const yOffset = Math.sin(age / 500) * 2;

          if (opacity <= 0) return null;

          return (
            <motion.div
              key={trail.id}
              className="pheromone-trail absolute left-0 text-xs font-rajdhani tracking-wider"
              style={{
                top: `${index * 20 + trail.y}px`,
                opacity: opacity * 0.4,
                transform: `translateX(${trail.x}px) translateY(${yOffset}px)`,
              }}
              initial={{ x: -20, opacity: 0 }}
              animate={{ 
                x: 0, 
                opacity: opacity * 0.4,
              }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-pheromone-medium">
                {'> '}
              </span>
              <span className="text-pheromone-bright">
                {trail.command}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/**
 * Pheromone Link Component
 *
 * Shows connections between related commands or locations.
 */

interface PheromoneLinkProps {
  from: string;
  to: string;
  strength?: number;
  animated?: boolean;
}

export function PheromoneLink({
  from,
  to,
  strength = 1,
  animated = true
}: PheromoneLinkProps) {
  return (
    <motion.div
      className="pheromone-link"
      initial={{ opacity: 0, pathLength: 0 }}
      animate={{ 
        opacity: strength * 0.5,
        pathLength: 1,
      }}
      transition={{ duration: 1 }}
    >
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <motion.path
          d="M 0 50 Q 50 25 100 50"
          fill="none"
          stroke="var(--pheromone-medium)"
          strokeWidth="1"
          strokeDasharray="5 5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5 }}
        />
        {animated && (
          <circle r="2" fill="var(--pheromone-bright)">
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              path="M 0 50 Q 50 25 100 50"
            />
          </circle>
        )}
      </svg>
    </motion.div>
  );
}
