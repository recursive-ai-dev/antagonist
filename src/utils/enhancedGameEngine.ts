/**
 * Enhanced Game Engine Integration
 * 
 * Integrates all new gameplay systems:
 * - Flow State (replaces saturation)
 * - Telemetry
 * - Mastery tracking
 * - Enhanced encounters
 * - Input buffering
 * - Feedback consistency
 */

import { GameState, StateMutation, ActionType, TraversalMode } from '../types/game';
import { flowStateManager, applyFlowMultiplier } from '../utils/flowStateSystem';
import { telemetryManager } from '../utils/telemetry';
import { masteryManager } from '../utils/masterySystem';
import { feedbackEngine, feedbackValidator } from '../utils/feedbackEngine';
import { inputBuffer, chainDetector } from '../utils/inputBuffer';
import { encounterUIManager, calculateEncounterResolution } from '../utils/enhancedEncounterSystem';
import { generateSecureId } from '../utils/security';

// ============================================================================
// ENHANCED ACTION PROCESSOR
// ============================================================================

export interface EnhancedActionContext {
  actionType: ActionType;
  roomId: string;
  timestamp: number;
  baseAwareness: number;
  baseSentience: number;
  gameState: GameState;
}

export interface EnhancedActionResult {
  mutations: StateMutation[];
  feedback: string[];
  telemetry_logged: boolean;
  mastery_updates: Array<{ track: string; challenge: string; delta: number }>;
  flow_state: {
    level: number;
    state: string;
    bonus_activated: boolean;
  };
}

/**
 * Process action with all enhanced systems
 */
