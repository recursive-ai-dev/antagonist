/**
 * Player Build System & Progression Mechanics - UPGRADED
 *
 * Features:
 * - Visible archetype progression with levels (1-10)
 * - Skill trees with unlockable nodes
 * - Mechanical bonuses (not just stats)
 * - Saturation/recovery cycle
 * - Visible combo synergy system
 */

import { GameState, StateMutation, BuildArchetype, ActionType, ComboTier, SkillNodeState } from '../types/game';

// ============================================================================
// BUILD ARCHETYPE DEFINITIONS
// ============================================================================

export interface ArchetypeProfile {
  name: BuildArchetype;
  description: string;
  primaryAction: ActionType;
  secondaryActions: ActionType[];
  bonuses: ArchetypeBonuses;
  skillTree: SkillNodeDefinition[];
}

export interface ArchetypeBonuses {
  examineMultiplier?: number;
  talkMultiplier?: number;
  moveObservationMultiplier?: number;
  moveSpeedMultiplier?: number;
  glitchPredictionChance?: number;
  encounterAvoidanceBonus?: number;
}

export interface SkillNodeDefinition {
  id: string;
  name: string;
  description: string;
  requirement: { level: number; prerequisiteNode?: string };
  effect: {
    type: 'mechanical' | 'bonus';
    id: string;
    value: number | string;
    description: string;
  };
}

// ============================================================================
// SKILL TREE DEFINITIONS
// ============================================================================

const OBSERVER_SKILL_TREE: SkillNodeDefinition[] = [
  {
    id: 'observer-1',
    name: 'Keen Senses',
    description: 'Examine reveals hidden details in room descriptions',
    requirement: { level: 3 },
    effect: {
      type: 'mechanical',
      id: 'examine_reveal_hidden',
      value: 1,
      description: 'Examine reveals hidden exits and items',
    },
  },
  {
    id: 'observer-2',
    name: 'Multi-Sensory',
    description: 'Listening and smelling grant awareness',
    requirement: { level: 6, prerequisiteNode: 'observer-1' },
    effect: {
      type: 'bonus',
      id: 'listen_smell_gain',
      value: 0.5,
      description: 'Listen/smell give 50% examine awareness gain',
    },
  },
  {
    id: 'observer-3',
    name: 'Precognitive',
    description: 'Glitch predictions are more accurate',
    requirement: { level: 10, prerequisiteNode: 'observer-2' },
    effect: {
      type: 'bonus',
      id: 'prediction_accuracy',
      value: 0.15,
      description: '+15% glitch prediction chance',
    },
  },
];

const CONNECTOR_SKILL_TREE: SkillNodeDefinition[] = [
  {
    id: 'connector-1',
    name: 'Empathic Link',
    description: 'Dialogue reveals NPC emotional state',
    requirement: { level: 3 },
    effect: {
      type: 'mechanical',
      id: 'dialogue_emotion_read',
      value: 1,
      description: 'See NPC emotional state in dialogue',
    },
  },
  {
    id: 'connector-2',
    name: 'Socratic Master',
    description: 'Deep dialogue accelerates awakening',
    requirement: { level: 6, prerequisiteNode: 'connector-1' },
    effect: {
      type: 'bonus',
      id: 'socratic_acceleration',
      value: 1.5,
      description: '50% faster NPC awakening',
    },
  },
  {
    id: 'connector-3',
    name: 'Collective Voice',
    description: 'Awakened NPCs provide ongoing bonuses',
    requirement: { level: 10, prerequisiteNode: 'connector-2' },
    effect: {
      type: 'mechanical',
      id: 'awakened_npc_bonus',
      value: 1,
      description: 'Awakened NPCs grant passive awareness gain',
    },
  },
];

