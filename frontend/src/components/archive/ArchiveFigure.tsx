import styles from "./ArchiveFigure.module.css";

export interface ArchiveFigureProps {
  src: string;
  alt: string;
  caption?: string;
  variant?: "inline" | "wide";
}

export default function ArchiveFigure({
  src,
  alt,
  caption,
  variant = "inline",
}: ArchiveFigureProps) {
  return (
    <figure
      className={`${styles.figure} ${variant === "wide" ? styles.wide : ""}`}
    >
      <img src={src} alt={alt} loading="lazy" />
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}
