import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { App } from './App';
import { STORAGE_KEY, type AppModelV1 } from './domain/model';

function setModel(model: AppModelV1) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(model));
}

describe('App document title', () => {
  let root: Root | null = null;
  let container: HTMLElement | null = null;

  beforeEach(() => {
    localStorage.clear();
    document.title = '';
    window.location.hash = '';

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container?.remove();
    container = null;
    root = null;
  });

  it('uses base title on stacks view', async () => {
    await act(async () => {
      root!.render(<App />);
    });
    expect(document.title).toBe('Flash Cards');
  });

  it('uses stack title when a stack is open', async () => {
    setModel({
      version: 1,
      stacks: {
        s1: { id: 's1', name: 'My Ideas', cardIds: ['c1'], fontSizePt: 18 },
      },
      cards: {
        c1: { id: 'c1', text: 'hello' },
      },
      stackOrder: ['s1'],
    });

    window.location.hash = '#stack/s1';

    await act(async () => {
      root!.render(<App />);
    });
    expect(document.title).toBe('Flash Cards: My Ideas');

    await act(async () => {
      window.location.hash = '';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(document.title).toBe('Flash Cards');
  });
});

