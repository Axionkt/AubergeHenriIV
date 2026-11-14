import {
  forwardRef,
  Fragment,
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import styles from "./Textarea.module.css";

/* -------------------------------------------------------------------------- */
/*  Textarea                                                                  */
/* -------------------------------------------------------------------------- */

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  /** Show the formatting toolbar above the field. Defaults to false. */
  toolbar?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      hint,
      error,
      toolbar = false,
      id,
      required,
      disabled,
      readOnly,
      maxLength,
      defaultValue,
      value,
      onChange,
      onKeyDown,
      className,
      ...rest
    },
    ref,
  ) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const msgId = `${textareaId}-msg`;

    const innerRef = useRef<HTMLTextAreaElement | null>(null);
    const setRefs = useCallback(
      (node: HTMLTextAreaElement | null) => {
        innerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    const [charCount, setCharCount] = useState(
      () => String(value ?? defaultValue ?? "").length,
    );
    const [activeTool, setActiveTool] = useState(0);

    const nearLimit = maxLength !== undefined && charCount >= maxLength * 0.8;
    const atLimit = maxLength !== undefined && charCount >= maxLength;

    const counterClass = [
      styles.counter,
      atLimit ? styles.limit : nearLimit ? styles.near : "",
    ]
      .join(" ")
      .trim();

    const hasLabelRow = label || maxLength !== undefined;
    const toolsDisabled = !!disabled || !!readOnly;

    function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
      onKeyDown?.(e);
      if (e.defaultPrevented || !toolbar || e.nativeEvent.isComposing) return;

      const el = e.currentTarget;
      const mod = e.metaKey || e.ctrlKey;

      if (mod && !e.altKey && !e.shiftKey && !readOnly) {
        const key = e.key.toLowerCase();
        if (key === "b") {
          e.preventDefault();
          toggleInline(el, "**", "bold text");
          return;
        }
        if (key === "i") {
          e.preventDefault();
          toggleInline(el, "*", "italic text");
          return;
        }
        if (key === "k") {
          e.preventDefault();
          insertLink(el);
          return;
        }
      }

      if (
        e.key === "Enter" &&
        !e.shiftKey &&
        !e.altKey &&
        !mod &&
        !readOnly &&
        el.selectionStart === el.selectionEnd
      ) {
        if (continueList(el)) e.preventDefault();
      }
    }

    function handleToolbarKeyDown(e: KeyboardEvent<HTMLDivElement>) {
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
      const buttons = Array.from(
        e.currentTarget.querySelectorAll<HTMLButtonElement>(
          "button:not(:disabled)",
        ),
      );
      const current = buttons.indexOf(
        document.activeElement as HTMLButtonElement,
      );
      if (current === -1) return;
      e.preventDefault();

      let next = current;
      if (e.key === "ArrowRight") next = (current + 1) % buttons.length;
      if (e.key === "ArrowLeft")
        next = (current - 1 + buttons.length) % buttons.length;
      if (e.key === "Home") next = 0;
      if (e.key === "End") next = buttons.length - 1;

      buttons[next].focus();
    }

    const fieldClass = [
      styles.field,
      toolbar ? styles.attached : "",
      toolbar && error ? styles.hasError : "",
      toolbar && disabled ? styles.isDisabled : "",
    ]
      .join(" ")
      .trim();

    return (
      <div className={styles.root}>
        {hasLabelRow && (
          <div className={styles.labelRow}>
            {label ? (
              <label htmlFor={textareaId} className={styles.label}>
                {label}
                {required && (
                  <span className={styles.required} aria-hidden="true">
                    *
                  </span>
                )}
              </label>
            ) : (
              <span />
            )}
            {maxLength !== undefined && (
              <span className={counterClass} aria-live="polite">
                {charCount} / {maxLength}
              </span>
            )}
          </div>
        )}

        <div className={fieldClass}>
          {toolbar && (
            <div
              role="toolbar"
              aria-label="Text formatting"
              aria-controls={textareaId}
              className={styles.toolbar}
              onKeyDown={handleToolbarKeyDown}
            >
              {ACTIONS.map((action, i) => (
                <Fragment key={action.id}>
                  {i > 0 && ACTIONS[i - 1].group !== action.group && (
                    <span
                      className={styles.separator}
                      role="separator"
                      aria-orientation="vertical"
                    />
                  )}
                  <button
                    type="button"
                    className={styles.toolBtn}
                    title={action.title}
                    aria-label={action.label}
                    tabIndex={i === activeTool ? 0 : -1}
                    disabled={toolsDisabled}
                    // Keep focus + selection in the textarea when clicking
                    onMouseDown={(e) => e.preventDefault()}
                    onFocus={() => setActiveTool(i)}
                    onClick={() => {
                      if (innerRef.current) action.run(innerRef.current);
                    }}
                  >
                    {action.icon}
                  </button>
                </Fragment>
              ))}
            </div>
          )}

          <textarea
            ref={setRefs}
            id={textareaId}
            required={required}
            disabled={disabled}
            readOnly={readOnly}
            maxLength={maxLength}
            value={value}
            defaultValue={defaultValue}
            aria-invalid={!!error}
            aria-describedby={error ? msgId : undefined}
            aria-required={required}
            className={[
              styles.textarea,
              error ? styles.error : "",
              className ?? "",
            ]
              .join(" ")
              .trim()}
            onChange={(e) => {
              setCharCount(e.currentTarget.value.length);
              onChange?.(e);
            }}
            onKeyDown={handleKeyDown}
            {...rest}
          />
        </div>

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

Textarea.displayName = "Textarea";
export default Textarea;

/* -------------------------------------------------------------------------- */
/*  FormattedText: renders the textarea's value for display                   */
/* -------------------------------------------------------------------------- */

type Block =
  | { type: "p"; lines: string[] }
  | { type: "quote"; lines: string[] }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[]; start: number }
  | { type: "spacer" };

const UL_LINE = /^\s*[-*+]\s+(.*)$/;
const OL_LINE = /^\s*(\d+)\.\s+(.*)$/;
const QUOTE_LINE = /^\s*>\s?(.*)$/;

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let blanks = 0;

  for (const line of text.replace(/\r\n?/g, "\n").split("\n")) {
    if (line.trim() === "") {
      blanks++;
      continue;
    }

    // First blank line separates blocks; each extra one adds visible spacing.
    if (blocks.length && blanks > 1) {
      for (let i = 1; i < blanks; i++) blocks.push({ type: "spacer" });
    }
    const continues = blanks === 0;
    blanks = 0;

    const prev = blocks[blocks.length - 1];
    let m: RegExpExecArray | null;

    if ((m = UL_LINE.exec(line))) {
      if (continues && prev?.type === "ul") prev.items.push(m[1]);
      else blocks.push({ type: "ul", items: [m[1]] });
    } else if ((m = OL_LINE.exec(line))) {
      if (continues && prev?.type === "ol") prev.items.push(m[2]);
      else blocks.push({ type: "ol", items: [m[2]], start: Number(m[1]) });
    } else if ((m = QUOTE_LINE.exec(line))) {
      if (continues && prev?.type === "quote") prev.lines.push(m[1]);
      else blocks.push({ type: "quote", lines: [m[1]] });
    } else if (continues && prev?.type === "p") {
      prev.lines.push(line);
    } else {
      blocks.push({ type: "p", lines: [line] });
    }
  }

  return blocks;
}