export function processEnhancedAction(
  context: EnhancedActionContext
): EnhancedActionResult {
  const { actionType, roomId, timestamp, baseAwareness, baseSentience, gameState } = context;
  const mutations: StateMutation[] = [];
  const feedback: string[] = [];
  const masteryUpdates: Array<{ track: string; challenge: string; delta: number }> = [];

  // 1. Update Flow State
  const flowResult = flowStateManager.processAction(actionType, gameState, {
    sameAsLast: gameState.actionHistory.length > 0 && 
                gameState.actionHistory[gameState.actionHistory.length - 1].type === actionType,
    diverse: getUniqueActionCount(gameState.actionHistory, actionType) >= 3,
    modeSwitched: false, // Would be set by traversal system
  });

  // 2. Apply flow multiplier to gains
  const flowMultiplier = flowResult.gainMultiplier;
  const finalAwareness = applyFlowMultiplier(baseAwareness, flowResult.flow.state);
  const finalSentience = applyFlowMultiplier(baseSentience, flowResult.flow.state);

  // 3. Generate feedback
  const feedbackResult = feedbackEngine.generateFeedback('examine', gameState, {
    saturation: gameState.actionSaturation[actionType],
    flow: flowResult.flow.level,
  });

  // 4. Log telemetry
  telemetryManager.logBuild({
    player_intent: actionType,
    system_response: flowResult.bonusActivated ? 'flow_bonus' : 'standard',
    outcome_variance: calculateOutcomeVariance(baseAwareness, finalAwareness),
    archetype: gameState.buildProgression.archetype,
    xp_gained: 0, // Would be calculated by build system
    leveled_up: false,
    saturation_level: gameState.actionSaturation[actionType],
    gameState,
  });

  // 5. Update mastery challenges
  if (flowResult.bonusActivated) {
    masteryUpdates.push({
      track: 'combo',
      challenge: 'combo_sustainer',
      delta: flowResult.flow.duration,
    });
  }

  // 6. Validate feedback consistency
  feedbackValidator.validate(actionType, gameState, feedbackResult);

  // 7. Add flow state feedback message
  if (flowResult.bonusActivated && flowResult.bonus) {
    feedback.push(`Flow State: ${flowResult.bonus.description}`);
  }

  feedback.push(flowStateManager.getNarrativeDescription());

  return {
    mutations,
    feedback,
    telemetry_logged: true,
    mastery_updates: masteryUpdates,
    flow_state: {
      level: flowResult.flow.level,
      state: flowResult.flow.state,
      bonus_activated: flowResult.bonusActivated,
    },
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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

// ============================================================================
// ENHANCED TRAVERSAL PROCESSOR
// ============================================================================

export interface EnhancedTraversalContext {
  direction: string;
  mode: TraversalMode;
  fromRoom: string;
  toRoom: string;
  gameState: GameState;
}

export interface EnhancedTraversalResult {
  success: boolean;
  encounter_triggered: boolean;
  momentum_gain: number;
  flow_update: ReturnType<typeof flowStateManager.processAction>;
  mastery_updates: Array<{ track: string; challenge: string; delta: number }>;
}

/**
 * Process traversal with enhanced systems
 */
export function processEnhancedTraversal(
  context: EnhancedTraversalContext
): EnhancedTraversalResult {
  const { mode, fromRoom, toRoom, gameState } = context;
  const masteryUpdates: Array<{ track: string; challenge: string; delta: number }> = [];

  // 1. Update flow state for movement
  const flowResult = flowStateManager.processAction('move', gameState, {
    sameAsLast: gameState.actionHistory.length > 0 && 
                gameState.actionHistory[gameState.actionHistory.length - 1].type === 'move',
    diverse: false,
    modeSwitched: mode !== gameState.traversalMode,
  });

  // 2. Calculate momentum gain (would integrate with traversalSystem.ts)
  const momentumGain = 15; // Base gain, would be modified by system

  // 3. Check for encounter
  const encounterTriggered = Math.random() < 0.15; // Base chance, would use actual system

  // 4. Update mastery
  if (flowResult.flow.state === 'peak') {
    masteryUpdates.push({
      track: 'traversal',
      challenge: 'momentum_master',
      delta: 1,
    });
  }

  // 5. Log telemetry
  telemetryManager.logTraversal({
    player_intent: 'move',
    system_response: encounterTriggered ? 'encounter' : 'success',
    outcome_variance: 0,
    mode,
    encounter_triggered: encounterTriggered,
    stance_activated: !!gameState.activeStanceBonus,
    momentum_before: gameState.traversalMomentum,
    momentum_after: gameState.traversalMomentum + momentumGain,
    gameState,
  });

  return {
    success: true,
    encounter_triggered: encounterTriggered,
    momentum_gain: momentumGain,
    flow_update: flowResult,
    mastery_updates: masteryUpdates,
  };
}

// ============================================================================
// ENHANCED ENCOUNTER RESOLVER
// ============================================================================

export interface EnhancedEncounterContext {
  encounter: any; // Encounter type from traversalSystem
  risk: 'cautious' | 'balanced' | 'aggressive';
  method: any; // BypassOption
  gameState: GameState;
}

export interface EnhancedEncounterResult {
  success: boolean;
  partial: boolean;
  description: string;
  awareness_gain: number;
  sentience_gain: number;
  item_reward?: string;
  can_proceed: boolean;
  mastery_updates: Array<{ track: string; challenge: string; delta: number }>;
}

/**
 * Resolve encounter with enhanced systems
 */
export function resolveEnhancedEncounter(
  context: EnhancedEncounterContext
): EnhancedEncounterResult {
  const { encounter, risk, method, gameState } = context;
  const masteryUpdates: Array<{ track: string; challenge: string; delta: number }> = [];

  // Use enhanced encounter system
  const result = calculateEncounterResolution(
    encounter,
    risk,
    method,
    gameState.inventory,
    gameState.traversalMode,
    gameState.encounterTension
  );

  // Update mastery
  if (result.success) {
    masteryUpdates.push({
      track: 'traversal',
      challenge: 'ghost_walker',
      delta: encounter.type === 'discovery' ? 1 : 0,
    });
  }

  // Log telemetry
  telemetryManager.logInteraction({
    timestamp: Date.now(),
    game_id: generateSecureId(),
    player_intent: 'encounter',
    system_response: result.success ? 'success' : result.partial ? 'partial' : 'failure',
    outcome_variance: result.success ? 0 : 0.5,
    context: {
      room: gameState.currentRoom,
      awareness: gameState.awareness,
      sentience: gameState.colonySentience,
      momentum: gameState.traversalMomentum,
      saturation_avg: 0,
      combo_tier: gameState.activeCombo?.tier || null,
      glitch_level: gameState.glitchLevel,
    },
    traversal: {
      mode: gameState.traversalMode,
      encounter_triggered: true,
      stance_activated: !!gameState.activeStanceBonus,
      momentum_before: gameState.traversalMomentum,
      momentum_after: gameState.traversalMomentum,
    },
  });

  return {
    ...result,
    mastery_updates: masteryUpdates,
  };
}

// ============================================================================
// INPUT BUFFERING INTEGRATION
// ============================================================================

export interface BufferedCommandResult {
  command: string;
  context: any;
  execution_order: number;
  processed: boolean;
}

/**
 * Queue command for buffered processing
 */
export function queueCommand(input: string, timestamp: number = Date.now()): void {
  inputBuffer.queue(input, timestamp);
}

/**
 * Process buffered commands
 */
export function processBufferedCommands(gameState: GameState): BufferedCommandResult[] {
  const processed = inputBuffer.process(gameState);
  
  return processed.map(cmd => ({
    command: cmd.command,
    context: cmd.context,
    execution_order: cmd.execution_order,
    processed: true,
  }));
}

/**
 * Get buffer status for UI
 */
export function getBufferStatus(): {
  size: number;
  max_size: number;
  window_ms: number;
  oldest_age_ms: number;
} {
  return inputBuffer.getStatus();
}

// ============================================================================
// MASTERY INTEGRATION
// ============================================================================

/**
 * Get current mastery state
 */
export function getMasteryState() {
  return masteryManager.getState();
}

/**
 * Check if mastery reward is unlocked
 */
export function isMasteryRewardUnlocked(rewardId: string): boolean {
  return masteryManager.isRewardUnlocked(rewardId);
}

/**
 * Get mastery reward effect
 */
export function getMasteryRewardEffect(rewardId: string): Record<string, unknown> | null {
  return masteryManager.getRewardEffect(rewardId);
}

// ============================================================================
// FLOW STATE INTEGRATION
// ============================================================================

/**
 * Get current flow state for UI
 */
export function getFlowState() {
  return flowStateManager.getFlow();
}

/**
 * Get flow narrative description
 */
export function getFlowNarrative(): string {
  return flowStateManager.getNarrativeDescription();
}

// ============================================================================
// TELEMETRY EXPORT
// ============================================================================

/**
 * Export session telemetry
 */
export function exportTelemetry(): string {
  return telemetryManager.exportData();
}

/**
 * Get telemetry status
 */
export function isTelemetryEnabled(): boolean {
  return telemetryManager.isEnabled();
}

// ============================================================================
// FEEDBACK VALIDATION
// ============================================================================

/**
 * Get feedback consistency report
 */
export function getFeedbackConsistencyReport(): {
  total_checks: number;
  consistent_count: number;
  inconsistent_count: number;
  consistency_rate: number;
} {
  return feedbackValidator.getConsistencyReport();
}
