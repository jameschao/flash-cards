export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export type SwipeHandlers = {
  onSwipe: (direction: SwipeDirection) => void;
};

export type SwipeTracker = {
  onPointerDown: (e: PointerEventLike) => void;
  onPointerMove: (e: PointerEventLike) => void;
  onPointerUp: (e: PointerEventLike) => void;
  onPointerCancel: (e: PointerEventLike) => void;
};

type Point = { x: number; y: number };
type PointerEventLike = { pointerId: number; clientX: number; clientY: number };

export function createSwipeTracker(
  handlers: SwipeHandlers,
  opts?: { thresholdPx?: number; maxOffAxisPx?: number },
): SwipeTracker {
  const thresholdPx = opts?.thresholdPx ?? 34;

  let start: Point | null = null;
  let activePointerId: number | null = null;
  let didSwipe = false;

  const classify = (dx: number, dy: number): SwipeDirection | null => {
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    if (Math.max(adx, ady) < thresholdPx) return null;
    if (adx >= ady) return dx < 0 ? 'left' : 'right';
    return dy < 0 ? 'up' : 'down';
  };

  return {
    onPointerDown(e) {
      activePointerId = e.pointerId;
      start = { x: e.clientX, y: e.clientY };
      didSwipe = false;
    },
    onPointerMove(e) {
      if (activePointerId !== e.pointerId) return;
      if (!start) return;
      if (didSwipe) return;
      const dir = classify(e.clientX - start.x, e.clientY - start.y);
      if (!dir) return;
      didSwipe = true;
      handlers.onSwipe(dir);
    },
    onPointerUp(e) {
      if (activePointerId !== e.pointerId) return;
      activePointerId = null;
      start = null;
      didSwipe = false;
    },
    onPointerCancel(e) {
      if (activePointerId !== e.pointerId) return;
      activePointerId = null;
      start = null;
      didSwipe = false;
    },
  };
}