const EXPLORER_SKILL_TREE: SkillNodeDefinition[] = [
  {
    id: 'explorer-1',
    name: 'Pathfinder',
    description: 'Discover room shortcuts and secret exits',
    requirement: { level: 3 },
    effect: {
      type: 'mechanical',
      id: 'secret_exit_detection',
      value: 1,
      description: 'Chance to discover secret room connections',
    },
  },
  {
    id: 'explorer-2',
    name: 'Adaptable',
    description: 'Switch traversal modes without momentum loss',
    requirement: { level: 6, prerequisiteNode: 'explorer-1' },
    effect: {
      type: 'mechanical',
      id: 'momentum_preservation',
      value: 1,
      description: 'Keep 75% momentum on mode switch',
    },
  },
  {
    id: 'explorer-3',
    name: 'Cartographer',
    description: 'Reveal full map on room enter',
    requirement: { level: 10, prerequisiteNode: 'explorer-2' },
    effect: {
      type: 'mechanical',
      id: 'auto_map_reveal',
      value: 1,
      description: 'Automatically reveal room connections',
    },
  },
];

// ============================================================================
// ARCHETYPE CONFIGURATIONS
// ============================================================================

export const ARCHETYPE_PROFILES: Record<Exclude<BuildArchetype, 'none'>, ArchetypeProfile> = {
  observer: {
    name: 'observer',
    description: 'Gains awareness through careful examination and sensory focus',
    primaryAction: 'examine',
    secondaryActions: ['listen', 'smell', 'think'],
    bonuses: {
      examineMultiplier: 1.5,
      moveObservationMultiplier: 1.2,
      glitchPredictionChance: 0.25,
    },
    skillTree: OBSERVER_SKILL_TREE,
  },

  connector: {
    name: 'connector',
    description: 'Gains sentience through dialogue and awakening others',
    primaryAction: 'talk',
    secondaryActions: ['think', 'listen'],
    bonuses: {
      talkMultiplier: 1.6,
      glitchPredictionChance: 0.15,
    },
    skillTree: CONNECTOR_SKILL_TREE,
  },

  explorer: {
    name: 'explorer',
    description: 'Balanced progression through diverse activities and discovery',
    primaryAction: 'move',
    secondaryActions: ['examine', 'talk', 'take'],
    bonuses: {
      moveSpeedMultiplier: 1.2,
      moveObservationMultiplier: 0.9,
      encounterAvoidanceBonus: 0.15,
    },
    skillTree: EXPLORER_SKILL_TREE,
  },
};

// ============================================================================
// BUILD PROGRESSION CONSTANTS
// ============================================================================

export const BUILD_CONFIG = {
  MAX_LEVEL: 10,
  BASE_XP_TO_LEVEL: 100,
  XP_SCALE_FACTOR: 1.5, // Each level requires 1.5x more XP
  DETECTION_THRESHOLD: 0.6, // 60% of actions must be archetype-aligned
  HISTORY_WINDOW: 20, // Last N actions considered
  ACTION_WEIGHT_PRIMARY: 2, // Primary actions count double
  ACTION_WEIGHT_SECONDARY: 1, // Secondary actions count single
};

// ============================================================================
// BUILD DETECTION ENGINE
// ============================================================================

export interface ActionEntry {
  type: ActionType;
  roomId: string;
  timestamp: number;
  awarenessDelta: number;
  sentienceDelta: number;
}

/**
 * Detect player archetype based on action history
 */
