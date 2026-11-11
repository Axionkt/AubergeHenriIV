import { MediaContext } from "../schemas/media";
import { MediaType } from "../models/Media";
import type Media from "../models/Media";

export type MediaRecord = Pick<
  Media,
  "file_path" | "mime_type" | "role" | "context" | "context_id"
>;

export type ResourceSingleton = {
  id: string;
  type: MediaType;
};

export type MediaCount = {
  context: MediaContext;
  contextId: string;
  numImages: number;
  numVideos: number;
};

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
