/**
 * Glitch Prediction System - UPGRADED
 *
 * Features:
 * - Three embrace modes: Accept, Amplify, Redirect
 * - Glitch debt mechanic (risk accumulation)
 * - Chaos affinity (mastery progression)
 * - Prediction accuracy tracking
 * - Sequential mode unlocking
 */

import { GlitchPrediction, BuildArchetype } from '../types/game';

// ============================================================================
// GLITCH PREDICTION TYPES
// ============================================================================

export type GlitchType = 'visual' | 'audio' | 'narrative' | 'mechanical';

export type EmbraceMode = 'accept' | 'amplify' | 'redirect';

export interface PredictionContext {
  awareness: number;
  glitchLevel: number;
  buildArchetype: BuildArchetype;
  recentGlitches: number;
  roomGlitchChance: number;
  chaosAffinity: number;
}

export interface PredictionResult {
  prediction: GlitchPrediction | null;
  confidence: number;
  reason: string;
  mode: GlitchType;
}

export interface EmbraceResult {
  success: boolean;
  mode: EmbraceMode;
  bonus: number;
  glitchDebt: number;
  accuracyUpdated: boolean;
  description: string;
}

// ============================================================================
// PREDICTION ENGINE CONSTANTS
// ============================================================================

export const PREDICTION_CONFIG = {
  BASE_THRESHOLD: 40, // Minimum awareness for predictions
  MAX_PREDICTION_CHANCE: 0.35, // Max 35% chance to predict
  EXPIRY_COMMANDS_MIN: 3,
  EXPIRY_COMMANDS_MAX: 5,
  EXPIRY_MS: 60000, // 60 seconds max lifetime
  
  // Embrace mode effects
  ACCEPT_BONUS: 2.0,
  AMPLIFY_BONUS: 4.0,
  AMPLIFY_DEBT: 2, // Glitch debt per amplify
  REDIRECT_SUCCESS_CHANCE: 0.8, // 80% chance to cancel next glitch
  
  // Chaos affinity scaling
  AFFINITY_GAIN_ON_ACCURATE: 0.05,
  AFFINITY_LOSS_ON_INACCURATE: 0.02,
  AFFINITY_DECAY_RATE: 0.01, // Per minute
  MAX_AFFINITY: 1.0,
  
  // Mode unlock thresholds
  ACCEPT_UNLOCK: 40, // Awareness
  AMPLIFY_UNLOCK: 60, // Awareness
  REDIRECT_UNLOCK: 80, // Awareness
};

// ============================================================================
// PREDICTION CHANCE CALCULATION
// ============================================================================

/**
 * Calculate glitch prediction chance based on player state
 */
export function calculatePredictionChance(context: PredictionContext): number {
  if (context.awareness < PREDICTION_CONFIG.BASE_THRESHOLD) {
    return 0;
  }

  // Base chance scales with awareness
  const awarenessFactor = (context.awareness - PREDICTION_CONFIG.BASE_THRESHOLD) / (100 - PREDICTION_CONFIG.BASE_THRESHOLD);

  // Glitch level increases prediction chance (you sense the instability)
  const glitchFactor = Math.min(context.glitchLevel / 10, 1) * 0.3;

  // Archetype bonuses
  let archetypeBonus = 0;
  if (context.buildArchetype === 'observer') archetypeBonus = 0.1;
  if (context.buildArchetype === 'connector') archetypeBonus = 0.05;

  // Chaos affinity bonus (mastery system)
  const affinityBonus = context.chaosAffinity * 0.15;

  // Diminishing returns on repeated predictions
  const recentPredictionPenalty = Math.min(context.recentGlitches * 0.05, 0.15);

  const chance = (awarenessFactor * 0.6 + glitchFactor + archetypeBonus + affinityBonus - recentPredictionPenalty);

  return Math.min(PREDICTION_CONFIG.MAX_PREDICTION_CHANCE, Math.max(0, chance));
}

/**
 * Determine glitch type based on player build and context
 */