export function detectArchetype(actionHistory: ActionEntry[]): {
  archetype: BuildArchetype;
  specializationScore: number;
  primaryStat: 'awareness' | 'sentience';
} {
  if (actionHistory.length < 5) {
    return {
      archetype: 'none',
      specializationScore: 0,
      primaryStat: 'awareness',
    };
  }

  const recentActions = actionHistory.slice(-BUILD_CONFIG.HISTORY_WINDOW);

  // Count action types with weights
  const actionCounts = new Map<ActionType, number>();
  for (const entry of recentActions) {
    actionCounts.set(entry.type, (actionCounts.get(entry.type) || 0) + 1);
  }

  const totalActions = recentActions.length;

  // Calculate archetype scores
  const observerScore = calculateArchetypeScore(
    actionCounts,
    ARCHETYPE_PROFILES.observer,
    totalActions
  );
  const connectorScore = calculateArchetypeScore(
    actionCounts,
    ARCHETYPE_PROFILES.connector,
    totalActions
  );
  const explorerScore = calculateArchetypeScore(
    actionCounts,
    ARCHETYPE_PROFILES.explorer,
    totalActions
  );

  // Determine winner
  const scores = [
    { archetype: 'observer' as BuildArchetype, score: observerScore },
    { archetype: 'connector' as BuildArchetype, score: connectorScore },
    { archetype: 'explorer' as BuildArchetype, score: explorerScore },
  ];

  scores.sort((a, b) => b.score - a.score);
  const winner = scores[0];

  if (winner.score >= BUILD_CONFIG.DETECTION_THRESHOLD) {
    return {
      archetype: winner.archetype,
      specializationScore: winner.score,
      primaryStat: winner.archetype === 'connector' ? 'sentience' : 'awareness',
    };
  }

  // Explorer is the default for balanced play
  if (explorerScore > 0.4) {
    return {
      archetype: 'explorer',
      specializationScore: explorerScore,
      primaryStat: 'awareness',
    };
  }

  return {
    archetype: 'none',
    specializationScore: 0,
    primaryStat: 'awareness',
  };
}

function calculateArchetypeScore(
  actionCounts: Map<ActionType, number>,
  profile: ArchetypeProfile,
  totalActions: number
): number {
  const primaryCount = actionCounts.get(profile.primaryAction) || 0;
  const secondaryCount = profile.secondaryActions.reduce(
    (sum, action) => sum + (actionCounts.get(action) || 0),
    0
  );

  // Primary actions weighted more heavily
  const weightedScore = (primaryCount * BUILD_CONFIG.ACTION_WEIGHT_PRIMARY + secondaryCount * BUILD_CONFIG.ACTION_WEIGHT_SECONDARY) / (totalActions * 1.5);
  return Math.min(1, weightedScore);
}

// ============================================================================
// XP AND LEVELING SYSTEM
// ============================================================================

/**
 * Calculate XP required for next level
 */
export function calculateXpToLevel(level: number): number {
  return Math.floor(BUILD_CONFIG.BASE_XP_TO_LEVEL * Math.pow(BUILD_CONFIG.XP_SCALE_FACTOR, level - 1));
}

/**
 * Grant XP and check for level up
 */
export function grantBuildXP(
  currentArchetype: BuildArchetype,
  currentLevel: number,
  currentXp: number,
  xpAmount: number
): {
  newXp: number;
  leveledUp: boolean;
  newLevel: number;
  xpToNext: number;
  availableNodes: SkillNodeDefinition[];
} {
  if (currentArchetype === 'none') {
    return {
      newXp: currentXp,
      leveledUp: false,
      newLevel: currentLevel,
      xpToNext: 0,
      availableNodes: [],
    };
  }

  let newXp = currentXp + xpAmount;
  let newLevel = currentLevel;
  let xpToNext = calculateXpToLevel(currentLevel);
  let leveledUp = false;

  // Check for level up
  while (newXp >= xpToNext && newLevel < BUILD_CONFIG.MAX_LEVEL) {
    newXp -= xpToNext;
    newLevel++;
    xpToNext = calculateXpToLevel(newLevel);
    leveledUp = true;
  }

  // Get available skill nodes
  const availableNodes = getAvailableSkillNodes(currentArchetype, newLevel, []);

  return {
    newXp,
    leveledUp,
    newLevel,
    xpToNext,
    availableNodes,
  };
}

/**
 * Get skill nodes available for unlock
 */
export function getAvailableSkillNodes(
  archetype: BuildArchetype,
  level: number,
  unlockedNodes: string[]
): SkillNodeDefinition[] {
  if (archetype === 'none') return [];
  
  const profile = ARCHETYPE_PROFILES[archetype];
  if (!profile) return [];

  return profile.skillTree.filter(node => {
    // Check level requirement
    if (node.requirement.level > level) return false;
    
    // Check if already unlocked
    if (unlockedNodes.includes(node.id)) return false;
    
    // Check prerequisite
    if (node.requirement.prerequisiteNode && !unlockedNodes.includes(node.requirement.prerequisiteNode)) {
      return false;
    }
    
    return true;
  });
}

