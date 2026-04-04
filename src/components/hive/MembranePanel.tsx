/**
 * Membrane Panel Component
 *
 * Organic, breathing container that mimics cell membrane behavior.
 * Used for text output, input areas, and UI panels.
 */

import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/utils/cn';

interface MembranePanelProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'narrative' | 'input' | 'interactive' | 'alert';
  pulse?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

export function MembranePanel({
  variant = 'default',
  pulse = false,
  glow = false,
  children,
  className,
  ...props
}: MembranePanelProps) {
  const variantClasses = {
    default: 'membrane-default',
    narrative: 'membrane-narrative',
    input: 'membrane-input',
    interactive: 'membrane-interactive',
    alert: 'membrane-alert',
  };

  return (
    <motion.div
      className={cn(
        'membrane-panel',
        variantClasses[variant],
        pulse && 'membrane-pulse',
        glow && 'membrane-glow',
        className
      )}
      initial={{ scale: 0.98, opacity: 0.9 }}
      animate={{ 
        scale: pulse ? [0.98, 1, 0.98] : 1,
        opacity: 1 
      }}
      transition={{
        scale: {
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        },
        opacity: { duration: 0.3 }
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Membrane Border Component
 *
 * Animated organic border that flows around content.
 */

interface MembraneBorderProps {
  className?: string;
  intensity?: number;
  color?: 'awareness' | 'sentience' | 'glitch' | 'default';
}

export function MembraneBorder({
  className,
  intensity = 1,
  color = 'default'
}: MembraneBorderProps) {
  const colorClasses = {
    default: 'membrane-border-default',
    awareness: 'membrane-border-awareness',
    sentience: 'membrane-border-sentience',
    glitch: 'membrane-border-glitch',
  };

  return (
    <motion.div
      className={cn(
        'membrane-border',
        colorClasses[color],
        className
      )}
      style={{
        '--border-intensity': intensity,
      } as React.CSSProperties}
      initial={{ opacity: 0 }}
      animate={{ opacity: intensity }}
      transition={{ duration: 0.5 }}
    />
  );
}
