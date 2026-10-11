// Apartment access
export interface UserApartment {
  apartmentId: string;
  apartmentName: string;
  apartmentThumbnailUrl: string | null;
  accessExpiry: string | null; // ISO date string
}

export interface UserApartmentAccess {
  userId: string;
  firstName: string;
  lastName: string;
  apartmentId: string;
  apartmentName: string;
  accessExpiry: string | null; // ISO date string
}

// ProSpace access
export interface UserProSpace {
  proSpaceId: string;
  proSpaceName: string;
  proSpaceThumbnailUrl: string | null;
  accessExpiry: string | null; // ISO date string
}

export interface UserProSpaceAccess {
  userId: string;
  firstName: string;
  lastName: string;
  proSpaceId: string;
  proSpaceName: string;
  accessExpiry: string | null; // ISO date string
}
