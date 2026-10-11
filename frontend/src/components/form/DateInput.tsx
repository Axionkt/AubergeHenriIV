import { forwardRef, useId, useState, useRef, useEffect } from "react";
import styles from "./DateInput.module.css";

interface DateInputProps {
  label?: string;
  hint?: string;
  error?: string;
  value?: string; // ISO: "YYYY-MM-DD"
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  min?: string; // ISO: "YYYY-MM-DD"
  max?: string; // ISO: "YYYY-MM-DD"
  id?: string;
}

// ── Helpers ───────────────────────────────────────────────

const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];
const DAY_LABELS = ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"];

function parseISO(
  iso: string | undefined,
): { y: number; m: number; d: number } | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return { y, m, d };
}

function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function daysInMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate();
}
function firstDayOfMonth(y: number, m: number) {
  return new Date(y, m - 1, 1).getDay();
}

function isoToDisplay(iso: string) {
  const p = parseISO(iso);
  if (!p) return "";
  return `${String(p.d).padStart(2, "0")} / ${String(p.m).padStart(2, "0")} / ${p.y}`;
}

// ── Component ─────────────────────────────────────────────

const DateInput = forwardRef<HTMLDivElement, DateInputProps>(
  (
    {
      label,
      hint,
      error,
      value,
      defaultValue,
      onChange,
      disabled,
      required,
      min,
      max,
      id,
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const msgId = `${inputId}-msg`;

    const [open, setOpen] = useState(false);
    const [internal, setInternal] = useState(value ?? defaultValue ?? "");

    const selected = parseISO(value ?? internal);
    const today = new Date();
    const [cursor, setCursor] = useState({
      y: selected?.y ?? today.getFullYear(),
      m: selected?.m ?? today.getMonth() + 1,
    });

    const rootEl = useRef<HTMLDivElement>(null);
    const current = value ?? internal;

    useEffect(() => {
      if (value) {
        setInternal(value);
        const p = parseISO(value);
        if (p) setCursor({ y: p.y, m: p.m });
      }
    }, [value]);

    useEffect(() => {
      if (!open) return;
      const handler = (e: MouseEvent) => {
        if (rootEl.current && !rootEl.current.contains(e.target as Node))
          setOpen(false);
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    function isDisabledDay(y: number, m: number, d: number) {
      const iso = toISO(y, m, d);
      if (min && iso < min) return true;
      if (max && iso > max) return true;
      return false;
    }

    function selectDay(y: number, m: number, d: number) {
      if (isDisabledDay(y, m, d)) return;
      const iso = toISO(y, m, d);
      setInternal(iso);
      onChange?.(iso);
      setOpen(false);
    }

    function prevMonth() {
      setCursor((c) =>
        c.m === 1 ? { y: c.y - 1, m: 12 } : { y: c.y, m: c.m - 1 },
      );
    }
    function nextMonth() {
      setCursor((c) =>
        c.m === 12 ? { y: c.y + 1, m: 1 } : { y: c.y, m: c.m + 1 },
      );
    }

    const cells: (number | null)[] = [
      ...Array(firstDayOfMonth(cursor.y, cursor.m)).fill(null),
      ...Array.from(
        { length: daysInMonth(cursor.y, cursor.m) },
        (_, i) => i + 1,
      ),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const todayISO = toISO(
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate(),
    );

    return (
      <div
        ref={(el) => {
          (rootEl as React.RefObject<HTMLDivElement | null>).current = el;
          if (typeof ref === "function") ref(el);
          else if (ref)
            (ref as React.RefObject<HTMLDivElement | null>).current = el;
        }}
        className={styles.root}
      >
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {required && (
              <span className={styles.required} aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <button
          id={inputId}
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-invalid={!!error}
          aria-describedby={error ? msgId : undefined}
          aria-required={required}
          onClick={() => !disabled && setOpen((o) => !o)}
          className={[
            styles.trigger,
            error ? styles.error : "",
            open ? styles.open : "",
          ]
            .join(" ")
            .trim()}
        >
          <span className={current ? undefined : styles.placeholder}>
            {current ? isoToDisplay(current) : "DD / MM / YYYY"}
          </span>
          <CalendarIcon />
        </button>

        {open && (
          <div
            role="dialog"
            aria-label="Choisir une date"
            className={styles.popover}
          >
            <div className={styles.calHeader}>
              <button
                type="button"
                onClick={prevMonth}
                className={styles.navBtn}
                aria-label="Previous month"
              >
                <ChevronIcon direction="left" />
              </button>
              <span className={styles.monthLabel}>
                {MONTHS[cursor.m - 1]} {cursor.y}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className={styles.navBtn}
                aria-label="Next month"
              >
                <ChevronIcon direction="right" />
              </button>
            </div>

            <div className={styles.grid}>
              {DAY_LABELS.map((d) => (
                <span key={d} className={styles.dayLabel}>
                  {d}
                </span>
              ))}
              {cells.map((day, i) => {
                if (!day) return <span key={`empty-${i}`} />;
                const iso = toISO(cursor.y, cursor.m, day);
                const isSelected = iso === current;
                const isToday = iso === todayISO;
                const isOff = isDisabledDay(cursor.y, cursor.m, day);

                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={isOff}
                    onClick={() => selectDay(cursor.y, cursor.m, day)}
                    aria-label={`${day} ${MONTHS[cursor.m - 1]} ${cursor.y}`}
                    aria-pressed={isSelected}
                    className={[
                      styles.dayBtn,
                      isToday && !isSelected ? styles.dayToday : "",
                      isSelected ? styles.daySelected : "",
                    ]
                      .join(" ")
                      .trim()}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className={styles.calFooter}>
              <button
                type="button"
                className={styles.todayBtn}
                disabled={isDisabledDay(
                  today.getFullYear(),
                  today.getMonth() + 1,
                  today.getDate(),
                )}
                onClick={() => {
                  setCursor({
                    y: today.getFullYear(),
                    m: today.getMonth() + 1,
                  });
                  selectDay(
                    today.getFullYear(),
                    today.getMonth() + 1,
                    today.getDate(),
                  );
                }}
              >
                Aujourd'hui
              </button>
              {current && (
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => {
                    setInternal("");
                    onChange?.("");
                    setOpen(false);
                  }}
                >
                  Effacer
                </button>
              )}
            </div>
          </div>
        )}

        {error ? (
          <span id={msgId} role="alert" className={styles.errorMsg}>
            <ErrorIcon />
            {error}
          </span>
        ) : hint ? (
          <span className={styles.hint}>{hint}</span>
        ) : null}
      </div>
    );
  },
);

DateInput.displayName = "DateInput";
export default DateInput;

// ── Icons ─────────────────────────────────────────────────

function CalendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0, color: "var(--clr-sand)" }}
    >
      <rect
        x="1.5"
        y="2.5"
        width="13"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <line
        x1="1.5"
        y1="6"
        x2="14.5"
        y2="6"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <line
        x1="5"
        y1="1"
        x2="5"
        y2="4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <line
        x1="11"
        y1="1"
        x2="11"
        y2="4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="5.5" cy="9.5" r="0.9" fill="currentColor" />
      <circle cx="8" cy="9.5" r="0.9" fill="currentColor" />
      <circle cx="10.5" cy="9.5" r="0.9" fill="currentColor" />
      <circle cx="5.5" cy="12" r="0.9" fill="currentColor" />
      <circle cx="8" cy="12" r="0.9" fill="currentColor" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      {direction === "left" ? (
        <polyline
          points="9,2 4,7 9,12"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <polyline
          points="5,2 10,7 5,12"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <circle cx="8" cy="8" r="7" stroke="#9b2335" strokeWidth="1.4" />
      <line
        x1="8"
        y1="4.5"
        x2="8"
        y2="8.8"
        stroke="#9b2335"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="8" cy="11" r="0.8" fill="#9b2335" />
    </svg>
  );
}
