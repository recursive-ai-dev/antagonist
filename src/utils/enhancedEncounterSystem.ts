/**
 * Enhanced Encounter System
 * 
 * Visual preparation phase with telegraphing and informed decision-making.
 * Replaces text-based bypass selection with structured UI.
 */

import { GameState, TraversalMode } from '../types/game';
import { Encounter, RISK_PROFILES, BypassOption } from './traversalSystem';

// ============================================================================
// ENCOUNTER UI TYPES
// ============================================================================

export type EncounterPhase = 'warning' | 'preparation' | 'resolution' | 'complete';

export type EncounterType = 'hazard' | 'obstacle' | 'discovery';

export interface EncounterUIState {
  phase: EncounterPhase;
  encounter: Encounter | null;
  
  // Warning phase
  warning: {
    visible: boolean;
    telegraph_remaining_ms: number;
    encounter_type: EncounterType;
  };

  // Preparation phase
  preparation: {
    visible: boolean;
    time_remaining_ms: number;
    selected_risk: 'cautious' | 'balanced' | 'aggressive';
    prepared_items: string[];
    selected_method: BypassOption | null;
  };

  // Resolution phase
  resolution: {
    visible: boolean;
    animating: boolean;
    tension: number; // 0-100
    success_chance: number;
  };
}

// ============================================================================
// ENCOUNTER UI CONFIG
// ============================================================================

export const ENCOUNTER_UI_CONFIG = {
  WARNING_TELEGRAPH_MS: 1500,
  PREPARATION_TIME_MS: 10000, // 10 seconds to decide
  RESOLUTION_ANIMATION_MS: 2000,
  
  // Risk profile display
  RISK_DISPLAY: {
    cautious: { 
      label: 'Cautious', 
      color: 'rgb(34, 197, 94)', 
      success_bonus: '+20%', 
      reward_mult: '×0.5' 
    },
    balanced: { 
      label: 'Balanced', 
      color: 'rgb(59, 130, 246)', 
      success_bonus: '±0%', 
      reward_mult: '×1.0' 
    },
    aggressive: { 
      label: 'Aggressive', 
      color: 'rgb(239, 68, 68)', 
      success_bonus: '-20%', 
      reward_mult: '×2.0' 
    },
  },

  // Type icons
  TYPE_ICONS: {
    hazard: '⚠️',
    obstacle: '🚧',
    discovery: '✨',
  },
};

// ============================================================================
// ENCOUNTER UI MANAGER
// ============================================================================

export class EncounterUIManager {
  private state: EncounterUIState = {
    phase: 'complete',
    encounter: null,
    warning: {
      visible: false,
      telegraph_remaining_ms: 0,
      encounter_type: 'discovery',
    },
    preparation: {
      visible: false,
      time_remaining_ms: 0,
      selected_risk: 'balanced',
      prepared_items: [],
      selected_method: null,
    },
    resolution: {
      visible: false,
      animating: false,
      tension: 50,
      success_chance: 50,
    },
  };

  private warningTimer: NodeJS.Timeout | null = null;
  private preparationTimer: NodeJS.Timeout | null = null;
  private callbacks: Array<(state: EncounterUIState) => void> = [];

  /**
   * Start encounter sequence
   */
  startEncounter(
    encounter: Encounter,
    gameState: GameState
  ): void {
    const type = this.determineEncounterType(encounter);

    // Phase 1: Warning
    this.state = {
      phase: 'warning',
      encounter,
      warning: {
        visible: true,
        telegraph_remaining_ms: ENCOUNTER_UI_CONFIG.WARNING_TELEGRAPH_MS,
        encounter_type: type,
      },
      preparation: {
        visible: false,
        time_remaining_ms: 0,
        selected_risk: 'balanced',
        prepared_items: [],
        selected_method: null,
      },
      resolution: {
        visible: false,
        animating: false,
        tension: 50,
        success_chance: 50,
      },
    };

    this.notify();

    // Start warning timer
    const warningStart = Date.now();
    this.warningTimer = setInterval(() => {
      const elapsed = Date.now() - warningStart;
      const remaining = ENCOUNTER_UI_CONFIG.WARNING_TELEGRAPH_MS - elapsed;

      if (remaining <= 0) {
        this.transitionToPreparation(encounter, gameState);
      } else {
        this.state.warning.telegraph_remaining_ms = remaining;
        this.notify();
      }
    }, 50);
  }

