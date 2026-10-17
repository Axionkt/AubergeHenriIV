import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import { keys } from "../../lib/query";
import { getApiErrorMessage } from "../../lib/apiError";
import styles from "./Admin.module.css";
import ConfirmModal from "../ConfirmModal";
import { Review } from "../../types/review";
import Input from "../form/Input";
import DateInput from "../form/DateInput";
import Textarea from "../form/Textarea";

interface ReviewForm {
  authorName: string;
  text: string;
  createdAt: string;
}
const EMPTY_REVIEW: ReviewForm = {
  authorName: "",
  text: "",
  createdAt: "",
};

export default function ReviewsPanel() {
  const qc = useQueryClient();
  const [form, setForm] = useState<ReviewForm>(EMPTY_REVIEW);
  const [editing, setEditing] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // Auto-dismiss success messages; errors persist until next action
  useEffect(() => {
    if (msg?.type !== "success") return;
    const t = setTimeout(() => setMsg(null), 3000);
    return () => clearTimeout(t);
  }, [msg]);

  const {
    data: reviews = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: keys.reviews(),
    queryFn: () => api.get<Review[]>("/home/reviews").then((r) => r.data),
  });

  function startEdit(r: Review) {
    setEditing(r.id);
    setForm({
      authorName: r.authorName,
      text: r.text,
      createdAt: r.createdAt?.slice(0, 10) ?? "",
    });
    setMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditing(null);
    setForm(EMPTY_REVIEW);
    setMsg(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const isEditing = editing !== null;
    const payload = { ...form, createdAt: form.createdAt || null };
    try {
      if (isEditing) {
        await api.put(`/admin/home/reviews/${editing}`, payload);
        setEditing(null);
      } else {
        await api.post("/admin/home/reviews", payload);
      }
      setForm(EMPTY_REVIEW);
      await qc.invalidateQueries({ queryKey: keys.reviews() });
      setMsg({
        type: "success",
        text: isEditing ? "Avis mis à jour." : "Avis ajouté.",
      });
    } catch (err) {
      setMsg({
        type: "error",
        text: getApiErrorMessage(err, "Une erreur est survenue."),
      });
    } finally {
      setSaving(false);
    }
  }

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/home/reviews/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.reviews() });
      setDeleteError(null);
    },
    onError: (err) =>
      setDeleteError(
        getApiErrorMessage(err, "Impossible de supprimer l'avis."),
      ),
  });

  return (
    <>
      <div className={styles.panelHead}>
        <div>
          <p className="section-eyebrow">Administration</p>
          <h2>Avis clients</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={`card ${styles.reviewForm}`}>
        <h3>{editing !== null ? "Modifier l'avis" : "Ajouter un avis"}</h3>
        <div className={styles.reviewFormGrid}>
          <Input
            label="Auteur"
            value={form.authorName}
            onChange={(e) =>
              setForm((f) => ({ ...f, authorName: e.target.value }))
            }
            required
          />
          <DateInput
            label="Date"
            value={form.createdAt}
            onChange={(date) => setForm((f) => ({ ...f, createdAt: date }))}
          />
        </div>
        <Textarea
          label="Témoignage"
          value={form.text}
          onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
          placeholder="Rédigez le témoignage…"
          required
        />
        {msg && (
          <p
            className={msg.type === "error" ? "msg-error" : "msg-success"}
            style={{ marginBottom: 12 }}
          >
            {msg.text}
          </p>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={saving}
          >
            {saving
              ? "Enregistrement…"
              : editing !== null
                ? "Mettre à jour"
                : "Ajouter"}
          </button>
          {editing !== null && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={cancelEdit}
            >
              Annuler
            </button>
          )}
        </div>
      </form>

      {isError && (
        <p className="msg-error" style={{ marginBottom: 16 }}>
          Impossible de charger les avis.
        </p>
      )}

      {deleteError && (
        <p className="msg-error" style={{ marginBottom: 16 }}>
          {deleteError}
        </p>
      )}

      {isLoading ? (
        <div className={styles.reviewsGrid}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`card ${styles.reviewCard}`}>
              <div className={styles.reviewTop}>
                <div className="skeleton" style={{ height: 14, width: 72 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div
                  className="skeleton"
                  style={{ height: 14, width: "95%" }}
                />
                <div
                  className="skeleton"
                  style={{ height: 14, width: "82%" }}
                />
                <div
                  className="skeleton"
                  style={{ height: 14, width: "60%" }}
                />
              </div>
              <div className="skeleton" style={{ height: 12, width: 80 }} />
              <div className={styles.reviewActions}>
                <div
                  className="skeleton"
                  style={{ height: 30, width: 80, borderRadius: 6 }}
                />
                <div
                  className="skeleton"
                  style={{ height: 30, width: 90, borderRadius: 6 }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.reviewsGrid}>
          {reviews.map((r) => (
            <div key={r.id} className={`card ${styles.reviewCard}`}>
              <div className={styles.reviewTop}>
                <span className={styles.reviewAuthor}>{r.authorName}</span>
              </div>
              <p className={styles.reviewText}>{r.text}</p>
              {r.createdAt && (
                <p className={styles.reviewDate}>
                  {new Date(r.createdAt).toLocaleDateString("fr-FR", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
              <div className={styles.reviewActions}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => startEdit(r)}
                >
                  Modifier
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() =>
                    setDeleteTarget({ id: r.id, name: r.authorName })
                  }
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
          {reviews.length === 0 && (
            <p className="text-muted">Aucun avis pour l'instant.</p>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Supprimer l'avis"
        message={`Êtes-vous sûr de vouloir supprimer l'avis de ${deleteTarget?.name} ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={() => {
          if (deleteTarget) deleteMut.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