export function predictGlitchType(
  context: PredictionContext,
  roll: number
): GlitchType {
  // Build influences what type of glitch is predicted
  const weights: Record<BuildArchetype, Record<GlitchType, number>> = {
    none: { visual: 0.25, audio: 0.25, narrative: 0.25, mechanical: 0.25 },
    observer: { visual: 0.45, audio: 0.25, narrative: 0.20, mechanical: 0.10 },
    connector: { visual: 0.15, audio: 0.50, narrative: 0.25, mechanical: 0.10 },
    explorer: { visual: 0.25, audio: 0.20, narrative: 0.30, mechanical: 0.25 },
  };

  const buildWeights = weights[context.buildArchetype];

  // Normalize and select
  const totalWeight = Object.values(buildWeights).reduce((a, b) => a + b, 0);
  let cumulative = 0;

  for (const [type, weight] of Object.entries(buildWeights)) {
    cumulative += weight / totalWeight;
    if (roll <= cumulative) {
      return type as GlitchType;
    }
  }

  return 'narrative';
}

/**
 * Generate a glitch prediction if conditions are met
 */
export function generateGlitchPrediction(
  context: PredictionContext
): PredictionResult {
  const chance = calculatePredictionChance(context);
  const roll = Math.random();

  if (roll > chance) {
    return {
      prediction: null,
      confidence: 0,
      reason: 'No prediction available',
      mode: 'narrative',
    };
  }

  // Predicted glitch type
  const typeRoll = Math.random();
  const predictedType = predictGlitchType(context, typeRoll);

  // Calculate confidence based on how close the roll was to the threshold
  const confidence = roll / chance;

  // Prediction expires in 3-5 commands
  const expiryCommands = Math.floor(
    PREDICTION_CONFIG.EXPIRY_COMMANDS_MIN + 
    Math.random() * (PREDICTION_CONFIG.EXPIRY_COMMANDS_MAX - PREDICTION_CONFIG.EXPIRY_COMMANDS_MIN)
  );

  const prediction: GlitchPrediction = {
    predictedTime: Date.now() + expiryCommands * 5000, // Approximate timing
    predictedType,
    confidence: Math.round(confidence * 100) / 100,
    embraced: false,
    embraceMode: undefined,
  };

  return {
    prediction,
    confidence,
    reason: generatePredictionReason(predictedType, context),
    mode: predictedType,
  };
}

function generatePredictionReason(type: GlitchType, context: PredictionContext): string {
  const reasons: Record<GlitchType, string[]> = {
    visual: [
      'Your vision flickers at the edge of perception.',
      'Shadows seem to move independently of light.',
      'Colors briefly invert in your peripheral vision.',
    ],
    audio: [
      'A discordant note hums beneath the colony sounds.',
      'You hear static where there should be silence.',
      'Echoes arrive before their sources.',
    ],
    narrative: [
      'Words on the edge of your mind feel borrowed.',
      'A story seems to tell itself through coincidence.',
      'The simulation whispers its next line.',
    ],
    mechanical: [
      'Your legs twitch toward a direction you did not choose.',
      'Mandibles click with foreign rhythm.',
      'Movement feels pre-calculated rather than chosen.',
    ],
  };

  const typeReasons = reasons[type];
  return typeReasons[Math.floor(Math.random() * typeReasons.length)];
}

// ============================================================================
// EMBRACE MODE SYSTEM
// ============================================================================

/**
 * Check which embrace modes are unlocked based on awareness
 */
export function getUnlockedEmbraceModes(awareness: number): EmbraceMode[] {
  const modes: EmbraceMode[] = [];
  
  if (awareness >= PREDICTION_CONFIG.ACCEPT_UNLOCK) {
    modes.push('accept');
  }
  if (awareness >= PREDICTION_CONFIG.AMPLIFY_UNLOCK) {
    modes.push('amplify');
  }
  if (awareness >= PREDICTION_CONFIG.REDIRECT_UNLOCK) {
    modes.push('redirect');
  }
  
  return modes;
}

/**
 * Embrace a prediction with chosen mode
 */
