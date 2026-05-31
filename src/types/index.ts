// User & Authentication
export interface User {
  id: string;
  email: string;
  fullName: string;
  familyId: string;
  role: 'parent' | 'family_member' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface Family {
  id: string;
  name: string;
  adminId: string;
  createdAt: Date;
  members?: User[];
}

export interface AuthContext {
  user: User | null;
  family: Family | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, fullName: string) => Promise<void>;
}

// Listings
export type ListingSource = 'hemnet' | 'blocket' | 'booli';
export type PropertyType = 'apartment' | 'house';
export type LandlordType = 'private' | 'company';
export type LeaseType = 'long_term' | 'short_term';

export interface Listing {
  id: string;
  externalId: string;
  source: ListingSource;
  title: string;
  description?: string;
  price: number;
  pricePerSqm?: number;
  rooms?: number;
  area?: number;
  address: string;
  latitude?: number;
  longitude?: number;
  type: PropertyType;
  landlordType: LandlordType;
  imageUrl?: string;
  url: string;
  availableFrom?: Date;
  leaseType: LeaseType;
  leaseLength?: number;
  hasKitchen?: boolean;
  hasFurnished?: boolean;
  hasBalcony?: boolean;
  petFriendly?: boolean;
  listedAt: Date;
  scrapedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Search Filters
export interface SearchFilter {
  id: string;
  userId: string;
  name: string;
  minPrice?: number;
  maxPrice?: number;
  minRooms?: number;
  maxRooms?: number;
  minArea?: number;
  maxArea?: number;
  areas: string[];
  types: PropertyType[];
  petFriendly?: boolean;
  furnished?: boolean;
  isActive: boolean;
  notifyNewListings: boolean;
  createdAt: Date;
}

// Applications
export type ApplicationStatus = 'interested' | 'applied' | 'viewed' | 'rejected' | 'accepted';

export interface Application {
  id: string;
  familyId: string;
  listingId: string;
  userWhoApplied: string;
  status: ApplicationStatus;
  appliedAt?: Date;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApplicationHistory {
  id: string;
  applicationId: string;
  changedBy: string;
  oldStatus?: ApplicationStatus;
  newStatus: ApplicationStatus;
  notes?: string;
  changedAt: Date;
}

// Notifications
export type EmailFrequency = 'realtime' | 'daily' | 'weekly' | 'none';

export interface NotificationPreferences {
  id: string;
  userId: string;
  emailFrequency: EmailFrequency;
  dailyDigestTime: string;
  notifyNewListings: boolean;
  notifyPriceDrop: boolean;
  notifyStatusChange: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Polling
export interface ApiPoll {
  id: string;
  source: ListingSource;
  status: 'success' | 'error' | 'rate_limited';
  listingsFound: number;
  newListings: number;
  errorMessage?: string;
  polledAt: Date;
  nextPollAt: Date;
}
