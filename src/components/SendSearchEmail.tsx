import { useState } from 'react';
import type { FilterValues } from './Listings/FilterPanel';

interface Props {
  filters: FilterValues;
}

function buildSearchLinks(filters: FilterValues): { name: string; url: string; description: string }[] {
  const { minPrice, maxPrice, minRooms, maxRooms } = filters;
  const links = [];

  // Qasa
  const qasaParams = new URLSearchParams();
  qasaParams.set('area', 'se/lund');
  if (minRooms > 1) qasaParams.set('minRooms', String(minRooms));
  if (maxRooms < 5) qasaParams.set('maxRooms', String(maxRooms));
  if (maxPrice < 20000) qasaParams.set('maxRent', String(maxPrice));
  if (minPrice > 0) qasaParams.set('minRent', String(minPrice));
  if (filters.furnished) qasaParams.set('furnished', 'true');
  links.push({
    name: 'Qasa',
    url: `https://qasa.com/se/sv/search?${qasaParams.toString()}`,
    description: 'Privata hyresvärdar, möblerade & omöblerade',
  });

  // AF Bostäder
  links.push({
    name: 'AF Bostäder',
    url: 'https://www.afbostader.se/lediga-bostader',
    description: 'Studentbostäder i Lund (kräver studentstatus)',
  });

  // LKF
  links.push({
    name: 'LKF',
    url: 'https://www.lkf.se/lediga-bostader',
    description: 'Kommunala hyresrätter i Lund',
  });

  // Bostadsportal
  const bpParams = new URLSearchParams();
  bpParams.set('municipality', 'lund');
  bpParams.set('type', 'apartment');
  bpParams.set('for_sale', 'false');
  if (maxPrice < 20000) bpParams.set('max_rent', String(maxPrice));
  if (minRooms > 1) bpParams.set('min_rooms', String(minRooms));
  links.push({
    name: 'Bostadsportal',
    url: `https://www.bostadsportal.se/search?${bpParams.toString()}`,
    description: 'Stor samling hyresrätter från olika hyresvärdar',
  });

  // Blocket
  const blocketParams = new URLSearchParams();
  blocketParams.set('area', 'skane');
  blocketParams.set('q', 'lund');
  blocketParams.set('sortby', 'date');
  if (maxPrice < 20000) blocketParams.set('price_max', String(maxPrice));
  if (minRooms > 1) blocketParams.set('rooms_min', String(minRooms));
  links.push({
    name: 'Blocket Bostad',
    url: `https://www.blocket.se/bostad/uthyres/lagenheter?${blocketParams.toString()}`,
    description: 'Andrahand & privata uthyrningar',
  });

  // Hyresrätter.se
  links.push({
    name: 'Hyresrätter.se',
    url: 'https://www.hyresratter.se/lediga-lagenheter/lund',
    description: 'Hyresrätter från olika fastighetsbolag',
  });

  return links;
}

function buildEmailBody(filters: FilterValues, links: ReturnType<typeof buildSearchLinks>): string {
  const { minPrice, maxPrice, minRooms, maxRooms, minArea, maxArea, petFriendly, furnished, selectedAreas } = filters;

  const criteria = [
    `💰 Hyra: ${minPrice > 0 ? `${minPrice.toLocaleString('sv-SE')}–` : 'upp till '}${maxPrice.toLocaleString('sv-SE')} kr/mån`,
    `🏠 Rum: ${minRooms === maxRooms ? `${minRooms} rum` : `${minRooms}–${maxRooms} rum`}`,
    minArea > 0 || maxArea < 150 ? `📐 Storlek: ${minArea > 0 ? `${minArea}–` : 'upp till '}${maxArea} m²` : null,
    selectedAreas.length > 0 ? `📍 Områden: ${selectedAreas.join(', ')}` : '📍 Område: Hela Lund',
    petFriendly ? '🐾 Husdjur OK' : null,
    furnished ? '🛋️ Möblerad' : null,
  ].filter(Boolean);

  const linkRows = links
    .map(l => `• ${l.name}\n  ${l.description}\n  👉 ${l.url}`)
    .join('\n\n');

  return `Hej!

Här är söklänkar till hyresbostäder i Lund som matchar dina krav:

DINA SÖKKRITERIER
${criteria.join('\n')}

SÖKLÄNKAR
${linkRows}

TIPS
• Skapa konto på Qasa och AF Bostäder för att få notiser om nya objekt
• LKF har kö – registrera dig tidigt!
• Kolla Blocket och Bostadsportal dagligen, nya annonser tillkommer hela tiden

Lycka till med bostadsletandet! 🏠

---
Skickat från Hitta boende i Lund
https://bostadsletning-lund.vercel.app`;
}

export function SendSearchEmail({ filters }: Props) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const links = buildSearchLinks(filters);
  const emailBody = buildEmailBody(filters, links);

  const subject = 'Bostäder i Lund – söklänkar matchade dina krav';

  const handleSendEmail = () => {
    const mailto = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailto, '_blank');
    setShowModal(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(emailBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1c2b3a] text-white rounded-xl font-medium text-sm hover:bg-[#2a3f57] transition-colors shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Skicka söklänkar via email
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Skicka söklänkar</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Email med direktlänkar baserade på dina filter</p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Filter summary */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Dina filter</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-600">
                  💰 {filters.minPrice > 0 ? `${filters.minPrice.toLocaleString('sv-SE')}–` : ''}
                  {filters.maxPrice.toLocaleString('sv-SE')} kr/mån
                </span>
                <span className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-600">
                  🏠 {filters.minRooms === filters.maxRooms ? `${filters.minRooms}` : `${filters.minRooms}–${filters.maxRooms}`} rum
                </span>
                {filters.selectedAreas.length > 0 && (
                  <span className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-600">
                    📍 {filters.selectedAreas.slice(0, 2).join(', ')}{filters.selectedAreas.length > 2 ? ` +${filters.selectedAreas.length - 2}` : ''}
                  </span>
                )}
                {filters.furnished && (
                  <span className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-600">🛋️ Möblerad</span>
                )}
                {filters.petFriendly && (
                  <span className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-600">🐾 Husdjur</span>
                )}
              </div>
            </div>

            {/* Links preview */}
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Inkluderade söklänkar</p>
              <div className="space-y-2">
                {links.map(link => (
                  <div key={link.name} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-gray-900">{link.name}</span>
                      <span className="text-xs text-gray-400 ml-2">{link.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Email input */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mottagarens email
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                  placeholder="dotter@exempel.se"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1c2b3a]"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSendEmail}
                  disabled={!recipientEmail}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1c2b3a] text-white rounded-xl text-sm font-medium hover:bg-[#2a3f57] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Öppna i email-klient
                </button>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Kopierat!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Kopiera text
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
