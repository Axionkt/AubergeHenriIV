import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  type CSSProperties,
} from "react";
import styles from "./ReviewCarousel.module.css";
import { Review } from "../types/review";
import { FormattedText } from "./form/Textarea";

const AUTOPLAY_MS = 10000;
const MOBILE_BREAKPOINT = 750;
// Must match `.pip` / `.pip-active` widths in index.css.
const PIP_W = 6;
const PIP_ACTIVE_W = 20;

function mod(i: number, n: number) {
  return ((i % n) + n) % n;
}

function useIsMobile(breakpoint = MOBILE_BREAKPOINT) {
  const query = `(max-width: ${breakpoint}px)`;
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return isMobile;
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className={`card ${styles.cardInner}`}>
      <div className={styles.quoteAuthor}>
        <span className={styles.authorName} title={review.authorName}>
          {review.authorName}
        </span>
        {review.createdAt && (
          <span className={styles.quoteDate}>
            {new Date(review.createdAt).toLocaleDateString("fr-FR", {
              year: "numeric",
            })}
          </span>
        )}
      </div>
      <div className={styles.body}>
        <span className={styles.quoteGlyph} aria-hidden="true">
          "
        </span>
        <FormattedText className={styles.text} value={review.text} />
        <div className={styles.fadeBottom} aria-hidden="true" />
      </div>
    </div>
  );
}

