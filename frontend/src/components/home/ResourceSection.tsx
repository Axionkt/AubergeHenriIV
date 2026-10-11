import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/axios";
import { keys } from "../../lib/query";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../ConfirmModal";
import { ApartmentItem } from "../../types/apartment";
import { ProSpaceItem } from "../../types/proSpace";
import { formatDateTime, formatShortDate } from "../../lib/time";
import styles from "./ResourceSection.module.css";

import img1 from "./assets/resource_lg.webp";
import img2 from "./assets/resource_sm.webp";

type ResourceItem = ApartmentItem | ProSpaceItem;
type Tab = "appartements" | "espaces-pro";
const VALID_TABS: Tab[] = ["appartements", "espaces-pro"];

const CONTACT_EMAIL = "aubergeh4@gmail.com";

function isProSpace(item: ResourceItem): item is ProSpaceItem {
  return "sizeCarrezSqm" in item;
}

async function copyEmail() {
  try {
    await navigator.clipboard.writeText(CONTACT_EMAIL);
    return true;
  } catch {
    return false;
  }
}

function ResourceCard({
  item,
  kind,
  onRequestAccess,
}: {
  item: ResourceItem;
  kind: Tab;
  onRequestAccess: (item: ResourceItem) => void;
}) {
  const proSpace = isProSpace(item);
  const detailBasePath =
    kind === "espaces-pro" ? "/espaces-pro" : "/appartements";
  const canViewDetails = item.hasAccess;
  const needsAccess = item.isAvailable && !item.hasAccess;

  return (
    <div className={styles.card}>
      <div className={styles.cardLeft}>
        <div className={styles.cardTop}>
          <div className={styles.cardThumb}>
            {item.thumbnailUrl ? (
              <img src={`/api/${item.thumbnailUrl}`} alt={item.name} />
            ) : (
              <div className={styles.cardThumbPlaceholder} />
            )}
          </div>
          <div className={styles.cardBody}>
            <span className={styles.cardName}>{item.name}</span>
            <span className={styles.cardMeta}>
              {item.type} · Étage {item.floor} · {item.orientation}
              {proSpace ? ` · ${item.sizeCarrezSqm} m²` : ""}
            </span>
            <span className={styles.cardCounts}>
              {item.photoCount} photo{item.photoCount > 1 ? "s" : ""} ·{" "}
              {item.videoCount} vidéo{item.videoCount > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className={styles.badges}>
          {item.isAvailable ? (
            <span className={`${styles.badge} ${styles.badgeAvailable}`}>
              Disponible
            </span>
          ) : (
            <span className={`${styles.badge} ${styles.badgeUnavailable}`}>
              Indisponible
            </span>
          )}
          {item.hasAccess && (
            <span className={`${styles.badge} ${styles.badgeAccess}`}>
              <span className={styles.badgeTextFull}>
                Accès
                {item.accessExpiry
                  ? ` jusqu'au ${formatDateTime(item.accessExpiry)}`
                  : " indeterminé"}
              </span>
              <span className={styles.badgeTextShort}>
                {item.accessExpiry
                  ? `Accès · ${formatShortDate(item.accessExpiry)}`
                  : "Accès indét."}
              </span>
            </span>
          )}
        </div>
      </div>

      {canViewDetails && (
        <Link
          to={`${detailBasePath}/${item.id}`}
          className={`${styles.cardRight} ${styles.cardRightArrow}`}
          aria-label={`Voir les détails de ${item.name}`}
        >
          <span aria-hidden="true">→</span>
        </Link>
      )}

      {!canViewDetails && needsAccess && (
        <button
          type="button"
          className={`${styles.cardRight} ${styles.cardRightRequest}`}
          onClick={() => onRequestAccess(item)}
          aria-label={`Demander l'accès pour ${item.name}`}
        >
          <span>Demander l'accès</span>
        </button>
      )}
    </div>
  );
}

function ResourceListSkeleton() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={styles.cardSkeleton} />
      ))}
    </>
  );
}

