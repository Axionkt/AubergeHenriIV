import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import axios from "axios";
import api from "../lib/axios";
import { getApiErrorMessage } from "../lib/apiError";
import {
  AdminMediaItem,
  AdminMediaListItem,
  MediaItem,
  NewAdminMediaItem,
} from "../types/media";
import {
  BaseResourceForm,
  ResourceDetailsBase,
  ResourceEditConfig,
} from "../types/resourceEditForm";

type FieldErrors = Record<string, string>;

function extractFieldErrors(err: unknown): FieldErrors {
  if (!axios.isAxiosError(err)) return {};
  const errors = err.response?.data?.errors;
  if (!Array.isArray(errors)) return {};

  const result: FieldErrors = {};
  for (const e of errors) {
    if (
      typeof e?.path === "string" &&
      typeof e?.message === "string" &&
      !(e.path in result) // keep the first error per field
    ) {
      result[e.path] = e.message;
    }
  }
  return result;
}

export function useResourceEditForm<
  TDetails extends ResourceDetailsBase,
  TForm extends BaseResourceForm,
>(
  resourceId: string | null,
  config: ResourceEditConfig<TDetails, TForm>,
  onClose: () => void,
) {
  const qc = useQueryClient();

  const {
    data: resource,
    isLoading: isLoadingResource,
    isError: isErrorResource,
  } = useQuery<TDetails>({
    queryKey: resourceId ? config.queryKeys.detail(resourceId) : ["__new__"],
    queryFn: () =>
      api
        .get<TDetails>(config.api.detailUrl(resourceId as string))
        .then((r) => r.data),
    enabled: !!resourceId,
  });

  const [form, setForm] = useState<TForm>(config.emptyForm);
  const [formDirty, setFormDirty] = useState(false);
  const [newThumb, setNewThumb] = useState<File | null>(null);
  const [thumbPreviewSrc, setThumbPreviewSrc] = useState<string | null>(null);
  const [deleteThumbnail, setDeleteThumbnail] = useState(false);
  const [markedMediaUids, setMarkedMediaUids] = useState<Set<string>>(
    new Set(),
  );
  const [mediaItems, setMediaItems] = useState<AdminMediaListItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const thumbRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (resource) {
      setForm(config.toForm(resource));
      setFormDirty(false);
    }
  }, [resource]);

  useEffect(() => {
    if (!newThumb) {
      setThumbPreviewSrc(null);
      return;
    }
    const url = URL.createObjectURL(newThumb);
    setThumbPreviewSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [newThumb]);

  useEffect(() => {
    if (msg?.type !== "success") return;
    const t = setTimeout(() => setMsg(null), 3000);
    return () => clearTimeout(t);
  }, [msg]);

  const { data: existingMedia } = useQuery<AdminMediaItem[]>({
    queryKey: resourceId ? config.queryKeys.media(resourceId) : ["__new__"],
    queryFn: () =>
      api
        .get<{
          media: AdminMediaItem[];
        }>(config.api.mediaListUrl(resourceId as string))
        .then((r) => r.data.media),
    enabled: !!resourceId,
  });

  useEffect(() => {
    if (!existingMedia?.length) return;

    let cancelled = false;
    const objectUrls: string[] = [];

    async function load() {
      const items: AdminMediaListItem[] = await Promise.all(
        existingMedia!.map(async (item) => {
          const res = await api.get(item.url, { responseType: "blob" });
          const objectUrl = URL.createObjectURL(res.data);
          objectUrls.push(objectUrl);
          return {
            ...item,
            kind: "existing" as const,
            uid: item.id,
            url: objectUrl,
          };
        }),
      );

      if (cancelled) return;

      setMediaItems((prev) => [
        ...items,
        ...prev.filter((m) => m.kind === "new"),
      ]);
    }

    load();

    return () => {
      cancelled = true;
      objectUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [existingMedia]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function clearFieldError(k: keyof TForm) {
    setFieldErrors((prev) => {
      if (!((k as string) in prev)) return prev;
      const { [k as string]: _removed, ...rest } = prev;
      return rest;
    });
  }

  function setField(k: keyof TForm) {
    return (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setForm((f) => ({ ...f, [k]: e.target.value }));
      clearFieldError(k);
      if (!formDirty) setFormDirty(true);
    };
  }

  function setBool(k: keyof TForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [k]: e.target.checked }));
      clearFieldError(k);
      if (!formDirty) setFormDirty(true);
    };
  }

  function toggleMarkMedia(uid: string) {
    setMarkedMediaUids((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
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

  function handleThumbPick(file: File) {
    setNewThumb(file);
    setDeleteThumbnail(false);
  }

  function handleAddMediaFiles(files: File[]) {
    const newItems: NewAdminMediaItem[] = files.map((file) => ({
      kind: "new",
      uid: crypto.randomUUID(),
      id: crypto.randomUUID(),
      type: file.type.startsWith("video/") ? "video" : "image",
      url: URL.createObjectURL(file),
      file,
    }));
    setMediaItems((prev) => [...prev, ...newItems]);
  }

  async function uploadThumbnail(id: string, file: File) {
    const fd = new FormData();
    fd.append("thumbnail", file);
    await api.post(config.api.mediaThumbnailUrl(id), fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  async function handleSave() {
    setFieldErrors({});

    if (!form.name.trim()) {
      setFieldErrors({ name: config.copy.requiredNameError });
      setMsg({ type: "error", text: config.copy.requiredNameError });
      return;
    }

    setSaving(true);
    setMsg(null);

    try {
      if (resourceId) {
        if (formDirty) {
          await api.put(
            config.api.detailUrl(resourceId),
            config.toPayload(form),
          );
        }

        if (deleteThumbnail && !newThumb) {
          await api.delete(config.api.mediaThumbnailUrl(resourceId));
        }

        if (newThumb) {
          await uploadThumbnail(resourceId, newThumb);
        }

        const existingMarkedIds = mediaItems
          .filter(
            (item) => item.kind === "existing" && markedMediaUids.has(item.uid),
          )
          .map((item) => item.id);
        if (existingMarkedIds.length > 0) {
          await api.delete(config.api.mediaBulkUrl(resourceId), {
            data: { mediaIds: existingMarkedIds },
          });
        }

        const newFiles = mediaItems.filter(
          (m): m is NewAdminMediaItem =>
            m.kind === "new" && !markedMediaUids.has(m.uid),
        );

        let uploadedIds: string[] = [];
        if (newFiles.length > 0) {
          const fd = new FormData();
          newFiles.forEach((m) => fd.append("files", m.file));
          const res = await api.post<MediaItem[]>(
            config.api.mediaBulkUrl(resourceId),
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
          await api.put(config.api.mediaReorderUrl(resourceId), {
            mediaIds: finalMediaIds,
          });
        }
      } else {
        const payload = config.toPayload(form);
        const res = await api.post<string>(config.api.createUrl, payload);
        const newResourceId = res.data;

        if (newThumb) {
          try {
            await uploadThumbnail(newResourceId, newThumb);
          } catch (thumbErr) {
            await qc.invalidateQueries({
              queryKey: config.queryKeys.invalidateOnSave,
            });
            setMediaItems((prev) => prev.filter((m) => m.kind !== "new"));
            setMsg({
              type: "error",
              text: getApiErrorMessage(
                thumbErr,
                config.copy.createSuccessThumbnailFailed,
              ),
            });
            setTimeout(onClose, 1500);
            return;
          }
        }
      }

      await qc.invalidateQueries({
        queryKey: config.queryKeys.invalidateOnSave,
      });

      setMediaItems((prev) => prev.filter((m) => m.kind !== "new"));
      setMsg({
        type: "success",
        text: resourceId
          ? config.copy.updateSuccess
          : config.copy.createSuccess,
      });
      setTimeout(onClose, 900);
    } catch (err) {
      setFieldErrors(extractFieldErrors(err));
      setMsg({
        type: "error",
        text: getApiErrorMessage(err, config.copy.genericError),
      });
    } finally {
      setSaving(false);
    }
  }

  const thumbnailSrc = thumbPreviewSrc ?? resource?.thumbnailUrl ?? null;
  const showThumbnailDelete = !deleteThumbnail && !!thumbnailSrc;
  const newCount = mediaItems.filter((m) => m.kind === "new").length;

  return {
    resource,
    isLoadingResource,
    isErrorResource,
    form,
    setField,
    setBool,
    mediaItems,
    markedMediaUids,
    toggleMarkMedia,
    handleDragEnd,
    sensors,
    thumbRef,
    mediaRef,
    newThumb,
    setNewThumb,
    deleteThumbnail,
    setDeleteThumbnail,
    handleThumbPick,
    handleAddMediaFiles,
    thumbnailSrc,
    showThumbnailDelete,
    newCount,
    saving,
    msg,
    fieldErrors,
    handleSave,
  };
}
