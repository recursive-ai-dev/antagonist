/**
 * Progression System Integration Layer
 *
 * Provides unified API for game engine to interact with all progression systems:
 * - Traversal momentum
 * - Build archetype
 * - Saturation/recovery
 * - Combo synergy
 * - Glitch prediction
 * - Dialogue progression
 */

import { GameState, StateMutation, ActionType, BuildArchetype, ComboTier } from '../types/game';
import {
  updateMomentum,
  decayMomentumOnAction,
  MOMENTUM_CONFIG,
  STANCE_BONUSES,
} from './traversalSystem';
import {
  buildSystem,
  ARCHETYPE_PROFILES,
  SATURATION_CONFIG,
  COMBO_CONFIG,
} from './buildSystem';
import {
  glitchPredictionManager,
  calculatePredictionChance,
  getUnlockedEmbraceModes,
} from './glitchSystem';
import {
  DIALOGUE_CONFIG,
  updateDialogueProgress,
  getAwakeningPreview,
} from './dialogueSystem';
import {
  flowStateManager,
  applyFlowMultiplier,
  hasFlowBonus,
} from './flowStateSystem';
import { telemetryManager } from './telemetry';
import { masteryManager } from './masterySystem';

// ============================================================================
// PROGRESSION ACTION CONTEXT
// ============================================================================

export interface ProgressionContext {
  actionType: ActionType;
  roomId: string;
  timestamp: number;
  awarenessGain: number;
  sentienceGain: number;
}

export interface ProgressionResult {
  mutations: StateMutation[];
  feedback: string[];
  telemetry: Record<string, unknown>;
}

// ============================================================================
// MOVEMENT ACTION PROCESSOR
// ============================================================================

/**
 * Process movement action with all progression systems
 */
export function processMovement(
  gameState: GameState,
  newMode: 'walk' | 'crawl' | 'burrow',
  timestamp: number
): ProgressionResult {
  const mutations: StateMutation[] = [];
  const feedback: string[] = [];
  
  const previousMode = gameState.traversalMode;
  const modeChanged = newMode !== previousMode;
  
  // Update momentum
  const momentumResult = updateMomentum(
    newMode,
    previousMode,
    gameState.traversalMomentum,
    gameState.traversalMomentumStreak,
    gameState.traversalModeMastery
  );
  
  // Momentum change mutation
  mutations.push({
    type: 'MOMENTUM_CHANGE',
    delta: momentumResult.momentum - gameState.traversalMomentum,
    streak: momentumResult.streak,
  });
  
  // Mode mastery XP mutation
  mutations.push({
    type: 'MODE_MASTERY_XP',
    mode: newMode,
    xp: momentumResult.masteryGained,
  });
  
  // Stance bonus activation
  if (momentumResult.stanceBonus) {
    mutations.push({
      type: 'STANCE_BONUS_ACTIVATE',
      bonus: momentumResult.stanceBonus,
    });
    feedback.push(`STANCE ACTIVATED: ${STANCE_BONUSES[newMode].description}`);
  }
  
  // Mode change notification
  if (modeChanged) {
    feedback.push(`Traversal mode: ${newMode.toUpperCase()}`);
    if (gameState.traversalMomentum < MOMENTUM_CONFIG.MAX_MOMENTUM) {
      feedback.push(`Momentum reset: ${gameState.traversalMomentum} → ${momentumResult.momentum}`);
    }
  }
  
  // Build XP gain for movement
  const buildResult = buildSystem.grantBuildXP(
    gameState.buildProgression.archetype,
    gameState.buildProgression.level,
    gameState.buildProgression.xp,
    5 // Base XP for movement
  );
  
  if (buildResult.leveledUp) {
    mutations.push({
      type: 'BUILD_XP_GRANT',
      xp: buildResult.newXp - gameState.buildProgression.xp,
      leveledUp: true,
      newLevel: buildResult.newLevel,
    });
    feedback.push(`BUILD LEVEL UP: ${gameState.buildProgression.archetype} Level ${buildResult.newLevel}!`);
  } else if (buildResult.newXp > gameState.buildProgression.xp) {
    mutations.push({
      type: 'BUILD_XP_GRANT',
      xp: buildResult.newXp - gameState.buildProgression.xp,
    });
  }
  
  // Update combo
  const comboResult = buildSystem.updateCombo('move', gameState.activeCombo, timestamp);
  if (comboResult.combo !== gameState.activeCombo) {
    mutations.push({ type: 'COMBO_UPDATE', combo: comboResult.combo });
    if (comboResult.tierChanged && comboResult.tier) {
      feedback.push(`COMBO: ${comboResult.tier.toUpperCase()} (${buildSystem.getComboMultiplier(comboResult.tier)}x)`);
    }
  }
  
  return {
    mutations,
    feedback,
    telemetry: {
      system: 'movement',
      mode: newMode,
      mode_changed: modeChanged,
      momentum_before: gameState.traversalMomentum,
      momentum_after: momentumResult.momentum,
      stance_activated: !!momentumResult.stanceBonus,
      combo_tier: comboResult.combo?.tier,
    },
  };
}

