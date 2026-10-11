import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import ArchiveEntry, { type ArchiveEntryProps } from "./ArchiveEntry";
import FloatingTimelineNav, {
  type TimelineNavEntry,
} from "./FloatingTimelineNav";
import styles from "./ArchiveTimeline.module.css";

export interface ArchiveTimelineProps {
  children: ReactNode;
}

export default function ArchiveTimeline({ children }: ArchiveTimelineProps) {
  const entryChildren = useMemo(
    () =>
      Children.toArray(children).filter(
        (child): child is ReactElement<ArchiveEntryProps> =>
          isValidElement(child) && child.type === ArchiveEntry,
      ),
    [children],
  );

  const entriesMeta: TimelineNavEntry[] = useMemo(
    () =>
      entryChildren.map((child, i) => ({
        id: `archive-entry-${i}`,
        year: child.props.year,
        date: child.props.date,
        era: child.props.era,
      })),
    [entryChildren],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const nodesRef = useRef<(HTMLDivElement | null)[]>([]);

  const registerNodeAt = useCallback(
    (index: number, node: HTMLDivElement | null) => {
      nodesRef.current[index] = node;
    },
    [],
  );

  useEffect(() => {
    const nodes = nodesRef.current.filter(
      (n): n is HTMLDivElement => n !== null,
    );
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (observerEntries) => {
        observerEntries.forEach((obs) => {
          if (obs.isIntersecting) {
            const idx = nodesRef.current.indexOf(obs.target as HTMLDivElement);
            if (idx !== -1) setActiveIndex(idx);
          }
        });
      },
      { rootMargin: "-49% 0px -49% 0px", threshold: 0 },
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [entriesMeta.length]);

  const jumpTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <>
      <nav className={styles.mobileToc} aria-label="Sommaire chronologique">
        {entriesMeta.map((entry) => (
          <a
            className={styles.mobileTocLink}
            href={`#${entry.id}`}
            key={entry.id}
          >
            <b>{entry.year}</b>
            <span>{entry.era}</span>
          </a>
        ))}
      </nav>

      <FloatingTimelineNav
        entries={entriesMeta}
        activeIndex={activeIndex}
        onJump={jumpTo}
      />

      <div className={styles.shell}>
        <main className={styles.timeline}>
          {entryChildren.map((child, i) =>
            cloneElement(child, {
              key: entriesMeta[i].id,
              entryId: entriesMeta[i].id,
              registerNode: (node: HTMLDivElement | null) =>
                registerNodeAt(i, node),
            }),
          )}
        </main>
      </div>
    </>
  );
}
