type MediaContext = "apartment" | "pro-space" | "common-space";
type MediaType = "image" | "video";

export default interface Media {
  id: string;
  file_path: string;
  mime_type: string;
  size_bytes: number;
  context: MediaContext;
  context_id: string | null;
  type: MediaType;
  is_thumbnail: boolean;
  display_order: number;
  caption: string | null;
  created_at: Date;
}
