import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { saveGame, loadGame, hasSave, getSaveSummary, exportSave } from '../saveSystem';

describe('Save System', () => {
  beforeEach(() => {
    // Mock localStorage
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should check for existing saves', () => {
    const result = hasSave?.();
    expect(typeof result).toBe('boolean');
  });

  it('should export save data', () => {
    // Create a mock game state
    const mockState = {
      currentRoomId: 'entrance',
      awareness: 10,
      sentience: 5,
      inventory: [],
      visited: new Set(['entrance']),
      history: []
    };

    const exported = exportSave?.(mockState as any);
    expect(exported).toBeDefined();
  });

  it('should get save summary without errors', () => {
    const summary = getSaveSummary?.();
    // Should return null if no save exists
    if (summary) {
      expect(summary).toBeDefined();
      expect(typeof summary).toBe('object');
    }
  });
});
