/**
 * Contextual Nodes Component
 *
 * Dynamic action nodes that appear based on context, location, and available interactions.
 * Float organically around the input area, pulsing to indicate availability.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

interface ContextualNode {
  id: string;
  label: string;
  icon?: React.ReactNode;
  command: string;
  category: 'movement' | 'observation' | 'interaction' | 'status' | 'special';
  priority?: number;
  available: boolean;
}

interface ContextualNodesProps {
  nodes: ContextualNode[];
  onCommand?: (command: string) => void;
  awareness?: number;
  className?: string;
}

export function ContextualNodes({
  nodes,
  onCommand,
  awareness = 0,
  className
}: ContextualNodesProps) {
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

  // Generate organic positions for nodes
  useEffect(() => {
    const newPositions: Record<string, { x: number; y: number }> = {};
    const angleStep = (Math.PI * 2) / Math.max(nodes.length, 1);
    const radius = Math.min(200, 100 + nodes.length * 10);

    nodes.forEach((node, index) => {
      // Spiral pattern that expands with more nodes
      const angle = index * angleStep;
      const spread = awareness > 50 ? 1.5 : 1;
      newPositions[node.id] = {
        x: Math.cos(angle) * radius * spread,
        y: Math.sin(angle) * radius * 0.6 * spread,
      };
    });

    setPositions(newPositions);
  }, [nodes, awareness]);

  const categoryColors = {
    movement: 'var(--fungus-glow)',
    observation: 'var(--awareness-bright)',
    interaction: 'var(--sentience-bright)',
    status: 'var(--clay-orange)',
    special: 'var(--rarity-legendary)',
  };

  const categoryIcons = {
    movement: '⟡',
    observation: '◉',
    interaction: '◈',
    status: '◐',
    special: '★',
  };

  return (
    <div className={cn('contextual-nodes relative', className)}>
      <AnimatePresence>
        {nodes.filter(n => n.available).map((node) => {
          const pos = positions[node.id] || { x: 0, y: 0 };
          const color = categoryColors[node.category];

          return (
            <motion.div
              key={node.id}
              className="contextual-node absolute"
              style={{
                left: `calc(50% + ${pos.x}px)`,
                top: `calc(50% + ${pos.y}px)`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: node.available ? 1 : 0.4,
                x: 0,
                y: 0,
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
                delay: Math.random() * 0.2,
              }}
              whileHover={{
                scale: 1.2,
                boxShadow: `0 0 20px ${color}`,
              }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onCommand?.(node.command)}
            >
              {/* Node orb */}
              <div
                className="relative w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
                style={{
                  background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
                  border: `1px solid ${color}`,
                  boxShadow: `0 0 10px ${color}60`,
                }}
              >
                {/* Icon */}
                <span
                  className="text-sm font-rajdhani"
                  style={{ color }}
                >
                  {node.icon || categoryIcons[node.category]}
                </span>

                {/* Orbiting particle */}
                <motion.div
                  className="absolute w-1 h-1 rounded-full"
                  style={{
                    background: color,
                    boxShadow: `0 0 4px ${color}`,
                    x: Math.cos(Date.now() / 1000) * 20,
                    y: Math.sin(Date.now() / 1000) * 20,
                  }}
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              </div>

              {/* Label tooltip */}
              <motion.div
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <span
                  className="text-xs font-rajdhani tracking-wider px-2 py-0.5 rounded"
                  style={{
                    background: 'var(--soil-deep)',
                    color: color,
                    border: `1px solid ${color}40`,
                  }}
                >
                  {node.label}
                </span>
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/**
 * Action Cluster Component
 *
 * Groups contextual nodes by category in organic clusters.
 */

interface ActionClusterProps {
  categories: Array<{
    id: string;
    name: string;
    nodes: ContextualNode[];
  }>;
  onCommand?: (command: string) => void;
  className?: string;
}

export function ActionCluster({
  categories,
  onCommand,
  className
}: ActionClusterProps) {
  return (
    <div className={cn('action-cluster', className)}>
      {categories.map((category) => (
        <div key={category.id} className="action-category mb-4">
          {/* Category header */}
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent" />
            <span className="text-xs font-rajdhani tracking-widest text-[var(--text-tertiary)] uppercase">
              {category.name}
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent" />
          </div>

          {/* Node grid */}
          <div className="grid grid-cols-4 gap-2">
            {category.nodes.map((node) => (
              <button
                key={node.id}
                onClick={() => onCommand?.(node.command)}
                className="action-node p-2 rounded border border-[var(--border-subtle)] hover:border-[var(--clay-orange)] transition-all bg-[var(--soil-deep)]/50 hover:bg-[var(--soil-medium)]/50"
                disabled={!node.available}
              >
                <div className="text-center">
                  <div className="text-lg mb-1">
                    {node.icon || '◦'}
                  </div>
                  <div className="text-[10px] font-rajdhani tracking-wide text-[var(--text-secondary)]">
                    {node.label}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
