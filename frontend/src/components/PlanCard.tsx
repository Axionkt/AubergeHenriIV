import { MediaType } from "../types/media";

interface PlanCardProps {
  url?: string | null;
  type?: MediaType | null;
  className?: string;
}

export default function PlanCard({ url, type, className }: PlanCardProps) {
  if (!url) return null;

  return (
    <div className={`card ${className ?? ""}`}>
      <h4>Plan</h4>
      <a
        href={`/api/${url}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-outline btn-sm"
        style={{ marginTop: 10 }}
        aria-label="Ouvrir le plan dans un nouvel onglet"
      >
        {type === "DOCUMENT" ? "Ouvrir le plan (PDF)" : "Ouvrir le plan"}{" "}
        <span aria-hidden="true">↗</span>
      </a>
    </div>
  );
}
