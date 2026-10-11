import { MediaContext } from "../schemas/media";

export type MediaType = "image" | "video";

export interface MediaRow {
  id: string;
  filePath: string;
  mimeType: string;
  context: MediaContext;
}

export interface SavedFile {
  id: string;
  filePath: string;
  diskPath: string;
  oldFilePath: string | null;
}

export interface MediaItem {
  id: string;
  type: MediaType;
  url: string;
}

export interface AdminMediaItem extends MediaItem {
  sizeBytes: number;
  createdAt: string;
}
