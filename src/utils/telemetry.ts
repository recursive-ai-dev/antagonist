/**
 * Structured Telemetry System
 * 
 * Comprehensive interaction logging for balance debugging and analytics.
 * All telemetry is local-only (dev mode) unless explicitly enabled for production.
 */

import { GameState, TraversalMode, ComboTier, EmbraceMode, BuildArchetype } from '../types/game';

// ============================================================================
// TELEMETRY TYPES
// ============================================================================

export interface InteractionTelemetry {
  // Core fields (all interactions)
  timestamp: number;
  game_id: string;
  player_intent: string;
  system_response: string;
  outcome_variance: number; // 0-1 deviation from expected

  // Context fields
  context: {
    room: string;
    awareness: number;
    sentience: number;
    momentum: number;
    saturation_avg: number;
    combo_tier: ComboTier | null;
    glitch_level: number;
  };

  // System-specific fields (optional)
  traversal?: {
    mode: TraversalMode;
    encounter_triggered: boolean;
    stance_activated: boolean;
    momentum_before: number;
    momentum_after: number;
  };
  
  glitch?: {
    prediction_confidence: number;
    embrace_mode?: EmbraceMode;
    affinity: number;
    debt: number;
    prediction_type?: 'visual' | 'audio' | 'narrative' | 'mechanical';
  };
  
  dialogue?: {
    npc_id: string;
    nl_confidence: number;
    progress_delta: number;
    relationship_before: number;
    relationship_after: number;
    trust_before: number;
    trust_after: number;
  };
  
  build?: {
    archetype: BuildArchetype;
    xp_gained: number;
    leveled_up: boolean;
    saturation_level: number;
  };
}

export interface SessionMetrics {
  session_id: string;
  start_time: number;
  end_time?: number;
  total_interactions: number;
  system_usage: {
    traversal: number;
    glitch: number;
    dialogue: number;
    build: number;
  };
  avg_outcome_variance: number;
  flow_state_duration_ms: number;
}

// ============================================================================
// TELEMETRY MANAGER
// ============================================================================

export class TelemetryManager {
  private static instance: TelemetryManager;
  private sessionId: string;
  private sessionStart: number;
  private interactions: InteractionTelemetry[] = [];
  private systemUsage: Record<string, number> = {
    traversal: 0,
    glitch: 0,
    dialogue: 0,
    build: 0,
  };
  private enabled: boolean = false;
  private maxHistory: number = 1000;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
    
