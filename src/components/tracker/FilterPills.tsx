'use client';

// Date-range pills as a click-to-scroll, drag-to-scroll horizontal strip —
// arrows fade based on scroll position, mouse-drag mirrors touch scrolling.
import { useCallback, useEffect, useRef, useState } from 'react';
import { FilterType } from '@/lib/types';

export const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'last7',  label: 'Last 7 Days' },
  { key: 'last30', label: 'Last 30 Days' },
  { key: 'last60', label: 'Last 60 Days' },
  { key: 'last90', label: 'Last 90 Days' },
  { key: 'year',   label: '1 Year' },
  { key: 'all',    label: 'All Time' },
];

// Circular left/right scroll button, faded out when there's nothing left to scroll to.
function ScrollArrow({ dir, can, onClick }: { dir: 'left' | 'right'; can: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={`Scroll ${dir}`}
      style={{
        flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
        border: `1px solid ${can ? 'var(--border)' : 'var(--border-soft)'}`,
        background: 'transparent',
        color: can ? 'var(--text-muted)' : 'var(--border)',
        cursor: can ? 'pointer' : 'default',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s', pointerEvents: can ? 'auto' : 'none',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        {dir === 'left'
          ? <path d="M9 2.5L5 7L9 11.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          : <path d="M5 2.5L9 7L5 11.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        }
      </svg>
    </button>
  );
}

// Horizontal strip of date-range pills that supports scroll arrows and mouse-drag scrolling.
export default function FilterPills({ active, onChange }: { active: FilterType; onChange: (filter: FilterType) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Recomputes whether the left/right scroll arrows should be enabled.
  const checkArrows = useCallback(() => {
    const element = scrollRef.current;

    if (!element) {
      return;
    }

    setCanScrollLeft(element.scrollLeft > 4);
    setCanScrollRight(element.scrollLeft < element.scrollWidth - element.clientWidth - 4);
  }, []);

  useEffect(() => {
    const element = scrollRef.current;

    if (!element) {
      return;
    }

    checkArrows();
    element.addEventListener('scroll', checkArrows, { passive: true });
    const resizeObserver = new ResizeObserver(checkArrows);
    resizeObserver.observe(element);

    return () => {
      element.removeEventListener('scroll', checkArrows);
      resizeObserver.disconnect();
    };
  }, [checkArrows]);

  // Scrolls the pill strip left or right by a fixed amount.
  function scroll(dir: 'left' | 'right') {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -160 : 160, behavior: 'smooth' });
  }

  // Begins a mouse-drag scroll gesture on the pill strip.
  const onDragStart = useCallback((event: React.MouseEvent) => {
    const element = scrollRef.current;

    if (!element) {
      return;
    }

    dragging.current = true;
    dragStartX.current = event.pageX - element.offsetLeft;
    dragScrollLeft.current = element.scrollLeft;
    element.style.cursor = 'grabbing';
    element.style.userSelect = 'none';
  }, []);

  // Scrolls the strip to follow the pointer while dragging.
  const onDragMove = useCallback((event: React.MouseEvent) => {
    if (!dragging.current || !scrollRef.current) {
      return;
    }

    event.preventDefault();
    const x = event.pageX - scrollRef.current.offsetLeft;
    scrollRef.current.scrollLeft = dragScrollLeft.current - (x - dragStartX.current);
  }, []);

  // Ends the mouse-drag scroll gesture.
  const onDragEnd = useCallback(() => {
    dragging.current = false;

    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
      scrollRef.current.style.userSelect = '';
    }
  }, []);

  return (
    <>
      <ScrollArrow dir="left" can={canScrollLeft} onClick={() => scroll('left')} />
      <div
        ref={scrollRef}
        className="no-scrollbar"
        style={{ display: 'flex', gap: 6, overflowX: 'auto', flex: 1, minWidth: 0, cursor: 'grab' }}
        onMouseDown={onDragStart}
        onMouseMove={onDragMove}
        onMouseUp={onDragEnd}
        onMouseLeave={onDragEnd}
      >
        {FILTERS.map((filter) => {
          const isActive = filter.key === active;
          return (
            <button
              key={filter.key}
              onClick={() => onChange(filter.key)}
              style={{
                flexShrink: 0,
                background: isActive ? 'var(--accent)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 20,
                color: isActive ? 'var(--accent-contrast)' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11, fontWeight: isActive ? 700 : 600, letterSpacing: '0.03em',
                padding: '6px 14px', cursor: 'pointer',
                whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}
              onMouseEnter={(event) => {
                if (!isActive) {
                  event.currentTarget.style.color = 'var(--accent)';
                }
              }}
              onMouseLeave={(event) => {
                if (!isActive) {
                  event.currentTarget.style.color = 'var(--text-muted)';
                }
              }}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
      <ScrollArrow dir="right" can={canScrollRight} onClick={() => scroll('right')} />
    </>
  );
}
