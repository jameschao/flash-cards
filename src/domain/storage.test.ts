import { describe, expect, it, beforeEach } from 'vitest';
import { loadModel, saveModel } from './storage';
import { STORAGE_KEY, type AppModelV1 } from './model';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty model when nothing saved', () => {
    const m = loadModel();
    expect(m.version).toBe(1);
    expect(m.stackOrder).toEqual([]);
  });

  it('round-trips model through localStorage', () => {
    const model: AppModelV1 = {
      version: 1,
      stacks: { s1: { id: 's1', name: 'A', cardIds: ['c1'], fontSizePt: 18 } },
      cards: { c1: { id: 'c1', text: 'hello' } },
      stackOrder: ['s1'],
    };
    saveModel(model);
    expect(localStorage.getItem(STORAGE_KEY)).toContain('"version":1');
    expect(loadModel()).toEqual(model);
  });

  it('ignores unknown versions', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 999, stacks: {} }));
    const m = loadModel();
    expect(m.version).toBe(1);
    expect(m.stackOrder).toEqual([]);
  });
});