// Groups: 2 code | 4,5 link | 7 bold+italic | 9 bold | 11 strike | 13 italic
const INLINE =
  /(`([^`\n]+)`)|(\[([^\]\n]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\))|(\*\*\*(\S(?:.*?\S)?)\*\*\*)|(\*\*(\S(?:.*?\S)?)\*\*)|(~~(\S(?:.*?\S)?)~~)|(\*(\S(?:[^*]*\S)?)\*)/g;

function renderInline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let n = 0;

  for (const m of text.matchAll(INLINE)) {
    const index = m.index ?? 0;
    if (index > last) out.push(text.slice(last, index));
    const key = `${keyBase}-${n++}`;

    if (m[2] !== undefined) {
      out.push(<code key={key}>{m[2]}</code>);
    } else if (m[4] !== undefined) {
      out.push(
        <a
          key={key}
          href={m[5]}
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          {renderInline(m[4], key)}
        </a>,
      );
    } else if (m[7] !== undefined) {
      out.push(
        <strong key={key}>
          <em>{renderInline(m[7], key)}</em>
        </strong>,
      );
    } else if (m[9] !== undefined) {
      out.push(<strong key={key}>{renderInline(m[9], key)}</strong>);
    } else if (m[11] !== undefined) {
      out.push(<s key={key}>{renderInline(m[11], key)}</s>);
    } else if (m[13] !== undefined) {
      out.push(<em key={key}>{renderInline(m[13], key)}</em>);
    }

    last = index + m[0].length;
  }

  if (last < text.length) out.push(text.slice(last));
  return out;
}

function renderLines(lines: string[], keyBase: string): ReactNode {
  return lines.map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {renderInline(line, `${keyBase}-${i}`)}
    </Fragment>
  ));
}

export function FormattedText({
  value,
  className,
}: {
  value?: string | null;
  className?: string;
}) {
  if (!value?.trim()) return null;

  return (
    <div className={[styles.formatted, className ?? ""].join(" ").trim()}>
      {parseBlocks(value).map((block, i) => {
        const key = `b${i}`;
        switch (block.type) {
          case "ul":
            return (
              <ul key={key}>
                {block.items.map((item, j) => (
                  <li key={j}>{renderInline(item, `${key}-${j}`)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={key} start={block.start}>
                {block.items.map((item, j) => (
                  <li key={j}>{renderInline(item, `${key}-${j}`)}</li>
                ))}
              </ol>
            );
          case "quote":
            return (
              <blockquote key={key}>{renderLines(block.lines, key)}</blockquote>
            );
          case "spacer":
            return (
              <div key={key} className={styles.spacer} aria-hidden="true" />
            );
          default:
            return <p key={key}>{renderLines(block.lines, key)}</p>;
        }
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Editing helpers                                                           */
/* -------------------------------------------------------------------------- */

function setNativeValue(el: HTMLTextAreaElement, next: string) {
  if (el.maxLength >= 0 && next.length > el.maxLength) return;
  const setter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    "value",
  )?.set;
  setter?.call(el, next);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

/**
 * Replaces [from, to) with `text`, then selects [selStart, selEnd).
 * Uses execCommand so the browser's undo stack (Ctrl+Z) keeps working, and so
 * React's onChange fires for both controlled and uncontrolled usage. Falls
 * back to a synthetic input event where execCommand is unavailable.
 */
function replaceRange(
  el: HTMLTextAreaElement,
  from: number,
  to: number,
  text: string,
  selStart: number,
  selEnd: number,
) {
  el.focus();
  el.setSelectionRange(from, to);

  let ok = false;
  if (text === "") {
    if (from === to) return;
    ok = document.execCommand("delete");
  } else {
    ok = document.execCommand("insertText", false, text);
  }

  if (!ok) {
    const v = el.value;
    setNativeValue(el, v.slice(0, from) + text + v.slice(to));
  }

  el.setSelectionRange(selStart, selEnd);
}

const countBack = (v: string, pos: number, ch: string) => {
  let n = 0;
  while (pos - n - 1 >= 0 && v[pos - n - 1] === ch) n++;
  return n;
};
const countFwd = (v: string, pos: number, ch: string) => {
  let n = 0;
  while (pos + n < v.length && v[pos + n] === ch) n++;
  return n;
};

// `*` is shared by italic (1) and bold (2), so an odd run means italic is on.
const isActive = (ch: string, len: number, run: number) =>
  ch === "*" ? (len === 1 ? run % 2 === 1 : run >= 2) : run >= len;

function toggleInline(
  el: HTMLTextAreaElement,
  marker: string,
  placeholder: string,
) {
  const ch = marker[0];
  const len = marker.length;
  const { value, selectionStart: s, selectionEnd: e } = el;
  const sel = value.slice(s, e);

  // Markers sit just outside the selection → remove them
  const outside = Math.min(countBack(value, s, ch), countFwd(value, e, ch));
  if (outside > 0 && isActive(ch, len, outside)) {
    replaceRange(el, s - len, e + len, sel, s - len, s - len + sel.length);
    return;
  }

  // Markers are inside the selection → remove them
  const inside = Math.min(countFwd(sel, 0, ch), countBack(sel, sel.length, ch));
  if (sel.length > 2 * len && isActive(ch, len, inside)) {
    const inner = sel.slice(len, -len);
    replaceRange(el, s, e, inner, s, s + inner.length);
    return;
  }

  const inner = sel || placeholder;
  replaceRange(
    el,
    s,
    e,
    marker + inner + marker,
    s + len,
    s + len + inner.length,
  );
}

type LineKind = "ul" | "ol" | "quote";
const PREFIX: Record<LineKind, RegExp> = {
  ul: /^(\s*)[-*+]\s+/,
  ol: /^(\s*)\d+\.\s+/,
  quote: /^>\s?/,
};

function toggleLines(el: HTMLTextAreaElement, kind: LineKind) {
  const { value, selectionStart: s, selectionEnd: rawEnd } = el;
  const e = rawEnd > s && value[rawEnd - 1] === "\n" ? rawEnd - 1 : rawEnd;

  const from = s === 0 ? 0 : value.lastIndexOf("\n", s - 1) + 1;
  let to = value.indexOf("\n", e);
  if (to === -1) to = value.length;

  const lines = value.slice(from, to).split("\n");
  const single = lines.length === 1;
  const targets = lines.filter((l) => single || l.trim() !== "");
  const allHave = targets.every((l) => PREFIX[kind].test(l));

  let n = 0;
  const next = lines.map((line) => {
    if (!single && line.trim() === "") return line;

    if (allHave)
      return line.replace(PREFIX[kind], kind === "quote" ? "" : "$1");

    if (kind === "quote") return "> " + line.replace(PREFIX.quote, "");

    const body = line.replace(PREFIX.ul, "$1").replace(PREFIX.ol, "$1");
    const indent = body.match(/^\s*/)?.[0] ?? "";
    const prefix = kind === "ul" ? "- " : `${++n}. `;
    return indent + prefix + body.slice(indent.length);
  });

  const text = next.join("\n");
  const collapsed = s === rawEnd;
  replaceRange(
    el,
    from,
    to,
    text,
    collapsed ? from + text.length : from,
    from + text.length,
  );
}

function insertLink(el: HTMLTextAreaElement) {
  const { value, selectionStart: s, selectionEnd: e } = el;
  const sel = value.slice(s, e);

  if (/^https?:\/\/\S+$/.test(sel)) {
    // Selected text is already a URL: wrap it and select the label
    const label = "link text";
    replaceRange(el, s, e, `[${label}](${sel})`, s + 1, s + 1 + label.length);
    return;
  }

  const label = sel || "link text";
  const url = "https://";
  const urlStart = s + label.length + 3; // "[" + label + "]("
  replaceRange(el, s, e, `[${label}](${url})`, urlStart, urlStart + url.length);
}

/** Enter inside a list/quote continues it; Enter on an empty item ends it. */
function continueList(el: HTMLTextAreaElement): boolean {
  const { value, selectionStart: pos } = el;
  const lineStart = pos === 0 ? 0 : value.lastIndexOf("\n", pos - 1) + 1;
  const before = value.slice(lineStart, pos);

  const m = /^(\s*)([-*+]|\d+\.|>)(\s+)(.*)$/.exec(before);
  if (!m) return false;

  if (m[4].trim() === "") {
    replaceRange(el, lineStart, pos, "", lineStart, lineStart);
    return true;
  }

  const marker = /^\d/.test(m[2]) ? `${parseInt(m[2], 10) + 1}.` : m[2];
  const insert = `\n${m[1]}${marker}${m[3]}`;
  replaceRange(el, pos, pos, insert, pos + insert.length, pos + insert.length);
  return true;
}

/* -------------------------------------------------------------------------- */
/*  Toolbar definition                                                        */
/* -------------------------------------------------------------------------- */

interface ToolbarAction {
  id: string;
  label: string;
  title: string;
  group: number;
  icon: ReactNode;
  run: (el: HTMLTextAreaElement) => void;
}

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const ACTIONS: ToolbarAction[] = [
  {
    id: "bold",
    label: "Bold",
    title: "Bold (Ctrl/⌘ B)",
    group: 0,
    icon: <span className={styles.glyphBold}>B</span>,
    run: (el) => toggleInline(el, "**", "bold text"),
  },
  {
    id: "italic",
    label: "Italic",
    title: "Italic (Ctrl/⌘ I)",
    group: 0,
    icon: <span className={styles.glyphItalic}>I</span>,
    run: (el) => toggleInline(el, "*", "italic text"),
  },
  {
    id: "strike",
    label: "Strikethrough",
    title: "Strikethrough",
    group: 0,
    icon: <span className={styles.glyphStrike}>S</span>,
    run: (el) => toggleInline(el, "~~", "strikethrough text"),
  },
  {
    id: "code",
    label: "Inline code",
    title: "Inline code",
    group: 0,
    icon: (
      <Svg>
        <polyline points="5.5,4.5 2,8 5.5,11.5" />
        <polyline points="10.5,4.5 14,8 10.5,11.5" />
      </Svg>
    ),
    run: (el) => toggleInline(el, "`", "code"),
  },
  {
    id: "ul",
    label: "Bulleted list",
    title: "Bulleted list",
    group: 1,
    icon: (
      <Svg>
        <circle cx="2.5" cy="4" r="0.6" fill="currentColor" />
        <circle cx="2.5" cy="8" r="0.6" fill="currentColor" />
        <circle cx="2.5" cy="12" r="0.6" fill="currentColor" />
        <line x1="6" y1="4" x2="14" y2="4" />
        <line x1="6" y1="8" x2="14" y2="8" />
        <line x1="6" y1="12" x2="14" y2="12" />
      </Svg>
    ),
    run: (el) => toggleLines(el, "ul"),
  },
  {
    id: "ol",
    label: "Numbered list",
    title: "Numbered list",
    group: 1,
    icon: (
      <Svg>
        <text x="0.5" y="5.5" fontSize="5" fill="currentColor" stroke="none">
          1
        </text>
        <text x="0.5" y="9.5" fontSize="5" fill="currentColor" stroke="none">
          2
        </text>
        <text x="0.5" y="13.5" fontSize="5" fill="currentColor" stroke="none">
          3
        </text>
        <line x1="6" y1="4" x2="14" y2="4" />
        <line x1="6" y1="8" x2="14" y2="8" />
        <line x1="6" y1="12" x2="14" y2="12" />
      </Svg>
    ),
    run: (el) => toggleLines(el, "ol"),
  },
  {
    id: "quote",
    label: "Quote",
    title: "Quote",
    group: 1,
    icon: (
      <Svg>
        <line x1="3" y1="3" x2="3" y2="13" />
        <line x1="7" y1="5" x2="14" y2="5" />
        <line x1="7" y1="8" x2="14" y2="8" />
        <line x1="7" y1="11" x2="12" y2="11" />
      </Svg>
    ),
    run: (el) => toggleLines(el, "quote"),
  },
  {
    id: "link",
    label: "Link",
    title: "Link (Ctrl/⌘ K)",
    group: 2,
    icon: (
      <Svg>
        <path d="M6.5 9.5l3-3" />
        <path d="M7 4.5l1-1a2.5 2.5 0 013.5 3.5l-1 1" />
        <path d="M9 11.5l-1 1a2.5 2.5 0 01-3.5-3.5l1-1" />
      </Svg>
    ),
    run: insertLink,
  },
];

/* -------------------------------------------------------------------------- */

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
