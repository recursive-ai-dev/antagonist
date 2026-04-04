/**
 * Traversal Mode & Encounter System - UPGRADED
 *
 * Adds mechanical depth through:
 * - Momentum building with consecutive same-mode moves
 * - Stance mastery bonuses at momentum peaks
 * - Mode-specific XP and progression
 * - Encounter preparation phase with risk/reward
 */

import { GameState, StateMutation, TraversalMode, ActionType } from '../types/game';

// ============================================================================
// TRAVERSAL MODE DEFINITIONS
// ============================================================================

export interface TraversalStats {
  speed: number;        // Multiplier on movement effectiveness
  noise: number;        // 0-1, affects encounter probability
  observation: number;  // Multiplier on awareness gain from rooms
  energyCost: number;   // Cost per move (future stamina system hook)
}

export const TRAVERSAL_MODES: Record<TraversalMode, TraversalStats> = {
  walk: {
    speed: 1.0,
    noise: 0.5,
    observation: 1.0,
    energyCost: 1,
  },
  crawl: {
    speed: 0.6,
    noise: 0.1,
    observation: 1.3,
    energyCost: 1.2,
  },
  burrow: {
    speed: 1.8,
    noise: 0.3,
    observation: 0.0,  // No observation while burrowing
    energyCost: 2,
  },
};

// ============================================================================
// MOMENTUM SYSTEM CONSTANTS
// ============================================================================

export const MOMENTUM_CONFIG = {
  MAX_MOMENTUM: 100,
  MOMENTUM_GAIN_PER_MOVE: 15,
  MOMENTUM_DECAY_ON_SWITCH: 50, // Percentage lost on mode change
  MOMENTUM_DECAY_ON_ACTION: 30, // Percentage lost on non-move action
  STANCE_THRESHOLD: 50, // Momentum needed for stance bonus
  STANCE_DURATION_MS: 30000, // 30 seconds
  MASTERY_XP_PER_MOVE: 10,
  MASTERY_XP_BONUS_AT_PEAK: 20, // Bonus XP at 100 momentum
};

export const STANCE_BONUSES: Record<TraversalMode, { type: 'speed' | 'stealth' | 'tunneling'; description: string }> = {
  walk: { type: 'speed', description: 'Movement speed +50%' },
  crawl: { type: 'stealth', description: 'Encounter chance -70%' },
  burrow: { type: 'tunneling', description: 'Can bypass obstacles' },
};

// ============================================================================
// MOMENTUM CALCULATION ENGINE
// ============================================================================

export interface MomentumResult {
  momentum: number;
  streak: number;
  bonusActivated: boolean;
  stanceBonus?: { type: 'speed' | 'stealth' | 'tunneling'; multiplier: number; expiresAt: number };
  masteryGained: number;
}

/**
 * Update momentum based on movement action
 */
export function updateMomentum(
  currentMode: TraversalMode,
  previousMode: TraversalMode,
  currentMomentum: number,
  currentStreak: number,
  modeMastery: Record<TraversalMode, number>
): MomentumResult {
  const modeChanged = currentMode !== previousMode;
  
  let newMomentum = currentMomentum;
  let newStreak = currentStreak;
  let masteryGained = MOMENTUM_CONFIG.MASTERY_XP_PER_MOVE;
  
  if (modeChanged) {
    // Decay momentum on mode switch
    newMomentum = Math.floor(currentMomentum * (1 - MOMENTUM_CONFIG.MOMENTUM_DECAY_ON_SWITCH / 100));
    newStreak = 1;
  } else {
    // Build momentum on consecutive same-mode moves
    newMomentum = Math.min(
      MOMENTUM_CONFIG.MAX_MOMENTUM,
      currentMomentum + MOMENTUM_CONFIG.MOMENTUM_GAIN_PER_MOVE
    );
    newStreak = currentStreak + 1;
    
    // Bonus mastery at momentum peak
    if (newMomentum >= MOMENTUM_CONFIG.MAX_MOMENTUM) {
      masteryGained += MOMENTUM_CONFIG.MASTERY_XP_BONUS_AT_PEAK;
    }
  }
  
  // Check for stance bonus activation
  let stanceBonus: MomentumResult['stanceBonus'];
  const bonusActivated = newMomentum >= STANCE_THRESHOLD && currentMomentum < STANCE_THRESHOLD;
  
  if (bonusActivated) {
    const stance = STANCE_BONUSES[currentMode];
    stanceBonus = {
      type: stance.type,
      multiplier: 1.5,
      expiresAt: Date.now() + STANCE_CONFIG.DURATION_MS,
    };
  }
  
  return {
    momentum: newMomentum,
    streak: newStreak,
    bonusActivated,
    stanceBonus,
    masteryGained,
  };
}

