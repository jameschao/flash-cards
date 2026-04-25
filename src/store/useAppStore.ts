import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { newId } from '../domain/ids';
import {
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  MAX_CARDS_PER_STACK,
  type AppModelV1,
  type CardId,
  type SaveStatus,
  type StackId,
} from '../domain/model';
import { loadModel, saveModel } from '../domain/storage';

type AppActions = {
  createStack(): StackId;
  renameStack(stackId: StackId, name: string): void;
  deleteStack(stackId: StackId): void;
  createCard(stackId: StackId, initialText?: string): CardId | null;
  updateCardText(cardId: CardId, text: string): void;
  deleteCard(stackId: StackId, cardId: CardId): void;
  reorderCards(stackId: StackId, nextCardIds: CardId[]): void;
  moveCard(stackId: StackId, cardId: CardId, delta: -1 | 1): void;
  setStackFontSize(stackId: StackId, fontSizePt: number): void;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function useAppStore() {
  const [model, setModel] = useState<AppModelV1>(() => loadModel());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastError, setLastError] = useState<string | null>(null);

  const dirtyRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);

  const scheduleSave = useCallback((next: AppModelV1) => {
    dirtyRef.current = true;
    setSaveStatus('saving');
    setLastError(null);

    if (saveTimerRef.current != null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    saveTimerRef.current = window.setTimeout(() => {
      try {
        saveModel(next);
        dirtyRef.current = false;
        setSaveStatus('saved');
      } catch (e) {
        setSaveStatus('error');
        setLastError(e instanceof Error ? e.message : 'Failed to save');
      }
    }, 350);
  }, []);

  const commit = useCallback(
    (updater: (prev: AppModelV1) => AppModelV1) => {
      setModel((prev) => {
        const next = updater(prev);
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  useEffect(() => {
    const flush = () => {
      if (!dirtyRef.current) return;
      try {
        saveModel(model);
        dirtyRef.current = false;
        setSaveStatus('saved');
      } catch (e) {
        setSaveStatus('error');
        setLastError(e instanceof Error ? e.message : 'Failed to save');
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [model]);

  const actions: AppActions = useMemo(
    () => ({
      createStack() {
        const id = newId('stack');
        const cardId = newId('card');
        commit((prev) => ({
          ...prev,
          cards: { ...prev.cards, [cardId]: { id: cardId, text: '' } },
          stacks: {
            ...prev.stacks,
            [id]: {
              id,
              name: 'New stack',
              cardIds: [cardId],
              fontSizePt: 18,
            },
          },
          stackOrder: [...prev.stackOrder, id],
        }));
        return id;
      },

      renameStack(stackId, name) {
        commit((prev) => {
          const stack = prev.stacks[stackId];
          if (!stack) return prev;
          return {
            ...prev,
            stacks: {
              ...prev.stacks,
              [stackId]: { ...stack, name },
            },
          };
        });
      },

      deleteStack(stackId) {
        commit((prev) => {
          const stack = prev.stacks[stackId];
          if (!stack) return prev;

          const nextStacks = { ...prev.stacks };
          delete nextStacks[stackId];

          const nextCards = { ...prev.cards };
          for (const cardId of stack.cardIds) delete nextCards[cardId];

          return {
            ...prev,
            stacks: nextStacks,
            cards: nextCards,
            stackOrder: prev.stackOrder.filter((id) => id !== stackId),
          };
        });
      },

      createCard(stackId, initialText = '') {
        const cardId = newId('card');
        let created: CardId | null = cardId;

        commit((prev) => {
          const stack = prev.stacks[stackId];
          if (!stack) {
            created = null;
            return prev;
          }
          if (stack.cardIds.length >= MAX_CARDS_PER_STACK) {
            created = null;
            return prev;
          }
          return {
            ...prev,
            cards: { ...prev.cards, [cardId]: { id: cardId, text: initialText } },
            stacks: {
              ...prev.stacks,
              [stackId]: { ...stack, cardIds: [...stack.cardIds, cardId] },
            },
          };
        });

        return created;
      },

      updateCardText(cardId, text) {
        commit((prev) => {
          const card = prev.cards[cardId];
          if (!card) return prev;
          return { ...prev, cards: { ...prev.cards, [cardId]: { ...card, text } } };
        });
      },

      deleteCard(stackId, cardId) {
        commit((prev) => {
          const stack = prev.stacks[stackId];
          if (!stack) return prev;
          if (!prev.cards[cardId]) return prev;

          const nextCards = { ...prev.cards };
          delete nextCards[cardId];

          return {
            ...prev,
            cards: nextCards,
            stacks: {
              ...prev.stacks,
              [stackId]: { ...stack, cardIds: stack.cardIds.filter((id) => id !== cardId) },
            },
          };
        });
      },

      reorderCards(stackId, nextCardIds) {
        commit((prev) => {
          const stack = prev.stacks[stackId];
          if (!stack) return prev;
          return {
            ...prev,
            stacks: {
              ...prev.stacks,
              [stackId]: { ...stack, cardIds: [...nextCardIds] },
            },
          };
        });
      },

      moveCard(stackId, cardId, delta) {
        commit((prev) => {
          const stack = prev.stacks[stackId];
          if (!stack) return prev;
          const idx = stack.cardIds.indexOf(cardId);
          if (idx < 0) return prev;
          const nextIdx = idx + delta;
          if (nextIdx < 0 || nextIdx >= stack.cardIds.length) return prev;
          const next = [...stack.cardIds];
          const [item] = next.splice(idx, 1);
          next.splice(nextIdx, 0, item);
          return {
            ...prev,
            stacks: { ...prev.stacks, [stackId]: { ...stack, cardIds: next } },
          };
        });
      },

      setStackFontSize(stackId, fontSizePt) {
        const nextSize = clamp(fontSizePt, FONT_SIZE_MIN, FONT_SIZE_MAX);
        commit((prev) => {
          const stack = prev.stacks[stackId];
          if (!stack) return prev;
          return {
            ...prev,
            stacks: { ...prev.stacks, [stackId]: { ...stack, fontSizePt: nextSize } },
          };
        });
      },
    }),
    [commit],
  );

  return { model, actions, saveStatus, lastError } as const;
}

