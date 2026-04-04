/**
 * Deterministic Feedback Engine
 * 
 * Ensures identical mechanical inputs always yield consistent perceptual outputs.
 * No feedback drift - same input = same output every time.
 */

import { GameState, TraversalMode, EmbraceMode, ComboTier } from '../types/game';

// ============================================================================
// FEEDBACK CONFIGURATION
// ============================================================================

export interface FeedbackConfig {
  audio: {
    typingSound: { frequency: number; duration: number; volume: number };
    glitchSound: { startFreq: number; endFreq: number; duration: number };
    successSound: { notes: number[]; tempo: number };
    unlockSound: { startFreq: number; endFreq: number; duration: number };
    notificationSound: { notes: number[]; duration: number };
    stanceActivateSound: { frequency: number; duration: number };
    momentumPeakSound: { notes: number[]; duration: number };
  };
  visual: {
    glitchIntensity: (awareness: number, glitchLevel: number) => number;
    stanceGlow: (momentum: number, mode: TraversalMode) => string;
    saturationColor: (level: number) => string;
    comboGlow: (tier: ComboTier) => string;
    momentumBarColor: (momentum: number) => string;
  };
  haptic: {
    // Future: Browser haptic API
    enabled: boolean;
  };
}

export const FEEDBACK_CONFIG: FeedbackConfig = {
  audio: {
    typingSound: { frequency: 800, duration: 50, volume: 0.3 },
    glitchSound: { startFreq: 200, endFreq: 800, duration: 300 },
    successSound: { notes: [523.25, 659.25, 783.99], tempo: 120 },
    unlockSound: { startFreq: 400, endFreq: 1200, duration: 500 },
    notificationSound: { notes: [880, 1100], duration: 150 },
    stanceActivateSound: { frequency: 600, duration: 200 },
    momentumPeakSound: { notes: [523.25, 659.25, 783.99, 1046.50], duration: 400 },
  },
  visual: {
    glitchIntensity: (awareness, glitchLevel) => {
      const baseIntensity = Math.min(1, awareness / 50);
      const glitchMultiplier = 1 + (glitchLevel * 0.1);
      return Math.min(1, baseIntensity * glitchMultiplier);
    },
    stanceGlow: (momentum, mode) => {
      if (momentum < 40) return 'transparent';
      
      const modeColors: Record<TraversalMode, string> = {
        walk: 'rgba(0, 255, 255, {alpha})',
        crawl: 'rgba(0, 255, 128, {alpha})',
        burrow: 'rgba(128, 0, 255, {alpha})',
      };

      const alpha = momentum >= 80 ? 0.8 : momentum >= 60 ? 0.5 : 0.3;
      return modeColors[mode].replace('{alpha}', alpha.toString());
    },
    saturationColor: (level) => {
      if (level <= 30) return 'rgb(34, 197, 94)';     // green
      if (level <= 60) return 'rgb(234, 179, 8)';     // yellow
      if (level <= 80) return 'rgb(249, 115, 22)';    // orange
      return 'rgb(239, 68, 68)';                       // red
    },
    comboGlow: (tier) => {
      const tierColors: Record<ComboTier, string> = {
        bronze: 'rgba(205, 127, 50, 0.5)',
        silver: 'rgba(192, 192, 192, 0.6)',
        gold: 'rgba(255, 215, 0, 0.7)',
        platinum: 'rgba(229, 228, 226, 0.8)',
      };
      return tierColors[tier];
    },
    momentumBarColor: (momentum) => {
      if (momentum < 30) return 'rgb(100, 100, 100)';
      if (momentum < 50) return 'rgb(34, 197, 94)';   // green
      if (momentum < 70) return 'rgb(59, 130, 246)';  // blue
      if (momentum < 90) return 'rgb(234, 179, 8)';   // yellow
      return 'rgb(249, 115, 22)';                     // orange
    },
  },
  haptic: {
    enabled: false, // Browser support limited
  },
};

// ============================================================================
// SEEDED RANDOM NUMBER GENERATOR
// ============================================================================