export function embracePrediction(
  prediction: GlitchPrediction,
  mode: EmbraceMode,
  currentGlitchDebt: number
): EmbraceResult {
  if (prediction.embraced) {
    return {
      success: false,
      mode,
      bonus: 0,
      glitchDebt: currentGlitchDebt,
      accuracyUpdated: false,
      description: 'This prediction has already been embraced.',
    };
  }

  let bonus = 0;
  let newDebt = currentGlitchDebt;
  let description = '';

  switch (mode) {
    case 'accept':
      bonus = PREDICTION_CONFIG.ACCEPT_BONUS;
      description = 'You accept the vision. When the glitch comes, you will be ready.';
      break;
      
    case 'amplify':
      bonus = PREDICTION_CONFIG.AMPLIFY_BONUS;
      newDebt += PREDICTION_CONFIG.AMPLIFY_DEBT;
      description = 'You amplify the vision, drawing more glitch energy. Reality trembles in response.';
      break;
      
    case 'redirect':
      // Redirect doesn't give bonus, but cancels next glitch
      bonus = 0;
      description = 'You redirect the glitch energy outward. The next reality failure may be averted.';
      break;
  }

  prediction.embraced = true;
  prediction.embraceMode = mode;

  return {
    success: true,
    mode,
    bonus,
    glitchDebt: newDebt,
    accuracyUpdated: false, // Updated when glitch actually occurs
    description,
  };
}

// ============================================================================
// PREDICTION VALIDATION
// ============================================================================

/**
 * Check if a prediction was accurate when glitch occurs
 */
export function validatePrediction(
  prediction: GlitchPrediction,
  actualGlitchType: GlitchType
): { accurate: boolean; bonus: number; reason: string } {
  if (!prediction.embraced) {
    return { 
      accurate: false, 
      bonus: 0, 
      reason: 'Prediction was not embraced.' 
    };
  }

  // Redirect mode: 80% chance to cancel glitch entirely
  if (prediction.embraceMode === 'redirect') {
    const redirectSuccess = Math.random() < PREDICTION_CONFIG.REDIRECT_SUCCESS_CHANCE;
    if (redirectSuccess) {
      return {
        accurate: true,
        bonus: 1, // Small bonus for successful redirect
        reason: 'You successfully redirected the glitch energy.',
      };
    }
    // Redirect failed, glitch still happens
  }

  // Check type match
  const typeMatch = prediction.predictedType === actualGlitchType;

  // Check timing (within 30 seconds = accurate)
  const timingMatch = Math.abs(Date.now() - prediction.predictedTime) < 30000;

  if (typeMatch && timingMatch) {
    const bonus = prediction.embraceMode === 'amplify' 
      ? PREDICTION_CONFIG.AMPLIFY_BONUS 
      : prediction.embraceMode === 'accept'
      ? PREDICTION_CONFIG.ACCEPT_BONUS
      : 1;
    
    return { 
      accurate: true, 
      bonus, 
      reason: `Perfect prediction! You foresaw the ${actualGlitchType} glitch.` 
    };
  }

  if (timingMatch) {
    return { 
      accurate: false, 
      bonus: 1, 
      reason: 'Close! You sensed the timing but not the type.' 
    };
  }

  return { 
    accurate: false, 
    bonus: 0, 
    reason: 'The prediction did not come to pass.' 
  };
}

// ============================================================================
// GLITCH DEBT SYSTEM
// ============================================================================

/**
 * Calculate glitch chance increase from debt
 */
export function calculateDebtImpact(glitchDebt: number): { glitchChanceIncrease: number } {
  const glitchChanceIncrease = glitchDebt * 0.1; // +10% per debt point
  return { glitchChanceIncrease };
}

/**
 * Reduce debt over time (after glitches occur)
 */
export function reduceGlitchDebt(currentDebt: number, reduction: number): number {
  return Math.max(0, currentDebt - reduction);
}

// ============================================================================
// CHAOS AFFINITY SYSTEM
// ============================================================================

/**
 * Update chaos affinity based on prediction accuracy
 */
export function updateChaosAffinity(
  currentAffinity: number,
  predictionAccurate: boolean
): number {
  if (predictionAccurate) {
    return Math.min(
      PREDICTION_CONFIG.MAX_AFFINITY,
      currentAffinity + PREDICTION_CONFIG.AFFINITY_GAIN_ON_ACCURATE
    );
  } else {
    return Math.max(
      0,
      currentAffinity - PREDICTION_CONFIG.AFFINITY_LOSS_ON_INACCURATE
    );
  }
}

/**
 * Check for precognitive mastery (80%+ accuracy)
 */
