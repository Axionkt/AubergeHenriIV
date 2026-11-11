import { useEffect, useRef, useState } from "react";
import styles from "./MediaBanner.module.css";
import { MediaItem } from "../types/media";

export interface MediaBannerProps {
  media?: MediaItem[];
  thumbnailUrl?: string | null;
  altText?: string;
  thumbStripPosition?: "top" | "bottom";
  loading?: boolean;
  thumbCount?: number;
}

export default function MediaBanner({
  media = [],
  thumbnailUrl,
  altText = "",
  thumbStripPosition = "bottom",
  loading = false,
  thumbCount = 5,
}: MediaBannerProps) {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const count = media.length;
  const hasMedia = count > 0;
  const current = hasMedia ? Math.min(index, count - 1) : 0;

  const currentRef = useRef(current);
  currentRef.current = current;

  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      track.scrollTo({
        left: currentRef.current * track.clientWidth,
        behavior: "auto",
      });
    });
    observer.observe(track);
    return () => observer.disconnect();
  }, [hasMedia, loading]);

  useEffect(() => {
    const strip = stripRef.current;
    const thumb = thumbRefs.current[current];
    if (!strip || !thumb) return;
    strip.scrollTo({
      left: thumb.offsetLeft - (strip.clientWidth - thumb.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [current, count]);

  function goTo(i: number) {
    const track = trackRef.current;
    if (!track || !hasMedia) return;
    const next = Math.max(0, Math.min(i, count - 1));
    setIndex(next);
    track.scrollTo({ left: next * track.clientWidth, behavior: "auto" });
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track || !track.clientWidth) return;
    const i = Math.round(track.scrollLeft / track.clientWidth);
    setIndex(Math.max(0, Math.min(i, count - 1)));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(current - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(current + 1);
    }
  }

  if (loading) {
    const heroSkeleton = (
      <div className={styles.heroMedia}>
        <div
          className="skeleton-dark"
          style={{ width: "100%", height: "100%", borderRadius: 0 }}
        />
      </div>
    );

    const thumbStripSkeleton = (
      <div className={styles.thumbStrip}>
        {Array.from({ length: thumbCount }).map((_, i) => (
          <div
            key={i}
            className="skeleton-dark"
            style={{
              width: 100,
              height: 64,
              flexShrink: 0,
              borderRadius: 4,
            }}
          />
        ))}
      </div>
    );

    return (
      <div className={styles.banner}>
        {thumbStripPosition === "top" && thumbStripSkeleton}
        {heroSkeleton}
        {thumbStripPosition === "bottom" && thumbStripSkeleton}
      </div>
    );
  }

  function renderSlideContent(item: MediaItem, i: number) {
    if (Math.abs(i - current) > 1) return null;
    const src = `/api/${item.url}`;

    if (item.type === "VIDEO") {
      return i === current ? (
        <video
          key={src}
          src={src}
          controls
          playsInline
          preload="metadata"
          className={styles.heroEl}
        />
      ) : (
        <div className={styles.videoPlaceholder} aria-hidden="true">
          ▶
        </div>
      );
    }

    return (
      <img
        src={src}
        alt={altText}
        draggable={false}
        className={styles.heroEl}
      />
    );
  }

  const heroMedia = (
    <div className={styles.heroMedia}>
      {hasMedia ? (
        <div
          ref={trackRef}
          className={styles.track}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="group"
          aria-roledescription="carousel"
          aria-label={altText || "Médias"}
        >
          {media.map((item, i) => (
            <div
              key={item.id}
              className={styles.slide}
              aria-hidden={i !== current}
            >
              {renderSlideContent(item, i)}
            </div>
          ))}
        </div>
      ) : thumbnailUrl ? (
        <img
          src={`/api/${thumbnailUrl}`}
          alt={altText}
          draggable={false}
          className={styles.heroEl}
        />
      ) : (
        <div className={styles.heroPlaceholder} />
      )}
    </div>
  );

  const thumbStrip = count > 1 && (
    <div ref={stripRef} className={styles.thumbStrip}>
      {media.map((item, i) => (
        <button
          key={item.id}
          ref={(el) => {
            thumbRefs.current[i] = el;
          }}
          onClick={() => goTo(i)}
          className={`${styles.thumb} ${i === current ? styles.thumbActive : ""}`}
          aria-label={`Média ${i + 1}`}
          aria-current={i === current}
        >
          {item.type === "VIDEO" ? (
            <span className={styles.thumbPlay}>▶</span>
          ) : (
            <img src={`/api/${item.url}`} alt="" className={styles.thumbImg} />
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div className={styles.banner}>
      {thumbStripPosition === "top" && thumbStrip}
      {heroMedia}
      {thumbStripPosition === "bottom" && thumbStrip}
    </div>
  );
}
