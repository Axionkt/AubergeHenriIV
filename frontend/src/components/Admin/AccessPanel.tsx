import { useState } from "react";
import styles from "./Admin.module.css";
import AccessManager from "./AccessManager";

type ResourceTab = "apartment" | "pro-space";

export default function AccessPanel() {
  const [resourceTab, setResourceTab] = useState<ResourceTab>("apartment");

  return (
    <>
      <div className={styles.panelHead}>
        <div>
          <p className="section-eyebrow">Administration</p>
          <h2>Gestion des accès</h2>
        </div>
      </div>

      <div className={styles.resourceTabs}>
        <button
          className={`${styles.resourceTab} ${resourceTab === "apartment" ? styles.resourceTabActive : ""}`}
          onClick={() => setResourceTab("apartment")}
        >
          Appartements
        </button>
        <button
          className={`${styles.resourceTab} ${resourceTab === "pro-space" ? styles.resourceTabActive : ""}`}
          onClick={() => setResourceTab("pro-space")}
        >
          Espaces pro
        </button>
      </div>

      {resourceTab === "apartment" && (
        <AccessManager resourceType="apartment" />
      )}
      {resourceTab === "pro-space" && (
        <AccessManager resourceType="pro-space" />
      )}
    </>
  );
}
