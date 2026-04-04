/**
 * Flow State System
 * 
 * Replaces saturation (punishment-based) with flow (reward-based).
 * Positive framing: build flow state instead of avoiding saturation.
 */

import { GameState, ActionType } from '../types/game';

// ============================================================================
// FLOW STATE TYPES
// ============================================================================

export type FlowState = 'none' | 'building' | 'active' | 'peak' | 'broken';

export type FlowSource = 'rhythm' | 'mastery' | 'expression';

export interface FlowMetrics {
  level: number; // 0-100
  state: FlowState;
  source: FlowSource | null;
  duration: number; // ms in current state
  streak: number; // consecutive actions maintaining flow
}

export interface FlowBonus {
  type: 'gain' | 'speed' | 'insight' | 'synergy';
  multiplier: number;
  description: string;
}

// ============================================================================
// FLOW CONFIGURATION
// ============================================================================

export const FLOW_CONFIG = {
  // Flow thresholds
  BUILDING_THRESHOLD: 30,
  ACTIVE_THRESHOLD: 60,
  PEAK_THRESHOLD: 85,

  // Flow gain per action
  BASE_FLOW_GAIN: 12,
  RHYTHM_BONUS: 5,       // Same action type in rhythm
  MASTERY_BONUS: 8,      // Using high-mastery action
  EXPRESSION_BONUS: 10,  // Creative/diverse action sequence

  // Flow decay
  BREAK_DELAY_MS: 30000,  // 30s pause breaks flow
  PANIC_SWITCH_PENALTY: 20, // Rapid mode switching penalty
  FLEE_PENALTY: 15,       // Running from encounters

  // Flow bonuses
  BONUSES: {
    gain: { threshold: 30, multiplier: 1.1, description: '+10% awareness gain' },
    speed: { threshold: 60, multiplier: 1.2, description: '+20% movement speed' },
    insight: { threshold: 85, multiplier: 1.3, description: '+30% examination depth' },
    synergy: { threshold: 100, multiplier: 1.5, description: '+50% all gains (peak flow)' },
  },

  // Flow preservation
  PRESERVATION: {
    SAME_ACTION_FLOW_GAIN: 15,
    DIVERSE_ACTION_FLOW_GAIN: 10,
    MODE_SWITCH_PENALTY: 10,
    ENCOUNTER_SUCCESS_BONUS: 20,
  },
};

// ============================================================================
// FLOW STATE TRACKER
// ============================================================================

export class FlowStateTracker {
  private flow: FlowMetrics = {
    level: 0,
    state: 'none',
    source: null,
    duration: 0,
    streak: 0,
  };

  private lastActionTime: number = 0;
  private lastActionType: ActionType | null = null;
  private recentActions: ActionType[] = [];
  private modeSwitches: number = 0;
  private encounterFlees: number = 0;

