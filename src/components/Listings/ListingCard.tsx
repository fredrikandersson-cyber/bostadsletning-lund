import { useState } from 'react';
import type { Listing, ApplicationStatus } from '../../types';
import { useApplicationsStore } from '../../store/applicationsStore';
import { getFallbackImage } from '../../data/lundImages';

const SOURCE_LABELS: Record<string, { label: string; dot: string }> = {
  blocket:       { label: 'Blocket',       dot: 'bg-orange-500' },
  bostadsportal: { label: 'Bostadsportal', dot: 'bg-violet-500' },
  qasa:          { label: 'Qasa',          dot: 'bg-teal-500' },
  hyresratter:   { label: 'Hyresrätter',   dot: 'bg-pink-500' },
  lkf:           { label: 'LKF',           dot: 'bg-blue-500' },
  afbostader:    { label: 'AF Bostäder',   dot: 'bg-indigo-500' },
  facebook:      { label: 'Facebook',      dot: 'bg-blue-400' },
};

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; bg: string; text: string }> = {
  interested: { label: 'Intressant', bg: 'bg-amber-100',  text: 'text-amber-800' },
  applied:    { label: 'Ansökt',     bg: 'bg-sky-100',    text: 'text-sky-800' },
  viewed:     { label: 'Visning',    bg: 'bg-violet-100', text: 'text-violet-800' },
  rejected:   { label: 'Nekad',      bg: 'bg-red-100',    text: 'text-red-700' },
  accepted:   { label: 'Accepterad', bg: 'bg-emerald-100', text: 'text-emerald-800' },
};

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const { getApplicationForListing, addApplication, updateApplicationStatus, updateApplicationNotes, removeApplication } =
    useApplicationsStore();

  const application = getApplicationForListing(listing.id);
  const src = SOURCE_LABELS[listing.source] ?? { label: listing.source, dot: 'bg-gray-400' };
  const img = listing.imageUrl || getFallbackImage(listing.id);

  const daysAgo = Math.floor((Date.now() - new Date(listing.listedAt).getTime()) / 86_400_000);
  const isNew = daysAgo === 0;

  const handleStatus = async (status: ApplicationStatus) => {
    setSaving(true);
    try {
      if (application) {
        application.status === status
          ? await removeApplication(application.id)
          : await updateApplicationStatus(application.id, status);
      } else {
        await addApplication(listing.id, status);
      }
    } finally { setSaving(false); }
  };

  const handleSaveNotes = async () => {
    if (!application) return;
    setSaving(true);
    await updateApplicationNotes(application.id, notes);
    setSaving(false);
    setShowNotes(false);
  };

  const statusCfg = application ? STATUS_CONFIG[application.status] : null;

  return (
    <article className={`group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col border ${
      application?.status === 'accepted' ? 'border-emerald-300 ring-1 ring-emerald-200' :
      application?.status === 'rejected' ? 'border-gray-200 opacity-55' :
      'border-gray-100 hover:border-gray-200'
    }`}>

      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={img}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="eager"
          onError={(e) => { (e.target as HTMLImageElement).src = getFallbackImage(listing.id + '_fallback'); }}
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
            <span className={`w-1.5 h-1.5 rounded-full ${src.dot}`} />
            {src.label}
          </span>
          {isNew && (
            <span className="bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
              Ny idag
            </span>
          )}
        </div>

        {/* Application status badge */}
        {statusCfg && (
          <div className="absolute top-3 right-3">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusCfg.bg} ${statusCfg.text} shadow-sm`}>
              {statusCfg.label}
            </span>
          </div>
        )}

        {/* Bottom price overlay */}
        <div className="absolute bottom-3 left-3">
          <span className="bg-white/95 backdrop-blur-sm text-gray-900 font-bold text-sm px-3 py-1.5 rounded-full shadow-sm">
            {listing.price.toLocaleString('sv-SE')} kr/mån
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-3">

        {/* Address */}
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1">
            {listing.address}
          </h3>
          {listing.title !== listing.address && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{listing.title}</p>
          )}
        </div>

        {/* Specs row */}
        <div className="flex items-center gap-3 text-xs text-gray-600">
          {listing.rooms && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {listing.rooms} rum
            </span>
          )}
          {listing.area && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              {listing.area} m²
            </span>
          )}
          <span className="flex items-center gap-1 ml-auto text-gray-400">
            {daysAgo === 0 ? 'Idag' : daysAgo === 1 ? 'Igår' : `${daysAgo}d sedan`}
          </span>
        </div>

        {/* Feature tags */}
        {(listing.petFriendly || listing.hasFurnished || listing.hasBalcony) && (
          <div className="flex flex-wrap gap-1.5">
            {listing.petFriendly && (
              <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-100">Husdjur</span>
            )}
            {listing.hasFurnished && (
              <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-md border border-violet-100">Möblerad</span>
            )}
            {listing.hasBalcony && (
              <span className="text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md border border-sky-100">Balkong</span>
            )}
          </div>
        )}

        {/* Notes */}
        {application?.notes && !showNotes && (
          <p className="text-xs text-gray-500 italic bg-gray-50 rounded-lg p-2 line-clamp-2 border border-gray-100">
            „{application.notes}"
          </p>
        )}
        {showNotes && (
          <div>
            <textarea
              defaultValue={application?.notes || ''}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full text-xs border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="Anteckningar..."
              autoFocus
            />
            <div className="flex gap-2 mt-1.5">
              <button onClick={handleSaveNotes} disabled={saving || !application}
                className="text-xs bg-gray-900 text-white px-3 py-1 rounded-lg hover:bg-gray-700 disabled:opacity-40 transition">
                Spara
              </button>
              <button onClick={() => setShowNotes(false)}
                className="text-xs text-gray-500 px-3 py-1 rounded-lg hover:bg-gray-100 transition">
                Avbryt
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto pt-3 border-t border-gray-50 space-y-2">
          <div className="grid grid-cols-3 gap-1">
            {(['interested', 'applied', 'viewed'] as ApplicationStatus[]).map(s => {
              const cfg = STATUS_CONFIG[s];
              const active = application?.status === s;
              return (
                <button key={s} onClick={() => handleStatus(s)} disabled={saving}
                  className={`text-xs py-1.5 rounded-lg font-medium transition ${
                    active
                      ? `${cfg.bg} ${cfg.text} border border-current/20`
                      : 'text-gray-500 hover:bg-gray-50 border border-gray-100 hover:border-gray-200'
                  }`}>
                  {cfg.label}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-1">
            {(['rejected', 'accepted'] as ApplicationStatus[]).map(s => {
              const cfg = STATUS_CONFIG[s];
              const active = application?.status === s;
              return (
                <button key={s} onClick={() => handleStatus(s)} disabled={saving}
                  className={`text-xs py-1.5 rounded-lg font-medium transition ${
                    active
                      ? `${cfg.bg} ${cfg.text} border border-current/20`
                      : 'text-gray-500 hover:bg-gray-50 border border-gray-100 hover:border-gray-200'
                  }`}>
                  {cfg.label}
                </button>
              );
            })}
            {application && (
              <button onClick={() => { setShowNotes(!showNotes); if (!notes && application.notes) setNotes(application.notes); }}
                className="text-xs py-1.5 rounded-lg text-gray-500 hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition">
                Notera
              </button>
            )}
          </div>
          <a href={listing.url} target="_blank" rel="noopener noreferrer"
            className="block w-full text-center text-xs font-medium text-gray-900 py-2 rounded-lg border border-gray-200 hover:bg-gray-900 hover:text-white transition-all">
            Visa annons →
          </a>
        </div>
      </div>
    </article>
  );
}
