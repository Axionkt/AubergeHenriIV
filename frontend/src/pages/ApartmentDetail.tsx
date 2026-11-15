import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios";
import { keys } from "../lib/query";
import styles from "./ApartmentDetail.module.css";
import MediaBanner from "../components/MediaBanner";
import { MediaItem } from "../types/media";
import { ApartmentDetails } from "../types/apartment";
import { formatDateTime, formatInt, noData } from "../lib/dataFormatting";
import { useAccessTokenKeepAlive } from "../hooks/useAccessTokenKeepAlive";
import { FormattedText } from "../components/form/Textarea";
import PlanCard from "../components/PlanCard";

export default function ApartmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: apt,
    isLoading,
    isError,
  } = useQuery({
    queryKey: keys.apartment(id!),
    queryFn: () =>
      api.get<ApartmentDetails>(`/apartments/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  useAccessTokenKeepAlive(!!apt);

  const { data: mediaData } = useQuery<{ media: MediaItem[] }>({
    queryKey: keys.apartmentMedia(id!),
    queryFn: () =>
      api
        .get<{ media: MediaItem[] }>(`/apartments/${id}/media`)
        .then((r) => r.data),
    enabled: !!id && !!apt,
  });

  const { data: commonSpaceMediaData } = useQuery<{ media: MediaItem[] }>({
    queryKey: [...keys.commonSpaces(), "apartment"],
    queryFn: () =>
      api
        .get<{ media: MediaItem[] }>("/apartments/common-space/media")
        .then((r) => r.data),
    enabled: !!apt,
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
            <p>Vous n'avez pas accès à cet appartement ou il n'existe pas.</p>
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

  if (!apt) return null; // Shouldn't happen, but TypeScript needs this

  return (
    <div className={styles.page}>
      <MediaBanner
        media={media}
        thumbnailUrl={apt.thumbnailUrl}
        altText={apt.name}
        thumbStripPosition="bottom"
      />

      <div className="page-content">
        <div className={styles.layout}>
          <div className={styles.main}>
            <h1>
              {apt.name}{" "}
              <span
                className={`badge ${apt.isAvailable ? "badge-success" : "badge-danger"}`}
              >
                {apt.isAvailable ? "Disponible" : "Non disponible"}
              </span>
            </h1>

            <div className={`card ${styles.descCard}`}>
              <h4>À propos de cet appartement</h4>
              <FormattedText value={apt.description} />
            </div>

            <div className={`card ${styles.detailsCard}`}>
              <h4>Caractéristiques</h4>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Type</span>
                  <span className={styles.dVal}>{apt.type}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Étage</span>
                  <span className={styles.dVal}>{apt.floor}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Surface Carrez</span>
                  <span className={styles.dVal}>
                    {formatInt(apt.sizeCarrezSqm)} m²
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Surface au sol</span>
                  <span className={styles.dVal}>
                    {formatInt(apt.sizeFloorSqm)} m²
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Orientation</span>
                  <span className={styles.dVal}>{apt.orientation}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Vue</span>
                  <span className={styles.dVal}>{apt.view}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Extérieur privé</span>
                  <span className={styles.dVal}>
                    {apt.hasPrivateExterior ? "Oui" : "Non"}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Parking privé</span>
                  <span className={styles.dVal}>
                    {apt.hasPrivateParking ? "Oui" : "Non"}
                  </span>
                </div>
              </div>
            </div>

            <div className={`card ${styles.detailsCard}`}>
              <h4>Informations</h4>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Point de livraison</span>
                  <span className={styles.dVal}>{apt.deliveryPointId}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>
                    Réf. cadastrale (avant 2025)
                  </span>
                  <span className={styles.dVal}>
                    {apt.landRegistryRefPre2025}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>
                    Réf. cadastrale (après 2025)
                  </span>
                  <span className={styles.dVal}>
                    {apt.landRegistryRefPost2025}
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
                    {apt.electricHeatingModel}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Sèche-serviette</span>
                  <span className={styles.dVal}>
                    {apt.bathroomTowelHeaterModel}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Chauffe-eau</span>
                  <span className={styles.dVal}>
                    {apt.electricWaterHeaterModel}
                  </span>
                </div>
              </div>
            </div>

            <div className={`card ${styles.detailsCard}`}>
              <h4>Cuisine</h4>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Plaque à induction</span>
                  <span className={styles.dVal}>
                    {apt.inductionCooktopModel}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Four</span>
                  <span className={styles.dVal}>{apt.ovenModel}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Hotte</span>
                  <span className={styles.dVal}>{apt.rangeHoodModel}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Meubles de cuisine</span>
                  <span className={styles.dVal}>
                    {apt.kitchenCabinetsModel}
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
                    {apt.dpeEnergyRating ?? noData}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Consommation</span>
                  <span className={styles.dVal}>
                    {apt.dpeEnergyKwhPerSqmYear != null
                      ? `${apt.dpeEnergyKwhPerSqmYear} kWh/m²/an`
                      : noData}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Classe émissions</span>
                  <span className={styles.dVal}>
                    {apt.dpeEmissionsRating ?? noData}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Émissions GES</span>
                  <span className={styles.dVal}>
                    {apt.dpeEmissionsKgPerSqmYear != null
                      ? `${apt.dpeEmissionsKgPerSqmYear} kg/m²/an`
                      : noData}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Double vitrage</span>
                  <span className={styles.dVal}>
                    {apt.hasDoubleGlazedWindows ? "Oui" : "Non"}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Puissance compteur</span>
                  <span className={styles.dVal}>{apt.meterPowerKva} kVA</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>
                    Conso. locataire préc. (€/an)
                    <em className={styles.dNote}>
                      (basée sur le dernier résident, non contractuelle)
                    </em>
                  </span>
                  <span className={styles.dVal}>
                    {apt.previousTenantAnnualConsumptionEur != null
                      ? apt.previousTenantAnnualConsumptionEur
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
                    {apt.hasFiberOptic ? "Oui" : "Non"}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Réseau cuivre</span>
                  <span className={styles.dVal}>
                    {apt.hasCopperNetwork ? "Oui" : "Non"}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Prise TV</span>
                  <span className={styles.dVal}>
                    {apt.hasTvOutlet ? "Oui" : "Non"}
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
              ← Retour aux appartements
            </button>
            <div className={`card ${styles.accessCard}`}>
              <h4>Votre accès</h4>
              <div className={styles.accessDetail}>
                <span className={styles.dLabel}>Valide jusqu'au</span>
                <span className={`${styles.dVal} ${styles.end}`}>
                  {formatDateTime(apt.accessExpiry)}
                </span>
              </div>
              <span
                className={`badge ${isExpired(apt.accessExpiry) ? "badge-danger" : "badge-success"}`}
                style={{ marginTop: 10 }}
              >
                {isExpired(apt.accessExpiry) ? "Expiré" : "Actif"}
              </span>
            </div>

            <div className={`card ${styles.accessCard}`}>
              <h4>Médiathèque</h4>
              <div className={styles.accessDetail}>
                <span className={styles.dLabel}>Photos</span>
                <span className={`${styles.dVal} ${styles.end}`}>
                  {apt.photoCount}
                </span>
              </div>
              <div className={styles.accessDetail}>
                <span className={styles.dLabel}>Vidéos</span>
                <span className={`${styles.dVal} ${styles.end}`}>
                  {apt.videoCount}
                </span>
              </div>
            </div>

            <PlanCard
              url={apt.planUrl}
              type={apt.planType}
              className={styles.accessCard}
            />
          </aside>
        </div>

        <h2>Espaces communs</h2>
        <p className="section-subtitle">Charme, convivialité et sérénité</p>
        <p className={styles.desc}>
          Dès que l'on pousse la grande porte d'entrée en bois massif de
          l'Auberge Henri IV, on découvre une atmosphère chaleureuse et
          accueillante, avec cette agréable impression d'être déjà chez soi.
          <br />
          L'escalier d'époque, soigneusement entretenu et ciré, est l'une des
          pièces maîtresses de l'immeuble. Situé dans un secteur patrimonial
          protégé, il fait l'objet de prescriptions de conservation destinées à
          préserver son caractère historique. Des petits anges apportent une
          touche de poésie et de douceur à la montée des étages. Depuis le hall
          d'entrée, les résidents accèdent à la cour arborée. Véritable
          parenthèse de verdure et de fraîcheur en plein centre-ville, celle-ci
          invite à s'installer pour lire, prendre un café ou simplement profiter
          d'un moment de détente, à l'écart de l'animation urbaine.
          <br />
          <br />
          Un interphone permettant de contrôler l'accès à l'immeuble, et une
          caméra de surveillance installée dans le hall d'entrée, assurent le
          confort et la tranquillité des résidents.
          <br />
          <br />
          Un local à vélos sécurisé est également mis à la disposition des
          résidents.
          <br />
          <br />
          Comme les appartements, les espaces communs font l'objet d'un
          entretien attentif et régulier, afin de préserver durablement le
          charme des lieux et le plaisir d'y vivre.
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
