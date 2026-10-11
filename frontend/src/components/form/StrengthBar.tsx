import { RULES } from "../../lib/password";
import styles from "./StrengthBar.module.css";

function getStrength(pw: string): number {
  if (!pw) return 0;
  return RULES.filter((r) => r.test(pw)).length;
}

export default function StrengthBar({ password }: { password: string }) {
  const passed = getStrength(password);
  const total = RULES.length;

  const pct = password ? (passed / total) * 100 : 0;
  const color =
    pct <= 33
      ? "var(--clr-danger)"
      : pct <= 66
        ? "var(--clr-gold)"
        : "var(--clr-success)";
  const label = !password
    ? ""
    : pct <= 33
      ? "Faible"
      : pct <= 66
        ? "Moyen"
        : pct < 100
          ? "Bon"
          : "Excellent";

  if (!password) return null;

  return (
    <div className={styles.strengthWrap}>
      <div className={styles.strengthBar}>
        <div
          className={styles.strengthFill}
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className={styles.strengthLabel} style={{ color }}>
        {label}
      </span>
    </div>
  );
}