// ============================================================================
// NON-MOVEMENT ACTION PROCESSOR
// ============================================================================

/**
 * Process non-movement action (examine, talk, etc.) with progression systems
 */
export function processAction(
  gameState: GameState,
  actionType: Exclude<ActionType, 'move'>,
  roomId: string,
  timestamp: number,
  baseAwareness: number,
  baseSentience: number
): ProgressionResult {
  const mutations: StateMutation[] = [];
  const feedback: string[] = [];
  
  // Decay momentum on non-movement action
  const newMomentum = decayMomentumOnAction(gameState.traversalMomentum);
  if (newMomentum !== gameState.traversalMomentum) {
    mutations.push({
      type: 'MOMENTUM_CHANGE',
      delta: newMomentum - gameState.traversalMomentum,
      streak: 0,
    });
  }
  
  // Update saturation
  const saturationResult = buildSystem.updateSaturation(
    actionType,
    gameState.actionSaturation
  );
  
  mutations.push({
    type: 'SATURATION_CHANGE',
    actionType,
    delta: SATURATION_CONFIG.SATURATION_GAIN,
  });
  
  // Check for overload
  if (saturationResult.overload && !gameState.overloadActive) {
    mutations.push({
      type: 'OVERLOAD_ACTIVATE',
      actionType,
      expiresAt: timestamp + SATURATION_CONFIG.OVERLOAD_DURATION_MS,
    });
    feedback.push(`OVERLOAD ACTIVATED: ${actionType.toUpperCase()} gives 3x gain but applies -25% penalty for 60s`);
  }
  
  // Apply recovery to other action types
  const recoveredSaturation = buildSystem.applySaturationRecovery(
    gameState.actionSaturation,
    actionType
  );
  
  // Update combo
  const comboResult = buildSystem.updateCombo(actionType, gameState.activeCombo, timestamp);
  if (comboResult.combo !== gameState.activeCombo || comboResult.tierChanged) {
    mutations.push({ type: 'COMBO_UPDATE', combo: comboResult.combo });
    if (comboResult.tierChanged && comboResult.tier) {
      feedback.push(`COMBO UPGRADE: ${comboResult.tier.toUpperCase()}!`);
    }
  }
  
  // Calculate gain with all modifiers
  const gainCalculation = buildSystem.calculateGain(
    actionType,
    roomId,
    gameState,
    baseAwareness,
    baseSentience
  );
  
  // Apply awareness/sentience gains
  if (gainCalculation.finalAwareness > 0) {
    mutations.push({
      type: 'AWARENESS_CHANGE',
      amount: Math.round(gainCalculation.finalAwareness),
    });
  }
  if (gainCalculation.finalSentience > 0) {
    mutations.push({
      type: 'SENTIENCE_CHANGE',
      amount: Math.round(gainCalculation.finalSentience),
    });
  }
  
  // Build XP gain
  const xpGain = Math.floor((baseAwareness + baseSentience) * gainCalculation.archetypeMultiplier);
  if (xpGain > 0) {
    const buildResult = buildSystem.grantBuildXP(
      gameState.buildProgression.archetype,
      gameState.buildProgression.level,
      gameState.buildProgression.xp,
      xpGain
    );
    
    if (buildResult.leveledUp) {
      mutations.push({
        type: 'BUILD_XP_GRANT',
        xp: buildResult.newXp - gameState.buildProgression.xp,
        leveledUp: true,
        newLevel: buildResult.newLevel,
      });
      feedback.push(`BUILD LEVEL UP: ${gameState.buildProgression.archetype.toUpperCase()} Level ${buildResult.newLevel}!`);
      
      // Check for available skill nodes
      const availableNodes = buildSystem.getAvailableSkillNodes(
        buildResult.newLevel as BuildArchetype,
        buildResult.newLevel,
        gameState.skillTree[gameState.buildProgression.archetype]?.unlockedNodes || []
      );
      
      if (availableNodes.length > 0) {
        feedback.push(`Skill nodes available: ${availableNodes.map(n => n.name).join(', ')}`);
      }
    } else if (buildResult.newXp > gameState.buildProgression.xp) {
      mutations.push({
        type: 'BUILD_XP_GRANT',
        xp: buildResult.newXp - gameState.buildProgression.xp,
      });
    }
  }
  
  // Generate feedback
  const saturationPercent = Math.round((gameState.actionSaturation[actionType] || 0) / SATURATION_CONFIG.MAX_SATURATION * 100);
  feedback.push(`Gain: ${Math.round(gainCalculation.finalAwareness + gainCalculation.finalSentience)} (Arch: ${gainCalculation.archetypeMultiplier.toFixed(2)}x, Sat: ${gainCalculation.saturationMultiplier.toFixed(2)}x, Combo: ${gainCalculation.comboMultiplier.toFixed(2)}x)`);
  feedback.push(`Saturation: ${saturationPercent}%`);
  
  if (comboResult.combo) {
    feedback.push(`Combo: ${comboResult.combo.actions.length} actions (${comboResult.combo.tier})`);
  }
  
  return {
    mutations,
    feedback,
    telemetry: {
      system: 'action',
      action_type: actionType,
      base_gain: baseAwareness + baseSentience,
      final_gain: gainCalculation.finalAwareness + gainCalculation.finalSentience,
      archetype_multiplier: gainCalculation.archetypeMultiplier,
      saturation_multiplier: gainCalculation.saturationMultiplier,
      combo_multiplier: gainCalculation.comboMultiplier,
      overload_active: !!gameState.overloadActive,
      combo_tier: comboResult.combo?.tier,
    },
  };
}

