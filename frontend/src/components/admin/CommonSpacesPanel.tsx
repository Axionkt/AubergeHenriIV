import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import api from "../../lib/axios";
import { keys } from "../../lib/query";
import { getApiErrorMessage } from "../../lib/apiError";
import styles from "./Admin.module.css";
import AdminMediaChip from "./AdminMediaChip";
import {
  AdminMediaItem,
  AdminMediaListItem,
  MediaItem,
  NewAdminMediaItem,
} from "../../types/media";

export default function CommonSpacesPanel() {
  const qc = useQueryClient();

  const [markedMediaUids, setMarkedMediaUids] = useState<Set<string>>(
    new Set(),
  );
  const [mediaItems, setMediaItems] = useState<AdminMediaListItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const mediaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (msg?.type !== "success") return;
    const t = setTimeout(() => setMsg(null), 3000);
    return () => clearTimeout(t);
  }, [msg]);

  const {
    data: existingMedia,
    isLoading,
    isError,
  } = useQuery<AdminMediaItem[]>({
    queryKey: keys.commonSpaces(),
    queryFn: () =>
      api
        .get<{ media: AdminMediaItem[] }>("/admin/common-spaces/media")
        .then((r) => r.data.media),
  });

  useEffect(() => {
    if (!existingMedia) return;
    if (existingMedia.length === 0) {
      setMediaItems((prev) => prev.filter((m) => m.kind === "new"));
      return;
    }

    const media = existingMedia;
    let cancelled = false;
    const urls: string[] = [];

    async function load() {
      const items: AdminMediaListItem[] = await Promise.all(
        media.map(async (item) => {
          const res = await api.get(item.url, { responseType: "blob" });
          const objectUrl = URL.createObjectURL(res.data);
          urls.push(objectUrl);
          return { ...item, kind: "existing", uid: item.id, url: objectUrl };
        }),
      );

      if (cancelled) return;

      setMediaItems((prev) => {
        const newItems = prev.filter((m) => m.kind === "new");
        return [...items, ...newItems];
      });
    }

    load();

    return () => {
      cancelled = true;
      urls.forEach(URL.revokeObjectURL);
    };
  }, [existingMedia]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function toggleMarkMedia(uid: string) {
    setMarkedMediaUids((prev) => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setMediaItems((items) => {
      const oldIndex = items.findIndex((i) => i.uid === active.id);
      const newIndex = items.findIndex((i) => i.uid === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    try {
      const existingMarkedIds = mediaItems
        .filter(
          (item) => item.kind === "existing" && markedMediaUids.has(item.uid),
        )
        .map((item) => item.id);
      if (existingMarkedIds.length > 0) {
        await api.delete("/admin/media/common-space", {
          data: { mediaIds: existingMarkedIds },
        });
      }

      const newFiles = mediaItems
        .filter(
          (m): m is NewAdminMediaItem =>
            m.kind === "new" && !markedMediaUids.has(m.uid),
        )
        .map((m) => m.file);

      let uploadedIds: string[] = [];
      if (newFiles.length > 0) {
        const fd = new FormData();
        newFiles.forEach((file) => fd.append("files", file));
        const res = await api.post<MediaItem[]>(
          "/admin/media/common-space",
          fd,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        uploadedIds = res.data.map((m) => m.id);
      }

      const finalMediaIds: string[] = [];
      let uploadIndex = 0;
      for (const item of mediaItems) {
        if (markedMediaUids.has(item.uid)) continue;
        if (item.kind === "existing") {
          finalMediaIds.push(item.id);
        } else {
          finalMediaIds.push(uploadedIds[uploadIndex]);
          uploadIndex++;
        }
      }

      if (finalMediaIds.length > 0) {
        await api.put("/admin/media/common-space/reorder", {
          mediaIds: finalMediaIds,
        });
      }

      await qc.invalidateQueries({ queryKey: keys.commonSpaces() });
      setMarkedMediaUids(new Set());
      setMediaItems((prev) => prev.filter((m) => m.kind !== "new"));

      setMsg({ type: "success", text: "Modifications enregistrées." });
    } catch (err) {
      setMsg({
        type: "error",
        text: getApiErrorMessage(err, "Une erreur est survenue."),
      });
    } finally {
      setSaving(false);
    }
  }

  const newCount = mediaItems.filter((m) => m.kind === "new").length;

  return (
    <>
      <div className={styles.panelHead}>
        <div>
          <p className="section-eyebrow">Administration</p>
          <h2>Espaces communs</h2>
        </div>
      </div>

      {isError && (
        <p className="msg-error" style={{ marginBottom: 16 }}>
          Impossible de charger les médias des espaces communs.
        </p>
      )}

      <div className={styles.mediaSection}>
        <h4>
          Médias
          {!isLoading && mediaItems.length === 0 && (
            <span className={styles.noMedia}>
              {" "}
              · Aucun média pour les espaces communs
            </span>
          )}
          {newCount > 0 && (
            <span className={styles.addedCount}>
              {" "}
              · {newCount} fichier{newCount > 1 ? "s" : ""} sélectionné
              {newCount > 1 ? "s" : ""}
            </span>
          )}
          {markedMediaUids.size > 0 && (
            <span className={styles.deleteCount}>
              {" "}
              · {markedMediaUids.size} marqué
              {markedMediaUids.size > 1 ? "s" : ""} pour suppression
            </span>
          )}
        </h4>

        <div className={styles.mediaChipGridLarge}>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`skeleton ${styles.mediaChipSkeleton}`} />
            ))
          ) : (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={mediaItems.map((m) => m.uid)}
                  strategy={rectSortingStrategy}
                >
                  {mediaItems.map((item, idx) => (
                    <AdminMediaChip
                      key={item.uid}
                      item={item}
                      index={idx}
                      marked={markedMediaUids.has(item.uid)}
                      onToggle={() => toggleMarkMedia(item.uid)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              <button
                type="button"
                className={styles.mediaChipAdd}
                onClick={() => mediaRef.current?.click()}
              >
                <span className={styles.mediaChipAddIcon}>+</span>
                <span className={styles.mediaChipAddLabel}>Ajouter</span>
                <input
                  ref={mediaRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    const newItems: NewAdminMediaItem[] = files.map((file) => ({
                      kind: "new",
                      uid: crypto.randomUUID(),
                      id: crypto.randomUUID(),
                      type: file.type.startsWith("video/") ? "video" : "image",
                      url: URL.createObjectURL(file),
                      file,
                    }));
                    setMediaItems((prev) => [...prev, ...newItems]);
                    e.target.value = "";
                  }}
                />
              </button>
            </>
          )}
        </div>
      </div>

      {msg && (
        <p
          className={msg.type === "error" ? "msg-error" : "msg-success"}
          style={{ marginTop: 16 }}
        >
          {msg.text}
        </p>
      )}

      <div className={styles.editActions}>
        <button
          className="btn btn-primary"
          disabled={saving}
          onClick={handleSave}
          type="button"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </>
  );
}