export default function ResourceSection() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAuth = !!user;

  const [activeTab, setActiveTab] = useState<Tab>("appartements");
  const [showAccountModal, setShowAccountModal] = useState(false);

  useEffect(() => {
    const tab = searchParams.get("tab");
    setActiveTab(
      VALID_TABS.includes(tab as Tab) ? (tab as Tab) : "appartements",
    );
  }, [searchParams]);

  function handleTabChange(tab: Tab) {
    const params = new URLSearchParams(location.search);
    params.set("tab", tab);
    navigate(
      { search: params.toString(), hash: location.hash },
      { replace: true, preventScrollReset: true },
    );
  }

  function notifyCopied() {
    showToast(
      `Adresse copiée : ${CONTACT_EMAIL} — collez-la dans un e-mail pour nous écrire.`,
      "success",
    );
  }

  async function handleRequestAccess() {
    if (isAuth) {
      const ok = await copyEmail();
      if (ok) notifyCopied();
    } else {
      setShowAccountModal(true);
    }
  }

  async function handleModalDeny() {
    const ok = await copyEmail();
    setShowAccountModal(false);
    if (ok) notifyCopied();
  }

  function handleModalCancel() {
    setShowAccountModal(false);
  }

  const {
    data: apartments = [],
    isLoading: apartmentsLoading,
    isError: apartmentsError,
  } = useQuery({
    queryKey: keys.apartments(),
    queryFn: () => api.get<ApartmentItem[]>("/apartments").then((r) => r.data),
  });

  const {
    data: proSpaces = [],
    isLoading: proSpacesLoading,
    isError: proSpacesError,
  } = useQuery({
    queryKey: keys.proSpaces(),
    queryFn: () => api.get<ProSpaceItem[]>("/pro-spaces").then((r) => r.data),
  });

  const items: ResourceItem[] =
    activeTab === "espaces-pro" ? proSpaces : apartments;
  const isLoading =
    activeTab === "espaces-pro" ? proSpacesLoading : apartmentsLoading;
  const isError =
    activeTab === "espaces-pro" ? proSpacesError : apartmentsError;

  return (
    <section id="collection" className={styles.resources}>
      <div className={styles.resourcesInner}>
        <div className={styles.grid}>
          <div className={styles.visual}>
            <div className={styles.visualMain}>
              <img
                src={img1}
                alt="Cheminée en briques et galets"
                loading="lazy"
              />
            </div>
            <div className={styles.visualAccent}>
              <img
                src={img2}
                alt="Salon en parquet à chevrons"
                loading="lazy"
              />
            </div>
          </div>

          <div className={styles.content}>
            <p className="section-eyebrow light">Notre collection</p>
            <h2 className="light">Les appartements et espaces pro</h2>
            <p className="section-subtitle light">
              Une sélection de lieux à vivre et à travailler, chacun pensé pour
              son propre usage — du studio cosy aux bureaux partagés.
            </p>

            <div className={styles.tabs} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab !== "espaces-pro"}
                className={`${styles.tab} ${
                  activeTab !== "espaces-pro" ? styles.tabActive : ""
                }`}
                onClick={() => handleTabChange("appartements")}
              >
                Appartements
                <span className={styles.tabCount}>{apartments.length}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "espaces-pro"}
                className={`${styles.tab} ${
                  activeTab === "espaces-pro" ? styles.tabActive : ""
                }`}
                onClick={() => handleTabChange("espaces-pro")}
              >
                Espaces pro
                <span className={styles.tabCount}>{proSpaces.length}</span>
              </button>
            </div>

            <div className={styles.list}>
              {isLoading && <ResourceListSkeleton />}
              {isError && (
                <p className={styles.error}>
                  Impossible de charger les biens pour le moment.
                </p>
              )}
              {!isLoading && !isError && items.length === 0 && (
                <p className={styles.empty}>
                  Aucun bien à afficher pour le moment.
                </p>
              )}
              {!isLoading &&
                !isError &&
                items.map((item) => (
                  <ResourceCard
                    key={item.id}
                    item={item}
                    kind={activeTab}
                    onRequestAccess={handleRequestAccess}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showAccountModal}
        variant="default"
        title="Créer un compte ?"
        message="Un compte est nécessaire pour bénéficier d'un accès complet. Vous pouvez en créer un dès maintenant, ou copier notre adresse et nous écrire sans compte."
        confirmLabel="Créer un compte"
        denyLabel={`Copier ${CONTACT_EMAIL}`}
        onConfirm={() => {
          setShowAccountModal(false);
          navigate("/inscription");
        }}
        onDeny={handleModalDeny}
        onCancel={handleModalCancel}
      />
    </section>
  );
}