/**
 * Decay momentum on non-movement actions
 */
export function decayMomentumOnAction(currentMomentum: number): number {
  return Math.floor(currentMomentum * (1 - MOMENTUM_CONFIG.MOMENTUM_DECAY_ON_ACTION / 100));
}

// ============================================================================
// STANCE BONUS SYSTEM
// ============================================================================

export const STANCE_CONFIG = {
  DURATION_MS: 30000,
  SPEED_MULTIPLIER: 1.5,
  STEALTH_REDUCTION: 0.7,
  TUNNELING_SUCCESS_BONUS: 0.3,
};

export interface StanceBonus {
  type: 'speed' | 'stealth' | 'tunneling';
  multiplier: number;
  expiresAt: number;
}

/**
 * Check if stance bonus is active and apply effects
 */
export function checkStanceBonus(
  stanceBonus: StanceBonus | undefined,
  currentTime: number
): StanceBonus | null {
  if (!stanceBonus || currentTime > stanceBonus.expiresAt) {
    return null;
  }
  return stanceBonus;
}

/**
 * Calculate traversal effects with momentum and stance
 */
export function calculateTraversalEffects(
  mode: TraversalMode,
  awareness: number,
  momentum: number,
  stanceBonus: StanceBonus | null
): {
  awarenessMultiplier: number;
  sentienceMultiplier: number;
  encounterChance: number;
  movementDescription: string;
  stanceActive: boolean;
} {
  const baseStats = TRAVERSAL_MODES[mode];
  
  // High awareness compensates for observation loss in burrow mode
  const awarenessBoost = mode === 'burrow' && awareness > 40 ? 0.3 : 0;
  
  // Momentum bonus: +0.1 per 10 momentum points
  const momentumBonus = momentum / 1000;
  
  // Apply stance bonuses
  let encounterChance = baseStats.noise;
  let awarenessMultiplier = baseStats.observation + awarenessBoost + momentumBonus;
  
  if (stanceBonus) {
    if (stanceBonus.type === 'stealth') {
      encounterChance *= (1 - STANCE_CONFIG.STEALTH_REDUCTION);
    }
    if (stanceBonus.type === 'speed') {
      awarenessMultiplier *= 0.8; // Trade observation for speed
    }
  }
  
  return {
    awarenessMultiplier,
    sentienceMultiplier: baseStats.speed + momentumBonus,
    encounterChance,
    movementDescription: getMovementDescription(mode, momentum),
    stanceActive: !!stanceBonus,
  };
}

function getMovementDescription(mode: TraversalMode, momentum: number): string {
  const momentumDesc = momentum >= 80 ? ' with flowing momentum' : momentum >= 50 ? ' with building rhythm' : '';
  
  switch (mode) {
    case 'walk':
      return `You walk${momentumDesc}`;
    case 'crawl':
      return `You move silently${momentumDesc}, pressing close to the ground`;
    case 'burrow':
      return `You tunnel through the soil${momentumDesc}`;
    default:
      return `You travel${momentumDesc}`;
  }
}

// ============================================================================
// ENCOUNTER SYSTEM (UPGRADED)
// ============================================================================

export type EncounterType = 'hazard' | 'obstacle' | 'discovery' | 'none';

