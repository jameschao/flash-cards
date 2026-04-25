import { useCallback, useEffect, useMemo, useState } from 'react';
import { FONT_SIZE_MAX, FONT_SIZE_MIN, MAX_CARDS_PER_STACK, type StackId } from './domain/model';
import { useAppStore } from './store/useAppStore';
import { createSwipeTracker } from './ui/gestures';

type Route =
  | { name: 'stacks' }
  | { name: 'stack'; stackId: StackId }
  | { name: 'reorder'; stackId: StackId };

function parseHash(hash: string): Route {
  const h = hash.replace(/^#/, '');
  if (!h) return { name: 'stacks' };
  const [kind, id] = h.split('/');
  if (kind === 'stack' && id) return { name: 'stack', stackId: id };
  if (kind === 'reorder' && id) return { name: 'reorder', stackId: id };
  return { name: 'stacks' };
}

function setHash(route: Route) {
  if (route.name === 'stacks') window.location.hash = '';
  if (route.name === 'stack') window.location.hash = `#stack/${route.stackId}`;
  if (route.name === 'reorder') window.location.hash = `#reorder/${route.stackId}`;
}

function statusLabel(status: string) {
  if (status === 'saving') return 'Saving…';
  if (status === 'saved') return 'Saved';
  if (status === 'error') return 'Save error';
  return 'Saved';
}

export function App() {
  const { model, actions, saveStatus, lastError } = useAppStore();
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHash = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const stack = route.name === 'stack' || route.name === 'reorder' ? model.stacks[route.stackId] : null;
  const [cardIndex, setCardIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const stackRouteId = route.name === 'stack' || route.name === 'reorder' ? route.stackId : undefined;

  useEffect(() => {
    if (route.name === 'stack' || route.name === 'reorder') {
      setCardIndex(0);
      setIsEditing(false);
    }
  }, [route.name, stackRouteId]);

  useEffect(() => {
    if (!stack) return;
    if (cardIndex >= stack.cardIds.length) setCardIndex(Math.max(0, stack.cardIds.length - 1));
  }, [stack?.cardIds.length, cardIndex, stack]);

  const currentCardId = stack ? stack.cardIds[cardIndex] : null;
  const currentCard = currentCardId ? model.cards[currentCardId] : null;

  const onPrev = useCallback(() => {
    if (!stack) return;
    setCardIndex((i) => Math.max(0, i - 1));
  }, [stack]);

  const onNext = useCallback(() => {
    if (!stack) return;
    setCardIndex((i) => Math.min(stack.cardIds.length - 1, i + 1));
  }, [stack]);

  const canGoPrev = !!stack && cardIndex > 0;
  const canGoNext = !!stack && cardIndex < stack.cardIds.length - 1;

  const swipe = useMemo(() => {
    return createSwipeTracker({
      onSwipe(dir) {
        if (isEditing) return;
        // Map both axes to the same prev/next actions.
        if ((dir === 'left' || dir === 'up') && canGoNext) onNext();
        if ((dir === 'right' || dir === 'down') && canGoPrev) onPrev();
      },
    });
  }, [isEditing, canGoNext, canGoPrev, onNext, onPrev]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditing) return;
      if (route.name !== 'stack') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (canGoNext) onNext();
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (canGoPrev) onPrev();
      }
    };
    window.addEventListener('keydown', onKey, { passive: false });
    return () => window.removeEventListener('keydown', onKey);
  }, [isEditing, route.name, canGoNext, canGoPrev, onNext, onPrev]);

  if (route.name === 'stacks') {
    return (
      <div className="appShell">
        <header className="topBar">
          <div className="topBarLeft">
            <span className="appTitle">Stacks</span>
          </div>
          <div className="topBarRight">
            <button
              className="btn"
              onClick={() => {
                const id = actions.createStack();
                setHash({ name: 'stack', stackId: id });
              }}
            >
              + Stack
            </button>
          </div>
        </header>

        <main className="screen">
          <div className="list">
            {model.stackOrder.length === 0 ? (
              <p className="muted">Create a stack to start.</p>
            ) : (
              <div className="listCard">
                {model.stackOrder.map((id) => {
                  const s = model.stacks[id];
                  if (!s) return null;
                  return (
                    <button
                      key={id}
                      className="rowButton"
                      onClick={() => setHash({ name: 'stack', stackId: id })}
                    >
                      <div>
                        <div className="stackTitle">{s.name}</div>
                        <div className="rowMeta">
                          {s.cardIds.length} / {MAX_CARDS_PER_STACK}
                        </div>
                      </div>
                      <div className="rowActions">
                        <button
                          className="btn"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const name = window.prompt('Rename stack', s.name);
                            if (name != null) actions.renameStack(id, name.trim() || s.name);
                          }}
                        >
                          Rename
                        </button>
                        <button
                          className="btn btnDanger"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (window.confirm(`Delete stack “${s.name}”? This cannot be undone.`)) {
                              actions.deleteStack(id);
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        <footer className="statusBar" aria-live="polite">
          <span className="statusText">
            {statusLabel(saveStatus)}
            {saveStatus === 'error' && lastError ? ` — ${lastError}` : ''}
          </span>
        </footer>
      </div>
    );
  }

  if (!stack) {
    return (
      <div className="appShell">
        <header className="topBar">
          <div className="topBarLeft">
            <button className="btn" onClick={() => setHash({ name: 'stacks' })}>
              Back
            </button>
          </div>
        </header>
        <main className="screen">
          <p className="muted">Stack not found.</p>
        </main>
        <footer className="statusBar" aria-live="polite">
          <span className="statusText">{statusLabel(saveStatus)}</span>
        </footer>
      </div>
    );
  }

  if (route.name === 'reorder') {
    return (
      <div className="appShell">
        <header className="topBar">
          <div className="topBarLeft">
            <button className="btn" onClick={() => setHash({ name: 'stack', stackId: stack.id })}>
              Back
            </button>
          </div>
          <div className="topBarCenter">
            <span className="stackTitle">Reorder</span>
          </div>
          <div className="topBarRight">
            <button className="btn" onClick={() => setHash({ name: 'stack', stackId: stack.id })}>
              Done
            </button>
          </div>
        </header>

        <main className="screen">
          <div className="list">
            {stack.cardIds.length === 0 ? (
              <p className="muted">No cards yet.</p>
            ) : (
              <div className="listCard">
                {stack.cardIds.map((cardId, idx) => {
                  const card = model.cards[cardId];
                  if (!card) return null;
                  return (
                    <div
                      key={cardId}
                      className="rowButton"
                      style={{
                        cursor: 'default',
                        borderTop: idx === 0 ? '0' : undefined,
                      }}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', cardId);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const fromId = e.dataTransfer.getData('text/plain');
                        if (!fromId) return;
                        const fromIdx = stack.cardIds.indexOf(fromId);
                        const toIdx = stack.cardIds.indexOf(cardId);
                        if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
                        const next = [...stack.cardIds];
                        const [item] = next.splice(fromIdx, 1);
                        next.splice(toIdx, 0, item);
                        actions.reorderCards(stack.id, next);
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="rowMeta">{idx + 1}</div>
                        <div
                          className="stackTitle"
                          style={{
                            fontSize: `${Math.min(15, stack.fontSizePt)}pt`,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {card.text || '—'}
                        </div>
                      </div>
                      <div className="rowActions">
                        <button
                          className="btn"
                          onClick={() => actions.moveCard(stack.id, cardId, -1)}
                          aria-label="Move up"
                        >
                          ↑
                        </button>
                        <button
                          className="btn"
                          onClick={() => actions.moveCard(stack.id, cardId, 1)}
                          aria-label="Move down"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        <footer className="statusBar" aria-live="polite">
          <span className="statusText">
            {statusLabel(saveStatus)}
            {saveStatus === 'error' && lastError ? ` — ${lastError}` : ''}
          </span>
        </footer>
      </div>
    );
  }

  // stack view (flip/edit)
  return (
    <div className="appShell">
      <header className="topBar">
        <div className="topBarLeft">
          <button className="btn" onClick={() => setHash({ name: 'stacks' })}>
            Back
          </button>
        </div>
        <div className="topBarCenter">
          <span className="stackTitle">{stack.name}</span>
        </div>
        <div className="topBarRight">
          <div className="rangeWrap" aria-label="Font size">
            <span className="rowMeta">{stack.fontSizePt}pt</span>
            <input
              type="range"
              min={FONT_SIZE_MIN}
              max={FONT_SIZE_MAX}
              value={stack.fontSizePt}
              onChange={(e) => actions.setStackFontSize(stack.id, Number(e.target.value))}
            />
          </div>
          <button className="btn" onClick={() => setHash({ name: 'reorder', stackId: stack.id })}>
            Reorder
          </button>
        </div>
      </header>

      <main className="screen">
        <div className="cardStage">
          <div className="cardNavRow" aria-label="Card navigation">
            <button className="btn" onClick={onPrev} disabled={cardIndex <= 0 || isEditing}>
              ←
            </button>
            <span className="badge">
              {stack.cardIds.length === 0 ? 'Empty' : `${cardIndex + 1} / ${stack.cardIds.length}`}
            </span>
            <button
              className="btn"
              onClick={onNext}
              disabled={stack.cardIds.length === 0 || cardIndex >= stack.cardIds.length - 1 || isEditing}
            >
              →
            </button>
            <button
              className="btn"
              onClick={() => {
                const created = actions.createCard(stack.id, '');
                if (created) {
                  setCardIndex(stack.cardIds.length); // new card goes to end
                  setIsEditing(true);
                } else {
                  window.alert(`Max ${MAX_CARDS_PER_STACK} cards per stack.`);
                }
              }}
              disabled={stack.cardIds.length >= MAX_CARDS_PER_STACK}
            >
              + Card
            </button>
          </div>

          <div
            className="cardSurface"
            role="group"
            aria-label="Card"
            onPointerDown={swipe.onPointerDown}
            onPointerMove={swipe.onPointerMove}
            onPointerUp={swipe.onPointerUp}
            onPointerCancel={swipe.onPointerCancel}
            onClick={() => {
              if (stack.cardIds.length === 0) return;
              setIsEditing(true);
            }}
            style={{ fontSize: `${stack.fontSizePt}pt` }}
          >
            {stack.cardIds.length === 0 ? (
              <div className="cardBody">
                <p className="muted">No cards yet. Tap “+ Card” to add one.</p>
              </div>
            ) : isEditing && currentCard ? (
              <textarea
                className="cardEditor"
                value={currentCard.text}
                onChange={(e) => actions.updateCardText(currentCard.id, e.target.value)}
                onBlur={() => setIsEditing(false)}
                autoFocus
                aria-label="Edit card"
              />
            ) : (
              <div className="cardBody">
                <p className="cardText">{currentCard?.text || ''}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="statusBar" aria-live="polite">
        <span className="statusText">
          {statusLabel(saveStatus)}
          {saveStatus === 'error' && lastError ? ` — ${lastError}` : ''}
        </span>
      </footer>
    </div>
  );
}