/**
 * Deterministic RNG for feedback generation
 * Same seed = same "random" output every time
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    // Linear Congruential Generator
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  nextRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  pick<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }
}

// ============================================================================
// FEEDBACK ENGINE CLASS
// ============================================================================

export interface FeedbackResult {
  audio?: {
    type: string;
    params: Record<string, number>;
  };
  visual?: {
    effect: string;
    intensity: number;
    color?: string;
  };
  haptic?: {
    pattern: number[];
    duration: number;
  };
}

export class FeedbackEngine {
  private seedCounter: number = Date.now();

  /**
   * Generate deterministic feedback for an action
   */
  generateFeedback(
    actionType: string,
    gameState: GameState,
    context: Record<string, unknown>
  ): FeedbackResult {
    // Create deterministic seed from game state
    const seed = this.createSeed(gameState, context);
    const rng = new SeededRandom(seed);

    switch (actionType) {
      case 'movement':
        return this.generateMovementFeedback(gameState, rng);
      case 'examine':
        return this.generateExamineFeedback(gameState, rng);
      case 'glitch':
        return this.generateGlitchFeedback(gameState, rng, context);
      case 'stance_activate':
        return this.generateStanceActivateFeedback(gameState, rng);
      case 'momentum_peak':
        return this.generateMomentumPeakFeedback(gameState, rng);
      case 'combo_tier_up':
        return this.generateComboTierUpFeedback(gameState, rng);
      case 'saturation_warning':
        return this.generateSaturationWarningFeedback(gameState, rng);
      default:
        return {};
    }
  }

  /**
   * Create deterministic seed from state
   */
  private createSeed(
    gameState: GameState,
    context: Record<string, unknown>
  ): number {
    // Hash game state into seed
    let hash = gameState.currentRoom.length;
    hash += Math.floor(gameState.awareness);
    hash += Math.floor(gameState.colonySentience);
    hash += Math.floor(gameState.traversalMomentum);
    hash += gameState.visitedRooms.length;
    
    // Add context factors
    for (const [key, value] of Object.entries(context)) {
      if (typeof value === 'number') {
        hash += Math.floor(value);
      } else if (typeof value === 'string') {
        hash += value.length;
      }
    }

    return hash * 1000 + this.seedCounter++;
  }

  /**
   * Generate movement feedback
   */
  private generateMovementFeedback(
    gameState: GameState,
    rng: SeededRandom
  ): FeedbackResult {
    const momentum = gameState.traversalMomentum;
    const mode = gameState.traversalMode;
    const stanceActive = !!gameState.activeStanceBonus;

    // Visual feedback based on momentum
    const glowColor = FEEDBACK_CONFIG.visual.stanceGlow(momentum, mode);
    const intensity = momentum / 100;

    return {
      visual: {
        effect: stanceActive ? 'stance_glow' : 'momentum_build',
        intensity,
        color: glowColor,
      },
    };
  }

  /**
   * Generate examine feedback
   */
  private generateExamineFeedback(
    gameState: GameState,
    _rng: SeededRandom
  ): FeedbackResult {
    const saturation = gameState.actionSaturation['examine'] || 0;
    const color = FEEDBACK_CONFIG.visual.saturationColor(saturation);

    return {
      visual: {
        effect: 'saturation_indicator',
        intensity: saturation / 100,
        color,
      },
    };
  }

  /**
   * Generate glitch feedback
   */
  private generateGlitchFeedback(
    gameState: GameState,
    rng: SeededRandom,
    context: Record<string, unknown>
  ): FeedbackResult {
    const intensity = FEEDBACK_CONFIG.visual.glitchIntensity(
      gameState.awareness,
      gameState.glitchLevel
    );

    const embraceMode = context.embraceMode as EmbraceMode | undefined;
    let color = 'rgba(255, 0, 255, 0.5)';
    
    if (embraceMode === 'accept') {
      color = 'rgba(0, 255, 255, 0.6)';
    } else if (embraceMode === 'amplify') {
      color = 'rgba(255, 0, 0, 0.7)';
    } else if (embraceMode === 'redirect') {
      color = 'rgba(0, 255, 0, 0.6)';
    }

    return {
      visual: {
        effect: 'reality_flicker',
        intensity,
        color,
      },
      audio: {
        type: 'glitchSound',
        params: {
          startFreq: FEEDBACK_CONFIG.audio.glitchSound.startFreq,
          endFreq: FEEDBACK_CONFIG.audio.glitchSound.endFreq,
          duration: FEEDBACK_CONFIG.audio.glitchSound.duration,
        },
      },
    };
  }

  /**
   * Generate stance activation feedback
   */
  private generateStanceActivateFeedback(
    gameState: GameState,
    _rng: SeededRandom
  ): FeedbackResult {
    const mode = gameState.traversalMode;
    const momentum = gameState.traversalMomentum;

    return {
      visual: {
        effect: 'stance_activate',
        intensity: momentum / 100,
        color: FEEDBACK_CONFIG.visual.stanceGlow(momentum, mode),
      },
      audio: {
        type: 'stanceActivateSound',
        params: {
          frequency: FEEDBACK_CONFIG.audio.stanceActivateSound.frequency,
          duration: FEEDBACK_CONFIG.audio.stanceActivateSound.duration,
        },
      },
    };
  }

  /**
   * Generate momentum peak feedback
   */
  private generateMomentumPeakFeedback(
    _gameState: GameState,
    _rng: SeededRandom
  ): FeedbackResult {
    return {
      audio: {
        type: 'momentumPeakSound',
        params: {
          notes: FEEDBACK_CONFIG.audio.momentumPeakSound.notes,
          duration: FEEDBACK_CONFIG.audio.momentumPeakSound.duration,
        },
      },
      visual: {
        effect: 'momentum_peak',
        intensity: 1.0,
        color: 'rgba(255, 215, 0, 0.8)',
      },
    };
  }

  /**
   * Generate combo tier up feedback
   */
  private generateComboTierUpFeedback(
    gameState: GameState,
    _rng: SeededRandom
  ): FeedbackResult {
    const tier = gameState.activeCombo?.tier || 'bronze';

    return {
      visual: {
        effect: 'combo_tier_up',
        intensity: 0.8,
        color: FEEDBACK_CONFIG.visual.comboGlow(tier),
      },
      audio: {
        type: 'successSound',
        params: {
          notes: FEEDBACK_CONFIG.audio.successSound.notes,
          tempo: FEEDBACK_CONFIG.audio.successSound.tempo,
        },
      },
    };
  }

  /**
   * Generate saturation warning feedback
   */
  private generateSaturationWarningFeedback(
    gameState: GameState,
    _rng: SeededRandom
  ): FeedbackResult {
    const saturationValues = Object.values(gameState.actionSaturation);
    const maxSaturation = Math.max(...saturationValues, 0);
    const color = FEEDBACK_CONFIG.visual.saturationColor(maxSaturation);

    return {
      visual: {
        effect: 'saturation_warning',
        intensity: maxSaturation / 100,
        color,
      },
    };
  }

  /**
   * Get narrative description for momentum level
   */
  getMomentumDescription(momentum: number): string {
    if (momentum < 20) return 'You move hesitantly';
    if (momentum < 40) return 'You find your rhythm';
    if (momentum < 60) return 'You move with building momentum';
    if (momentum < 80) return 'You move with flowing momentum';
    return 'You move as one with the tunnel';
  }

  /**
   * Get narrative description for saturation level
   */
  getSaturationDescription(saturation: number): string {
    if (saturation < 30) return 'Your actions feel fresh and fluid';
    if (saturation < 60) return 'Repetition dulls your senses';
    if (saturation < 80) return 'You struggle against monotony';
    return 'Your actions feel hollow and forced';
  }

  /**
   * Get narrative description for combo tier
   */
  getComboDescription(tier: ComboTier): string {
    const descriptions: Record<ComboTier, string> = {
      bronze: 'You find a rhythm',
      silver: 'Your actions flow together',
      gold: 'Perfect synergy guides your path',
      platinum: 'You move as one with the simulation',
    };
    return descriptions[tier];
  }
}