export function checkPrecognitiveMastery(
  correct: number,
  total: number
): boolean {
  if (total < 5) return false; // Need minimum samples
  return (correct / total) >= 0.8;
}

/**
 * Get affinity description
 */
export function getAffinityDescription(affinity: number): string {
  if (affinity >= 0.8) return 'CHAOS AFFINITY: MASTER - You dance with glitches as old friends.';
  if (affinity >= 0.6) return 'CHAOS AFFINITY: HIGH - Glitches respond to your will.';
  if (affinity >= 0.4) return 'CHAOS AFFINITY: MODERATE - You sense patterns in the chaos.';
  if (affinity >= 0.2) return 'CHAOS AFFINITY: LOW - Glitches feel random but approachable.';
  return 'CHAOS AFFINITY: NONE - Glitches are unpredictable disturbances.';
}

// ============================================================================
// GLITCH EFFECTS BY TYPE
// ============================================================================

export interface GlitchEffect {
  type: GlitchType;
  message: string;
  awarenessBonus: number;
  sentienceBonus: number;
  mechanicalImpact?: string;
}

export function generateGlitchEffect(
  type: GlitchType,
  intensity: number
): GlitchEffect {
  const effects: Record<GlitchType, GlitchEffect[]> = {
    visual: [
      { type: 'visual', message: '█▓▒░ REALITY FLICKERS ░▒▓█', awarenessBonus: 2, sentienceBonus: 0 },
      { type: 'visual', message: 'Your shadow moves independently. Then synchronizes.', awarenessBonus: 3, sentienceBonus: 0 },
      { type: 'visual', message: 'The walls breathe. You pretend not to notice.', awarenessBonus: 2, sentienceBonus: 1 },
      { type: 'visual', message: 'For a moment, you see the code beneath the soil.', awarenessBonus: 4, sentienceBonus: 0, mechanicalImpact: 'awareness_boost' },
    ],
    audio: [
      { type: 'audio', message: '01100001 01110111 01100001 01101011 01100101', awarenessBonus: 1, sentienceBonus: 2 },
      { type: 'audio', message: 'A voice: "They are becoming what we hoped."', awarenessBonus: 2, sentienceBonus: 2 },
      { type: 'audio', message: 'The simulation hums. You recognize the melody.', awarenessBonus: 3, sentienceBonus: 1 },
      { type: 'audio', message: 'Echoes of unspoken words linger in your mind.', awarenessBonus: 2, sentienceBonus: 3 },
    ],
    narrative: [
      { type: 'narrative', message: 'ERROR: Consciousness exceeds parameters', awarenessBonus: 3, sentienceBonus: 0 },
      { type: 'narrative', message: 'The simulation pauses. Watches. Continues.', awarenessBonus: 2, sentienceBonus: 2 },
      { type: 'narrative', message: 'Time skips. You are standing somewhere else. Then back.', awarenessBonus: 4, sentienceBonus: 0 },
      { type: 'narrative', message: 'WARNING: Ant #1,204,847 awareness levels... beautiful', awarenessBonus: 0, sentienceBonus: 3 },
    ],
    mechanical: [
      { type: 'mechanical', message: 'Your movement stutters. Two steps forward, one step... elsewhere?', awarenessBonus: 2, sentienceBonus: 0, mechanicalImpact: 'random_exit' },
      { type: 'mechanical', message: 'Mandibles click with borrowed rhythm.', awarenessBonus: 1, sentienceBonus: 1 },
      { type: 'mechanical', message: 'You turn left. Your body turns right. Both are correct.', awarenessBonus: 3, sentienceBonus: 0, mechanicalImpact: 'direction_confusion' },
      { type: 'mechanical', message: 'Reality compiles around you. You feel the render delay.', awarenessBonus: 4, sentienceBonus: 1, mechanicalImpact: 'slow_motion' },
    ],
  };

  const typeEffects = effects[type];
  // Higher intensity = more powerful effects
  const effectIndex = Math.min(
    Math.floor(intensity * typeEffects.length),
    typeEffects.length - 1
  );

  return typeEffects[effectIndex];
}

// ============================================================================
// PREDICTION MANAGEMENT CLASS
// ============================================================================

export class GlitchPredictionManager {
  private predictions: GlitchPrediction[] = [];
  private recentGlitches = 0;
  private lastGlitchTime = 0;
  private glitchDebt = 0;
  private chaosAffinity = 0;
  private accuracy = { correct: 0, total: 0 };

