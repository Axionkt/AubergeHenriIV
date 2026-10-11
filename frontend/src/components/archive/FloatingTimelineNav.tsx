import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./FloatingTimelineNav.module.css";

const ROW_HEIGHT = 46;
const VISIBLE_ROWS = 9;
const HIDE_DELAY = 2200;

export interface TimelineNavEntry {
  id: string;
  year: string;
  month?: string;
  era?: string;
}

export interface FloatingTimelineNavProps {
  entries: TimelineNavEntry[];
  activeIndex: number;
  onJump: (id: string) => void;
}

export default function FloatingTimelineNav({
  entries,
  activeIndex,
  onJump,
}: FloatingTimelineNavProps) {
  const containerHeight = ROW_HEIGHT * VISIBLE_ROWS;
  const padY = containerHeight / 2 - ROW_HEIGHT / 2;

  const scrollElRef = useRef<HTMLDivElement | null>(null);
  const isManualRef = useRef(false);
  const activeIndexRef = useRef(activeIndex);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [navVisible, setNavVisible] = useState(true);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const showNav = useCallback(() => {
    setNavVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setNavVisible(false), HIDE_DELAY);
  }, []);

  const snapToActive = useCallback(() => {
    const el = scrollElRef.current;
    if (!el) return;
    el.scrollTo({
      top: activeIndexRef.current * ROW_HEIGHT,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    const el = scrollElRef.current;
    if (el) el.scrollTop = activeIndexRef.current * ROW_HEIGHT;
    showNav();
  }, []);

  useEffect(() => {
    if (isManualRef.current) return;
    const el = scrollElRef.current;
    if (el) el.scrollTo({ top: activeIndex * ROW_HEIGHT, behavior: "smooth" });
  }, [activeIndex]);

  useEffect(() => {
    const onWindowScroll = () => {
      showNav();
      if (isManualRef.current) {
        isManualRef.current = false;
        snapToActive();
      }
    };
    window.addEventListener("scroll", onWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", onWindowScroll);
  }, [showNav, snapToActive]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const handleManualStart = () => {
    isManualRef.current = true;
    showNav();
  };

  const handleNavScroll = () => {
    const el = scrollElRef.current;
    if (el) setScrollTop(el.scrollTop);
  };

  if (!entries.length) return null;

  return (
    <>
      <div
        className={styles.hoverZone}
        onMouseEnter={showNav}
        aria-hidden="true"
      />
      <nav
        className={styles.floatNav}
        style={{
          height: containerHeight,
          opacity: navVisible ? 1 : 0,
          pointerEvents: navVisible ? "auto" : "none",
        }}
        aria-label="Chronologie"
        onMouseEnter={showNav}
        onMouseMove={showNav}
      >
        <div
          ref={scrollElRef}
          className={styles.scroll}
          style={{ paddingTop: padY, paddingBottom: padY }}
          onScroll={handleNavScroll}
          onWheel={handleManualStart}
          onTouchStart={handleManualStart}
        >
          {entries.map((entry, i) => {
            const distance = Math.min(
              Math.abs(i * ROW_HEIGHT - scrollTop) / ROW_HEIGHT,
              4,
            );
            const isActive = distance < 0.5;
            return (
              <button
                key={entry.id}
                type="button"
                className={styles.item}
                onClick={() => onJump(entry.id)}
                style={{
                  height: ROW_HEIGHT,
                  opacity: Math.max(0.08, 1 - distance * 0.26),
                  transform: `scale(${Math.max(0.82, 1.12 - distance * 0.08)})`,
                }}
                aria-current={isActive ? "true" : undefined}
              >
                <span className={styles.dot} />
                <span className={styles.year}>{entry.year}</span>
                {isActive && entry.era && (
                  <span className={styles.era}>{entry.era}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
