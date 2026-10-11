import { useState, useRef, useCallback, useEffect } from "react";
import styles from "./ReviewCarousel.module.css";
import { Review } from "../types/review";

const AUTOPLAY_MS = 10000;
const SLIDE_MS = 420;
const MOBILE_BREAKPOINT = 750;

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
        <span className="ornament-line" />
        {review.authorName}
        {review.createdAt && (
          <span className={styles.quoteDate}>
            {new Date(review.createdAt).toLocaleDateString("fr-FR", {
              year: "numeric",
              month: "long",
            })}
          </span>
        )}
        <span className="ornament-line" />
      </div>
      <div className={styles.body}>
        <span className={styles.quoteGlyph} aria-hidden="true">
          "
        </span>
        <p className={styles.text}>{review.text}</p>
        <div className={styles.fadeBottom} aria-hidden="true" />
      </div>
    </div>
  );
}

export default function ReviewCarousel({ reviews }: { reviews: Review[] }) {
  const n = reviews.length;
  const isMobile = useIsMobile();
  const itemsPerView = isMobile ? 1 : 2;
  const slots = itemsPerView + 2; // buffer-before + N visible + buffer-after
  const step = 100 / slots; // % of TRACK width per slide-step
  const canCycle = n > itemsPerView; // sliding window only makes sense with more reviews than fit in one view

  const [startIndex, setStartIndex] = useState(0);
  const [sliding, setSliding] = useState<"idle" | "forward" | "backward">(
    "idle",
  );
  const [jumpKey, setJumpKey] = useState(0);
  const [jumpDir, setJumpDir] = useState<"forward" | "backward">("forward");

  const animatingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goNext = useCallback(() => {
    if (animatingRef.current || !canCycle) return;
    animatingRef.current = true;
    setSliding("forward");
  }, [canCycle]);

  const goPrev = useCallback(() => {
    if (animatingRef.current || !canCycle) return;
    animatingRef.current = true;
    setSliding("backward");
  }, [canCycle]);

  const jumpTo = useCallback(
    (target: number) => {
      if (animatingRef.current || target === startIndex) return;

      if (canCycle) {
        const fwd = mod(target - startIndex, n);
        const bwd = mod(startIndex - target, n);
        if (fwd === 1) return goNext();
        if (bwd === 1) return goPrev();
        setJumpDir(fwd <= bwd ? "forward" : "backward");
      }

      setStartIndex(target);
      setJumpKey((k) => k + 1);
    },
    [startIndex, n, canCycle, goNext, goPrev],
  );

  // Autoplay
  useEffect(() => {
    if (!canCycle) return;
    intervalRef.current = setInterval(goNext, AUTOPLAY_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [canCycle, goNext]);

  const handleTrackTransitionEnd = (e: React.TransitionEvent) => {
    if (e.propertyName !== "transform" || sliding === "idle") return;
    setStartIndex((prev) =>
      sliding === "forward" ? mod(prev + 1, n) : mod(prev - 1, n),
    );
    setSliding("idle");
    animatingRef.current = false;
  };

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

  // `slots` slots: [buffer-before, ...N visible, buffer-after]
  const slotIndices = canCycle
    ? Array.from({ length: slots }, (_, i) => mod(startIndex - 1 + i, n))
    : [];

  const trackWidthPercent = (slots / itemsPerView) * 100;

  let trackTransform = `translateX(-${step}%)`; // baseline: shows slots [1..itemsPerView]
  let withTransition = false;
  if (sliding === "forward") {
    trackTransform = `translateX(-${step * 2}%)`;
    withTransition = true;
  } else if (sliding === "backward") {
    trackTransform = "translateX(0%)";
    withTransition = true;
  }

  const visibleSet = canCycle
    ? new Set(
        Array.from({ length: itemsPerView }, (_, k) => mod(startIndex + k, n)),
      )
    : null;

  return (
    <>
      <div className={styles.viewport}>
        {canCycle ? (
          <div
            className={styles.track}
            style={{
              width: `${trackWidthPercent}%`,
              transform: trackTransform,
              transition: withTransition
                ? `transform ${SLIDE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
                : "none",
            }}
            onTransitionEnd={handleTrackTransitionEnd}
          >
            {slotIndices.map((idx, slot) => (
              <div
                className={styles.slot}
                key={`${slot}-${idx}`}
                style={{ flex: `0 0 ${step}%` }}
              >
                <ReviewCard review={reviews[idx]} />
              </div>
            ))}
          </div>
        ) : (
          <div
            key={jumpKey}
            className={`${styles.pairJump} ${
              jumpDir === "forward" ? styles.fromRight : styles.fromLeft
            }`}
          >
            {Array.from({ length: itemsPerView }, (_, k) =>
              mod(startIndex + k, n),
            ).map((idx, k) => (
              <div className={styles.pairSlot} key={k}>
                <ReviewCard review={reviews[idx]} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="controls light">
        <button
          className="control-btn"
          onClick={goPrev}
          aria-label="Previous review"
          disabled={!canCycle || sliding !== "idle"}
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

        <div className="pips" role="tablist" aria-label="Reviews navigation">
          {reviews.map((_, i) => {
            const isVisible = canCycle ? visibleSet!.has(i) : true;
            return (
              <button
                key={i}
                role="tab"
                aria-selected={isVisible}
                aria-label={`Review ${i + 1} of ${n}`}
                className={`pip ${isVisible ? "pip-active" : ""}`}
                onClick={() => jumpTo(i)}
              />
            );
          })}
        </div>

        <button
          className="control-btn"
          onClick={goNext}
          aria-label="Next review"
          disabled={!canCycle || sliding !== "idle"}
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

      <div className={styles.controls}>
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
