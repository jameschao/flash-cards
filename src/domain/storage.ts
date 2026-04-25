import { STORAGE_KEY, type AppModelV1 } from './model';

const EMPTY: AppModelV1 = {
  version: 1,
  stacks: {},
  cards: {},
  stackOrder: [],
};

export function loadModel(): AppModelV1 {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return EMPTY;
    const v = (parsed as { version?: unknown }).version;
    if (v !== 1) return EMPTY;
    return parsed as AppModelV1;
  } catch {
    return EMPTY;
  }
}

export function saveModel(model: AppModelV1): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(model));
}

