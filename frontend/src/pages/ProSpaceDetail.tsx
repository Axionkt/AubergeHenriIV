import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios";
import { keys } from "../lib/query";
import styles from "./ProSpaceDetail.module.css";
import { MediaItem } from "../types/media";
import { ProSpaceDetails } from "../types/proSpace";
import { formatDateTime, formatInt, noData } from "../lib/dataFormatting";
import { useAccessTokenKeepAlive } from "../hooks/useAccessTokenKeepAlive";
import { FormattedText } from "../components/form/Textarea";
import MediaBanner from "../components/MediaBanner";
import PlanCard from "../components/PlanCard";

export default function ProSpaceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: space,
    isLoading,
    isError,
  } = useQuery({
    queryKey: keys.proSpace(id!),
    queryFn: () =>
      api.get<ProSpaceDetails>(`/pro-spaces/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  useAccessTokenKeepAlive(!!space);

  const { data: mediaData } = useQuery<{ media: MediaItem[] }>({
    queryKey: keys.proSpaceMedia(id!),
    queryFn: () =>
      api
        .get<{ media: MediaItem[] }>(`/pro-spaces/${id}/media`)
        .then((r) => r.data),
    enabled: !!id && !!space,
  });

  const { data: commonSpaceMediaData } = useQuery<{ media: MediaItem[] }>({
    queryKey: [...keys.commonSpaces(), "pro-space"],
    queryFn: () =>
      api
        .get<{ media: MediaItem[] }>("/pro-spaces/common-space/media")
        .then((r) => r.data),
    enabled: !!space,
  });

  const media = mediaData?.media ?? [];
  const commonSpaceMedia = commonSpaceMediaData?.media ?? [];

  function isExpired(d?: string | null) {
    return !!d && new Date(d) < new Date();
  }

  if (isLoading)
    return (
      <div className={styles.page}>
        <MediaBanner loading thumbStripPosition="bottom" />

        <div className="page-content">
          <div
            className="skeleton"
            style={{
              height: 32,
              width: 180,
              borderRadius: 6,
              marginBottom: 28,
            }}
          />

          <div className={styles.layout}>
            <div className={styles.main}>
              <div
                className="skeleton"
                style={{ height: 48, width: "55%", marginBottom: 24 }}
              />

              <div className={`card ${styles.descCard}`}>
                <div
                  className="skeleton"
                  style={{ height: 12, width: 200, marginBottom: 12 }}
                />
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <div
                    className="skeleton"
                    style={{ height: 15, width: "95%" }}
                  />
                  <div
                    className="skeleton"
                    style={{ height: 15, width: "82%" }}
                  />
                  <div
                    className="skeleton"
                    style={{ height: 15, width: "65%" }}
                  />
                </div>
              </div>

              <div className={`card ${styles.detailsCard}`}>
                <div
                  className="skeleton"
                  style={{ height: 12, width: 140, marginBottom: 16 }}
                />
                <div className={styles.detailsGrid}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={styles.detailItem}>
                      <div
                        className="skeleton"
                        style={{ height: 10, width: 56 }}
                      />
                      <div
                        className="skeleton"
                        style={{ height: 20, width: 40, marginTop: 3 }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className={styles.sidebar}>
              <div className={`card ${styles.accessCard}`}>
                <div
                  className="skeleton"
                  style={{ height: 12, width: 100, marginBottom: 12 }}
                />
                <div className={styles.accessDetail}>
                  <div className="skeleton" style={{ height: 10, width: 80 }} />
                  <div className="skeleton" style={{ height: 16, width: 90 }} />
                </div>
                <div
                  className="skeleton"
                  style={{
                    height: 24,
                    width: 60,
                    borderRadius: 999,
                    marginTop: 10,
                  }}
                />
              </div>

              <div className={`card ${styles.accessCard}`}>
                <div
                  className="skeleton"
                  style={{ height: 12, width: 110, marginBottom: 12 }}
                />
                {["Photos", "Vidéos"].map((_, i) => (
                  <div
                    key={i}
                    className={styles.accessDetail}
                    style={{ marginTop: i > 0 ? 6 : 0 }}
                  >
                    <div
                      className="skeleton"
                      style={{ height: 10, width: 50 }}
                    />
                    <div
                      className="skeleton"
                      style={{ height: 16, width: 24 }}
                    />
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    );

  if (isError)
    return (
      <div className={styles.page}>
        <div className="page-content">
          <div className={styles.errorState}>
            <h2>Accès refusé</h2>
            <p>Vous n'avez pas accès à cet espace pro ou il n'existe pas.</p>
            <button
              onClick={() => navigate(-1)}
              className="btn btn-outline"
              style={{ marginTop: 20 }}
            >
              ← Retour
            </button>
          </div>
        </div>
      </div>
    );

  if (!space) return null; // Shouldn't happen, but TypeScript needs this

  return (
    <div className={styles.page}>
      <MediaBanner
        media={media}
        thumbnailUrl={space.thumbnailUrl}
        altText={space.name}
        thumbStripPosition="bottom"
      />

      <div className="page-content">
        <div className={styles.layout}>
          <div className={styles.main}>
            <h1>
              {space.name}{" "}
              <span
                className={`badge ${space.isAvailable ? "badge-success" : "badge-danger"}`}
              >
                {space.isAvailable ? "Disponible" : "Non disponible"}
              </span>
            </h1>

            <div className={`card ${styles.descCard}`}>
              <h4>À propos de cet espace pro</h4>
              <FormattedText value={space.description} />
            </div>

            <div className={`card ${styles.detailsCard}`}>
              <h4>Caractéristiques</h4>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Type</span>
                  <span className={styles.dVal}>{space.type}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Étage</span>
                  <span className={styles.dVal}>{space.floor}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Surface Carrez</span>
                  <span className={styles.dVal}>
                    {formatInt(space.sizeCarrezSqm)} m²
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Surface au sol</span>
                  <span className={styles.dVal}>
                    {formatInt(space.sizeFloorSqm)} m²
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Orientation</span>
                  <span className={styles.dVal}>{space.orientation}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Vue</span>
                  <span className={styles.dVal}>{space.view}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Extérieur privé</span>
                  <span className={styles.dVal}>
                    {space.hasPrivateExterior ? "Oui" : "Non"}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Parking privé</span>
                  <span className={styles.dVal}>
                    {space.hasPrivateParking ? "Oui" : "Non"}
                  </span>
                </div>
              </div>
            </div>

            <div className={`card ${styles.detailsCard}`}>
              <h4>Informations</h4>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Point de livraison</span>
                  <span className={styles.dVal}>{space.deliveryPointId}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>
                    Réf. cadastrale (avant 2025)
                  </span>
                  <span className={styles.dVal}>
                    {space.landRegistryRefPre2025}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>
                    Réf. cadastrale (après 2025)
                  </span>
                  <span className={styles.dVal}>
                    {space.landRegistryRefPost2025}
                  </span>
                </div>
              </div>
            </div>

            <div className={`card ${styles.detailsCard}`}>
              <h4>Chauffage & Eau chaude</h4>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Chauffage</span>
                  <span className={styles.dVal}>
                    {space.electricHeatingModel}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Sèche-serviette</span>
                  <span className={styles.dVal}>
                    {space.bathroomTowelHeaterModel}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Chauffe-eau</span>
                  <span className={styles.dVal}>
                    {space.electricWaterHeaterModel}
                  </span>
                </div>
              </div>
            </div>

            <div className={`card ${styles.detailsCard}`}>
              <h4>Cuisine</h4>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Meubles de cuisine</span>
                  <span className={styles.dVal}>
                    {space.kitchenCabinetsModel}
                  </span>
                </div>
              </div>
            </div>

            <div className={`card ${styles.detailsCard}`}>
              <h4>Performance énergétique (DPE)</h4>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Classe énergie</span>
                  <span className={styles.dVal}>
                    {space.dpeEnergyRating ?? noData}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Consommation</span>
                  <span className={styles.dVal}>
                    {space.dpeEnergyKwhPerSqmYear != null
                      ? `${space.dpeEnergyKwhPerSqmYear} kWh/m²/an`
                      : noData}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Classe émissions</span>
                  <span className={styles.dVal}>
                    {space.dpeEmissionsRating ?? noData}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Émissions GES</span>
                  <span className={styles.dVal}>
                    {space.dpeEmissionsKgPerSqmYear != null
                      ? `${space.dpeEmissionsKgPerSqmYear} kg/m²/an`
                      : noData}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Double vitrage</span>
                  <span className={styles.dVal}>
                    {space.hasDoubleGlazedWindows ? "Oui" : "Non"}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Puissance compteur</span>
                  <span className={styles.dVal}>{space.meterPowerKva} kVA</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>
                    Conso. locataire préc. (€/an)
                    <em className={styles.dNote}>
                      (basée sur le dernier résident, non contractuelle)
                    </em>
                  </span>
                  <span className={styles.dVal}>
                    {space.previousTenantAnnualConsumptionEur != null
                      ? space.previousTenantAnnualConsumptionEur
                      : noData}
                  </span>
                </div>
              </div>
            </div>

            <div className={`card ${styles.detailsCard}`}>
              <h4>Connectivité</h4>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Fibre optique</span>
                  <span className={styles.dVal}>
                    {space.hasFiberOptic ? "Oui" : "Non"}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Réseau cuivre</span>
                  <span className={styles.dVal}>
                    {space.hasCopperNetwork ? "Oui" : "Non"}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Prise TV</span>
                  <span className={styles.dVal}>
                    {space.hasTvOutlet ? "Oui" : "Non"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <aside className={styles.sidebar}>
            <button
              onClick={() => navigate(-1)}
              className="btn btn-ghost btn-sm"
            >
              ← Retour aux espaces pro
            </button>
            <div className={`card ${styles.accessCard}`}>
              <h4>Votre accès</h4>
              <div className={styles.accessDetail}>
                <span className={styles.dLabel}>Valide jusqu'au</span>
                <span className={`${styles.dVal} ${styles.end}`}>
                  {formatDateTime(space.accessExpiry)}
                </span>
              </div>
              <span
                className={`badge ${isExpired(space.accessExpiry) ? "badge-danger" : "badge-success"}`}
                style={{ marginTop: 10 }}
              >
                {isExpired(space.accessExpiry) ? "Expiré" : "Actif"}
              </span>
            </div>

            <div className={`card ${styles.accessCard}`}>
              <h4>Médiathèque</h4>
              <div className={styles.accessDetail}>
                <span className={styles.dLabel}>Photos</span>
                <span className={`${styles.dVal} ${styles.end}`}>
                  {space.photoCount}
                </span>
              </div>
              <div className={styles.accessDetail}>
                <span className={styles.dLabel}>Vidéos</span>
                <span className={`${styles.dVal} ${styles.end}`}>
                  {space.videoCount}
                </span>
              </div>
            </div>

            <PlanCard
              url={space.planUrl}
              type={space.planType}
              className={styles.accessCard}
            />
          </aside>
        </div>

        <h2>Espaces communs</h2>
        <p className="section-subtitle">Une parenthèse de verdure</p>
        <p className={styles.desc}>
          Au cœur de l'immeuble, la cour arborée offre une véritable parenthèse
          de fraîcheur en plein centre-ville. Palmiers, olivier, érable du
          Japon, lauriers roses et jasmin composent un décor végétal plein de
          charme, à l'abri de l'agitation urbaine.
          <br />
          <br />
          Ce petit havre de verdure apporte une touche de sérénité et de
          convivialité à tous les résidents de l'Auberge Henri IV, dans un cadre
          privilégié, à deux pas du Château de Pau et de la place Clémenceau.
        </p>
      </div>

      <MediaBanner
        media={commonSpaceMedia}
        altText="Espaces communs"
        thumbStripPosition="top"
      />
    </div>
  );
}
