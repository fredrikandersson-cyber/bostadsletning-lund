import { useEffect } from 'react';
import { useListingsStore } from '../store/listingsStore';
import { useApplicationsStore } from '../store/applicationsStore';
import { useAuthStore } from '../store/authStore';

export function Dashboard() {
  const { fetchListings, filteredListings, isLoading } = useListingsStore();
  const { fetchApplications } = useApplicationsStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchListings();
    fetchApplications();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Laddar bostäder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Bostadsletning i Lund</h1>
        <p className="text-gray-600 mt-2">Välkommen, {user?.fullName}!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredListings.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">Inga bostäder hittades. Prova att ändra dina filter.</p>
          </div>
        ) : (
          filteredListings.map((listing) => (
            <div key={listing.id} className="bg-white rounded-lg shadow hover:shadow-lg transition border border-gray-200">
              {listing.imageUrl && (
                <img
                  src={listing.imageUrl}
                  alt={listing.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              )}
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{listing.title}</h2>
                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <p className="font-semibold text-blue-600">{listing.price.toLocaleString('sv-SE')} kr/mån</p>
                  {listing.rooms && <p>{listing.rooms} rum</p>}
                  {listing.area && <p>{listing.area} m²</p>}
                  <p className="text-xs text-gray-500">{listing.address}</p>
                </div>
                <a
                  href={listing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm font-medium"
                >
                  Visa annons →
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
