import { create } from 'zustand';
import type { Listing, SearchFilter } from '../types';

interface ListingsState {
  listings: Listing[];
  filteredListings: Listing[];
  isLoading: boolean;
  error: string | null;
  currentFilter: Partial<SearchFilter> | null;

  // Actions
  setListings: (listings: Listing[]) => void;
  addListing: (listing: Listing) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Fetch methods
  fetchListings: () => Promise<void>;
  searchListings: (filter: Partial<SearchFilter>) => void;
  filterByArea: (areas: string[]) => void;
  filterByPrice: (minPrice: number, maxPrice: number) => void;
  filterByRooms: (minRooms: number, maxRooms: number) => void;
  clearFilters: () => void;
}

export const useListingsStore = create<ListingsState>((set, get) => ({
  listings: [],
  filteredListings: [],
  isLoading: false,
  error: null,
  currentFilter: null,

  setListings: (listings) => set({ listings }),
  addListing: (listing) => {
    const current = get().listings;
    const exists = current.some((l) => l.externalId === listing.externalId && l.source === listing.source);
    if (!exists) {
      set({ listings: [listing, ...current] });
    }
  },
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  fetchListings: async () => {
    try {
      set({ isLoading: true, error: null });
      const token = localStorage.getItem('token');

      const response = await fetch('/api/routes/listings', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch listings');
      }

      const data = await response.json();
      set({ listings: data.listings, filteredListings: data.listings });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch listings';
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  searchListings: (filter) => {
    const listings = get().listings;
    const filtered = listings.filter((listing) => {
      if (filter.minPrice && listing.price < filter.minPrice) return false;
      if (filter.maxPrice && listing.price > filter.maxPrice) return false;
      if (filter.minRooms && listing.rooms && listing.rooms < filter.minRooms) return false;
      if (filter.maxRooms && listing.rooms && listing.rooms > filter.maxRooms) return false;
      if (filter.minArea && listing.area && listing.area < filter.minArea) return false;
      if (filter.maxArea && listing.area && listing.area > filter.maxArea) return false;
      if (filter.areas && filter.areas.length > 0) {
        // Simple area matching - could be improved with geohashing
        const match = filter.areas.some((area) =>
          listing.address.toLowerCase().includes(area.toLowerCase())
        );
        if (!match) return false;
      }
      if (filter.types && filter.types.length > 0) {
        if (!filter.types.includes(listing.type)) return false;
      }
      if (filter.petFriendly && !listing.petFriendly) return false;
      if (filter.furnished && !listing.hasFurnished) return false;
      return true;
    });

    set({ filteredListings: filtered, currentFilter: filter });
  },

  filterByArea: (areas) => {
    const current = get().currentFilter || {};
    get().searchListings({ ...current, areas });
  },

  filterByPrice: (minPrice, maxPrice) => {
    const current = get().currentFilter || {};
    get().searchListings({ ...current, minPrice, maxPrice });
  },

  filterByRooms: (minRooms, maxRooms) => {
    const current = get().currentFilter || {};
    get().searchListings({ ...current, minRooms, maxRooms });
  },

  clearFilters: () => {
    const listings = get().listings;
    set({ filteredListings: listings, currentFilter: null });
  },
}));