  /**
   * Update flow state after action
   */
  updateFlow(
    actionType: ActionType,
    gameState: GameState,
    context: {
      sameAsLast: boolean;
      diverse: boolean;
      modeSwitched: boolean;
      encounterResult?: 'success' | 'failure' | 'flee';
    }
  ): {
    flow: FlowMetrics;
    bonusActivated: boolean;
    bonus?: FlowBonus;
    breakReason?: string;
  } {
    const now = Date.now();
    let bonusActivated = false;
    let bonus: FlowBonus | undefined;
    let breakReason: string | undefined;

    // Check for flow break
    const timeSinceLastAction = now - this.lastActionTime;
    if (timeSinceLastAction > FLOW_CONFIG.BREAK_DELAY_MS) {
      this.flow.state = 'broken';
      this.flow.level = 0;
      this.flow.streak = 0;
      breakReason = 'Long pause broke your flow';
    }

    // Check for panic switching
    if (context.modeSwitched) {
      this.modeSwitches++;
      if (this.modeSwitches >= 3) {
        this.flow.level = Math.max(0, this.flow.level - FLOW_CONFIG.PANIC_SWITCH_PENALTY);
        breakReason = 'Rapid mode switching disrupts flow';
      }
    } else {
      this.modeSwitches = 0;
    }

    // Check for encounter flee
    if (context.encounterResult === 'flee') {
      this.encounterFlees++;
      this.flow.level = Math.max(0, this.flow.level - FLOW_CONFIG.FLEE_PENALTY);
      breakReason = 'Fleeing breaks flow';
    } else {
      this.encounterFlees = 0;
      
      // Encounter success bonus
      if (context.encounterResult === 'success') {
        this.flow.level = Math.min(100, this.flow.level + FLOW_CONFIG.PRESERVATION.ENCOUNTER_SUCCESS_BONUS);
      }
    }

    if (!breakReason) {
      // Calculate flow gain
      let flowGain = FLOW_CONFIG.BASE_FLOW_GAIN;

      if (context.sameAsLast) {
        // Rhythm bonus - same action in succession
        flowGain += FLOW_CONFIG.RHYTHM_BONUS;
        this.flow.source = 'rhythm';
        this.flow.streak++;
      } else if (context.diverse) {
        // Expression bonus - diverse action sequence
        flowGain += FLOW_CONFIG.EXPRESSION_BONUS;
        this.flow.source = 'expression';
        this.flow.streak = 1;
      } else {
        // Standard gain
        this.flow.source = 'mastery';
        this.flow.streak = 1;
      }

      // Apply flow gain
      this.flow.level = Math.min(100, this.flow.level + flowGain);
      this.flow.duration = now - this.lastActionTime;
    }

    // Determine flow state
    this.flow.state = this.determineFlowState(this.flow.level);

    // Check for bonus activation
    const previousState = this.getFlowStateFromLevel(this.flow.level - 1);
    if (this.flow.state !== previousState && this.flow.state !== 'none') {
      bonusActivated = true;
      bonus = this.getFlowBonus(this.flow.state);
    }

    // Update tracking
    this.lastActionTime = now;
    this.lastActionType = actionType;
    this.recentActions.push(actionType);
    if (this.recentActions.length > 5) {
      this.recentActions.shift();
    }

    return {
      flow: { ...this.flow },
      bonusActivated,
      bonus,
      breakReason,
    };
  }

  /**
   * Determine flow state from level
   */
  private determineFlowState(level: number): FlowState {
    if (level >= FLOW_CONFIG.PEAK_THRESHOLD) return 'peak';
    if (level >= FLOW_CONFIG.ACTIVE_THRESHOLD) return 'active';
    if (level >= FLOW_CONFIG.BUILDING_THRESHOLD) return 'building';
    return 'none';
  }

  /**
   * Get flow state from level (for comparison)
   */
  private getFlowStateFromLevel(level: number): FlowState {
    return this.determineFlowState(level);
  }

  /**
   * Get flow bonus for state
   */
  private getFlowBonus(state: FlowState): FlowBonus | undefined {
    switch (state) {
      case 'peak':
        return FLOW_CONFIG.BONUSES.synergy;
      case 'active':
        return FLOW_CONFIG.BONUSES.insight;
      case 'building':
        return FLOW_CONFIG.BONUSES.speed;
      default:
        return FLOW_CONFIG.BONUSES.gain;
    }
  }

  /**
   * Get current flow metrics
   */
  getFlow(): FlowMetrics {
    return { ...this.flow };
  }

  /**
   * Get flow bonus description for display
   */
  getFlowDescription(): string {
    switch (this.flow.state) {
      case 'peak':
        return 'Peak Flow: All gains +50%';
      case 'active':
        return 'Active Flow: Examination depth +30%';
      case 'building':
        return 'Building Flow: Movement speed +20%';
      case 'broken':
        return 'Flow Broken: Resume actions to rebuild';
      default:
        return 'No Flow: Establish rhythm to build';
    }
  }

  /**
   * Get narrative description
   */
  getNarrativeDescription(): string {
    switch (this.flow.state) {
      case 'peak':
        return 'You move as one with the simulation';
      case 'active':
        return 'Your actions flow with perfect clarity';
      case 'building':
        return 'You find your rhythm in the tunnels';
      case 'broken':
        return 'Your flow is broken. Find your rhythm again.';
      default:
        return 'You move hesitantly, finding your way';
    }
  }

  /**
   * Reset flow state
   */
  reset(): void {
    this.flow = {
      level: 0,
      state: 'none',
      source: null,
      duration: 0,
      streak: 0,
    };
    this.lastActionTime = 0;
    this.lastActionType = null;
    this.recentActions = [];
    this.modeSwitches = 0;
    this.encounterFlees = 0;
  }