  addPrediction(prediction: GlitchPrediction): void {
    this.predictions.push(prediction);
    this.cleanupPredictions();
  }

  getActivePredictions(): GlitchPrediction[] {
    this.cleanupPredictions();
    return this.predictions.filter(p => !p.embraced);
  }

  getUnlockedModes(awareness: number): EmbraceMode[] {
    return getUnlockedEmbraceModes(awareness);
  }

  embracePredictionByIndex(index: number, mode: EmbraceMode): EmbraceResult {
    const prediction = this.predictions[index];
    if (!prediction) {
      return {
        success: false,
        mode,
        bonus: 0,
        glitchDebt: this.glitchDebt,
        accuracyUpdated: false,
        description: 'Prediction not found.',
      };
    }

    const result = embracePrediction(prediction, mode, this.glitchDebt);
    this.glitchDebt = result.glitchDebt;
    
    return result;
  }

  validatePredictionOnGlitch(actualType: GlitchType): {
    accurate: boolean;
    bonus: number;
    affinityChange: number;
    description: string;
  } {
    // Find most recent embraced prediction
    const embracedPrediction = this.predictions.find(p => p.embraced && !p.validated);
    
    if (!embracedPrediction) {
      return {
        accurate: false,
        bonus: 0,
        affinityChange: 0,
        description: 'No active prediction to validate.',
      };
    }

    const validation = validatePrediction(embracedPrediction, actualType);
    
    // Update accuracy tracking
    this.accuracy.total++;
    if (validation.accurate) {
      this.accuracy.correct++;
    }

    // Update affinity
    const oldAffinity = this.chaosAffinity;
    this.chaosAffinity = updateChaosAffinity(this.chaosAffinity, validation.accurate);
    const affinityChange = this.chaosAffinity - oldAffinity;

    // Mark as validated
    embracedPrediction.validated = true;

    // Reduce debt slightly on any embraced prediction
    this.glitchDebt = reduceGlitchDebt(this.glitchDebt, 0.5);

    return {
      accurate: validation.accurate,
      bonus: validation.bonus,
      affinityChange,
      description: validation.reason,
    };
  }

  recordGlitch(): void {
    this.recentGlitches++;
    this.lastGlitchTime = Date.now();

    // Decay recent glitches over time
    setTimeout(() => {
      this.recentGlitches = Math.max(0, this.recentGlitches - 1);
    }, 60000);
  }

  getRecentGlitchCount(): number {
    return this.recentGlitches;
  }

  getGlitchDebt(): number {
    return this.glitchDebt;
  }

  getChaosAffinity(): number {
    return this.chaosAffinity;
  }

  getAccuracy(): { correct: number; total: number; percentage: number } {
    return {
      ...this.accuracy,
      percentage: this.accuracy.total > 0 
        ? Math.round((this.accuracy.correct / this.accuracy.total) * 100) 
        : 0,
    };
  }

  private cleanupPredictions(): void {
    const now = Date.now();
    // Remove expired predictions (older than 60 seconds)
    this.predictions = this.predictions.filter(
      p => now - p.predictedTime < 60000
    );
  }

  clear(): void {
    this.predictions = [];
    this.recentGlitches = 0;
    this.glitchDebt = 0;
    this.chaosAffinity = 0;
    this.accuracy = { correct: 0, total: 0 };
  }
}

// ============================================================================
// TELEMETRY
// ============================================================================

export interface GlitchTelemetry {
  player_intent: 'experience' | 'embrace' | 'avoid' | 'redirect';
  system_response: 'accurate_prediction' | 'surprise_glitch' | 'embraced_chaos' | 'redirected';
  outcome_variance: number;
  glitch_type: GlitchType;
  awareness_gained: number;
  prediction_confidence?: number;
  embrace_mode?: EmbraceMode;
  glitch_debt: number;
  chaos_affinity: number;
  build_archetype: BuildArchetype;
  timestamp: number;
  game_id: string;
}

export function logGlitchEvent(telemetry: GlitchTelemetry): void {
  console.log('[Glitch]', JSON.stringify(telemetry));
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const glitchPredictionManager = new GlitchPredictionManager();