  /**
   * Determine encounter type from encounter data
   */
  private determineEncounterType(encounter: Encounter): EncounterType {
    if (encounter.type === 'discovery') return 'discovery';
    if (encounter.type === 'hazard') return 'hazard';
    return 'obstacle';
  }

  /**
   * Transition to preparation phase
   */
  private transitionToPreparation(
    encounter: Encounter,
    gameState: GameState
  ): void {
    if (this.warningTimer) {
      clearInterval(this.warningTimer);
      this.warningTimer = null;
    }

    this.state = {
      ...this.state,
      phase: 'preparation',
      warning: {
        ...this.state.warning,
        visible: false,
      },
      preparation: {
        visible: true,
        time_remaining_ms: ENCOUNTER_UI_CONFIG.PREPARATION_TIME_MS,
        selected_risk: 'balanced',
        prepared_items: gameState.inventory,
        selected_method: null,
      },
    };

    this.notify();

    // Start preparation timer
    const prepStart = Date.now();
    this.preparationTimer = setInterval(() => {
      const elapsed = Date.now() - prepStart;
      const remaining = ENCOUNTER_UI_CONFIG.PREPARATION_TIME_MS - elapsed;

      if (remaining <= 0) {
        // Time's up - auto-resolve with balanced risk
        this.resolveEncounter('balanced', null);
      } else {
        this.state.preparation.time_remaining_ms = remaining;
        this.notify();
      }
    }, 100);
  }

  /**
   * Select risk profile
   */
  selectRisk(risk: 'cautious' | 'balanced' | 'aggressive'): void {
    this.state.preparation.selected_risk = risk;
    this.notify();
  }

  /**
   * Select bypass method
   */
  selectMethod(method: BypassOption): void {
    this.state.preparation.selected_method = method;
    this.notify();
  }

  /**
   * Resolve encounter
   */
  resolveEncounter(
    risk: 'cautious' | 'balanced' | 'aggressive',
    method: BypassOption | null
  ): void {
    if (this.preparationTimer) {
      clearInterval(this.preparationTimer);
      this.preparationTimer = null;
    }

    // Calculate success chance
    const baseChance = method?.successChance || 0.5;
    const riskBonus = RISK_PROFILES[risk].successBonus;
    const successChance = Math.min(0.95, Math.max(0.05, baseChance + riskBonus));

    this.state = {
      ...this.state,
      phase: 'resolution',
      preparation: {
        ...this.state.preparation,
        visible: false,
      },
      resolution: {
        visible: true,
        animating: true,
        tension: this.state.resolution.tension,
        success_chance: Math.round(successChance * 100),
      },
    };

    this.notify();

    // Resolution animation
    setTimeout(() => {
      this.state.resolution.animating = false;
      this.notify();

      // Complete after brief delay
      setTimeout(() => {
        this.completeEncounter();
      }, 500);
    }, ENCOUNTER_UI_CONFIG.RESOLUTION_ANIMATION_MS);
  }

  /**
   * Complete encounter sequence
   */
  completeEncounter(): void {
    this.state = {
      phase: 'complete',
      encounter: null,
      warning: {
        visible: false,
        telegraph_remaining_ms: 0,
        encounter_type: 'discovery',
      },
      preparation: {
        visible: false,
        time_remaining_ms: 0,
        selected_risk: 'balanced',
        prepared_items: [],
        selected_method: null,
      },
      resolution: {
        visible: false,
        animating: false,
        tension: 50,
        success_chance: 50,
      },
    };

    this.notify();
  }

  /**
   * Get current state
   */
  getState(): EncounterUIState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: (state: EncounterUIState) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify subscribers
   */
  private notify(): void {
    for (const callback of this.callbacks) {
      callback({ ...this.state });
    }
  }

  /**
   * Get risk display info
   */
  getRiskDisplay(risk: 'cautious' | 'balanced' | 'aggressive'): {
    label: string;
    color: string;
    success_bonus: string;
    reward_mult: string;
  } {
    return ENCOUNTER_UI_CONFIG.RISK_DISPLAY[risk];
  }

  /**
   * Get encounter type icon
   */
  getTypeIcon(type: EncounterType): string {
    return ENCOUNTER_UI_CONFIG.TYPE_ICONS[type];
  }
}

