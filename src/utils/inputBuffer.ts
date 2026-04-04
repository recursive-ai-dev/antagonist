/**
 * Predictive Input Buffer System
 * 
 * Enables fluid command chaining by buffering rapid inputs
 * and processing them with context capture.
 */

import { GameState } from '../types/game';

// ============================================================================
// TYPES
// ============================================================================

export interface QueuedCommand {
  id: string;
  command: string;
  timestamp: number;
  processed: boolean;
  context?: CommandContext;
}

export interface CommandContext {
  room: string;
  momentum: number;
  saturation: Record<string, number>;
  combo: {
    tier: string | null;
    actions: string[];
  } | null;
  awareness: number;
  sentience: number;
}

export interface ProcessedCommand {
  id: string;
  command: string;
  timestamp: number;
  processed: boolean;
  context: CommandContext;
  execution_order: number;
}

// ============================================================================
// INPUT BUFFER CLASS
// ============================================================================

export class InputBuffer {
  private buffer: QueuedCommand[] = [];
  private readonly BUFFER_WINDOW_MS = 200;
  private readonly MAX_BUFFER_SIZE = 5;
  private commandCounter = 0;

  /**
   * Queue a command for buffered processing
   */
  queue(command: string, timestamp: number = Date.now()): QueuedCommand {
    const queuedCommand: QueuedCommand = {
      id: this.generateCommandId(),
      command,
      timestamp,
      processed: false,
    };

    // Add to buffer
    if (this.buffer.length >= this.MAX_BUFFER_SIZE) {
      // Drop oldest if at capacity
      this.buffer.shift();
    }
    this.buffer.push(queuedCommand);

    return queuedCommand;
  }

  /**
   * Process buffered commands with context capture
   */
  process(gameState: GameState): ProcessedCommand[] {
    const now = Date.now();
    
    // Filter to valid, unprocessed commands within buffer window
    const valid = this.buffer.filter(
      cmd => 
        !cmd.processed && 
        (now - cmd.timestamp) < this.BUFFER_WINDOW_MS
    );

    // Process in order
    const processed = valid.map((cmd, index) => {
      cmd.processed = true;
      return {
        ...cmd,
        processed: true,
        context: this.captureContext(gameState, cmd),
        execution_order: index,
      };
    });

    // Clean up processed commands from buffer
    this.buffer = this.buffer.filter(cmd => !cmd.processed);

    return processed;
  }

  /**
   * Process a single command immediately (bypass buffer)
   */
  processImmediate(command: string, gameState: GameState): ProcessedCommand {
    return {
      id: this.generateCommandId(),
      command,
      timestamp: Date.now(),
      processed: true,
      context: this.captureContext(gameState, { timestamp: Date.now() }),
      execution_order: 0,
    };
  }

  /**
   * Capture context for a command
   */
  private captureContext(gameState: GameState, _cmd: QueuedCommand): CommandContext {
    return {
      room: gameState.currentRoom,
      momentum: gameState.traversalMomentum,
      saturation: { ...gameState.actionSaturation },
      combo: gameState.activeCombo ? {
        tier: gameState.activeCombo.tier,
        actions: gameState.activeCombo.actions,
      } : null,
      awareness: gameState.awareness,
      sentience: gameState.colonySentience,
    };
  }

  /**
   * Get buffer status
   */
  getStatus(): {
    size: number;
    max_size: number;
    window_ms: number;
    oldest_age_ms: number;
  } {
    const now = Date.now();
    const oldest = this.buffer.length > 0 
      ? now - this.buffer[0].timestamp 
      : 0;

    return {
      size: this.buffer.length,
      max_size: this.MAX_BUFFER_SIZE,
      window_ms: this.BUFFER_WINDOW_MS,
      oldest_age_ms: oldest,
    };
  }

  /**
   * Clear the buffer
   */
  clear(): void {
    this.buffer = [];
  }

  /**
   * Get unprocessed commands
   */
  getPending(): QueuedCommand[] {
    return this.buffer.filter(cmd => !cmd.processed);
  }

  /**
   * Generate unique command ID
   */
  private generateCommandId(): string {
    this.commandCounter++;
    return `cmd_${Date.now()}_${this.commandCounter}`;
  }

  /**
   * Mark commands as processed (for external processing)
   */
  markProcessed(ids: string[]): void {
    for (const cmd of this.buffer) {
      if (ids.includes(cmd.id)) {
        cmd.processed = true;
      }
    }
    this.buffer = this.buffer.filter(cmd => !cmd.processed);
  }
}

// ============================================================================
// COMMAND CHAIN DETECTOR
// ============================================================================

export interface ChainPattern {
  type: 'direction_chain' | 'action_chain' | 'mixed_chain';
  commands: string[];
  length: number;
  confidence: number;
}

export class ChainDetector {
  private readonly DIRECTION_COMMANDS = ['north', 'south', 'east', 'west', 'up', 'down', 'n', 's', 'e', 'w', 'u', 'd'];
  private readonly ACTION_COMMANDS = ['examine', 'look', 'take', 'talk', 'listen', 'smell', 'think'];

