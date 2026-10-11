import { Link } from "react-router-dom";
import styles from "./History.module.css";

export default function History() {
  return (
    <section className={styles.history}>
      <div className={styles.historyInner}>
        <p className="section-eyebrow">Archives de la ville</p>
        <h2>Une adresse ancrée dans l'histoire de Pau</h2>
        <p>
          Le 23 rue Bernadotte, à deux pas de la maison natale de Jean-Baptiste
          Bernadotte, futur roi de Suède, est un témoin vivant de l'évolution de
          Pau depuis le Moyen Âge.
          <br />
          <br />
          La ville s'est développée autour de son château, construit dès le XIIe
          siècle sur un éperon rocheux dominant le gave de Pau et le ravin du
          Hédas. Cet emplacement stratégique est devenu le cœur historique de la
          cité.
          <br />
          <br />
          Situé à la jonction de deux axes essentiels à l'époque, la rue de la
          Côte de la Fontaine (aujourd'hui rue Laclède) et la rue
          Neuve-des-Cordeliers (aujourd'hui rue Bernadotte), l'immeuble
          s'inscrit dans un quartier autrefois rural, progressivement intégré au
          développement urbain de Pau vers le nord.
          <br />
          <br />
          L'adresse réunit deux bâtiments distincts, édifiés à deux siècles
          d'intervalle. Le premier était une ferme, construite au XVIe siècle,
          le second, érigé au XVIIIe siècle, correspond à un immeuble de rapport
          typique de son époque. Ensemble, ils composent un ensemble
          architectural atypique, mêlant murs massifs, galeries en bois
          suspendues et détails patrimoniaux, tels que les éviers sculptés du
          XVIIIe siècle ou les lucarnes soigneusement alignées.
          <br />
          <br />
          Une adresse paisible, habitée par l'âme du passé, au cœur d'un
          quartier vivant et d'une ville résolument moderne et dynamique.
          <Link
            to="/histoire"
            className="section-subtitle btn btn-ghost btn-sm"
          >
            Envie d'en savoir plus ? Découvrez l'histoire complète en cliquant
            ici →
          </Link>
        </p>
      </div>
    </section>
  );
}
