import { useState } from "react";
import { Link } from "react-router-dom";
import UsersPanel from "../../components/admin/UserPanel";
import CommonSpacesPanel from "../../components/admin/CommonSpacesPanel";
import ApartmentsPanel from "../../components/admin/ApartmentsPanel";
import AccessPanel from "../../components/admin/AccessPanel";
import ReviewsPanel from "../../components/admin/ReviewsPanel";
import styles from "./Admin.module.css";
import ProSpacesPanel from "../../components/admin/ProSpacesPanel";

type Panel =
  | "users"
  | "common-spaces"
  | "apartments"
  | "pro-spaces"
  | "access"
  | "reviews";

const NAV: { id: Panel; label: string }[] = [
  { id: "users", label: "Utilisateurs" },
  { id: "common-spaces", label: "Espaces communs" },
  { id: "apartments", label: "Appartements" },
  { id: "pro-spaces", label: "Espaces professionnels" },
  { id: "access", label: "Accès" },
  { id: "reviews", label: "Avis" },
];
const NAV_ICONS = ["◈", "◇"];

export default function Admin() {
  const [panel, setPanel] = useState<Panel>("users");

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <span className={styles.sidebarBrandText}>Admin</span>
          <span className={styles.sidebarBrandSub}>Auberge Henri IV</span>
        </div>
        <nav className={styles.sidebarNav}>
          {NAV.map((n, i) => (
            <button
              key={n.id}
              onClick={() => setPanel(n.id)}
              className={`${styles.navItem} ${panel === n.id ? styles.navItemActive : ""}`}
            >
              <span className={styles.navIcon}>
                {NAV_ICONS[i % NAV_ICONS.length]}
              </span>
              {n.label}
            </button>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <Link
            to="/"
            className="btn btn-ghost btn-sm"
            style={{ width: "100%", justifyContent: "center" }}
          >
            ← Site public
          </Link>
        </div>
      </aside>

      <main className={styles.main}>
        {panel === "users" && <UsersPanel />}
        {panel === "common-spaces" && <CommonSpacesPanel />}
        {panel === "apartments" && <ApartmentsPanel />}
        {panel === "pro-spaces" && <ProSpacesPanel />}
        {panel === "access" && <AccessPanel />}
        {panel === "reviews" && <ReviewsPanel />}
      </main>
    </div>
  );
}
