export interface CommonSpaceDTO {
  id: string;
  name: string;
  description: string;
  photoCount: number;
  videoCount: number;
  thumbnailUrl: string | null;
}

export interface AdminCommonSpaceDTO extends CommonSpaceDTO {
  createdAt: Date;
  updatedAt: Date;
}

export interface MutateCommonSpaceDTO {
  name: string;
  description: string;
}

export interface MutateCommonSpaceForm {
  id?: string; // optional for creation, required for editing
  name: string;
  description: string;
  thumbnailUrl: string | null;
}
