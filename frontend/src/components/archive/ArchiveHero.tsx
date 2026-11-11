import { useNavigate } from "react-router-dom";
import styles from "./ArchiveHero.module.css";

import img01 from "../archive/assets/image1.png";

export interface ArchiveFact {
  label: string;
  value: string;
}

export interface ArchiveHeroProps {
  eyebrow?: string;
  title: string;
  facts?: ArchiveFact[];
  backHref?: string;
  backLabel?: string;
}

export default function ArchiveHero({
  eyebrow,
  title,
  facts = [],
  backLabel = "← Retour au site",
}: ArchiveHeroProps) {
  const navigate = useNavigate();

  return (
    <header className={styles.hero}>
      <img src={img01} alt="" aria-hidden="true" className={styles.watermark} />
      <div className={styles.inner}>
        <div>
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">
            {backLabel}
          </button>
        </div>
        {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
        <h1>{title}</h1>
        {facts.length > 0 && (
          <div className={styles.facts}>
            {facts.map((f) => (
              <div className={styles.fact} key={f.label}>
                <b>{f.value}</b>
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
