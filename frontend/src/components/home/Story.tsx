import { useQuery } from "@tanstack/react-query";
import api from "../../lib/axios";
import { keys } from "../../lib/query";
import styles from "./Story.module.css";
import { Overview } from "../../types/overview";

import img1 from "./assets/story_lg.webp";
import img2 from "./assets/story_sm.webp";

export default function Story() {
  const { data: overview } = useQuery({
    queryKey: keys.overview(),
    queryFn: () => api.get<Overview>("/home/overview").then((r) => r.data),
  });

  return (
    <section className={styles.story}>
      <div className={styles.storyGrid}>
        <div>
          <p className="section-eyebrow">Notre histoire</p>
          <h2>Le 23 rue Bernadotte</h2>
          <p className="section-subtitle">
            Nous avons choisi de l'appeler l'Auberge Henri IV.
          </p>
          <p>
            Situé dans le périmètre du quartier historique de Pau, à deux pas du
            Château et de la place Clémenceau, il bénéficie pourtant du calme de
            la rue Bernadotte, qui relie la place de la Libération à la place de
            Verdun, idéale pour le stationnement.
            <br />
            <br />
            Au cœur de l'immeuble, une petite cour arborée offre à ses habitants
            une parenthèse végétale en plein centre-ville, avec ses palmiers,
            son olivier, ses lauriers roses et son jasmin.
            <br />
            <br />
            Dès que l'on pousse la grande porte d'entrée en bois massif,
            l'escalier d'époque nous accueille avec sa douce odeur de cire.
            L'ambiance chaleureuse et familiale qui règne dans les lieux procure
            un sentiment apaisant : celui de rentrer chez soi, dans un cadre
            bienveillant et sécurisé. L'interphone protège l'accès, une caméra
            veille sur le hall d'entrée, et les vélos sont bien abrités dans un
            local dédié.
            <br />
            <br />
            Acquis en monopropriété, l'immeuble a été soigneusement rénové dans
            son ensemble : ses quatre étages, ses façades et sa toiture ont fait
            l'objet d'une attention particulière, avec l'objectif d'allier le
            confort moderne au cachet de l'ancien. Nous continuons aujourd'hui à
            entretenir les appartements et les parties communes avec le même
            soin, afin de préserver cette qualité de rénovation dans le temps.
          </p>
          {overview && (
            <div className={styles.storyFeatures}>
              <div className={styles.feature}>
                <span className={styles.featureNum}>
                  {overview.apartmentCount}
                </span>
                <span className={styles.featureLabel}>Appartements</span>
              </div>
              <div className={styles.featureDivider} />
              <div className={styles.feature}>
                <span className={styles.featureNum}>
                  {overview.proSpaceCount}
                </span>
                <span className={styles.featureLabel}>
                  Espaces professionnels
                </span>
              </div>
            </div>
          )}
        </div>
        <div className={styles.storyVisual}>
          <div className={styles.storyImageMain}>
            <img src={img1} alt="Escalier ancien vu d'en bas" loading="lazy" />
          </div>
          <div className={styles.storyImageAccent}>
            <img src={img2} alt="Cour arborée de l'immeuble" loading="lazy" />
          </div>
        </div>
      </div>
    </section>
  );
}