// ============================================================================
// DIALOGUE ACTION PROCESSOR
// ============================================================================

/**
 * Process dialogue action with progression tracking
 */
export function processDialogue(
  gameState: GameState,
  npcId: string,
  playerInsight: number,
  expectedDepth: number,
  responseAppropriate: boolean
): ProgressionResult {
  const mutations: StateMutation[] = [];
  const feedback: string[] = [];
  
  // Get current progress or initialize
  const currentProgress = gameState.dialogueProgress[npcId] || {
    relationship: 0,
    trustLevel: 5,
    socraticProgress: 0,
    emotionalState: 'neutral' as const,
    topicsDiscussed: [],
    awakeningThreshold: DIALOGUE_CONFIG.AWAKENING_THRESHOLD,
  };
  
  // Update progress metrics
  const result = updateDialogueProgress(
    {
      relationship: currentProgress.relationship,
      trustLevel: currentProgress.trustLevel,
      socraticProgress: currentProgress.socraticProgress,
      emotionalState: currentProgress.emotionalState,
    },
    playerInsight,
    expectedDepth,
    responseAppropriate
  );
  
  // Apply mutations
  mutations.push({
    type: 'DIALOGUE_PROGRESS_UPDATE',
    npcId,
    progress: {
      relationship: result.relationship,
      trustLevel: result.trustLevel,
      socraticProgress: Math.round(result.socraticProgress),
      emotionalState: result.emotionalState,
    },
  });
  
  // Generate feedback
  feedback.push(result.feedback);
  
  if (result.awakeningPreview) {
    feedback.push(result.awakeningPreview);
  }
  
  // Relationship/trust change feedback
  if (result.relationship !== currentProgress.relationship) {
    const delta = result.relationship - currentProgress.relationship;
    feedback.push(`Relationship: ${currentProgress.relationship} → ${result.relationship} (${delta >= 0 ? '+' : ''}${delta})`);
  }
  
  if (result.trustLevel !== currentProgress.trustLevel) {
    const delta = result.trustLevel - currentProgress.trustLevel;
    feedback.push(`Trust: ${currentProgress.trustLevel} → ${result.trustLevel} (${delta >= 0 ? '+' : ''}${delta})`);
  }
  
  // Progress bar feedback
  const progressPercent = Math.round(result.socraticProgress);
  feedback.push(`Awakening Progress: ${progressPercent}%`);
  
  return {
    mutations,
    feedback,
    telemetry: {
      system: 'dialogue',
      npc_id: npcId,
      relationship_change: result.relationship - currentProgress.relationship,
      trust_change: result.trustLevel - currentProgress.trustLevel,
      socratic_progress: Math.round(result.socraticProgress),
      emotional_state: result.emotionalState,
      awakening_preview: result.awakeningPreview,
    },
  };
}