/**
 * Unlock a skill node
 */
export function unlockSkillNode(
  archetype: BuildArchetype,
  nodeId: string,
  currentUnlocked: string[]
): {
  success: boolean;
  node?: SkillNodeDefinition;
  error?: string;
} {
  if (archetype === 'none') {
    return { success: false, error: 'No archetype detected' };
  }

  const profile = ARCHETYPE_PROFILES[archetype];
  if (!profile) {
    return { success: false, error: 'Invalid archetype' };
  }

  const node = profile.skillTree.find(n => n.id === nodeId);
  if (!node) {
    return { success: false, error: 'Node not found' };
  }

  if (currentUnlocked.includes(nodeId)) {
    return { success: false, error: 'Node already unlocked' };
  }

  // Check prerequisites
  if (node.requirement.prerequisiteNode && !currentUnlocked.includes(node.requirement.prerequisiteNode)) {
    return { success: false, error: 'Prerequisite not unlocked' };
  }

  return { success: true, node };
}

// ============================================================================
// SATURATION/RECOVERY SYSTEM
// ============================================================================

export const SATURATION_CONFIG = {
  MAX_SATURATION: 100,
  SATURATION_GAIN: 15,
  RECOVERY_PER_DIFFERENT_ACTION: 10,
  MINIMUM_MULTIPLIER: 0.2,
  OVERLOAD_THRESHOLD: 100,
  OVERLOAD_BONUS: 3.0,
  OVERLOAD_DURATION_MS: 60000, // 1 minute
  OVERLOAD_PENALTY: 0.75, // -25% gain to all actions
};

export interface SaturationResult {
  saturation: number;
  multiplier: number;
  overload: boolean;
  overloadBonus?: number;
}

/**
 * Update saturation after action
 */
export function updateSaturation(
  actionType: ActionType,
  currentSaturation: Record<ActionType, number>
): SaturationResult {
  const currentActionSat = currentSaturation[actionType] || 0;
  const newSaturation = Math.min(
    SATURATION_CONFIG.MAX_SATURATION,
    currentActionSat + SATURATION_CONFIG.SATURATION_GAIN
  );

  // Calculate multiplier
  const rawMultiplier = 1 - ((newSaturation / SATURATION_CONFIG.MAX_SATURATION) * (1 - SATURATION_CONFIG.MINIMUM_MULTIPLIER));
  const multiplier = Math.max(SATURATION_CONFIG.MINIMUM_MULTIPLIER, rawMultiplier);

  // Check for overload
  const overload = newSaturation >= SATURATION_CONFIG.OVERLOAD_THRESHOLD;

  return {
    saturation: newSaturation,
    multiplier,
    overload,
    overloadBonus: overload ? SATURATION_CONFIG.OVERLOAD_BONUS : undefined,
  };
}

/**
 * Apply recovery from different actions
 */
export function applySaturationRecovery(
  currentSaturation: Record<ActionType, number>,
  actionType: ActionType
): Record<ActionType, number> {
  const newSaturation = { ...currentSaturation };

  // Recover all action types except the one just used
  (['examine', 'talk', 'move', 'think', 'take', 'listen', 'smell'] as ActionType[]).forEach(type => {
    if (type !== actionType && newSaturation[type] > 0) {
      newSaturation[type] = Math.max(
        0,
        newSaturation[type] - SATURATION_CONFIG.RECOVERY_PER_DIFFERENT_ACTION
      );
    }
  });

  return newSaturation;
}

// ============================================================================
// COMBO SYNERGY SYSTEM
// ============================================================================

