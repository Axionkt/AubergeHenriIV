import styles from "./Hero.module.css";

export default function Hero() {
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
      </div>
      <div className={styles.heroScroll}>
        <span>Défiler</span>
        <div className={styles.scrollLine} />
      </div>
    </section>
  );
}
