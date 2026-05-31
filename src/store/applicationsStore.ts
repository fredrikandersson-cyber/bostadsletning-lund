import { create } from 'zustand';
import { Application, ApplicationStatus } from '../types';

interface ApplicationsState {
  applications: Application[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setApplications: (apps: Application[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Methods
  fetchApplications: () => Promise<void>;
  addApplication: (listingId: string, status: ApplicationStatus) => Promise<void>;
  updateApplicationStatus: (applicationId: string, status: ApplicationStatus, notes?: string) => Promise<void>;
  updateApplicationNotes: (applicationId: string, notes: string) => Promise<void>;
  removeApplication: (applicationId: string) => Promise<void>;
  getApplicationForListing: (listingId: string) => Application | undefined;
}

export const useApplicationsStore = create<ApplicationsState>((set, get) => ({
  applications: [],
  isLoading: false,
  error: null,

  setApplications: (applications) => set({ applications }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  fetchApplications: async () => {
    try {
      set({ isLoading: true, error: null });
      const token = localStorage.getItem('token');

      const response = await fetch('/api/routes/applications', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      set({ applications: data.applications });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch applications';
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  addApplication: async (listingId, status) => {
    try {
      set({ error: null });
      const token = localStorage.getItem('token');

      const response = await fetch('/api/routes/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ listingId, status }),
      });

      if (!response.ok) {
        throw new Error('Failed to add application');
      }

      const data = await response.json();
      const current = get().applications;
      set({ applications: [data.application, ...current] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add application';
      set({ error: message });
      throw error;
    }
  },

  updateApplicationStatus: async (applicationId, status, notes) => {
    try {
      set({ error: null });
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/routes/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, notes }),
      });

      if (!response.ok) {
        throw new Error('Failed to update application');
      }

      const data = await response.json();
      const updated = get().applications.map((app) =>
        app.id === applicationId ? data.application : app
      );
      set({ applications: updated });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update application';
      set({ error: message });
      throw error;
    }
  },

  updateApplicationNotes: async (applicationId, notes) => {
    try {
      set({ error: null });
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/routes/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        throw new Error('Failed to update notes');
      }

      const data = await response.json();
      const updated = get().applications.map((app) =>
        app.id === applicationId ? data.application : app
      );
      set({ applications: updated });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update notes';
      set({ error: message });
      throw error;
    }
  },

  removeApplication: async (applicationId) => {
    try {
      set({ error: null });
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/routes/applications/${applicationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to remove application');
      }

      const updated = get().applications.filter((app) => app.id !== applicationId);
      set({ applications: updated });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove application';
      set({ error: message });
      throw error;
    }
  },

  getApplicationForListing: (listingId) => {
    return get().applications.find((app) => app.listingId === listingId);
  },
}));
