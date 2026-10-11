import { Link } from "react-router-dom";
import styles from "./Hero.module.css";

interface HeroProps {
  isAuth: boolean;
}

export default function Hero({ isAuth }: HeroProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroOverlay} />
      <div className={styles.heroBg} />
      <div className={styles.heroContent}>
        <p className={styles.heroEyebrow}>Bienvenue à</p>
        <h1 className={styles.heroTitle}>
          l'Auberge
          <br />
          <em>Henri IV</em>
        </h1>
        <p className={styles.heroSub}>
          deux bâtiments des XVIᵉ et XVIIIᵉ siècles réunis en une adresse de
          charme,
          <br />
          où le cachet de l'ancien rencontre la douceur de vivre.
        </p>
        <div className={styles.heroCta}>
          <Link
            to={isAuth ? "/?tab=appartements#collection" : "/inscription"}
            className="btn btn-gold btn-lg"
          >
            Découvrir nos appartements
          </Link>
          <Link
            to={isAuth ? "/?tab=espaces-pro#collection" : "/inscription"}
            className="btn btn-gold btn-lg"
          >
            Découvrir nos espaces pro
          </Link>
          {!isAuth && (
            <Link to="/connexion" className="btn btn-outline-light btn-lg">
              Se connecter
            </Link>
          )}
        </div>
      </div>
      <div className={styles.heroScroll}>
        <span>Défiler</span>
        <div className={styles.scrollLine} />
      </div>
    </section>
  );
}