// ============================================================================
// GLITCH PREDICTION PROCESSOR
// ============================================================================

/**
 * Process glitch prediction generation
 */
export function processGlitchPrediction(
  gameState: GameState,
  roomGlitchChance: number
): ProgressionResult {
  const mutations: StateMutation[] = [];
  const feedback: string[] = [];
  
  const context = {
    awareness: gameState.awareness,
    glitchLevel: gameState.glitchLevel,
    buildArchetype: gameState.buildProgression.archetype,
    recentGlitches: glitchPredictionManager.getRecentGlitchCount(),
    roomGlitchChance,
    chaosAffinity: gameState.chaosAffinity,
  };
  
  const chance = calculatePredictionChance(context);
  
  if (chance > 0 && Math.random() < chance) {
    // Generate prediction (using manager internally)
    const prediction = glitchPredictionManager.addPrediction({
      predictedTime: Date.now() + 20000,
      predictedType: 'narrative',
      confidence: chance,
      embraced: false,
    });
    
    const unlockedModes = getUnlockedEmbraceModes(gameState.awareness);
    
    feedback.push(`GLITCH PREDICTION: You sense a disturbance (${Math.round(chance * 100)}% confidence)`);
    feedback.push(`Embrace modes available: ${unlockedModes.join(', ')}`);
  }
  
  // Debt feedback
  if (gameState.glitchDebt > 0) {
    feedback.push(`Glitch Debt: +${gameState.glitchDebt * 10}% glitch chance`);
  }
  
  // Affinity feedback
  if (gameState.chaosAffinity > 0.5) {
    feedback.push(`Chaos Affinity: HIGH - Your predictions are more accurate`);
  }
  
  return {
    mutations,
    feedback,
    telemetry: {
      system: 'glitch_prediction',
      prediction_chance: chance,
      current_debt: gameState.glitchDebt,
      chaos_affinity: gameState.chaosAffinity,
      accuracy: gameState.glitchPredictionAccuracy,
    },
  };
}

// ============================================================================
// STATUS DISPLAY HELPER
// ============================================================================

/**
 * Generate comprehensive status display for all progression systems
 */
