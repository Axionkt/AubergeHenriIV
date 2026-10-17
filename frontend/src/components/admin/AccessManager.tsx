import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { keys } from "../../lib/query";
import api from "../../lib/axios";
import { getApiErrorMessage } from "../../lib/apiError";
import styles from "./Admin.module.css";
import ConfirmModal from "../ConfirmModal";
import { User } from "../../types/user";
import { ApartmentItemAdmin } from "../../types/apartment";
import { ProSpaceItemAdmin } from "../../types/proSpace";
import { formatDateTime } from "../../lib/time";
import Input from "../form/Input";
import DateInput from "../form/DateInput";

type ResourceType = "apartment" | "pro-space";

interface NormalizedGrant {
  key: string;
  userId: string;
  resourceId: string;
  firstName: string;
  lastName: string;
  resourceName: string;
  accessExpiry: string | null;
}

interface RevokeTarget {
  userId: string;
  resourceId: string;
  label: string;
}

interface ResourceConfig {
  resourceLabel: string;
  resourceLabelPlural: string;
  resourcesQueryKey: readonly unknown[];
  accessesQueryKey: readonly unknown[];
  listQueryKey: readonly unknown[];
  resourcesUrl: string;
  accessesUrl: string;
  searchPlaceholder: string;
  buildGrantPayload: (
    userIds: string[],
    resourceIds: string[],
    expiry: string | null,
  ) => object;
  buildRevokePayload: (userIds: string[], resourceIds: string[]) => object;
  normalizeGrant: (grant: any) => NormalizedGrant;
}

const CONFIGS: Record<ResourceType, ResourceConfig> = {
  apartment: {
    resourceLabel: "appartement",
    resourceLabelPlural: "Appartements",
    resourcesQueryKey: keys.apartmentsAdmin(),
    accessesQueryKey: keys.userApartmentAccesses(),
    listQueryKey: keys.apartments(),
    resourcesUrl: "/admin/apartments",
    accessesUrl: "/admin/apartments/user-accesses",
    searchPlaceholder: "Rechercher un appartement…",
    buildGrantPayload: (userIds, resourceIds, expiry) => ({
      userIds,
      apartmentIds: resourceIds,
      accessExpiry: expiry,
    }),
    buildRevokePayload: (userIds, resourceIds) => ({
      userIds,
      apartmentIds: resourceIds,
    }),
    normalizeGrant: (g) => ({
      key: `${g.userId}-${g.apartmentId}`,
      userId: g.userId,
      resourceId: g.apartmentId,
      firstName: g.firstName,
      lastName: g.lastName,
      resourceName: g.apartmentName,
      accessExpiry: g.accessExpiry,
    }),
  },
  "pro-space": {
    resourceLabel: "espace pro",
    resourceLabelPlural: "Espaces pro",
    resourcesQueryKey: keys.proSpacesAdmin(),
    accessesQueryKey: keys.userProSpaceAccesses(),
    listQueryKey: keys.proSpaces(),
    resourcesUrl: "/admin/pro-spaces",
    accessesUrl: "/admin/pro-spaces/user-accesses",
    searchPlaceholder: "Rechercher un espace pro…",
    buildGrantPayload: (userIds, resourceIds, expiry) => ({
      userIds,
      proSpaceIds: resourceIds,
      accessExpiry: expiry,
    }),
    buildRevokePayload: (userIds, resourceIds) => ({
      userIds,
      proSpaceIds: resourceIds,
    }),
    normalizeGrant: (g) => ({
      key: `${g.userId}-${g.proSpaceId}`,
      userId: g.userId,
      resourceId: g.proSpaceId,
      firstName: g.firstName,
      lastName: g.lastName,
      resourceName: g.proSpaceName,
      accessExpiry: g.accessExpiry,
    }),
  },
};

