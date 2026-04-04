import { describe, it, expect, beforeEach } from 'vitest';
import { achievementSystem } from '../utils/achievementSystem';

describe('Achievement System', () => {
  beforeEach(() => {
    // Clear achievement state before each test
    achievementSystem.reset?.();
  });

  it('should initialize with proper achievement list', () => {
    const achievements = achievementSystem.getAllAchievements?.();
    expect(achievements).toBeDefined();
    expect(Array.isArray(achievements)).toBe(true);
    expect(achievements.length).toBeGreaterThan(0);
  });

  it('should track achievement unlocks', () => {
    const achievement = achievementSystem.getAllAchievements?.()?.[0];
    if (achievement) {
      const unlocked = achievementSystem.isUnlocked?.(achievement.id);
      expect(typeof unlocked).toBe('boolean');
    }
  });

  it('should handle achievement state serialization', () => {
    const state = achievementSystem.export?.();
    expect(state).toBeDefined();
  });
});
