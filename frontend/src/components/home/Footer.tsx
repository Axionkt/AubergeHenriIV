import { Link } from "react-router-dom";
import styles from "./Footer.module.css";
import stampSrc from "./assets/logo-stamp.webp";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerLeft}>
          <img
            src={stampSrc}
            alt=""
            aria-hidden="true"
            width={88}
            height={88}
            loading="lazy"
            className={styles.footerStamp}
          />
          <div className={styles.footerBrand}>
            <span className={styles.footerLogo}>Auberge Henri IV</span>
            <p className={styles.footerTagline}>L'art de vivre palois</p>
          </div>
        </div>

        <div className={styles.footerCenter}>
          <div className={styles.footerLinks}>
            <Link to="/">Accueil</Link>
            <Link to="/connexion">Connexion</Link>
            <Link to="/inscription">S'inscrire</Link>
          </div>
          <span className={styles.footerContact}>aubergeh4@gmail.com</span>
        </div>

        <div className={styles.footerCredits}>
          <p>Site conçu et créé par Kelian</p>
          <p>Photos prises par Jean Christophe</p>
        </div>
      </div>

      <p className={styles.footerCopy}>
        © {new Date().getFullYear()} Auberge Henri IV · Pau, France
      </p>
    </footer>
  );
}