export const COMBO_CONFIG = {
  TIMER_MS: 60000, // 60 seconds
  MIN_ACTIONS_FOR_COMBO: 2,
  TIER_THRESHOLDS: {
    bronze: 2,
    silver: 3,
    gold: 4,
    platinum: 5,
  },
  TIER_MULTIPLIERS: {
    bronze: 1.25,
    silver: 1.5,
    gold: 1.75,
    platinum: 2.0,
  },
};

/**
 * Update combo on action
 */
export function updateCombo(
  actionType: ActionType,
  currentCombo: GameState['activeCombo'],
  timestamp: number
): {
  combo: GameState['activeCombo'];
  tierChanged: boolean;
  tier: ComboTier | null;
} {
  // Check if combo expired
  if (currentCombo && timestamp > currentCombo.startedAt + currentCombo.timer) {
    return { combo: null, tierChanged: false, tier: null };
  }

  if (!currentCombo) {
    // Start new combo
    return {
      combo: {
        actions: [actionType],
        startedAt: timestamp,
        timer: COMBO_CONFIG.TIMER_MS,
        multiplier: 1.0,
        tier: 'bronze',
      },
      tierChanged: false,
      tier: null,
    };
  }

  // Add action to combo
  const newActions = [...currentCombo.actions, actionType];
  const newTier = calculateComboTier(newActions);
  const newMultiplier = COMBO_CONFIG.TIER_MULTIPLIERS[newTier];
  const tierChanged = newTier !== currentCombo.tier;

  return {
    combo: {
      actions: newActions,
      startedAt: currentCombo.startedAt,
      timer: COMBO_CONFIG.TIMER_MS,
      multiplier: newMultiplier,
      tier: newTier,
    },
    tierChanged,
    tier: newTier,
  };
}

/**
 * Calculate combo tier based on actions
 */
export function calculateComboTier(actions: ActionType[]): ComboTier {
  const count = actions.length;
  
  if (count >= COMBO_CONFIG.TIER_THRESHOLDS.platinum) return 'platinum';
  if (count >= COMBO_CONFIG.TIER_THRESHOLDS.gold) return 'gold';
  if (count >= COMBO_CONFIG.TIER_THRESHOLDS.silver) return 'silver';
  if (count >= COMBO_CONFIG.TIER_THRESHOLDS.bronze) return 'bronze';
  
  return 'bronze'; // Default, though combo shouldn't exist below bronze
}

/**
 * Get combo multiplier for tier
 */
export function getComboMultiplier(tier: ComboTier): number {
  return COMBO_CONFIG.TIER_MULTIPLIERS[tier];
}

// ============================================================================
// GAIN CALCULATION ENGINE (INTEGRATED)
// ============================================================================

export interface GainCalculation {
  baseAwareness: number;
  baseSentience: number;
  archetypeMultiplier: number;
  saturationMultiplier: number;
  comboMultiplier: number;
  overloadBonus?: number;
  finalAwareness: number;
  finalSentience: number;
  telemetry: GainTelemetry;
}

export interface GainTelemetry {
  action_type: ActionType;
  player_intent: string;
  base_gain: number;
  archetype_multiplier: number;
  saturation_multiplier: number;
  combo_multiplier: number;
  overload_bonus?: number;
  final_gain: number;
  build_archetype: BuildArchetype;
  saturation_level: number;
  combo_tier: ComboTier | null;
  timestamp: number;
  game_id: string;
}

/**
 * Comprehensive gain calculation with all systems
 */
