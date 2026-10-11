import { useQuery } from "@tanstack/react-query";
import api from "../../lib/axios";
import { keys } from "../../lib/query";
import styles from "./ReviewsSection.module.css";
import ReviewCarousel, { ReviewCarouselSkeleton } from "../ReviewCarousel";
import { Review } from "../../types/review";

export default function ReviewsSection() {
  const {
    data: reviews,
    isLoading,
    isError,
  } = useQuery({
    queryKey: keys.reviews(),
    queryFn: () => api.get<Review[]>("/home/reviews").then((r) => r.data),
  });

  return (
    <section
      className={`${styles.reviews} ${isError ? styles.reviewsCompact : ""}`}
    >
      <div className={styles.reviewsInner}>
        <div className="text-center">
          <p className="section-eyebrow light">Livre d'or</p>
          <h2 className="light">Paroles de locataires</h2>
        </div>
        {isLoading && <ReviewCarouselSkeleton />}
        {isError && (
          <p
            className="msg-error"
            style={{ maxWidth: 480, margin: "32px auto 0" }}
          >
            Impossible de charger les avis.
          </p>
        )}
        {reviews && <ReviewCarousel reviews={reviews} />}
      </div>
    </section>
  );
}