export default function AccessManager({
  resourceType,
}: {
  resourceType: ResourceType;
}) {
  const config = CONFIGS[resourceType];
  const qc = useQueryClient();

  const [selUsers, setSelUsers] = useState<string[]>([]);
  const [selResources, setSelResources] = useState<string[]>([]);
  const [endDate, setEndDate] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [resourceSearch, setResourceSearch] = useState("");
  const [tab, setTab] = useState<"grant" | "revoke">("grant");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<RevokeTarget | null>(null);

  useEffect(() => {
    if (msg?.type !== "success") return;
    const t = setTimeout(() => setMsg(null), 3000);
    return () => clearTimeout(t);
  }, [msg]);

  // Reset selections when switching resource type
  useEffect(() => {
    setSelUsers([]);
    setSelResources([]);
    setEndDate("");
    setUserSearch("");
    setResourceSearch("");
    setTab("grant");
    setMsg(null);
  }, [resourceType]);

  const {
    data: users = [],
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
  } = useQuery({
    queryKey: keys.users(),
    queryFn: () => api.get<User[]>("/admin/users").then((r) => r.data),
  });

  const {
    data: resources = [],
    isLoading: isLoadingResources,
    isError: isErrorResources,
  } = useQuery({
    queryKey: config.resourcesQueryKey,
    queryFn: () =>
      api
        .get<ApartmentItemAdmin[] | ProSpaceItemAdmin[]>(config.resourcesUrl)
        .then((r) => r.data),
  });

  const {
    data: rawGrants = [],
    isLoading: isLoadingGrants,
    isError: isErrorGrants,
  } = useQuery({
    queryKey: config.accessesQueryKey,
    queryFn: () => api.get<any[]>(config.accessesUrl).then((r) => r.data),
  });

  const grants: NormalizedGrant[] = rawGrants.map(config.normalizeGrant);

  const filteredUsers = users.filter((u) =>
    `${u.firstName} ${u.lastName} ${u.email}`
      .toLowerCase()
      .includes(userSearch.toLowerCase()),
  );
  const filteredResources = (
    resources as { id: string; name: string }[]
  ).filter((r) => r.name.toLowerCase().includes(resourceSearch.toLowerCase()));

  function toggleUser(id: string) {
    setSelUsers((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  }
  function toggleResource(id: string) {
    setSelResources((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selUsers.length || !selResources.length) {
      setMsg({
        type: "error",
        text: `Sélectionnez au moins un utilisateur et un ${config.resourceLabel}.`,
      });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      if (tab === "grant") {
        await api.post(
          config.accessesUrl,
          config.buildGrantPayload(selUsers, selResources, endDate || null),
        );
        setMsg({
          type: "success",
          text: `Accès accordé à ${selUsers.length} utilisateur(s) pour ${selResources.length} ${config.resourceLabel}(s).`,
        });
      } else {
        await api.delete(config.accessesUrl, {
          data: config.buildRevokePayload(selUsers, selResources),
        });
        setMsg({ type: "success", text: "Accès révoqué." });
      }
      setSelUsers([]);
      setSelResources([]);
      setEndDate("");
      await qc.invalidateQueries({ queryKey: config.accessesQueryKey });
      await qc.invalidateQueries({ queryKey: config.listQueryKey });
    } catch (err) {
      setMsg({
        type: "error",
        text: getApiErrorMessage(err, "Une erreur est survenue."),
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleRevokeConfirm() {
    if (!revokeTarget) return;
    try {
      await api.delete(config.accessesUrl, {
        data: config.buildRevokePayload(
          [revokeTarget.userId],
          [revokeTarget.resourceId],
        ),
      });
      await qc.invalidateQueries({ queryKey: config.accessesQueryKey });
      await qc.invalidateQueries({ queryKey: config.listQueryKey });
      setMsg({ type: "success", text: "Accès révoqué." });
    } catch (err) {
      setMsg({
        type: "error",
        text: getApiErrorMessage(err, "Impossible de révoquer l'accès."),
      });
    } finally {
      setRevokeTarget(null);
    }
  }

  return (
    <>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "grant" ? styles.tabActive : ""}`}
          onClick={() => setTab("grant")}
        >
          Accorder un accès
        </button>
        <button
          className={`${styles.tab} ${tab === "revoke" ? styles.tabActive : ""}`}
          onClick={() => setTab("revoke")}
        >
          Révoquer un accès
        </button>
      </div>

      <form onSubmit={handleSubmit} className={`card ${styles.accessForm}`}>
        <div className={styles.accessGrid}>
          <div className={styles.accessGridCol}>
            <h3>
              Utilisateurs{" "}
              <span className="lead">
                ({selUsers.length} sélectionné
                {selUsers.length > 1 ? "s" : ""})
              </span>
            </h3>
            <Input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Rechercher un utilisateur…"
            />
            <div className={styles.checkList}>
              {isLoadingUsers ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={styles.checkRow}>
                    <div
                      className="skeleton"
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 3,
                        flexShrink: 0,
                      }}
                    />
                    <div className="skeleton" style={{ height: 14, flex: 1 }} />
                    <div
                      className="skeleton"
                      style={{ height: 12, width: 80 }}
                    />
                  </div>
                ))
              ) : isErrorUsers ? (
                <p className={styles.checkEmpty}>
                  Impossible de charger les utilisateurs.
                </p>
              ) : (
                <>
                  {filteredUsers.map((u) => (
                    <label
                      key={u.id}
                      className={`${styles.checkRow} ${selUsers.includes(u.id) ? styles.checkRowActive : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={selUsers.includes(u.id)}
                        onChange={() => toggleUser(u.id)}
                      />
                      <span className={styles.checkName}>
                        {u.firstName} {u.lastName}
                      </span>
                      <span className={styles.checkSub}>{u.email}</span>
                    </label>
                  ))}
                  {filteredUsers.length === 0 && (
                    <p className={styles.checkEmpty}>Aucun résultat</p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className={styles.accessGridCol}>
            <h3>
              {config.resourceLabelPlural}{" "}
              <span className="lead">
                ({selResources.length} sélectionné
                {selResources.length > 1 ? "s" : ""})
              </span>
            </h3>
            <Input
              value={resourceSearch}
              onChange={(e) => setResourceSearch(e.target.value)}
              placeholder={config.searchPlaceholder}
            />
            <div className={styles.checkList}>
              {isLoadingResources ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={styles.checkRow}>
                    <div
                      className="skeleton"
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 3,
                        flexShrink: 0,
                      }}
                    />
                    <div
                      className="skeleton"
                      style={{ height: 14, width: "70%" }}
                    />
                  </div>
                ))
              ) : isErrorResources ? (
                <p className={styles.checkEmpty}>
                  Impossible de charger les{" "}
                  {config.resourceLabelPlural.toLowerCase()}.
                </p>
              ) : (
                <>
                  {filteredResources.map((r) => (
                    <label
                      key={r.id}
                      className={`${styles.checkRow} ${selResources.includes(r.id) ? styles.checkRowActive : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={selResources.includes(r.id)}
                        onChange={() => toggleResource(r.id)}
                      />
                      <span className={styles.checkName}>{r.name}</span>
                    </label>
                  ))}
                  {filteredResources.length === 0 && (
                    <p className={styles.checkEmpty}>Aucun résultat</p>
                  )}
                </>
              )}
            </div>
          </div>

          {tab === "grant" && (
            <div className={styles.accessGridCol}>
              <div>
                <h3>Date d'expiration</h3>
                <span className="lead">(vide = sans expiration)</span>
              </div>
              <DateInput
                value={endDate}
                onChange={(date) => setEndDate(date)}
              />
            </div>
          )}
        </div>

        {msg && (
          <p
            className={msg.type === "error" ? "msg-error" : "msg-success"}
            style={{ marginBottom: 12 }}
          >
            {msg.text}
          </p>
        )}

        <button
          type="submit"
          className={`btn ${tab === "revoke" ? "btn-danger" : "btn-primary"}`}
          disabled={saving}
        >
          {saving
            ? "En cours…"
            : tab === "grant"
              ? `Accorder l'accès (${selUsers.length} × ${selResources.length})`
              : `Révoquer l'accès (${selUsers.length} × ${selResources.length})`}
        </button>
      </form>

      <h3>Accès actifs — {config.resourceLabelPlural}</h3>

      {isErrorGrants && (
        <p className="msg-error" style={{ marginBottom: 16 }}>
          Impossible de charger les accès actifs.
        </p>
      )}

      <div className="card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>{config.resourceLabelPlural}</th>
              <th>Expiration</th>
              <th className={styles.actionsCol}></th>
            </tr>
          </thead>
          <tbody>
            {isLoadingGrants ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td>
                    <div
                      className="skeleton"
                      style={{ height: 16, width: "70%" }}
                    />
                  </td>
                  <td>
                    <div
                      className="skeleton"
                      style={{ height: 16, width: "60%" }}
                    />
                  </td>
                  <td>
                    <div
                      className="skeleton"
                      style={{ height: 22, width: 100, borderRadius: 999 }}
                    />
                  </td>
                  <td>
                    <div
                      className="skeleton"
                      style={{
                        height: 30,
                        width: 80,
                        borderRadius: 6,
                        marginLeft: "auto",
                      }}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <>
                {grants.map((g) => {
                  const expired =
                    !!g.accessExpiry && new Date(g.accessExpiry) < new Date();
                  return (
                    <tr key={g.key}>
                      <td>
                        {g.firstName} {g.lastName}
                      </td>
                      <td>{g.resourceName}</td>
                      <td>
                        <span
                          className={`badge ${expired ? "badge-danger" : "badge-success"}`}
                        >
                          {formatDateTime(g.accessExpiry)}
                        </span>
                      </td>
                      <td className={styles.actionsCol}>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() =>
                            setRevokeTarget({
                              userId: g.userId,
                              resourceId: g.resourceId,
                              label: `${g.firstName} ${g.lastName} — ${g.resourceName}`,
                            })
                          }
                        >
                          Révoquer
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {grants.length === 0 && (
                  <tr>
                    <td colSpan={4} className={styles.emptyCell}>
                      Aucun accès actif.
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={!!revokeTarget}
        title="Révoquer l'accès"
        message={`Êtes-vous sûr de vouloir révoquer l'accès de ${revokeTarget?.label} ? L'utilisateur perdra immédiatement l'accès.`}
        confirmLabel="Révoquer"
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={handleRevokeConfirm}
        onCancel={() => setRevokeTarget(null)}
      />
    </>
  );
}
