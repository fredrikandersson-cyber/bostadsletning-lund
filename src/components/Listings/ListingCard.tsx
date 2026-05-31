import { useState } from 'react';
import type { Listing, ApplicationStatus } from '../../types';
import { useApplicationsStore } from '../../store/applicationsStore';

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  blocket:      { label: 'Blocket',      color: 'bg-orange-100 text-orange-700' },
  bostadsportal:{ label: 'Bostadsportal',color: 'bg-purple-100 text-purple-700' },
  qasa:         { label: 'Qasa',         color: 'bg-teal-100 text-teal-700' },
  hyresratter:  { label: 'Hyresrätter',  color: 'bg-pink-100 text-pink-700' },
  lkf:          { label: 'LKF',          color: 'bg-blue-100 text-blue-700' },
  afbostader:   { label: 'AF Bostäder',  color: 'bg-indigo-100 text-indigo-700' },
  facebook:     { label: 'Facebook',     color: 'bg-blue-100 text-blue-800' },
};

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string }> = {
  interested: { label: 'Intressant',  color: 'bg-yellow-100 text-yellow-700' },
  applied:    { label: 'Ansökt',      color: 'bg-blue-100 text-blue-700' },
  viewed:     { label: 'Visning',     color: 'bg-purple-100 text-purple-700' },
  rejected:   { label: 'Nekad',       color: 'bg-red-100 text-red-600' },
  accepted:   { label: 'Accepterad',  color: 'bg-green-100 text-green-700' },
};

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const {
    getApplicationForListing,
    addApplication,
    updateApplicationStatus,
    updateApplicationNotes,
    removeApplication,
  } = useApplicationsStore();

  const application = getApplicationForListing(listing.id);
  const sourceMeta = SOURCE_LABELS[listing.source] ?? { label: listing.source, color: 'bg-gray-100 text-gray-600' };

  const handleStatusChange = async (status: ApplicationStatus) => {
    try {
      setSaving(true);
      if (application) {
        if (application.status === status) {
          await removeApplication(application.id);
        } else {
          await updateApplicationStatus(application.id, status);
        }
      } else {
        await addApplication(listing.id, status);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!application) return;
    setSaving(true);
    await updateApplicationNotes(application.id, notes);
    setSaving(false);
    setShowNotes(false);
  };

  const daysAgo = Math.floor(
    (Date.now() - new Date(listing.listedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const isNew = daysAgo < 2;

  return (
    <div className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition flex flex-col ${
      application?.status === 'rejected' ? 'opacity-60' : ''
    } ${application?.status === 'accepted' ? 'ring-2 ring-green-400' : 'border-gray-200'}`}>

      {/* Image */}
      <div className="relative">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-44 object-cover rounded-t-xl"
          />
        ) : (
          <div className="w-full h-44 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-xl flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sourceMeta.color}`}>
            {sourceMeta.label}
          </span>
          {isNew && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-500 text-white">
              Ny!
            </span>
          )}
        </div>

        {/* Application status badge */}
        {application && (
          <div className="absolute top-2 right-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CONFIG[application.status].color}`}>
              {STATUS_CONFIG[application.status].label}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">
          {listing.title}
        </h3>

        <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{listing.address}</span>
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-sm mb-3">
          <span className="font-bold text-blue-700 text-base">
            {listing.price.toLocaleString('sv-SE')} kr
          </span>
          {listing.rooms && (
            <span className="text-gray-500 text-xs">{listing.rooms} rum</span>
          )}
          {listing.area && (
            <span className="text-gray-500 text-xs">{listing.area} m²</span>
          )}
        </div>

        {/* Flags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {listing.petFriendly && (
            <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
              Husdjur OK
            </span>
          )}
          {listing.hasFurnished && (
            <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full border border-violet-200">
              Möblerad
            </span>
          )}
          {listing.hasBalcony && (
            <span className="text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full border border-sky-200">
              Balkong
            </span>
          )}
        </div>

        {/* Date posted */}
        <p className="text-xs text-gray-400 mb-3">
          {daysAgo === 0 ? 'Idag' : daysAgo === 1 ? 'Igår' : `${daysAgo} dagar sedan`}
        </p>

        {/* Notes (if saved) */}
        {application?.notes && !showNotes && (
          <p className="text-xs text-gray-600 italic bg-gray-50 rounded p-2 mb-3 line-clamp-2">
            "{application.notes}"
          </p>
        )}

        {/* Notes input */}
        {showNotes && (
          <div className="mb-3">
            <textarea
              defaultValue={application?.notes || ''}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full text-xs border border-gray-300 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Dina anteckningar..."
            />
            <div className="flex gap-2 mt-1">
              <button
                onClick={handleSaveNotes}
                disabled={saving || !application}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:bg-gray-300 transition"
              >
                Spara
              </button>
              <button
                onClick={() => setShowNotes(false)}
                className="text-xs text-gray-500 px-3 py-1 rounded hover:bg-gray-100 transition"
              >
                Avbryt
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto pt-2 border-t border-gray-100 flex flex-col gap-2">
          {/* Status buttons */}
          <div className="flex gap-1">
            {(['interested', 'applied', 'viewed'] as ApplicationStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={saving}
                className={`flex-1 text-xs py-1.5 rounded-lg border transition ${
                  application?.status === status
                    ? `${STATUS_CONFIG[status].color} border-current font-medium`
                    : 'text-gray-500 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                {STATUS_CONFIG[status].label}
              </button>
            ))}
          </div>

          <div className="flex gap-1">
            {(['rejected', 'accepted'] as ApplicationStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={saving}
                className={`flex-1 text-xs py-1.5 rounded-lg border transition ${
                  application?.status === status
                    ? `${STATUS_CONFIG[status].color} border-current font-medium`
                    : 'text-gray-500 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                {STATUS_CONFIG[status].label}
              </button>
            ))}

            {application && (
              <button
                onClick={() => { setShowNotes(!showNotes); if (!notes && application.notes) setNotes(application.notes); }}
                className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 hover:bg-gray-50 transition"
              >
                Notera
              </button>
            )}
          </div>

          {/* View link */}
          <a
            href={listing.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center text-xs text-blue-600 hover:underline font-medium py-1"
          >
            Öppna annons →
          </a>
        </div>
      </div>
    </div>
  );
}
