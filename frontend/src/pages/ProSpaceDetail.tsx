import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios";
import { keys } from "../lib/query";
import styles from "./ProSpaceDetail.module.css";
import { MediaItem } from "../types/media";
import { ProSpaceDetails } from "../types/proSpace";
import { formatDateTime } from "../lib/time";
import { useAccessTokenKeepAlive } from "../hooks/useAccessTokenKeepAlive";

export default function ProSpaceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [selected, setSelected] = useState<MediaItem | null>(null);

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

  const media = mediaData?.media ?? [];
  const current = selected ?? media[0] ?? null;

  function isExpired(d?: string | null) {
    return !!d && new Date(d) < new Date();
  }

  if (isLoading)
    return (
      <div className={styles.page}>
        <div className={styles.hero}>
          <div className={styles.heroMedia}>
            <div
              className="skeleton-dark"
              style={{ width: "100%", height: "100%", borderRadius: 0 }}
            />
          </div>
          <div className={styles.thumbStrip}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="skeleton-dark"
                style={{
                  width: 100,
                  height: 64,
                  flexShrink: 0,
                  borderRadius: 4,
                }}
              />
            ))}
          </div>
        </div>

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
      <div className={styles.hero}>
        <div className={styles.heroMedia}>
          {current ? (
            current.type === "video" ? (
              <video
                key={`/api/${current.url}`}
                src={`/api/${current.url}`}
                controls
                className={styles.heroEl}
              />
            ) : (
              <img
                src={`/api/${current.url}`}
                alt={space.name}
                className={styles.heroEl}
              />
            )
          ) : space.thumbnailUrl ? (
            <img
              src={`/api/${space.thumbnailUrl}`}
              alt={space.name}
              className={styles.heroEl}
            />
          ) : (
            <div className={styles.heroPlaceholder} />
          )}
        </div>

        {media.length > 1 && (
          <div className={styles.thumbStrip}>
            {media.map((item, i) => (
              <button
                key={i}
                onClick={() => setSelected(item)}
                className={`${styles.thumb} ${current === item ? styles.thumbActive : ""}`}
                aria-label={`Média ${i + 1}`}
              >
                {item.type === "video" ? (
                  <span className={styles.thumbPlay}>▶</span>
                ) : (
                  <img
                    src={`/api/${item.url}`}
                    alt=""
                    className={styles.thumbImg}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

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

            {space.description && (
              <div className={`card ${styles.descCard}`}>
                <h4>À propos de cet espace pro</h4>
                <p className={styles.desc}>{space.description}</p>
              </div>
            )}

            <div className={`card ${styles.detailsCard}`}>
              <h4>Caractéristiques</h4>
              <div className={styles.detailsGrid}>
                {space.type && (
                  <div className={styles.detailItem}>
                    <span className={styles.dLabel}>Type</span>
                    <span className={styles.dVal}>{space.type}</span>
                  </div>
                )}
                {space.floor && (
                  <div className={styles.detailItem}>
                    <span className={styles.dLabel}>Étage</span>
                    <span className={styles.dVal}>{space.floor}</span>
                  </div>
                )}
                {space.sizeCarrezSqm != null && (
                  <div className={styles.detailItem}>
                    <span className={styles.dLabel}>Surface Carrez</span>
                    <span className={styles.dVal}>
                      {space.sizeCarrezSqm} m²
                    </span>
                  </div>
                )}
                {space.sizeFloorSqm != null && (
                  <div className={styles.detailItem}>
                    <span className={styles.dLabel}>Surface au sol</span>
                    <span className={styles.dVal}>{space.sizeFloorSqm} m²</span>
                  </div>
                )}
                {space.orientation && (
                  <div className={styles.detailItem}>
                    <span className={styles.dLabel}>Orientation</span>
                    <span className={styles.dVal}>{space.orientation}</span>
                  </div>
                )}
                {space.view && (
                  <div className={styles.detailItem}>
                    <span className={styles.dLabel}>Vue</span>
                    <span className={styles.dVal}>{space.view}</span>
                  </div>
                )}
                <div className={styles.detailItem}>
                  <span className={styles.dLabel}>Extérieur privé</span>
                  <span className={styles.dVal}>
                    {space.hasPrivateExterior ? "Oui" : "Non"}
                  </span>
                </div>
              </div>
            </div>

            {(space.electricHeatingModel ||
              space.bathroomTowelHeaterModel ||
              space.electricWaterHeaterModel) && (
              <div className={`card ${styles.detailsCard}`}>
                <h4>Chauffage & Eau chaude</h4>
                <div className={styles.detailsGrid}>
                  {space.electricHeatingModel && (
                    <div className={styles.detailItem}>
                      <span className={styles.dLabel}>
                        Chauffage électrique
                      </span>
                      <span className={styles.dVal}>
                        {space.electricHeatingModel}
                      </span>
                    </div>
                  )}
                  {space.bathroomTowelHeaterModel && (
                    <div className={styles.detailItem}>
                      <span className={styles.dLabel}>Sèche-serviette</span>
                      <span className={styles.dVal}>
                        {space.bathroomTowelHeaterModel}
                      </span>
                    </div>
                  )}
                  {space.electricWaterHeaterModel && (
                    <div className={styles.detailItem}>
                      <span className={styles.dLabel}>Chauffe-eau</span>
                      <span className={styles.dVal}>
                        {space.electricWaterHeaterModel}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {space.kitchenCabinetsModel && (
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
            )}

            {(space.dpeEnergyRating ||
              space.dpeEmissionsRating ||
              space.dpeEnergyKwhPerSqmYear != null ||
              space.dpeEmissionsKgPerSqmYear != null) && (
              <div className={`card ${styles.detailsCard}`}>
                <h4>Performance énergétique (DPE)</h4>
                <div className={styles.detailsGrid}>
                  {space.dpeEnergyRating && (
                    <div className={styles.detailItem}>
                      <span className={styles.dLabel}>Classe énergie</span>
                      <span className={styles.dVal}>
                        {space.dpeEnergyRating}
                      </span>
                    </div>
                  )}
                  {space.dpeEnergyKwhPerSqmYear != null && (
                    <div className={styles.detailItem}>
                      <span className={styles.dLabel}>Consommation</span>
                      <span className={styles.dVal}>
                        {space.dpeEnergyKwhPerSqmYear} kWh/m²/an
                      </span>
                    </div>
                  )}
                  {space.dpeEmissionsRating && (
                    <div className={styles.detailItem}>
                      <span className={styles.dLabel}>Classe émissions</span>
                      <span className={styles.dVal}>
                        {space.dpeEmissionsRating}
                      </span>
                    </div>
                  )}
                  {space.dpeEmissionsKgPerSqmYear != null && (
                    <div className={styles.detailItem}>
                      <span className={styles.dLabel}>Émissions GES</span>
                      <span className={styles.dVal}>
                        {space.dpeEmissionsKgPerSqmYear} kg/m²/an
                      </span>
                    </div>
                  )}
                  {space.hasDoubleGlazedWindows != null && (
                    <div className={styles.detailItem}>
                      <span className={styles.dLabel}>Double vitrage</span>
                      <span className={styles.dVal}>
                        {space.hasDoubleGlazedWindows ? "Oui" : "Non"}
                      </span>
                    </div>
                  )}
                  {space.meterPowerKva != null && (
                    <div className={styles.detailItem}>
                      <span className={styles.dLabel}>Puissance compteur</span>
                      <span className={styles.dVal}>
                        {space.meterPowerKva} kVA
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

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
          </aside>
        </div>
      </div>
    </div>
  );
}