export interface Encounter {
  id: string;
  type: EncounterType;
  description: string;
  requiresItem?: string;
  requiresAwareness?: number;
  bypassOptions: BypassOption[];
  rewards?: {
    awareness?: number;
    sentience?: number;
    item?: string;
  };
  penalties?: {
    awareness?: number;
    preventsExit?: boolean;
  };
}

export interface BypassOption {
  type: 'item' | 'awareness' | 'traversal' | 'wait';
  value: string | number;
  description: string;
  successChance: number;
}

// ============================================================================
// ENCOUNTER REGISTRY
// ============================================================================

export const REGION_ENCOUNTERS: Record<string, Encounter[]> = {
  'Upper Gardens': [
    {
      id: 'predator-bird',
      type: 'hazard',
      description: 'A shadow passes overhead. Something hunts from above.',
      requiresAwareness: 15,
      bypassOptions: [
        { type: 'traversal', value: 'crawl', description: 'Move silently, avoid detection', successChance: 0.9 },
        { type: 'wait', value: 3, description: 'Wait for the predator to pass', successChance: 0.7 },
      ],
      penalties: { awareness: 5 },
    },
    {
      id: 'aphid-colony',
      type: 'discovery',
      description: 'You discover a colony of aphids—a potential food source.',
      bypassOptions: [],
      rewards: { awareness: 2 },
    },
  ],
  'Deep Tunnels': [
    {
      id: 'cave-in',
      type: 'obstacle',
      description: 'The tunnel ahead is partially collapsed.',
      requiresItem: 'fungal-spore',
      bypassOptions: [
        { type: 'item', value: 'fungal-spore', description: 'Use spore to clear the way', successChance: 1.0 },
        { type: 'traversal', value: 'burrow', description: 'Burrow through the loose soil', successChance: 0.8 },
        { type: 'awareness', value: 25, description: 'Find an alternate path', successChance: 0.6 },
      ],
      penalties: { preventsExit: true },
    },
    {
      id: 'lost-cargo',
      type: 'discovery',
      description: 'Ancient pheromone trails lead to a forgotten cache.',
      requiresAwareness: 30,
      bypassOptions: [],
      rewards: { awareness: 5, item: 'strange-pheromone' },
    },
  ],
  'The Core': [
    {
      id: 'quantum-static',
      type: 'hazard',
      description: 'Reality flickers. The path ahead phases in and out of existence.',
      requiresAwareness: 50,
      bypassOptions: [
        { type: 'awareness', value: 50, description: 'Perceive the true path', successChance: 1.0 },
        { type: 'traversal', value: 'burrow', description: 'Tunnel through probability itself', successChance: 0.4 },
      ],
      rewards: { awareness: 10 },
      penalties: { awareness: 10, preventsExit: true },
    },
  ],
  'default': [
    {
      id: 'uneven-ground',
      type: 'obstacle',
      description: 'The passage narrows. Movement is difficult here.',
      bypassOptions: [
        { type: 'traversal', value: 'crawl', description: 'Crawl through the narrow space', successChance: 1.0 },
        { type: 'traversal', value: 'burrow', description: 'Tunnel around the obstacle', successChance: 0.7 },
      ],
    },
  ],
};

// ============================================================================
// ENCOUNTER PREPARATION SYSTEM
// ============================================================================

export interface EncounterPreparation {
  encounter: Encounter;
  selectedRisk: 'cautious' | 'balanced' | 'aggressive';
  preparedItems: string[];
  traversalMode: TraversalMode;
}

export const RISK_PROFILES = {
  cautious: { successBonus: 0.2, rewardMultiplier: 0.5, description: 'Safe approach' },
  balanced: { successBonus: 0, rewardMultiplier: 1.0, description: 'Balanced approach' },
  aggressive: { successBonus: -0.2, rewardMultiplier: 2.0, description: 'High risk, high reward' },
};

/**
 * Start encounter preparation phase
 */
export function startEncounterPreparation(
  encounter: Encounter,
  gameState: GameState
): EncounterPreparation {
  return {
    encounter,
    selectedRisk: 'balanced', // Default
    preparedItems: [],
    traversalMode: gameState.traversalMode,
  };
}

/**
 * Resolve encounter with preparation
 */
