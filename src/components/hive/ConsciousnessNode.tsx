/**
 * Consciousness Node Component
 *
 * Represents stat values as glowing nodes in the colony's neural network.
 * Used for awareness, sentience, and other key metrics.
 */

import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface ConsciousnessNodeProps {
  label: string;
  value: number;
  maxValue?: number;
  type?: 'awareness' | 'sentience' | 'momentum' | 'saturation' | 'glitch';
  size?: 'small' | 'medium' | 'large';
  showValue?: boolean;
  showLabel?: boolean;
  pulsing?: boolean;
  className?: string;
  onClick?: () => void;
}

export function ConsciousnessNode({
  label,
  value,
  maxValue = 100,
  type = 'awareness',
  size = 'medium',
  showValue = true,
  showLabel = true,
  pulsing = true,
  className,
  onClick
}: ConsciousnessNodeProps) {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));

  const typeConfig = {
    awareness: {
      color: 'var(--awareness-bright)',
      glow: 'rgba(232, 200, 104, 0.5)',
      bg: 'var(--awareness-dark)',
    },
    sentience: {
      color: 'var(--sentience-bright)',
      glow: 'rgba(232, 150, 120, 0.5)',
      bg: 'var(--sentience-dark)',
    },
    momentum: {
      color: 'var(--fungus-glow)',
      glow: 'rgba(184, 246, 164, 0.5)',
      bg: 'var(--fungus-dark)',
    },
    saturation: {
      color: 'var(--clay-orange)',
      glow: 'rgba(160, 104, 56, 0.5)',
      bg: 'var(--soil-deep)',
    },
    glitch: {
      color: 'var(--glitch-magenta)',
      glow: 'rgba(255, 0, 255, 0.5)',
      bg: 'var(--soil-deep)',
    },
  };

  const config = typeConfig[type];

  const sizeConfig = {
    small: {
      node: 'w-8 h-8',
      text: 'text-xs',
      glow: '0 0 10px',
    },
    medium: {
      node: 'w-12 h-12',
      text: 'text-sm',
      glow: '0 0 15px',
    },
    large: {
      node: 'w-16 h-16',
      text: 'text-base',
      glow: '0 0 20px',
    },
  };

  const sizes = sizeConfig[size];

  return (
    <motion.div
      className={cn(
        'consciousness-node',
        className
      )}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Node container */}
      <div className="flex items-center gap-2">
        {/* Glowing node */}
        <motion.div
          className={cn(
            'relative rounded-full flex items-center justify-center',
            sizes.node
          )}
          style={{
            background: `radial-gradient(circle, ${config.color} 0%, ${config.bg} 70%)`,
            boxShadow: `${sizes.glow} ${config.glow}`,
          }}
          animate={pulsing ? {
            scale: [1, 1.1, 1],
            boxShadow: [
              `${sizes.glow} ${config.glow}`,
              `${sizes.glow} ${config.glow.replace('0.5', '0.8')}`,
              `${sizes.glow} ${config.glow}`,
            ],
          } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Inner core */}
          <div
            className="w-1/2 h-1/2 rounded-full bg-white/80"
            style={{
              filter: 'blur(1px)',
            }}
          />
        </motion.div>

        {/* Label and value */}
        {(showLabel || showValue) && (
          <div className="flex flex-col">
            {showLabel && (
              <span className={cn(
                'text-[var(--text-secondary)] font-rajdhani tracking-wide',
                sizes.text
              )}>
                {label}
              </span>
            )}
            {showValue && (
              <motion.span
                className={cn(
                  'font-bold font-rajdhani',
                  sizes.text,
                  type === 'awareness' && 'text-awareness-bright',
                  type === 'sentience' && 'text-sentience-bright',
                  type === 'momentum' && 'text-fungus-glow',
                  type === 'saturation' && 'text-clay-orange',
                  type === 'glitch' && 'text-glitch-magenta'
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {Math.round(value)}{maxValue === 100 ? '%' : ''}
              </motion.span>
            )}
          </div>
        )}
      </div>

      {/* Progress ring for detailed view */}
      {size === 'large' && (
        <motion.svg
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 100 100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Background ring */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="var(--soil-deep)"
            strokeWidth="4"
          />
          {/* Progress ring */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={config.color}
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ strokeDasharray: '0 283' }}
            animate={{
              strokeDasharray: `${(percentage / 100) * 283} ${283 - (percentage / 100) * 283}`,
            }}
            transition={{ duration: 0.5 }}
            style={{
              filter: `drop-shadow(0 0 4px ${config.glow})`,
            }}
          />
        </motion.svg>
      )}
    </motion.div>
  );
}

/**
 * Node Cluster Component
 *
 * Groups multiple consciousness nodes in an organic arrangement.
 */

interface NodeClusterProps {
  nodes: Array<{
    id: string;
    label: string;
    value: number;
    type: ConsciousnessNodeProps['type'];
  }>;
  className?: string;
}

export function NodeCluster({ nodes, className }: NodeClusterProps) {
  return (
    <motion.div
      className={cn(
        'node-cluster',
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center gap-4 flex-wrap">
        {nodes.map((node, index) => (
          <ConsciousnessNode
            key={node.id}
            label={node.label}
            value={node.value}
            type={node.type}
            size="medium"
            delay={index * 0.1}
          />
        ))}
      </div>
    </motion.div>
  );
}