// ============================================================================
// ENCOUNTER PREPARATION COMPONENT DATA
// ============================================================================

export interface EncounterPreparationData {
  encounter: Encounter;
  bypass_options: BypassOption[];
  risk_profiles: Array<{
    id: 'cautious' | 'balanced' | 'aggressive';
    label: string;
    color: string;
    success_bonus: number;
    reward_multiplier: number;
    description: string;
  }>;
  player_items: string[];
  traversal_mode: TraversalMode;
}

export function getEncounterPreparationData(
  encounter: Encounter,
  gameState: GameState
): EncounterPreparationData {
  return {
    encounter,
    bypass_options: encounter.bypassOptions,
    risk_profiles: [
      {
        id: 'cautious',
        label: 'Cautious',
        color: 'rgb(34, 197, 94)',
        success_bonus: 0.2,
        reward_multiplier: 0.5,
        description: 'Safe approach, reduced rewards',
      },
      {
        id: 'balanced',
        label: 'Balanced',
        color: 'rgb(59, 130, 246)',
        success_bonus: 0,
        reward_multiplier: 1.0,
        description: 'Standard risk and reward',
      },
      {
        id: 'aggressive',
        label: 'Aggressive',
        color: 'rgb(239, 68, 68)',
        success_bonus: -0.2,
        reward_multiplier: 2.0,
        description: 'High risk, double rewards',
      },
    ],
    player_items: gameState.inventory,
    traversal_mode: gameState.traversalMode,
  };
}

// ============================================================================
// SUCCESS CALCULATION HELPER
// ============================================================================

export interface EncounterResolutionResult {
  success: boolean;
  partial: boolean;
  description: string;
  awareness_gain: number;
  sentience_gain: number;
  item_reward?: string;
  can_proceed: boolean;
}

export function calculateEncounterResolution(
  encounter: Encounter,
  risk: 'cautious' | 'balanced' | 'aggressive',
  method: BypassOption | null,
  playerItems: string[],
  traversalMode: TraversalMode,
  tension: number
): EncounterResolutionResult {
  const riskProfile = RISK_PROFILES[risk];
  
  // Default method if none selected
  const selectedMethod = method || encounter.bypassOptions[0] || {
    type: 'wait',
    value: 3,
    description: 'Wait it out',
    successChance: 0.5,
  };

  // Calculate success chance
  let successChance = selectedMethod.successChance;
  successChance += riskProfile.successBonus;

  // Item preparation bonus
  if (selectedMethod.type === 'item' && typeof selectedMethod.value === 'string') {
    if (playerItems.includes(selectedMethod.value)) {
      successChance += 0.3;
    }
  }

  // Traversal mode synergy
  if (selectedMethod.type === 'traversal') {
    const modeStats = {
      walk: { speed: 1.0 },
      crawl: { speed: 0.6 },
      burrow: { speed: 1.8 },
    };
    if (selectedMethod.value === traversalMode) {
      successChance += 0.15;
    }
    successChance *= modeStats[traversalMode].speed;
  }

  // Tension bonus
  successChance += (tension / 100) * 0.1;

  // Roll for success
  const roll = Math.random();
  const success = roll <= successChance;
  const partial = !success && roll <= successChance + 0.2;

  // Calculate rewards
  let awareness_gain = 0;
  let sentience_gain = 0;
  let item_reward: string | undefined;

  if (success || partial) {
    const scale = partial ? 0.5 : 1.0;
    if (encounter.rewards?.awareness) {
      awareness_gain = Math.floor(encounter.rewards.awareness * scale);
    }
    if (encounter.rewards?.sentience) {
      sentience_gain = Math.floor(encounter.rewards.sentience * scale);
    }
    if (encounter.rewards?.item && success) {
      item_reward = encounter.rewards.item;
    }
  }

  // Generate description
  let description = encounter.description;
  if (success) {
    description += ` You overcome it using ${selectedMethod.description.toLowerCase()}.`;
  } else if (partial) {
    description += ` You partially overcome it, but struggle.`;
  } else {
    description += ` You fail to bypass it.`;
  }

  return {
    success,
    partial,
    description,
    awareness_gain,
    sentience_gain,
    item_reward,
    can_proceed: success || partial || !encounter.penalties?.preventsExit,
  };
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const encounterUIManager = new EncounterUIManager();
