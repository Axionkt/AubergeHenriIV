import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import api from "../lib/axios";
import { keys } from "../lib/query";
import ConfirmModal from "../components/ConfirmModal";
import type { UserApartment, UserProSpace } from "../types/userAccess";
import styles from "./Profile.module.css";
import { formatDateTime } from "../lib/time";
import { getApiError } from "../lib/apiError";
import Input from "../components/form/Input";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [nameForm, setNameForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
  });
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (user && !editing) {
      setNameForm({ firstName: user.firstName, lastName: user.lastName });
    }
  }, [user, editing]);

  const [emailCopied, setEmailCopied] = useState(false);

  async function handleCopyEmail() {
    try {
      await navigator.clipboard.writeText("aubergeh4@gmail.com");
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 3000);
    } catch {
      // clipboard blocked/unavailable — button just won't flip to "copied"
    }
  }

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const {
    data: apartments = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: keys.userProfileApartmentAccesses(),
    queryFn: () =>
      api
        .get<UserApartment[]>("/apartments/access-to-apartments")
        .then((r) => r.data),
  });

  const {
    data: proSpaces = [],
    isLoading: proSpacesLoading,
    isError: proSpacesError,
  } = useQuery({
    queryKey: keys.userProfileProSpaceAccesses(),
    queryFn: () =>
      api
        .get<UserProSpace[]>("/pro-spaces/access-to-pro-spaces")
        .then((r) => r.data),
  });

  function isExpired(date: string | null) {
    return !!date && new Date(date) < new Date();
  }

  function startEdit() {
    setNameForm({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
    });
    setNameMsg(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setNameMsg(null);
  }

  async function handleNameSave(e: React.FormEvent) {
    e.preventDefault();
    if (!nameForm.firstName.trim() || !nameForm.lastName.trim()) {
      setNameMsg({ type: "error", text: "Le prénom et le nom sont requis." });
      return;
    }
    setNameSaving(true);
    setNameMsg(null);
    try {
      await api.put(`/user/${user?.id}`, nameForm);
      setEditing(false);
      setNameMsg({
        type: "success",
        text: "Nom mis à jour. Reconnectez-vous pour voir les changements partout.",
      });
    } catch (err: unknown) {
      setNameMsg({
        type: "error",
        text: getApiError(err, "Une erreur est survenue. Veuillez réessayer."),
      });
    } finally {
      setNameSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`/user/${user?.id}`);
      logout();
      navigate("/", { replace: true });
    } catch (err: unknown) {
      setDeleting(false);
      setConfirmDelete(false);
      setDeleteError(
        getApiError(
          err,
          "Une erreur est survenue lors de la suppression du compte.",
        ),
      );
    }
  }

  return (
    <>
      <div className={styles.page}>
        <div className={`page-content ${styles.profilePageContent}`}>
          <div className={styles.header}>
            <div className={styles.avatar}>
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>

            <div className={styles.headerInfo}>
              {editing ? (
                <form onSubmit={handleNameSave} className={styles.nameEditForm}>
                  <div className={styles.nameInputRow}>
                    <Input
                      label="Prénom"
                      value={nameForm.firstName}
                      onChange={(e) =>
                        setNameForm((f) => ({
                          ...f,
                          firstName: e.target.value,
                        }))
                      }
                      required
                      autoFocus
                    />
                    <Input
                      label="Nom"
                      value={nameForm.lastName}
                      onChange={(e) =>
                        setNameForm((f) => ({
                          ...f,
                          lastName: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  {nameMsg && (
                    <p
                      className={
                        nameMsg.type === "error" ? "msg-error" : "msg-success"
                      }
                      style={{ marginTop: 8, marginBottom: 0 }}
                    >
                      {nameMsg.text}
                    </p>
                  )}
                  <div className={styles.nameFormActions}>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={nameSaving}
                    >
                      {nameSaving ? "Enregistrement…" : "Enregistrer"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={cancelEdit}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className={styles.nameDisplayRow}>
                    <h1 className={styles.name}>
                      {user?.firstName} {user?.lastName}
                    </h1>
                  </div>
                  {nameMsg && (
                    <p
                      className={
                        nameMsg.type === "error" ? "msg-error" : "msg-success"
                      }
                      style={{ marginTop: 6, marginBottom: 4 }}
                    >
                      {nameMsg.text}
                    </p>
                  )}
                  <p className={styles.email}>{user?.email}</p>
                  <span
                    className={`badge ${user?.isAdmin ? "badge-lavender" : "badge-neutral"}`}
                  >
                    {user?.isAdmin ? "Administrateur" : "Résident"}
                  </span>
                </>
              )}
            </div>

            {!editing && (
              <button
                className={"btn btn-ghost btn-sm " + styles.modifyUserBtn}
                onClick={startEdit}
              >
                ✎ Modifier
              </button>
            )}
          </div>

          <div className={styles.divider} />

          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <div>
                <p className="section-eyebrow">Mes accès</p>
                <h2>Mes appartements</h2>
              </div>
              <Link
                to="/?tab=appartements#collection"
                className="btn btn-outline btn-sm"
              >
                Voir tous les appartements →
              </Link>
            </div>

            {isLoading && (
              <div className={styles.skeletonGrid}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--clr-linen)",
                    }}
                  >
                    <div
                      className="skeleton"
                      style={{
                        width: 52,
                        height: 38,
                        borderRadius: 4,
                        flexShrink: 0,
                      }}
                    />
                    <div
                      className="skeleton"
                      style={{ height: 15, width: "25%" }}
                    />
                    <div style={{ flex: 1 }} />
                    <div
                      className="skeleton"
                      style={{ height: 24, width: 110, borderRadius: 999 }}
                    />
                    <div
                      className="skeleton"
                      style={{ height: 30, width: 64, borderRadius: 6 }}
                    />
                  </div>
                ))}
              </div>
            )}

            {isError && (
              <p className="msg-error">
                Impossible de charger vos appartements.
              </p>
            )}

            {!isLoading && !isError && apartments.length === 0 && (
              <div className={styles.empty}>
                <h3>Aucun appartement</h3>
                <p className={styles.emptySub}>
                  Vous n'avez pas encore accès à un appartement. Contactez
                  l'administration pour obtenir un accès.
                </p>
              </div>
            )}

            {!isLoading && apartments.length > 0 && (
              <div className="card" style={{ overflow: "hidden" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Appartement</th>
                      <th>Accès jusqu'au</th>
                      <th className={styles.actionsCol}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {apartments.map((apt) => (
                      <tr key={apt.apartmentId}>
                        <td>
                          <div className={styles.resourceCell}>
                            <div className={styles.resourceThumb}>
                              {apt.apartmentThumbnailUrl ? (
                                <img
                                  src={`/api/${apt.apartmentThumbnailUrl}`}
                                  alt={apt.apartmentName}
                                  className={styles.resourceThumbImg}
                                />
                              ) : (
                                <div
                                  className={styles.resourceThumbPlaceholder}
                                />
                              )}
                            </div>
                            <span className={styles.resourceName}>
                              {apt.apartmentName}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge ${isExpired(apt.accessExpiry) ? "badge-danger" : "badge-success"}`}
                            style={{ width: "fit-content" }}
                          >
                            {formatDateTime(apt.accessExpiry)}
                          </span>
                        </td>
                        <td className={styles.actionsCol}>
                          <Link
                            to={`/appartements/${apt.apartmentId}`}
                            className="btn btn-ghost btn-sm"
                          >
                            Voir →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className={styles.divider} />

          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <div>
                <p className="section-eyebrow">Mes accès</p>
                <h2>Mes espaces pro</h2>
              </div>
              <Link
                to="/?tab=espaces-pro#collection"
                className="btn btn-outline btn-sm"
              >
                Voir tous les espaces pro →
              </Link>
            </div>

            {proSpacesLoading && (
              <div className={styles.skeletonGrid}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--clr-linen)",
                    }}
                  >
                    <div
                      className="skeleton"
                      style={{
                        width: 52,
                        height: 38,
                        borderRadius: 4,
                        flexShrink: 0,
                      }}
                    />
                    <div
                      className="skeleton"
                      style={{ height: 15, width: "25%" }}
                    />
                    <div style={{ flex: 1 }} />
                    <div
                      className="skeleton"
                      style={{ height: 24, width: 110, borderRadius: 999 }}
                    />
                    <div
                      className="skeleton"
                      style={{ height: 30, width: 64, borderRadius: 6 }}
                    />
                  </div>
                ))}
              </div>
            )}

            {proSpacesError && (
              <p className="msg-error">
                Impossible de charger vos espaces pro.
              </p>
            )}

            {!proSpacesLoading && !proSpacesError && proSpaces.length === 0 && (
              <div className={styles.empty}>
                <h3>Aucun espace pro</h3>
                <p className={styles.emptySub}>
                  Vous n'avez pas encore accès à un espace pro. Contactez
                  l'administration pour obtenir un accès.
                </p>
              </div>
            )}

            {!proSpacesLoading && proSpaces.length > 0 && (
              <div className="card" style={{ overflow: "hidden" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Espace pro</th>
                      <th>Accès jusqu'au</th>
                      <th className={styles.actionsCol}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {proSpaces.map((space) => (
                      <tr key={space.proSpaceId}>
                        <td>
                          <div className={styles.resourceCell}>
                            <div className={styles.resourceThumb}>
                              {space.proSpaceThumbnailUrl ? (
                                <img
                                  src={`/api/${space.proSpaceThumbnailUrl}`}
                                  alt={space.proSpaceName}
                                  className={styles.resourceThumbImg}
                                />
                              ) : (
                                <div
                                  className={styles.resourceThumbPlaceholder}
                                />
                              )}
                            </div>
                            <span className={styles.resourceName}>
                              {space.proSpaceName}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge ${isExpired(space.accessExpiry) ? "badge-danger" : "badge-success"}`}
                            style={{ width: "fit-content" }}
                          >
                            {formatDateTime(space.accessExpiry)}
                          </span>
                        </td>
                        <td className={styles.actionsCol}>
                          <Link
                            to={`/espaces-pro/${space.proSpaceId}`}
                            className="btn btn-ghost btn-sm"
                          >
                            Voir →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className={styles.contactRow}>
            <p className={styles.contactText}>
              Besoin d'un accès ou d'une modification ?
            </p>
            <button
              className={`btn btn-outline btn-sm ${styles.contactCopyBtn}`}
              onClick={handleCopyEmail}
            >
              {emailCopied ? "✓ Copié" : "✉ Contacter aubergeh4@gmail.com"}
            </button>
          </div>

          <div>
            <div>
              <p className={styles.dangerTitle}>Supprimer mon compte</p>
              <p className={styles.dangerSub}>
                Cette action est irréversible. Toutes vos données seront
                supprimées définitivement.
              </p>
            </div>
            {deleteError && (
              <p className="msg-error" style={{ marginBottom: 12 }}>
                {deleteError}
              </p>
            )}
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setConfirmDelete(true)}
              disabled={deleting}
            >
              {deleting ? "Suppression…" : "Supprimer mon compte"}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmDelete}
        title="Supprimer mon compte"
        message="Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et toutes vos données seront perdues définitivement."
        confirmLabel="Supprimer définitivement"
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
