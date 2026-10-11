import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <span className={styles.footerLogo}>Auberge Henri IV</span>
          <p className={styles.footerTagline}>L'art de vivre palois</p>
        </div>
        <div className={styles.footerLinks}>
          <Link to="/">Accueil</Link>
          <Link to="/connexion">Connexion</Link>
          <Link to="/inscription">S'inscrire</Link>
        </div>
        <span className={styles.footerContact}>aubergeh4@gmail.com</span>
        <p className={styles.footerCopy}>
          © {new Date().getFullYear()} Auberge Henri IV · Pau, France
        </p>
      </div>
    </footer>
  );
}
