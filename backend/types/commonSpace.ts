import { AdminMediaItem, MediaItem } from "./media";

export interface CommonSpaceMediaDTO<T = MediaItem | AdminMediaItem> {
  media: T[];
}