export function resolvePreparedEncounter(
  preparation: EncounterPreparation,
  chosenMethod: string,
  tension: number
): {
  success: boolean;
  partial: boolean;
  description: string;
  mutations: StateMutation[];
  canProceed: boolean;
  rewardMultiplier: number;
} {
  const mutations: StateMutation[] = [];
  const encounter = preparation.encounter;
  const riskProfile = RISK_PROFILES[preparation.selectedRisk];
  
  // Find the bypass option that matches the chosen method
  const option = encounter.bypassOptions.find(
    opt => opt.value === chosenMethod || opt.type === chosenMethod
  );
  
  // Handle discoveries (no bypass needed)
  if (encounter.type === 'discovery') {
    if (encounter.rewards?.awareness) {
      mutations.push({ type: 'AWARENESS_CHANGE', amount: encounter.rewards.awareness });
    }
    if (encounter.rewards?.sentience) {
      mutations.push({ type: 'SENTIENCE_CHANGE', amount: encounter.rewards.sentience });
    }
    if (encounter.rewards?.item) {
      mutations.push({ type: 'INVENTORY_ADD', itemId: encounter.rewards.item });
    }
    
    return {
      success: true,
      partial: false,
      description: encounter.description,
      mutations,
      canProceed: true,
      rewardMultiplier: 1,
    };
  }
  
  if (!option) {
    // No valid bypass
    return {
      success: false,
      partial: false,
      description: `Cannot bypass: ${encounter.description}`,
      mutations: [],
      canProceed: encounter.penalties?.preventsExit !== true,
      rewardMultiplier: 0,
    };
  }
  
  // Calculate success chance with all modifiers
  let successChance = option.successChance;
  
  // Risk profile modifier
  successChance += riskProfile.successBonus;
  
  // Item preparation bonus
  if (option.type === 'item' && preparation.preparedItems.includes(option.value as string)) {
    successChance += 0.3;
  }
  
  // Traversal mode synergy
  if (option.type === 'traversal') {
    const modeStats = TRAVERSAL_MODES[preparation.traversalMode];
    if (option.value === preparation.traversalMode) {
      successChance += 0.15; // Using correct mode
    }
    successChance *= modeStats.speed;
  }
  
  // Tension bonus (high tension = higher success but higher penalty on fail)
  successChance += (tension / 100) * 0.1;
  
  // Roll for success
  const roll = Math.random();
  const success = roll <= successChance;
  
  // Calculate progress for partial success
  const progress = roll <= successChance + 0.2 ? 75 : roll <= successChance + 0.4 ? 50 : 25;
  const partial = !success && progress >= 50;
  
  if (success || partial) {
    // Apply rewards (scaled by partial success)
    const scale = partial ? 0.5 : 1.0;
    
    if (encounter.rewards?.awareness) {
      mutations.push({ type: 'AWARENESS_CHANGE', amount: Math.floor(encounter.rewards.awareness * scale) });
    }
    if (encounter.rewards?.sentience) {
      mutations.push({ type: 'SENTIENCE_CHANGE', amount: Math.floor(encounter.rewards.sentience * scale) });
    }
    if (encounter.rewards?.item && success) {
      mutations.push({ type: 'INVENTORY_ADD', itemId: encounter.rewards.item });
    }
  } else {
    // Apply penalties
    if (encounter.penalties?.awareness) {
      mutations.push({ type: 'AWARENESS_CHANGE', amount: -encounter.penalties.awareness });
    }
  }
  
  const rewardMultiplier = riskProfile.rewardMultiplier * (partial ? 0.5 : 1.0);
  
  return {
    success,
    partial,
    method: chosenMethod,
    description: generateEncounterDescription(encounter, option, success, partial),
    mutations,
    canProceed: success || partial || encounter.penalties?.preventsExit !== true,
    rewardMultiplier,
  };
}

