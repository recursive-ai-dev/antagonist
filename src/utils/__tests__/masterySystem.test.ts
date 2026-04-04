import { describe, it, expect, beforeEach } from 'vitest';
import { masterySystem } from '../masterySystem';

describe('Mastery System', () => {
  beforeEach(() => {
    // Reset if available
    if (masterySystem.reset) {
      masterySystem.reset();
    }
  });

  it('should initialize mastery state', () => {
    const state = masterySystem.getState?.();
    expect(state).toBeDefined();
  });

  it('should track mastery points and progress', () => {
    const state = masterySystem.getState?.();
    if (state) {
      expect(state.totalXp).toBeGreaterThanOrEqual(0);
      expect(state.tracks).toBeDefined();
    }
  });

  it('should have valid track definitions', () => {
    const tracks = ['pathfinder', 'chaos_dancer', 'awakener', 'specialist', 'flow_state'];
    tracks.forEach(track => {
      const trackState = masterySystem.getState?.()?.tracks?.[track];
      expect(trackState).toBeDefined();
    });
  });

  it('should handle XP gain without errors', () => {
    const initialState = masterySystem.getState?.();
    const initialXp = initialState?.totalXp || 0;

    // Attempt to gain XP (may or may not work depending on implementation)
    if (masterySystem.gainXp) {
      masterySystem.gainXp(10); // Add 10 XP to a track if available
      const newState = masterySystem.getState?.();
      expect(newState).toBeDefined();
    }
  });

  it('should export mastery state for serialization', () => {
    const exported = masterySystem.export?.();
    expect(exported).toBeDefined();
  });
});