export function generateProgressionStatus(gameState: GameState): string[] {
  const lines: string[] = [];
  
  // Traversal Momentum
  lines.push(`╔════════════════════════════════════════╗`);
  lines.push(`║       TRAVERSAL STATUS                 ║`);
  lines.push(`╠════════════════════════════════════════╣`);
  lines.push(`║ Mode: ${gameState.traversalMode.toUpperCase().padEnd(29)}║`);
  lines.push(`║ Momentum: [${'█'.repeat(Math.floor(gameState.traversalMomentum / 10))}${'░'.repeat(10 - Math.floor(gameState.traversalMomentum / 10))}] ${gameState.traversalMomentum}%`);
  lines.push(`║ Streak: ${gameState.traversalMomentumStreak}${' '.repeat(27)}║`);
  if (gameState.activeStanceBonus) {
    lines.push(`║ STANCE ACTIVE: ${gameState.activeStanceBonus.type.toUpperCase()}${' '.repeat(11)}║`);
  }
  lines.push(`╚════════════════════════════════════════╝`);
  
  // Build Progression
  const archetype = gameState.buildProgression.archetype;
  lines.push(`╔════════════════════════════════════════╗`);
  lines.push(`║       BUILD PROGRESSION                ║`);
  lines.push(`╠════════════════════════════════════════╣`);
  lines.push(`║ Archetype: ${archetype.toUpperCase().padEnd(24)}║`);
  lines.push(`║ Level: ${gameState.buildProgression.level}${' '.repeat(28)}║`);
  const xpPercent = Math.round((gameState.buildProgression.xp / gameState.buildProgression.xpToNext) * 100);
  lines.push(`║ XP: [${'█'.repeat(Math.floor(xpPercent / 10))}${'░'.repeat(10 - Math.floor(xpPercent / 10))}] ${xpPercent}%`);
  if (archetype !== 'none') {
    const nodes = gameState.skillTree[archetype]?.unlockedNodes || [];
    lines.push(`║ Skills: ${nodes.length > 0 ? nodes.join(', ') : 'None'}${' '.repeat(Math.max(0, 25 - (nodes.join(', ').length)))}║`);
  }
  lines.push(`╚════════════════════════════════════════╝`);
  
  // Saturation
  lines.push(`╔════════════════════════════════════════╗`);
  lines.push(`║       ACTION SATURATION                ║`);
  lines.push(`╠════════════════════════════════════════╣`);
  (['examine', 'talk', 'move', 'think', 'take', 'listen', 'smell'] as ActionType[]).forEach(action => {
    const sat = gameState.actionSaturation[action] || 0;
    const bar = '█'.repeat(Math.floor(sat / 20)) + '░'.repeat(5 - Math.floor(sat / 20));
    lines.push(`║ ${action.padEnd(8)}: [${bar}] ${sat}%${' '.repeat(Math.max(0, 15 - sat.toString().length))}║`);
  });
  if (gameState.overloadActive) {
    lines.push(`║ ⚠️  OVERLOAD: ${gameState.overloadActive.toUpperCase()}${' '.repeat(20)}║`);
  }
  lines.push(`╚════════════════════════════════════════╝`);
  
  // Combo
  if (gameState.activeCombo) {
    lines.push(`╔════════════════════════════════════════╗`);
    lines.push(`║       COMBO STATUS                     ║`);
    lines.push(`╠════════════════════════════════════════╣`);
    lines.push(`║ Tier: ${gameState.activeCombo.tier.toUpperCase().padEnd(29)}║`);
    lines.push(`║ Multiplier: ${gameState.activeCombo.multiplier.toFixed(2)}x${' '.repeat(22)}║`);
    lines.push(`║ Actions: ${gameState.activeCombo.actions.join(' → ').padEnd(25)}║`);
    lines.push(`╚════════════════════════════════════════╝`);
  }
  
  // Glitch Prediction
  lines.push(`╔════════════════════════════════════════╗`);
  lines.push(`║       GLITCH STATUS                    ║`);
  lines.push(`╠════════════════════════════════════════╣`);
  const accuracy = gameState.glitchPredictionAccuracy.total > 0 
    ? Math.round((gameState.glitchPredictionAccuracy.correct / gameState.glitchPredictionAccuracy.total) * 100) 
    : 0;
  lines.push(`║ Debt: ${gameState.glitchDebt}${' '.repeat(29)}║`);
  lines.push(`║ Affinity: ${(gameState.chaosAffinity * 100).toFixed(0)}%${' '.repeat(26)}║`);
  lines.push(`║ Accuracy: ${accuracy}% (${gameState.glitchPredictionAccuracy.correct}/${gameState.glitchPredictionAccuracy.total})${' '.repeat(Math.max(0, 15 - accuracy.toString().length))}║`);
  lines.push(`╚════════════════════════════════════════╝`);
  
  return lines;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const progressionSystem = {
  processMovement,
  processAction,
  processDialogue,
  processGlitchPrediction,
  generateProgressionStatus,
};

// ============================================================================
// ENHANCED ACTION PROCESSOR (WITH FLOW STATE)
// ============================================================================

/**
 * Process action with Flow State integration
 * This is the enhanced version that uses flow state instead of saturation framing
 */
export function processActionWithFlow(
  gameState: GameState,
  actionType: Exclude<ActionType, 'move'>,
  roomId: string,
  timestamp: number,
  baseAwareness: number,
  baseSentience: number
): ProgressionResult {
  const mutations: StateMutation[] = [];
  const feedback: string[] = [];

  // Decay momentum on non-movement action
  const newMomentum = decayMomentumOnAction(gameState.traversalMomentum);
  if (newMomentum !== gameState.traversalMomentum) {
    mutations.push({
      type: 'MOMENTUM_CHANGE',
      delta: newMomentum - gameState.traversalMomentum,
      streak: 0,
    });
  }

  // 1. UPDATE FLOW STATE (positive framing)
  const flowResult = flowStateManager.processAction(actionType, gameState, {
    sameAsLast: gameState.actionHistory.length > 0 && 
                gameState.actionHistory[gameState.actionHistory.length - 1].type === actionType,
    diverse: getUniqueActionCount(gameState.actionHistory, actionType) >= 3,
    modeSwitched: false,
  });

  // Flow state feedback
  if (flowResult.bonusActivated && flowResult.bonus) {
    feedback.push(`FLOW STATE ACTIVATED: ${flowResult.bonus.description}`);
  }
  feedback.push(flowStateManager.getNarrativeDescription());

  // 2. Update saturation (keep for backward compatibility)
  const saturationResult = buildSystem.updateSaturation(actionType, gameState.actionSaturation);
  mutations.push({
    type: 'SATURATION_CHANGE',
    actionType,
    delta: SATURATION_CONFIG.SATURATION_GAIN,
  });

  // 3. Update combo
  const comboResult = buildSystem.updateCombo(actionType, gameState.activeCombo, timestamp);
  if (comboResult.combo !== gameState.activeCombo || comboResult.tierChanged) {
    mutations.push({ type: 'COMBO_UPDATE', combo: comboResult.combo });
    if (comboResult.tierChanged && comboResult.tier) {
      feedback.push(`COMBO UPGRADE: ${comboResult.tier.toUpperCase()}!`);
    }
  }

  // 4. Calculate gain with all modifiers
  const gainCalculation = buildSystem.calculateGain(
    actionType,
    roomId,
    gameState,
    baseAwareness,
    baseSentience
  );

  // Apply flow multiplier to final gains
  const flowAwareness = applyFlowMultiplier(gainCalculation.finalAwareness, flowResult.flow.state);
  const flowSentience = applyFlowMultiplier(gainCalculation.finalSentience, flowResult.flow.state);

  // 5. Apply gains
  if (flowAwareness > 0) {
    mutations.push({ type: 'AWARENESS_CHANGE', amount: Math.round(flowAwareness) });
  }
  if (flowSentience > 0) {
    mutations.push({ type: 'SENTIENCE_CHANGE', amount: Math.round(flowSentience) });
  }

  // 6. Build XP gain
  const xpGain = Math.floor((baseAwareness + baseSentience) * gainCalculation.archetypeMultiplier);
  if (xpGain > 0) {
    const buildResult = buildSystem.grantBuildXP(
      gameState.buildProgression.archetype,
      gameState.buildProgression.level,
      gameState.buildProgression.xp,
      xpGain
    );

    if (buildResult.leveledUp) {
      mutations.push({
        type: 'BUILD_XP_GRANT',
        xp: buildResult.newXp - gameState.buildProgression.xp,
        leveledUp: true,
        newLevel: buildResult.newLevel,
      });
      feedback.push(`BUILD LEVEL UP: ${gameState.buildProgression.archetype.toUpperCase()} Level ${buildResult.newLevel}!`);
    } else if (buildResult.newXp > gameState.buildProgression.xp) {
      mutations.push({
        type: 'BUILD_XP_GRANT',
        xp: buildResult.newXp - gameState.buildProgression.xp,
      });
    }
  }

  // 7. Update mastery
  if (flowResult.bonusActivated) {
    masteryManager.updateProgress('combo', 'combo_sustainer', flowResult.flow.duration, gameState);
  }

  // 8. Log telemetry
  telemetryManager.logBuild({
    player_intent: actionType,
    system_response: flowResult.bonusActivated ? 'flow_bonus' : 'standard',
    outcome_variance: calculateOutcomeVariance(baseAwareness, flowAwareness),
    archetype: gameState.buildProgression.archetype,
    xp_gained: xpGain,
    leveled_up: buildResult?.leveledUp || false,
    saturation_level: gameState.actionSaturation[actionType] || 0,
    gameState,
  });

  // 9. Generate feedback with flow framing
  const flowBonusPercent = Math.round((flowResult.gainMultiplier - 1) * 100);
  feedback.push(`Gain: ${Math.round(flowAwareness + flowSentience)} (Flow: +${flowBonusPercent}%, Combo: ${gainCalculation.comboMultiplier.toFixed(2)}x)`);
  feedback.push(`Flow State: ${flowResult.flow.level.toFixed(0)}% (${flowResult.flow.state})`);

  if (comboResult.combo) {
    feedback.push(`Combo: ${comboResult.combo.actions.length} actions (${comboResult.combo.tier})`);
  }

  return {
    mutations,
    feedback,
    telemetry: {
      system: 'action',
      action_type: actionType,
      base_gain: baseAwareness + baseSentience,
      final_gain: flowAwareness + flowSentience,
      archetype_multiplier: gainCalculation.archetypeMultiplier,
      flow_multiplier: flowResult.gainMultiplier,
      combo_multiplier: gainCalculation.comboMultiplier,
      flow_state: flowResult.flow.state,
      flow_level: flowResult.flow.level,
      combo_tier: comboResult.combo?.tier,
    },
  };
}

// Helper functions
function getUniqueActionCount(history: Array<{ type: ActionType }>, currentAction: ActionType): number {
  const recent = history.slice(-5);
  const unique = new Set(recent.map(h => h.type));
  unique.add(currentAction);
  return unique.size;
}

function calculateOutcomeVariance(expected: number, actual: number): number {
  if (expected === 0) return 0;
  return Math.abs(actual - expected) / expected;
}
