import type { MediaContext } from "../schemas/media";

export type MediaType = "IMAGE" | "VIDEO" | "DOCUMENT";
export type MediaRole = "REGULAR" | "THUMBNAIL" | "PLAN";
export type SingletonMediaRole = Exclude<MediaRole, "REGULAR">;

export default interface Media {
  id: string;
  file_path: string;
  mime_type: string;
  size_bytes: number;
  caption: string | null;
  context: MediaContext;
  context_id: string | null;
  role: MediaRole;
  type: MediaType;
  display_order: number;
  created_at: Date;
}