    // Enable only in dev mode by default
    this.enabled = process.env.NODE_ENV === 'development' || 
                   window.location.hostname === 'localhost';
  }

  static getInstance(): TelemetryManager {
    if (!TelemetryManager.instance) {
      TelemetryManager.instance = new TelemetryManager();
    }
    return TelemetryManager.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log an interaction event
   */
  logInteraction(telemetry: InteractionTelemetry): void {
    if (!this.enabled) return;

    // Add session metadata
    const enrichedTelemetry = {
      ...telemetry,
      session_id: this.sessionId,
    };

    // Store in memory
    this.interactions.push(enrichedTelemetry);
    
    // Trim if exceeds max history
    if (this.interactions.length > this.maxHistory) {
      this.interactions = this.interactions.slice(-this.maxHistory);
    }

    // Track system usage
    if (telemetry.traversal) this.systemUsage.traversal++;
    if (telemetry.glitch) this.systemUsage.glitch++;
    if (telemetry.dialogue) this.systemUsage.dialogue++;
    if (telemetry.build) this.systemUsage.build++;

    // Console output for debugging
    console.log('[Telemetry]', JSON.stringify(enrichedTelemetry));

    // Store in global for dev tools access
    if (typeof window !== 'undefined') {
      (window as any).__ANTAGONIST_TELEMETRY = 
        (window as any).__ANTAGONIST_TELEMETRY || [];
      (window as any).__ANTAGONIST_TELEMETRY.push(enrichedTelemetry);
    }
  }

  /**
   * Log traversal event
   */
  logTraversal(data: {
    player_intent: string;
    system_response: string;
    outcome_variance: number;
    mode: TraversalMode;
    encounter_triggered: boolean;
    stance_activated: boolean;
    momentum_before: number;
    momentum_after: number;
    gameState: GameState;
  }): void {
    this.logInteraction({
      timestamp: Date.now(),
      game_id: this.generateGameId(),
      player_intent: data.player_intent,
      system_response: data.system_response,
      outcome_variance: data.outcome_variance,
      context: this.captureContext(data.gameState),
      traversal: {
        mode: data.mode,
        encounter_triggered: data.encounter_triggered,
        stance_activated: data.stance_activated,
        momentum_before: data.momentum_before,
        momentum_after: data.momentum_after,
      },
    });
  }

  /**
   * Log glitch event
   */
  logGlitch(data: {
    player_intent: string;
    system_response: string;
    outcome_variance: number;
    prediction_confidence: number;
    embrace_mode?: EmbraceMode;
    affinity: number;
    debt: number;
    prediction_type?: 'visual' | 'audio' | 'narrative' | 'mechanical';
    gameState: GameState;
  }): void {
    this.logInteraction({
      timestamp: Date.now(),
      game_id: this.generateGameId(),
      player_intent: data.player_intent,
      system_response: data.system_response,
      outcome_variance: data.outcome_variance,
      context: this.captureContext(data.gameState),
      glitch: {
        prediction_confidence: data.prediction_confidence,
        embrace_mode: data.embrace_mode,
        affinity: data.affinity,
        debt: data.debt,
        prediction_type: data.prediction_type,
      },
    });
  }

  /**
   * Log dialogue event
   */
  logDialogue(data: {
    player_intent: string;
    system_response: string;
    outcome_variance: number;
    npc_id: string;
    nl_confidence: number;
    progress_delta: number;
    relationship_before: number;
    relationship_after: number;
    trust_before: number;
    trust_after: number;
    gameState: GameState;
  }): void {
    this.logInteraction({
      timestamp: Date.now(),
      game_id: this.generateGameId(),
      player_intent: data.player_intent,
      system_response: data.system_response,
      outcome_variance: data.outcome_variance,
      context: this.captureContext(data.gameState),
      dialogue: {
        npc_id: data.npc_id,
        nl_confidence: data.nl_confidence,
        progress_delta: data.progress_delta,
        relationship_before: data.relationship_before,
        relationship_after: data.relationship_after,
        trust_before: data.trust_before,
        trust_after: data.trust_after,
      },
    });
  }

  /**
   * Log build/progression event
   */
  logBuild(data: {
    player_intent: string;
    system_response: string;
    outcome_variance: number;
    archetype: BuildArchetype;
    xp_gained: number;
    leveled_up: boolean;
    saturation_level: number;
    gameState: GameState;
  }): void {
    this.logInteraction({
      timestamp: Date.now(),
      game_id: this.generateGameId(),
      player_intent: data.player_intent,
      system_response: data.system_response,
      outcome_variance: data.outcome_variance,
      context: this.captureContext(data.gameState),
      build: {
        archetype: data.archetype,
        xp_gained: data.xp_gained,
        leveled_up: data.leveled_up,
        saturation_level: data.saturation_level,
      },
    });
  }

  /**
   * Capture context from game state
   */
  private captureContext(gameState: GameState): InteractionTelemetry['context'] {
    const saturationValues = Object.values(gameState.actionSaturation);
    const avgSaturation = saturationValues.length > 0
      ? saturationValues.reduce((a, b) => a + b, 0) / saturationValues.length
      : 0;

    return {
      room: gameState.currentRoom,
      awareness: gameState.awareness,
      sentience: gameState.colonySentience,
      momentum: gameState.traversalMomentum,
      saturation_avg: Math.round(avgSaturation),
      combo_tier: gameState.activeCombo?.tier || null,
      glitch_level: gameState.glitchLevel,
    };
  }

  private generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get session metrics
   */
  getSessionMetrics(): SessionMetrics {
    const avgVariance = this.interactions.length > 0
      ? this.interactions.reduce((sum, i) => sum + i.outcome_variance, 0) / this.interactions.length
      : 0;

    return {
      session_id: this.sessionId,
      start_time: this.sessionStart,
      total_interactions: this.interactions.length,
      system_usage: { ...this.systemUsage },
      avg_outcome_variance: Math.round(avgVariance * 100) / 100,
      flow_state_duration_ms: this.calculateFlowStateDuration(),
    };
  }

  /**
   * Calculate time spent in flow state (variance < 0.3)
   */
  private calculateFlowStateDurationMs(): number {
    const flowInteractions = this.interactions.filter(i => i.outcome_variance < 0.3);
    if (flowInteractions.length < 2) return 0;

    // Approximate duration based on interaction count and average time between
    const firstTime = flowInteractions[0].timestamp;
    const lastTime = flowInteractions[flowInteractions.length - 1].timestamp;
    return lastTime - firstTime;
  }

  /**
   * Export telemetry data
   */
  exportData(): string {
    const metrics = this.getSessionMetrics();
    const exportData = {
      metrics,
      interactions: this.interactions,
    };
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Clear telemetry data
   */
  clear(): void {
    this.interactions = [];
    this.systemUsage = { traversal: 0, glitch: 0, dialogue: 0, build: 0 };
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
  }

  /**
   * Enable/disable telemetry
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if telemetry is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const telemetryManager = TelemetryManager.getInstance();

/**
 * Convenience function for logging
 */
export function logInteraction(telemetry: InteractionTelemetry): void {
  telemetryManager.logInteraction(telemetry);
}
