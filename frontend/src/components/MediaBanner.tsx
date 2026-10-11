import { useState } from "react";
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
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const current = selected ?? media[0] ?? null;

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

  const heroMedia = (
    <div className={styles.heroMedia}>
      {current ? (
        current.type === "video" ? (
          <video
            key={`/api/${current.url}`}
            src={`/api/${current.url}`}
            controls
            className={styles.heroEl}
          />
        ) : (
          <img
            src={`/api/${current.url}`}
            alt={altText}
            className={styles.heroEl}
          />
        )
      ) : thumbnailUrl ? (
        <img
          src={`/api/${thumbnailUrl}`}
          alt={altText}
          className={styles.heroEl}
        />
      ) : (
        <div className={styles.heroPlaceholder} />
      )}
    </div>
  );

  const thumbStrip = media.length > 1 && (
    <div className={styles.thumbStrip}>
      {media.map((item, i) => (
        <button
          key={i}
          onClick={() => setSelected(item)}
          className={`${styles.thumb} ${current === item ? styles.thumbActive : ""}`}
          aria-label={`Média ${i + 1}`}
        >
          {item.type === "video" ? (
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
