import styles from "./Home.module.css";
import Hero from "../components/home/Hero";
import Story from "../components/home/Story";
import ResourceSection from "../components/home/ResourceSection";
import History from "../components/home/History";
import ReviewsSection from "../components/home/ReviewsSection";
import CTA from "../components/home/CTA";
import Footer from "../components/home/Footer";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { isAuth } = useAuth();

  return (
    <div className={styles.page}>
      <Hero isAuth={isAuth} />
      <Story />
      <ResourceSection />
      <History />
      <ReviewsSection />
      <CTA isAuth={isAuth} />
      <Footer />
    </div>
  );
}
