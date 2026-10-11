import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Centralised query keys — prevents typos and makes invalidation easy
export const keys = {
  overview: () => ["overview"] as const,
  reviews: () => ["reviews"] as const,
  users: () => ["users"] as const,
  userApartmentAccesses: () => ["accesses", "apartment"] as const,
  userProfileApartmentAccesses: () =>
    ["accesses", "apartment", "profile"] as const,
  userProSpaceAccesses: () => ["accesses", "proSpace"] as const,
  userProfileProSpaceAccesses: () =>
    ["accesses", "proSpace", "profile"] as const,
  apartments: () => ["apartments"] as const,
  apartmentsAdmin: () => ["apartments", "admin"] as const,
  apartment: (id: string) => ["apartments", id] as const,
  apartmentAdmin: (id: string) => ["apartments", id, "admin"] as const,
  apartmentMedia: (id: string) => ["apartments", id, "media"] as const,
  apartmentMediaAdmin: (id: string) =>
    ["apartments", id, "media", "admin"] as const,
  proSpaces: () => ["proSpaces"] as const,
  proSpacesAdmin: () => ["proSpaces", "admin"] as const,
  proSpace: (id: string) => ["proSpaces", id] as const,
  proSpaceAdmin: (id: string) => ["proSpaces", id, "admin"] as const,
  proSpaceMedia: (id: string) => ["proSpaces", id, "media"] as const,
  proSpaceMediaAdmin: (id: string) =>
    ["proSpaces", id, "media", "admin"] as const,
  commonSpaces: () => ["commonSpaces"] as const,
} as const;
