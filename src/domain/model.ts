export type StackId = string;
export type CardId = string;

export type Card = {
  id: CardId;
  text: string;
};

export type Stack = {
  id: StackId;
  name: string;
  cardIds: CardId[];
  fontSizePt: number;
};

export type AppModelV1 = {
  version: 1;
  stacks: Record<StackId, Stack>;
  cards: Record<CardId, Card>;
  stackOrder: StackId[];
};

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export const STORAGE_KEY = 'indexCardsApp:v1';
export const MAX_CARDS_PER_STACK = 100;
export const FONT_SIZE_MIN = 12;
export const FONT_SIZE_MAX = 48;