export default function ReviewCarousel({ reviews }: { reviews: Review[] }) {
  const n = reviews.length;
  const isMobile = useIsMobile();
  const itemsPerView = isMobile ? 1 : 2;
  const k = itemsPerView; // clones on each side of the real slides
  const canCycle = n > itemsPerView; // scrolling only makes sense with more reviews than fit in one view

  const [index, setIndex] = useState(0); // logical index of the first visible review

  const trackRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(index);
  indexRef.current = index;
  const touchingRef = useRef(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoplayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const pipWindowRef = useRef<HTMLDivElement>(null);
  const pipStripRef = useRef<HTMLDivElement>(null);
  const [maxPips, setMaxPips] = useState(Infinity); // how many pips fit between the buttons

  const slotWidth = () => {
    const track = trackRef.current;
    return track ? track.clientWidth / itemsPerView : 0;
  };

  const currentSlot = () => {
    const track = trackRef.current;
    const w = slotWidth();
    return track && w ? Math.round(track.scrollLeft / w) : indexRef.current + k;
  };

  const scrollToSlot = (p: number, smooth: boolean) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({
      left: p * slotWidth(),
      behavior: smooth ? "smooth" : "auto",
    });
  };

  const clearAutoplay = () => {
    if (autoplayRef.current) clearTimeout(autoplayRef.current);
    autoplayRef.current = null;
  };

  // Restart the full countdown so the user always gets AUTOPLAY_MS on whatever they land on.
  const scheduleAutoplay = () => {
    clearAutoplay();
    if (!canCycle || touchingRef.current) return;
    autoplayRef.current = setTimeout(() => goNextRef.current(), AUTOPLAY_MS);
  };

  // Once scrolling settles: if we landed on a clone, jump instantly to the identical real slide.
  const normalize = () => {
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = null;
    if (!canCycle || touchingRef.current) return;
    const p = currentSlot();
    if (p < k) scrollToSlot(p + n, false);
    else if (p >= n + k) scrollToSlot(p - n, false);
    scheduleAutoplay();
  };

  const goBy = (delta: number) => {
    if (!canCycle) return;
    scrollToSlot(currentSlot() + delta, true);
    scheduleAutoplay();
  };
  const goNext = () => goBy(1);
  const goPrev = () => goBy(-1);

  const goNextRef = useRef(goNext);
  goNextRef.current = goNext;
  const normalizeRef = useRef(normalize);
  normalizeRef.current = normalize;

  const jumpTo = (target: number) => {
    if (!canCycle) return;
    if (target !== index) scrollToSlot(target + k, true);
    scheduleAutoplay();
  };

  function handleScroll() {
    const track = trackRef.current;
    const w = slotWidth();
    if (!track || !w) return;
    const p = Math.round(track.scrollLeft / w);
    setIndex(mod(p - k, n));
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    if (!touchingRef.current) {
      settleTimerRef.current = setTimeout(() => normalizeRef.current(), 120);
    }
  }

  function handleTouchStart() {
    touchingRef.current = true;
    clearAutoplay();
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
  }

  function handleTouchEnd() {
    touchingRef.current = false;
    // Covers a release with no momentum (no further scroll events) on browsers without `scrollend`.
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => normalizeRef.current(), 120);
  }

  // Land on the right slot before first paint and whenever the layout (or clone count) changes.
  useLayoutEffect(() => {
    if (!canCycle) return;
    scrollToSlot(mod(indexRef.current, n) + k, false);
  }, [canCycle, itemsPerView, n]);

  // Keep alignment on resize, and normalize promptly where `scrollend` is supported.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !canCycle) return;
    const onScrollEnd = () => normalizeRef.current();
    track.addEventListener("scrollend", onScrollEnd);
    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        track.scrollTo({
          left: (indexRef.current + k) * (track.clientWidth / k),
          behavior: "auto",
        });
      });
      observer.observe(track);
    }
    return () => {
      track.removeEventListener("scrollend", onScrollEnd);
      observer?.disconnect();
    };
  }, [canCycle, k]);

  // Autoplay: one-shot timer, restarted after every settled scroll.
  useEffect(() => {
    if (!canCycle) return;
    scheduleAutoplay();
    return () => {
      clearAutoplay();
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canCycle]);

  // Measure how many pips fit between the prev/next buttons (with `itemsPerView` of them active/wide).
  useLayoutEffect(() => {
    const controls = controlsRef.current;
    const pipWindow = pipWindowRef.current;
    const strip = pipStripRef.current;
    if (!controls || !pipWindow || !strip) return;
    const measure = () => {
      const ctrlGap = parseFloat(getComputedStyle(controls).columnGap) || 0;
      const pipGap = parseFloat(getComputedStyle(strip).columnGap) || 0;
      let others = 0;
      for (const el of Array.from(controls.children)) {
        if (el !== pipWindow) others += (el as HTMLElement).offsetWidth + ctrlGap;
      }
      const avail = controls.clientWidth - others;
      const fit = Math.floor(
        (avail + pipGap - itemsPerView * (PIP_ACTIVE_W - PIP_W)) /
          (PIP_W + pipGap),
      );
      setMaxPips(Math.max(fit, itemsPerView));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(controls);
    return () => observer.disconnect();
  }, [itemsPerView, n]);

  if (n === 0) {
    return <p className={styles.empty}>No reviews yet.</p>;
  }

  if (n === 1) {
    return (
      <div className={styles.viewport}>
        <ReviewCard review={reviews[0]} />
      </div>
    );
  }

  const visibleSet = canCycle
    ? new Set(Array.from({ length: itemsPerView }, (_, j) => mod(index + j, n)))
    : null;

  // Physical slides: [last k (clones), all n, first k (clones)]
  const slides = canCycle
    ? [
        ...Array.from({ length: k }, (_, j) => ({
          key: `pre-${j}`,
          idx: mod(n - k + j, n),
        })),
        ...reviews.map((_, i) => ({ key: `${i}`, idx: i })),
        ...Array.from({ length: k }, (_, j) => ({
          key: `post-${j}`,
          idx: j,
        })),
      ]
    : [];
  const firstVisibleSlot = index + k;

  // Pip window: when not every pip fits, show a sliding subset that keeps the active pip(s)
  // centered, clamping at either end so the active pip(s) then move toward the edge instead.
  let windowSize = n;
  let windowStart = 0;
  if (canCycle && maxPips < n) {
    windowSize = maxPips;
    // Same parity as itemsPerView so the active pip(s) sit exactly in the middle.
    if ((windowSize - itemsPerView) % 2 !== 0) windowSize -= 1;
    windowSize = Math.max(windowSize, itemsPerView);
    const centered = index - (windowSize - itemsPerView) / 2;
    windowStart = Math.min(Math.max(centered, 0), n - windowSize);
  }
  const windowEnd = windowStart + windowSize;
  const inWindow = (i: number) => i >= windowStart && i < windowEnd;
  const isActive = (i: number) =>
    inWindow(i) && (canCycle ? visibleSet!.has(i) : true);
  let activeInWindow = 0;
  for (let i = windowStart; i < windowEnd; i++) if (isActive(i)) activeInWindow++;
  const pipWindowStyle = {
    "--pip-count": windowSize,
    "--pip-active-count": activeInWindow,
    "--pip-offset": windowStart,
  } as CSSProperties;

  return (
    <>
      <div className={styles.viewport}>
        {canCycle ? (
          <div
            ref={trackRef}
            className={styles.track}
            onScroll={handleScroll}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            role="group"
            aria-roledescription="carousel"
            aria-label="Reviews"
          >
            {slides.map(({ key, idx }, p) => (
              <div
                className={styles.slot}
                key={key}
                style={{ flex: `0 0 ${100 / itemsPerView}%` }}
                aria-hidden={
                  p < firstVisibleSlot || p >= firstVisibleSlot + itemsPerView
                }
              >
                <ReviewCard review={reviews[idx]} />
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.pairJump}>
            {reviews.map((review, i) => (
              <div className={styles.pairSlot} key={i}>
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`controls ${styles.controls}`} ref={controlsRef}>
        <button
          className="control-btn"
          onClick={goPrev}
          aria-label="Previous review"
          disabled={!canCycle}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div
          className={styles.pipWindow}
          ref={pipWindowRef}
          style={pipWindowStyle}
        >
          <div
            className={`pips ${styles.pipStrip}`}
            ref={pipStripRef}
            role="tablist"
            aria-label="Reviews navigation"
          >
            {reviews.map((_, i) => {
              const active = isActive(i);
              const visible = canCycle ? visibleSet!.has(i) : true;
              // Shrink the outermost pip when more pips are hidden beyond it.
              const isEdge =
                !active &&
                ((i === windowStart && windowStart > 0) ||
                  (i === windowEnd - 1 && windowEnd < n));
              return (
                <button
                  key={i}
                  role="tab"
                  aria-selected={visible}
                  aria-label={`Review ${i + 1} of ${n}`}
                  tabIndex={inWindow(i) ? 0 : -1}
                  className={`pip ${active ? "pip-active" : ""} ${isEdge ? styles.pipEdge : ""}`}
                  onClick={() => jumpTo(i)}
                />
              );
            })}
          </div>
        </div>

        <button
          className="control-btn"
          onClick={goNext}
          aria-label="Next review"
          disabled={!canCycle}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </>
  );
}

export function ReviewCarouselSkeleton() {
  return (
    <>
      <div className={styles.viewport}>
        <div className={styles.pairJump}>
          {[0, 1].map((i) => (
            <div className={styles.pairSlot} key={i}>
              <div className={`card ${styles.cardInner}`}>
                <div className={styles.rating}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div
                        key={j}
                        className="skeleton"
                        style={{ width: 18, height: 18, borderRadius: 4 }}
                      />
                    ))}
                  </div>
                </div>
                <div className={styles.body}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      paddingTop: 32,
                      paddingLeft: 6,
                    }}
                  >
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div
                        key={j}
                        className="skeleton"
                        style={{
                          height: 16,
                          width: j === 4 ? "40%" : j === 3 ? "65%" : "88%",
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className={styles.quoteAuthor}>
                  <span className="ornament-line" />
                  <div
                    className="skeleton"
                    style={{ width: 120, height: 12 }}
                  />
                  <span className="ornament-line" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`controls ${styles.controls}`}>
        <div
          className="skeleton"
          style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0 }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ width: i === 0 ? 20 : 6, height: 6, borderRadius: 3 }}
            />
          ))}
        </div>
        <div
          className="skeleton"
          style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0 }}
        />
      </div>
    </>
  );
}
