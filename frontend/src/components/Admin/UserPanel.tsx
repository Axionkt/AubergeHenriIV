import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/axios";
import { keys } from "../../lib/query";
import { User } from "../../types/user";
import styles from "./Admin.module.css";
import { formatDateTime } from "../../lib/time";
import Input from "../form/Input";

export default function UsersPanel() {
  const [search, setSearch] = useState("");
  const [filterVerified, setFilterVerified] = useState(false);

  const {
    data: users = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: keys.users(),
    queryFn: () => api.get<User[]>("/admin/users").then((r) => r.data),
  });

  const filtered = users.filter((u) => {
    const contains = `${u.firstName} ${u.lastName} ${u.email}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const verifiedOnly = filterVerified ? u.isVerified : true;
    return contains && verifiedOnly;
  });

  return (
    <>
      <div className={styles.panelHead}>
        <div>
          <p className="section-eyebrow">Administration</p>
          <h2>Utilisateurs</h2>
        </div>

        <div className={styles.filters}>
          <Input
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            className={`${styles.filterToggle} ${filterVerified ? styles.active : ""}`}
            onClick={() => setFilterVerified((v) => !v)}
          >
            Vérifiés
          </button>
        </div>
      </div>

      {isError && (
        <p className="msg-error" style={{ marginBottom: 16 }}>
          Impossible de charger les utilisateurs.
        </p>
      )}

      <div className="card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>E-mail</th>
              <th>Rôle</th>
              <th>Créé le</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td>
                    <div
                      className="skeleton"
                      style={{ height: 16, width: "75%" }}
                    />
                  </td>
                  <td>
                    <div
                      className="skeleton"
                      style={{ height: 16, width: "85%" }}
                    />
                  </td>
                  <td>
                    <div
                      className="skeleton"
                      style={{ height: 22, width: 80, borderRadius: 999 }}
                    />
                  </td>
                  <td>
                    <div
                      className="skeleton"
                      style={{ height: 22, width: 100, borderRadius: 999 }}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>
                        {u.firstName} {u.lastName}
                      </strong>
                    </td>
                    <td className="text-muted">{u.email}</td>
                    <td>
                      <span
                        className={`badge ${
                          u.isVerified
                            ? u.isAdmin
                              ? "badge-lavender"
                              : "badge-neutral"
                            : "badge-danger"
                        }`}
                      >
                        {u.isVerified
                          ? u.isAdmin
                            ? "Administrateur"
                            : "Résident"
                          : "Non vérifié"}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-neutral">
                        {formatDateTime(u.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className={styles.emptyCell}>
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
