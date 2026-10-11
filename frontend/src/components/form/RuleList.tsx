import { RULES } from "../../lib/password";
import styles from "./RuleList.module.css";

export default function RuleList({
  password,
  touched,
}: {
  password: string;
  touched: boolean;
}) {
  if (!touched) return null;
  return (
    <ul className={styles.ruleList}>
      {RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <li
            key={rule.label}
            className={`${styles.rule} ${ok ? styles.ruleOk : styles.ruleFail}`}
          >
            <span className={styles.ruleIcon}>{ok ? "✓" : "✗"}</span>
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
