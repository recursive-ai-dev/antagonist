/**
 * Enhanced Gameplay Systems - Unified Export
 * 
 * All upgraded gameplay mechanics for ANTAGONIST
 * 
 * Systems included:
 * - Telemetry: Structured interaction logging
 * - Input Buffer: Predictive command buffering
 * - Feedback Engine: Deterministic feedback generation
 * - Mastery System: Cross-system mastery tracking
 * - Flow State: Positive framing (replaces saturation)
 * - Enhanced Encounter: Visual preparation UI
 */

// Telemetry System
export { 
  telemetryManager, 
  logInteraction,
  type InteractionTelemetry,
  type SessionMetrics 
} from './telemetry';

// Input Buffer System
export { 
  inputBuffer, 
  chainDetector, 
  latencyTracker,
  InputBuffer,
  ChainDetector,
  LatencyTracker,
  type QueuedCommand,
  type CommandContext,
  type ProcessedCommand,
  type ChainPattern,
  type LatencyMetrics,
} from './inputBuffer';

// Feedback Engine
export { 
  feedbackEngine, 
  feedbackValidator,
  FeedbackEngine,
  FeedbackValidator,
  SeededRandom,
  FEEDBACK_CONFIG,
  type FeedbackConfig,
  type FeedbackResult,
  type ConsistencyCheck,
} from './feedbackEngine';

// Mastery System
export { 
  masteryManager,
  MasteryManager,
  MASTERY_TRACKS,
  type MasteryTrack,
  type MasteryChallenge,
  type MasteryReward,
  type MasteryState,
  type MasteryRank,
} from './masterySystem';

// Flow State System
export { 
  flowStateManager,
  FlowStateManager,
  FlowStateTracker,
  FLOW_CONFIG,
  applyFlowMultiplier,
  hasFlowBonus,
  type FlowState,
  type FlowSource,
  type FlowMetrics,
  type FlowBonus,
} from './flowStateSystem';

// Enhanced Encounter System
export { 
  encounterUIManager,
  EncounterUIManager,
  ENCOUNTER_UI_CONFIG,
  getEncounterPreparationData,
  calculateEncounterResolution,
  type EncounterUIState,
  type EncounterPhase,
  type EncounterPreparationData,
  type EncounterResolutionResult,
} from './enhancedEncounterSystem';
