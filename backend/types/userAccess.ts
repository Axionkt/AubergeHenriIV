// Apartment access
export interface UserApartmentAccessDTO {
  apartmentId: string;
  apartmentName: string;
  apartmentThumbnailUrl: string | null;
  accessExpiry: string | null; // ISO date string
}

export interface UserApartmentAccessAdminDTO {
  userId: string;
  firstName: string;
  lastName: string;
  apartmentId: string;
  apartmentName: string;
  accessExpiry: string | null; // ISO date string
}

// ProSpace access
export interface UserProSpaceAccessDTO {
  proSpaceId: string;
  proSpaceName: string;
  proSpaceThumbnailUrl: string | null;
  accessExpiry: string | null; // ISO date string
}

export interface UserProSpaceAccessAdminDTO {
  userId: string;
  firstName: string;
  lastName: string;
  proSpaceId: string;
  proSpaceName: string;
  accessExpiry: string | null; // ISO date string
}
