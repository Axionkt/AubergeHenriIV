export type MediaContext = "apartment" | "common-space";
export type MediaType = "image" | "video";

export interface MediaItem {
  id: string;
  type: MediaType;
  url: string;
}

export interface AdminMediaItem extends MediaItem {
  sizeBytes: number;
  createdAt: string;
}

// For UI only within complex media upload logic
export type AdminMediaListItem = ExistingAdminMediaItem | NewAdminMediaItem;

export interface ExistingAdminMediaItem extends AdminMediaItem {
  kind: "existing";
  uid: string;
}

export interface NewAdminMediaItem {
  kind: "new";
  uid: string;

  id: string;
  type: MediaType;
  url: string;

  file: File;
}
