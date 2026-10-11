import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./ArchiveEntry.module.css";

export interface ArchiveEntryProps {
  year: string;
  date: string;
  era?: string;
  title?: string;
  children?: ReactNode;
  entryId?: string;
  registerNode?: (node: HTMLDivElement | null) => void;
}

export default function ArchiveEntry({
  date,
  era,
  title,
  children,
  entryId,
  registerNode,
}: ArchiveEntryProps) {
  const localRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = localRef.current;
    if (!node) return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const setRefs = (node: HTMLDivElement | null) => {
    localRef.current = node;
    if (registerNode) registerNode(node);
  };

  return (
    <div
      id={entryId}
      ref={setRefs}
      className={styles.entry}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
      }}
    >
      <div className={styles.rail}>
        <span className={styles.dot} aria-hidden="true" />
        <div className={styles.year}>{date}</div>
        {era && <div className={styles.era}>{era}</div>}
      </div>

      <div className={styles.body}>
        {title && <h3>{title}</h3>}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