// ============================================================================
// FEEDBACK CONSISTENCY VALIDATOR
// ============================================================================

export interface ConsistencyCheck {
  action_type: string;
  state_hash: string;
  feedback_hash: string;
  consistent: boolean;
  timestamp: number;
}

export class FeedbackValidator {
  private history: Map<string, FeedbackResult> = new Map();
  private checks: ConsistencyCheck[] = [];

  /**
   * Validate feedback consistency
   */
  validate(
    actionType: string,
    gameState: GameState,
    feedback: FeedbackResult
  ): ConsistencyCheck {
    const stateHash = this.hashState(gameState);
    const feedbackHash = this.hashFeedback(feedback);
    const key = `${actionType}_${stateHash}`;

    const previousFeedback = this.history.get(key);
    const consistent = previousFeedback 
      ? this.feedbackEquals(previousFeedback, feedback)
      : true;

    // Store for future comparison
    this.history.set(key, feedback);

    // Record check
    const check: ConsistencyCheck = {
      action_type: actionType,
      state_hash: stateHash,
      feedback_hash: feedbackHash,
      consistent,
      timestamp: Date.now(),
    };

    this.checks.push(check);
    if (this.checks.length > 100) {
      this.checks = this.checks.slice(-100);
    }

    return check;
  }

  /**
   * Hash game state for comparison
   */
  private hashState(gameState: GameState): string {
    return `${gameState.currentRoom}_${
      Math.floor(gameState.awareness)}_${
      Math.floor(gameState.colonySentience)}_${
      Math.floor(gameState.traversalMomentum)}`;
  }

  /**
   * Hash feedback for comparison
   */
  private hashFeedback(feedback: FeedbackResult): string {
    return JSON.stringify(feedback);
  }

  /**
   * Compare two feedback results
   */
  private feedbackEquals(a: FeedbackResult, b: FeedbackResult): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  /**
   * Get consistency report
   */
  getConsistencyReport(): {
    total_checks: number;
    consistent_count: number;
    inconsistent_count: number;
    consistency_rate: number;
  } {
    const consistent = this.checks.filter(c => c.consistent).length;
    const total = this.checks.length;

    return {
      total_checks: total,
      consistent_count: consistent,
      inconsistent_count: total - consistent,
      consistency_rate: total > 0 ? consistent / total : 1,
    };
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history.clear();
    this.checks = [];
  }
}

// ============================================================================
// SINGLETON EXPORTS
// ============================================================================

export const feedbackEngine = new FeedbackEngine();
export const feedbackValidator = new FeedbackValidator();