  /**
   * Detect chain pattern from commands
   */
  detectPattern(commands: string[]): ChainPattern | null {
    if (commands.length < 2) return null;

    const directions = commands.filter(c => this.isDirection(c));
    const actions = commands.filter(c => this.isAction(c));

    if (directions.length === commands.length) {
      return {
        type: 'direction_chain',
        commands,
        length: commands.length,
        confidence: directions.length / commands.length,
      };
    }

    if (actions.length === commands.length) {
      return {
        type: 'action_chain',
        commands,
        length: commands.length,
        confidence: actions.length / commands.length,
      };
    }

    if (directions.length > 0 && actions.length > 0) {
      return {
        type: 'mixed_chain',
        commands,
        length: commands.length,
        confidence: 0.5,
      };
    }

    return null;
  }

  /**
   * Check if command is a direction
   */
  private isDirection(command: string): boolean {
    const normalized = command.toLowerCase().trim();
    return this.DIRECTION_COMMANDS.includes(normalized) ||
           normalized.startsWith('go ') ||
           normalized.startsWith('move ');
  }

  /**
   * Check if command is an action
   */
  private isAction(command: string): boolean {
    const normalized = command.toLowerCase().trim();
    return this.ACTION_COMMANDS.some(action => 
      normalized === action || normalized.startsWith(action + ' ')
    );
  }

  /**
   * Predict next likely command based on pattern
   */
  predictNext(pattern: ChainPattern): string | null {
    if (pattern.type === 'direction_chain' && pattern.commands.length > 0) {
      // Simple prediction: continue in same direction
      const lastCmd = pattern.commands[pattern.commands.length - 1];
      return lastCmd;
    }

    // No prediction for other patterns
    return null;
  }
}

// ============================================================================
// INPUT LATENCY MEASUREMENT
// ============================================================================

export interface LatencyMetrics {
  input_to_process_ms: number;
  process_to_output_ms: number;
  total_latency_ms: number;
  buffer_delay_ms: number;
}

export class LatencyTracker {
  private measurements: LatencyMetrics[] = [];
  private readonly MAX_MEASUREMENTS = 100;

  /**
   * Record input timestamp
   */
  recordInput(timestamp: number): string {
    const id = `input_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    (window as any).__ANTAGONIST_INPUT_TIMING = 
      (window as any).__ANTAGONIST_INPUT_TIMING || {};
    (window as any).__ANTAGONIST_INPUT_TIMING[id] = {
      input_time: timestamp,
    };
    return id;
  }

  /**
   * Record processing timestamp
   */
  recordProcess(id: string, timestamp: number): void {
    const timing = (window as any).__ANTAGONIST_INPUT_TIMING?.[id];
    if (!timing) return;

    timing.process_time = timestamp;
    timing.input_to_process_ms = timestamp - timing.input_time;
  }

  /**
   * Record output timestamp
   */
  recordOutput(id: string, timestamp: number): LatencyMetrics | null {
    const timing = (window as any).__ANTAGONIST_INPUT_TIMING?.[id];
    if (!timing || !timing.process_time) return null;

    timing.output_time = timestamp;
    timing.process_to_output_ms = timestamp - timing.process_time;
    timing.total_latency_ms = timestamp - timing.input_time;
    timing.buffer_delay_ms = timing.process_time - timing.input_time;

    const metrics: LatencyMetrics = {
      input_to_process_ms: timing.input_to_process_ms,
      process_to_output_ms: timing.process_to_output_ms,
      total_latency_ms: timing.total_latency_ms,
      buffer_delay_ms: timing.buffer_delay_ms,
    };

    this.measurements.push(metrics);
    if (this.measurements.length > this.MAX_MEASUREMENTS) {
      this.measurements = this.measurements.slice(-this.MAX_MEASUREMENTS);
    }

    // Cleanup old entries
    delete (window as any).__ANTAGONIST_INPUT_TIMING[id];

    return metrics;
  }

  /**
   * Get average latency
   */
  getAverageLatency(): LatencyMetrics | null {
    if (this.measurements.length === 0) return null;

    const avg = {
      input_to_process_ms: this.measurements.reduce((s, m) => s + m.input_to_process_ms, 0) / this.measurements.length,
      process_to_output_ms: this.measurements.reduce((s, m) => s + m.process_to_output_ms, 0) / this.measurements.length,
      total_latency_ms: this.measurements.reduce((s, m) => s + m.total_latency_ms, 0) / this.measurements.length,
      buffer_delay_ms: this.measurements.reduce((s, m) => s + m.buffer_delay_ms, 0) / this.measurements.length,
    };

    return {
      input_to_process_ms: Math.round(avg.input_to_process_ms * 100) / 100,
      process_to_output_ms: Math.round(avg.process_to_output_ms * 100) / 100,
      total_latency_ms: Math.round(avg.total_latency_ms * 100) / 100,
      buffer_delay_ms: Math.round(avg.buffer_delay_ms * 100) / 100,
    };
  }

  /**
   * Clear measurements
   */
  clear(): void {
    this.measurements = [];
  }
}

// ============================================================================
// SINGLETON EXPORTS
// ============================================================================

export const inputBuffer = new InputBuffer();
export const chainDetector = new ChainDetector();
export const latencyTracker = new LatencyTracker();