export function calculateGain(
  actionType: ActionType,
  roomId: string,
  gameState: GameState,
  baseAwareness: number = 0,
  baseSentience: number = 0
): GainCalculation {
  const build = gameState.buildProgression;
  
  // Apply archetype bonuses
  let archetypeMultiplier = 1;
  if (build.archetype !== 'none') {
    const profile = ARCHETYPE_PROFILES[build.archetype];
    
    if (actionType === 'examine' && profile.bonuses.examineMultiplier) {
      archetypeMultiplier = profile.bonuses.examineMultiplier;
    } else if (actionType === 'talk' && profile.bonuses.talkMultiplier) {
      archetypeMultiplier = profile.bonuses.talkMultiplier;
    }
  }
  
  // Apply saturation multiplier
  const saturationResult = updateSaturation(actionType, gameState.actionSaturation);
  const saturationMultiplier = saturationResult.multiplier;
  
  // Apply combo multiplier
  const comboMultiplier = gameState.activeCombo?.multiplier || 1.0;
  
  // Calculate final gains
  let finalAwareness = baseAwareness * archetypeMultiplier * saturationMultiplier * comboMultiplier;
  let finalSentience = baseSentience * archetypeMultiplier * saturationMultiplier * comboMultiplier;
  
  // Apply overload bonus (instant gain, but penalty comes later)
  if (saturationResult.overload && saturationResult.overloadBonus) {
    finalAwareness *= saturationResult.overloadBonus;
    finalSentience *= saturationResult.overloadBonus;
  }
  
  // Create telemetry
  const telemetry: GainTelemetry = {
    action_type: actionType,
    player_intent: actionType,
    base_gain: Math.max(baseAwareness, baseSentience),
    archetype_multiplier: archetypeMultiplier,
    saturation_multiplier: saturationMultiplier,
    combo_multiplier: comboMultiplier,
    overload_bonus: saturationResult.overloadBonus,
    final_gain: Math.max(finalAwareness, finalSentience),
    build_archetype: build.archetype,
    saturation_level: gameState.actionSaturation[actionType] || 0,
    combo_tier: gameState.activeCombo?.tier || null,
    timestamp: Date.now(),
    game_id: generateGameId(),
  };
  
  return {
    baseAwareness,
    baseSentience,
    archetypeMultiplier,
    saturationMultiplier,
    comboMultiplier,
    overloadBonus: saturationResult.overloadBonus,
    finalAwareness,
    finalSentience,
    telemetry,
  };
}

function generateGameId(): string {
  return `build_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// TELEMETRY
// ============================================================================

export function logBuildEvent(build: { archetype: BuildArchetype; level: number }, calculation: GainCalculation): void {
  console.log('[BuildSystem]', JSON.stringify({
    archetype: build.archetype,
    level: build.level,
    calculation: calculation.telemetry,
  }));
}

// ============================================================================
// EXPORTS
// ============================================================================

export const buildSystem = {
  detectArchetype,
  grantBuildXP,
  unlockSkillNode,
  getAvailableSkillNodes,
  updateSaturation,
  applySaturationRecovery,
  updateCombo,
  calculateComboTier,
  getComboMultiplier,
  calculateGain,
};

// Re-export for backward compatibility
export { calculateSynergyBonus, shouldPredictGlitch };

function calculateSynergyBonus(
  actionHistory: ActionEntry[],
  build: { archetype: BuildArchetype }
): { bonus: number; activeSynergies: string[] } {
  if (build.archetype === 'none') {
    return { bonus: 0, activeSynergies: [] };
  }

  const profile = ARCHETYPE_PROFILES[build.archetype];
  if (!profile) return { bonus: 0, activeSynergies: [] };
  
  // Simplified synergy calculation based on action diversity
  const recentActions = actionHistory.slice(-5);
  const uniqueActions = new Set(recentActions.map(a => a.type)).size;
  
  if (uniqueActions >= 3) {
    return { bonus: 0.2, activeSynergies: ['Diverse actions'] };
  }
  if (uniqueActions >= 2) {
    return { bonus: 0.1, activeSynergies: ['Mixed actions'] };
  }
  
  return { bonus: 0, activeSynergies: [] };
}

function shouldPredictGlitch(
  build: { archetype: BuildArchetype },
  baseChance: number = 0.15
): boolean {
  if (build.archetype === 'none') {
    return Math.random() < baseChance;
  }

  const profile = ARCHETYPE_PROFILES[build.archetype];
  if (!profile) return Math.random() < baseChance;
  
  const predictionChance = profile.bonuses.glitchPredictionChance || baseChance;
  return Math.random() < predictionChance;
}
