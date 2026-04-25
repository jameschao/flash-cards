import { STORAGE_KEY, type AppModelV1 } from './model';
import { newId } from './ids';

const EMPTY: AppModelV1 = {
  version: 1,
  stacks: {},
  cards: {},
  stackOrder: [],
};

function normalizeModel(input: AppModelV1): AppModelV1 {
  let model = input;

  const ensureStack = () => {
    const stackId = newId('stack');
    const cardId = newId('card');
    model = {
      ...model,
      stacks: {
        ...model.stacks,
        [stackId]: {
          id: stackId,
          name: 'My Stack',
          cardIds: [cardId],
          fontSizePt: 18,
        },
      },
      cards: {
        ...model.cards,
        [cardId]: { id: cardId, text: '' },
      },
      stackOrder: [...model.stackOrder, stackId],
    };
  };

  // If there's no stack data at all, bootstrap a default stack + first card.
  if (Object.keys(model.stacks).length === 0 || model.stackOrder.length === 0) {
    model = { ...EMPTY };
    ensureStack();
    return model;
  }

  // Ensure each stack has at least one card (older data / deleted all cards).
  for (const stackId of model.stackOrder) {
    const stack = model.stacks[stackId];
    if (!stack) continue;
    if (stack.cardIds.length > 0) continue;
    const cardId = newId('card');
    model = {
      ...model,
      stacks: {
        ...model.stacks,
        [stackId]: { ...stack, cardIds: [cardId] },
      },
      cards: {
        ...model.cards,
        [cardId]: { id: cardId, text: '' },
      },
    };
  }

  return model;
}

export function loadModel(): AppModelV1 {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return normalizeModel(EMPTY);
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return normalizeModel(EMPTY);
    const v = (parsed as { version?: unknown }).version;
    if (v !== 1) return normalizeModel(EMPTY);
    return normalizeModel(parsed as AppModelV1);
  } catch {
    return normalizeModel(EMPTY);
  }
}

export function saveModel(model: AppModelV1): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(model));
}