  /**
   * Export state for saving
   */
  export(): Record<string, unknown> {
    return {
      flow: this.flow,
      lastActionTime: this.lastActionTime,
      lastActionType: this.lastActionType,
      recentActions: this.recentActions,
      modeSwitches: this.modeSwitches,
      encounterFlees: this.encounterFlees,
    };
  }

  /**
   * Import state from save
   */
  import(data: Record<string, unknown>): void {
    if (data.flow) {
      this.flow = data.flow as FlowMetrics;
    }
    if (data.lastActionTime) {
      this.lastActionTime = data.lastActionTime as number;
    }
    if (data.lastActionType) {
      this.lastActionType = data.lastActionType as ActionType;
    }
    if (data.recentActions) {
      this.recentActions = data.recentActions as ActionType[];
    }
  }
}

// ============================================================================
// FLOW STATE MANAGER
// ============================================================================

export class FlowStateManager {
  private tracker: FlowStateTracker;
  private callbacks: Array<(flow: FlowMetrics) => void> = [];

  constructor() {
    this.tracker = new FlowStateTracker();
  }

  /**
   * Process action and update flow
   */
  processAction(
    actionType: ActionType,
    gameState: GameState,
    context: {
      sameAsLast: boolean;
      diverse: boolean;
      modeSwitched: boolean;
      encounterResult?: 'success' | 'failure' | 'flee';
    }
  ): {
    flow: FlowMetrics;
    bonusActivated: boolean;
    bonus?: FlowBonus;
    breakReason?: string;
    gainMultiplier: number;
  } {
    const result = this.tracker.updateFlow(actionType, gameState, context);
    
    // Calculate gain multiplier
    const gainMultiplier = this.calculateGainMultiplier(result.flow.state);

    // Notify subscribers
    this.notify(result.flow);

    return {
      ...result,
      gainMultiplier,
    };
  }

  /**
   * Calculate gain multiplier from flow state
   */
  private calculateGainMultiplier(state: FlowState): number {
    switch (state) {
      case 'peak': return 1.5;
      case 'active': return 1.3;
      case 'building': return 1.2;
      default: return 1.0;
    }
  }

  /**
   * Get current flow
   */
  getFlow(): FlowMetrics {
    return this.tracker.getFlow();
  }

  /**
   * Get flow description
   */
  getDescription(): string {
    return this.tracker.getFlowDescription();
  }

  /**
   * Get narrative description
   */
  getNarrativeDescription(): string {
    return this.tracker.getNarrativeDescription();
  }

  /**
   * Subscribe to flow changes
   */
  subscribe(callback: (flow: FlowMetrics) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify subscribers
   */
  private notify(flow: FlowMetrics): void {
    for (const callback of this.callbacks) {
      callback(flow);
    }
  }

  /**
   * Export state
   */
  export(): Record<string, unknown> {
    return this.tracker.export();
  }

  /**
   * Import state
   */
  import(data: Record<string, unknown>): void {
    this.tracker.import(data);
  }

  /**
   * Reset flow
   */
  reset(): void {
    this.tracker.reset();
  }
}

// ============================================================================
// FLOW STATE INTEGRATION HELPERS
// ============================================================================

/**
 * Apply flow multiplier to awareness gain
 */
export function applyFlowMultiplier(baseGain: number, flowState: FlowState): number {
  const multipliers: Record<FlowState, number> = {
    none: 1.0,
    building: 1.2,
    active: 1.3,
    peak: 1.5,
    broken: 1.0,
  };
  return Math.round(baseGain * multipliers[flowState] * 10) / 10;
}

/**
 * Check if flow bonus applies
 */
export function hasFlowBonus(flowState: FlowState, bonusType: FlowBonus['type']): boolean {
  const bonusRequirements: Record<FlowBonus['type'], FlowState[]> = {
    gain: ['building', 'active', 'peak'],
    speed: ['building', 'active', 'peak'],
    insight: ['active', 'peak'],
    synergy: ['peak'],
  };
  return bonusRequirements[bonusType].includes(flowState);
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const flowStateManager = new FlowStateManager();
