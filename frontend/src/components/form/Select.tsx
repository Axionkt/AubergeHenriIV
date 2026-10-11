import { forwardRef, useId, useState, useRef, useEffect } from "react";
import styles from "./Select.module.css";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  label?: string;
  hint?: string;
  error?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}

const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      options,
      label,
      hint,
      error,
      value,
      defaultValue,
      onChange,
      placeholder = "Sélectionner une option",
      disabled,
      required,
      id,
    },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const msgId = `${selectId}-msg`;
    const listboxId = `${selectId}-listbox`;

    const [open, setOpen] = useState(false);
    const [internal, setInternal] = useState(value ?? defaultValue ?? "");
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);

    const rootEl = useRef<HTMLDivElement>(null);
    const triggerEl = useRef<HTMLButtonElement>(null);
    const listEl = useRef<HTMLUListElement>(null);

    const current = value ?? internal;
    const selectedOption = options.find((o) => o.value === current);

    useEffect(() => {
      if (value !== undefined) setInternal(value);
    }, [value]);

    useEffect(() => {
      if (!open) return;
      const handler = (e: MouseEvent) => {
        if (rootEl.current && !rootEl.current.contains(e.target as Node)) {
          setOpen(false);
          setFocusedIndex(-1);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    useEffect(() => {
      if (!open || focusedIndex < 0) return;
      const item = listEl.current?.children[focusedIndex] as
        | HTMLElement
        | undefined;
      item?.scrollIntoView({ block: "nearest" });
    }, [focusedIndex, open]);

    function openList() {
      if (disabled) return;
      setOpen(true);
      const idx = current
        ? options.findIndex((o) => o.value === current)
        : options.findIndex((o) => !o.disabled);
      setFocusedIndex(idx);
    }

    function close() {
      setOpen(false);
      setFocusedIndex(-1);
      triggerEl.current?.focus();
    }

    function select(opt: SelectOption) {
      if (opt.disabled) return;
      setInternal(opt.value);
      onChange?.(opt.value);
      close();
    }

    function handleTriggerKeyDown(e: React.KeyboardEvent) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        if (!open) openList();
      }
      if (e.key === "Escape") close();
    }

    function handleListKeyDown(e: React.KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "Tab") {
        close();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((i) => {
          let next = i + 1;
          while (next < options.length && options[next].disabled) next++;
          return next < options.length ? next : i;
        });
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((i) => {
          let prev = i - 1;
          while (prev >= 0 && options[prev].disabled) prev--;
          return prev >= 0 ? prev : i;
        });
      }
      if (e.key === "Home") {
        e.preventDefault();
        const first = options.findIndex((o) => !o.disabled);
        if (first >= 0) setFocusedIndex(first);
      }
      if (e.key === "End") {
        e.preventDefault();
        let last = options.length - 1;
        while (last >= 0 && options[last].disabled) last--;
        if (last >= 0) setFocusedIndex(last);
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (focusedIndex >= 0 && !options[focusedIndex].disabled)
          select(options[focusedIndex]);
      }
      if (e.key.length === 1) {
        const char = e.key.toLowerCase();
        const start = focusedIndex + 1;
        const match = options.findIndex(
          (o, i) =>
            i >= start && !o.disabled && o.label.toLowerCase().startsWith(char),
        );
        const fallback = options.findIndex(
          (o) => !o.disabled && o.label.toLowerCase().startsWith(char),
        );
        const idx = match >= 0 ? match : fallback;
        if (idx >= 0) setFocusedIndex(idx);
      }
    }

    return (
      <div
        ref={(el) => {
          (rootEl as React.MutableRefObject<HTMLDivElement | null>).current =
            el;
          if (typeof ref === "function") ref(el);
          else if (ref)
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
        className={styles.root}
      >
        {label && (
          <label htmlFor={selectId} className={styles.label}>
            {label}
            {required && (
              <span className={styles.required} aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <button
          ref={triggerEl}
          id={selectId}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-invalid={!!error}
          aria-describedby={error ? msgId : undefined}
          aria-required={required}
          aria-activedescendant={
            focusedIndex >= 0 ? `${selectId}-opt-${focusedIndex}` : undefined
          }
          disabled={disabled}
          onClick={() => (open ? close() : openList())}
          onKeyDown={handleTriggerKeyDown}
          className={[
            styles.trigger,
            error ? styles.error : "",
            open ? styles.open : "",
          ]
            .join(" ")
            .trim()}
        >
          <span className={selectedOption ? undefined : styles.placeholder}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span
            className={[styles.chevron, open ? styles.rotated : ""]
              .join(" ")
              .trim()}
          >
            <ChevronIcon />
          </span>
        </button>

        {open && (
          <ul
            ref={listEl}
            id={listboxId}
            role="listbox"
            aria-label={label ?? "Options"}
            tabIndex={-1}
            onKeyDown={handleListKeyDown}
            className={styles.listbox}
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === current;
              const isFocused = i === focusedIndex;
              const isOff = opt.disabled;

              return (
                <li
                  key={opt.value}
                  id={`${selectId}-opt-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={isOff}
                  onClick={() => !isOff && select(opt)}
                  onMouseEnter={() => !isOff && setFocusedIndex(i)}
                  className={[
                    styles.option,
                    isFocused && !isOff ? styles.focused : "",
                    isSelected ? styles.selected : "",
                    isOff ? styles.optionDisabled : "",
                  ]
                    .join(" ")
                    .trim()}
                >
                  <span>{opt.label}</span>
                  {isSelected && <CheckIcon />}
                </li>
              );
            })}
          </ul>
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

Select.displayName = "Select";
export default Select;

function ChevronIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <polyline
        points="2,4.5 7,9.5 12,4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0, color: "var(--clr-lavender)" }}
    >
      <polyline
        points="2,7 5.5,10.5 12,3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