function generateEncounterDescription(
  encounter: Encounter,
  option: BypassOption,
  success: boolean,
  partial: boolean
): string {
  if (success) {
    return `${encounter.description} You overcome it using ${option.description.toLowerCase()}.`;
  }
  if (partial) {
    return `${encounter.description} You partially overcome it using ${option.description.toLowerCase()}, but struggle.`;
  }
  return `${encounter.description} You fail to bypass it. ${option.description} was not sufficient.`;
}

/**
 * Calculate tension impact on rewards
 */
export function calculateTensionReward(
  tension: number,
  riskLevel: string,
  baseReward: number
): number {
  const tensionBonus = 1 + (tension / 100) * 0.5; // Up to 1.5x at max tension
  const riskMultiplier = RISK_PROFILES[riskLevel as keyof typeof RISK_PROFILES]?.rewardMultiplier || 1.0;
  
  return Math.floor(baseReward * tensionBonus * riskMultiplier);
}

// ============================================================================
// ENCOUNTER RESOLUTION ENGINE (LEGACY SUPPORT)
// ============================================================================

export interface EncounterResolution {
  success: boolean;
  method: string;
  description: string;
  mutations: StateMutation[];
  canProceed: boolean;
}

/**
 * Legacy encounter resolution (for backward compatibility)
 */
export function resolveEncounter(
  encounter: Encounter,
  _gameState: GameState,
  chosenMethod: string,
  traversalMode: TraversalMode
): EncounterResolution {
  const result = resolvePreparedEncounter(
    { encounter, selectedRisk: 'balanced', preparedItems: [], traversalMode },
    chosenMethod,
    50 // Default tension
  );
  
  return {
    success: result.success,
    method: result.method,
    description: result.description,
    mutations: result.mutations,
    canProceed: result.canProceed,
  };
}

/**
 * Check for random encounter based on region and traversal mode
 */
export function checkForEncounter(
  region: string,
  traversalMode: TraversalMode,
  awareness: number,
  momentum: number
): Encounter | null {
  const encounters = REGION_ENCOUNTERS[region] || REGION_ENCOUNTERS['default'];
  const modeStats = TRAVERSAL_MODES[traversalMode];
  
  // Base encounter chance modified by noise level
  const baseChance = 0.15;
  const noiseModifier = modeStats.noise;
  
  // Momentum reduces encounter chance (flow state protection)
  const momentumReduction = momentum / 200; // Up to 50% reduction at 100 momentum
  
  const encounterChance = Math.max(0.05, baseChance * noiseModifier - momentumReduction);
  
  if (Math.random() > encounterChance) {
    return null;
  }
  
  // Filter encounters by awareness requirement
  const availableEncounters = encounters.filter(
    e => !e.requiresAwareness || awareness >= e.requiresAwareness
  );
  
  if (availableEncounters.length === 0) {
    return null;
  }
  
  // Weight by type: hazards more common with high noise, discoveries with low noise
  const weightedEncounters = availableEncounters.map(e => {
    let weight = 1;
    if (e.type === 'hazard') weight = modeStats.noise > 0.5 ? 2 : 0.5;
    if (e.type === 'discovery') weight = modeStats.noise < 0.3 ? 2 : 0.5;
    return { encounter: e, weight };
  });
  
  const totalWeight = weightedEncounters.reduce((sum, we) => sum + we.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const we of weightedEncounters) {
    random -= we.weight;
    if (random <= 0) {
      return we.encounter;
    }
  }
  
  return weightedEncounters[weightedEncounters.length - 1].encounter;
}

// ============================================================================
// TELEMETRY
// ============================================================================

export interface TraversalTelemetry {
  player_intent: 'move' | 'encounter' | 'success' | 'momentum_build';
  system_response: 'encounter' | 'success' | 'momentum_gain' | 'stance_activate';
  outcome_variance: number; // 0-1 deviation from expected
  traversal_mode: TraversalMode;
  encounter_type?: EncounterType;
  resolution_method?: string;
  momentum_before: number;
  momentum_after: number;
  stance_activated: boolean;
  timestamp: number;
  game_id: string;
}

export function logTraversalEvent(telemetry: TraversalTelemetry): void {
  console.log('[Traversal]', JSON.stringify(telemetry));
}
