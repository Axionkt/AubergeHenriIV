import { useNavigate } from "react-router-dom";
import styles from "./ArchiveHero.module.css";

import img01 from "../archive/assets/image1.png";
import img08 from "../archive/assets/image8.png";
import img22 from "../archive/assets/image22.png";
import img23 from "../archive/assets/image23.png";
import img24 from "../archive/assets/image24.png";
import img40 from "../archive/assets/image40.png";
import img41 from "../archive/assets/image41.png";
import img53 from "../archive/assets/image53.png";
import img54 from "../archive/assets/image54.png";

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
      <BuildingProgression />
    </header>
  );
}

const groups = [
  [{ src: img22, alt: "Premier corps du bâtiment, XVIe siècle" }],
  [
    { src: img23, alt: "Façade du bâtiment XVIIIe siècle" },
    { src: img40, alt: "Façade sur cour après regroupement, 1845" },
    { src: img53, alt: "Façade sur cour après réhabilitation, 1998" },
  ],
  [
    { src: img08, alt: "Dessin du bâtiment du XVIe siècle" },
    { src: img24, alt: "Façade XVIe sur cour" },
    { src: img41, alt: "Façade XVIe sur cour après regroupement, 1845" },
    { src: img54, alt: "Façade XVIe sur cour après réhabilitation, 1998" },
  ],
];

function BuildingProgression() {
  return (
    <div className={styles.progression} aria-hidden="true">
      {groups.map((group, i) => (
        <div className={styles.group} key={i}>
          {group.map((img, j) => (
            <div className={styles.frame} key={j}>
              <img src={img.src} alt={img.alt} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
