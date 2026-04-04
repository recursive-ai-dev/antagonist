/**
 * Motion Presets - Centralized Animation Configurations
 * 
 * All motion values reference design tokens - no hardcoded values.
 * Motion reflects spatial relationships: enter from below = rising.
 */

import type { Variants, Transition } from 'framer-motion';

// ============================================================================
// TOKEN REFERENCES (via CSS custom properties converted to JS values)
// ============================================================================

const motionDurations = {
  instant: 0,
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
  slower: 0.6,
  button: 0.15,
  modalEnter: 0.25,
  modalExit: 0.15,
  toastEnter: 0.4,
  toastExit: 0.3,
  menuSlide: 0.3,
  tooltip: 0.15,
  progressFill: 0.5,
  terminalLine: 0.2,
  switch: 0.2,
} as const;

const easingFunctions = {
  enter: [0.4, 0, 0.2, 1] as const,
  exit: [0.4, 0, 1, 1] as const,
  spring: [0.5, 0, 0.2, 1.5] as const,
  smooth: [0.25, 0.1, 0.25, 1] as const,
  bounce: [0.68, -0.55, 0.265, 1.55] as const,
  buttonHover: [0.4, 0, 0.2, 1] as const,
  buttonTap: [0.4, 0, 1, 1] as const,
  modal: [0.4, 0, 0.2, 1] as const,
  toast: [0.34, 1.56, 0.64, 1] as const,
  switch: [0.5, 0, 0.2, 1.5] as const,
} as const;

// ============================================================================
// BUTTON MOTION PRESETS
// ============================================================================

export const buttonVariants: Variants = {
  idle: {
    scale: 1,
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: motionDurations.button,
      ease: easingFunctions.buttonHover,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: motionDurations.button,
      ease: easingFunctions.buttonTap,
    },
  },
  disabled: {
    scale: 1,
    opacity: 0.5,
  },
};

export const buttonTransition: Transition = {
  type: 'tween',
  duration: motionDurations.button,
};

// ============================================================================
// MODAL MOTION PRESETS
// ============================================================================

export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: motionDurations.modalEnter,
      ease: easingFunctions.modal,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: motionDurations.modalExit,
      ease: easingFunctions.exit,
    },
  },
};

export const modalOverlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

// Alias for backwards compatibility
export { modalOverlayVariants as overlayVariants };

// ============================================================================
// TOAST MOTION PRESETS
// ============================================================================

export const toastVariants: Variants = {
  hidden: {
    y: 100,
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 300,
      duration: motionDurations.toastEnter,
    },
  },
  exit: {
    y: 50,
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: motionDurations.toastExit,
      ease: easingFunctions.exit,
    },
  },
};

// ============================================================================
// PROGRESS BAR MOTION PRESETS
// ============================================================================

export const progressFillTransition: Transition = {
  duration: motionDurations.progressFill,
  ease: easingFunctions.enter,
};

export const progressShimmerAnimation = {
  x: ['-100%', '100%'],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: easingFunctions.smooth,
  },
};

// ============================================================================
// SWITCH MOTION PRESETS
// ============================================================================

export const switchThumbTransition: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
  duration: motionDurations.switch,
};

// ============================================================================
// TERMINAL LINE MOTION PRESETS
// ============================================================================

export const terminalLineVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -10,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: motionDurations.terminalLine,
      ease: easingFunctions.enter,
    },
  },
};

// ============================================================================
// MENU PANEL MOTION PRESETS
// ============================================================================

export const menuPanelVariants: Variants = {
  hidden: {
    x: '100%',
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 200,
      duration: motionDurations.menuSlide,
    },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: {
      duration: motionDurations.menuSlide,
      ease: easingFunctions.exit,
    },
  },
};

// ============================================================================
// TOOLTIP MOTION PRESETS
// ============================================================================

export const tooltipVariants: Variants = {
  hidden: (side: 'top' | 'bottom' | 'left' | 'right' = 'top') => ({
    opacity: 0,
    y: side === 'top' ? 4 : side === 'bottom' ? -4 : 0,
    x: side === 'left' ? 4 : side === 'right' ? -4 : 0,
  }),
  visible: {
    opacity: 1,
    y: 0,
    x: 0,
    transition: {
      duration: motionDurations.tooltip,
      ease: easingFunctions.enter,
    },
  },
  exit: {
    opacity: 0,
    y: 4,
    transition: {
      duration: motionDurations.tooltip,
      ease: easingFunctions.exit,
    },
  },
};

// ============================================================================
// CARD MOTION PRESETS
// ============================================================================

export const cardVariants: Variants = {
  idle: {
    y: 0,
  },
  hover: {
    y: -2,
    transition: {
      duration: motionDurations.fast,
      ease: easingFunctions.enter,
    },
  },
};

// ============================================================================
// EXPANSION/COLLAPSE MOTION PRESETS
// ============================================================================

export const expansionVariants: Variants = {
  hidden: {
    height: 0,
    opacity: 0,
  },
  visible: {
    height: 'auto',
    opacity: 1,
    transition: {
      duration: motionDurations.fast,
      ease: easingFunctions.enter,
    },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      duration: motionDurations.fast,
      ease: easingFunctions.exit,
    },
  },
};

// ============================================================================
// REDUCED MOTION OVERRIDES
// ============================================================================

export const reducedMotionTransition: Transition = {
  duration: 0,
};

export function getMotionConfig(prefersReducedMotion: boolean) {
  return {
    transition: prefersReducedMotion ? reducedMotionTransition : undefined,
    initial: prefersReducedMotion ? false : undefined,
  };
}

// ============================================================================
// EXPORT ALL PRESETS
// ============================================================================

export const motionPresets = {
  button: {
    variants: buttonVariants,
    transition: buttonTransition,
  },
  modal: {
    variants: modalVariants,
    overlayVariants: modalOverlayVariants,
  },
  toast: {
    variants: toastVariants,
  },
  progress: {
    fillTransition: progressFillTransition,
    shimmerAnimation: progressShimmerAnimation,
  },
  switch: {
    thumbTransition: switchThumbTransition,
  },
  terminal: {
    lineVariants: terminalLineVariants,
  },
  menu: {
    panelVariants: menuPanelVariants,
  },
  tooltip: {
    variants: tooltipVariants,
  },
  card: {
    variants: cardVariants,
  },
  expansion: {
    variants: expansionVariants,
  },
  reducedMotion: {
    transition: reducedMotionTransition,
  },
} as const;
