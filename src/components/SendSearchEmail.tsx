import { useState } from 'react';
import type { FilterValues } from './Listings/FilterPanel';

interface Listing {
  id: string;
  title: string;
  price: number;
  rooms?: number;
  area?: number;
  pricePerSqm?: number;
  furnished?: boolean;
  petFriendly?: boolean;
  imageUrl?: string;
  url: string;
  source: string;
  priority?: number;
  reason?: string;
  highlights?: string[];
}

interface AnalysisResult {
  listings: Listing[];
  summary: string;
  topRecommendation?: string;
}

interface Props {
  filters: FilterValues;
}

async function fetchRealListings(filters: FilterValues): Promise<Listing[]> {
  const params = new URLSearchParams({
    minPrice:       String(filters.minPrice),
    maxPrice:       String(filters.maxPrice),
    minRooms:       String(filters.minRooms),
    maxRooms:       String(filters.maxRooms),
    minArea:        String(filters.minArea),
    maxArea:        String(filters.maxArea),
    maxPricePerSqm: String(filters.maxPricePerSqm || 0),
    furnished:      String(filters.furnished),
    petFriendly:    String(filters.petFriendly),
    leaseType:      filters.leaseType || 'all',
    availableFrom:  filters.availableFrom || '',
    selectedAreas:  (filters.selectedAreas || []).join(','),
  });

  const res = await fetch(`/api/listings?${params.toString()}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  return data.listings || [];
}

async function analyzeListingsWithAI(listings: Listing[], filters: FilterValues): Promise<AnalysisResult> {
  try {
    const res = await fetch('/api/analyze-listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listings, filters }),
    });
    if (!res.ok) throw new Error(`Analysis API error ${res.status}`);
    const data = await res.json();
    return {
      listings: data.listings || listings,
      summary: data.summary || '',
      topRecommendation: data.topRecommendation,
    };
  } catch (err) {
    console.warn('AI analysis failed, using basic priority:', err);
    // Fallback: return listings with basic priority
    return {
      listings: listings.map((l, i) => ({
        ...l,
        priority: i + 1,
        reason: 'Sorterad efter nyaste först',
        highlights: [],
      })),
      summary: `Hittade ${listings.length} bostäder (AI-analys ej tillgänglig)`,
    };
  }
}

function buildEmailBody(filters: FilterValues, listings: Listing[], aiSummary?: string, topRecommendation?: string): string {
  const { minPrice, maxPrice, minRooms, maxRooms, petFriendly, furnished, selectedAreas } = filters;

  const criteria = [
    `💰 Hyra: ${minPrice > 0 ? `${minPrice.toLocaleString('sv-SE')}–` : 'upp till '}${maxPrice.toLocaleString('sv-SE')} kr/mån`,
    `🏠 Rum: ${minRooms === maxRooms ? `${minRooms} rum` : `${minRooms}–${maxRooms} rum`}`,
    selectedAreas.length > 0 ? `📍 Områden: ${selectedAreas.join(', ')}` : '📍 Område: Hela Lund',
    petFriendly ? '🐾 Husdjur OK' : null,
    furnished ? '🛋️ Möblerad' : null,
  ].filter(Boolean).join('\n');

  const listingRows = listings.slice(0, 20).map((l) => {
    const rooms = l.rooms ? `${l.rooms} rum` : '';
    const area = l.area ? `${l.area} m²` : '';
    const size = [rooms, area].filter(Boolean).join(', ');
    const tags = [
      l.furnished ? '🛋️ Möblerad' : null,
      l.petFriendly ? '🐾 Husdjur' : null,
    ].filter(Boolean).join(' ');

    const priorityBadge = l.priority ? `[#${l.priority}]` : '';
    const reasonText = l.reason ? `\n   ℹ️ ${l.reason}` : '';

    return `${priorityBadge} ${l.title}
   💰 ${l.price.toLocaleString('sv-SE')} kr/mån${size ? ` · ${size}` : ''}${tags ? ` · ${tags}` : ''}${reasonText}
   👉 ${l.url}`;
  }).join('\n\n');

  const aiSection = aiSummary ? `
AI-ANALYS
${aiSummary}
${topRecommendation ? `\n🌟 TOPPREKOMMENDATION:\n${topRecommendation}\n` : ''}
` : '';

  return `Hej!

Jag har hittat ${listings.length} bostäder i Lund som matchar dina krav. Här är de ${Math.min(listings.length, 20)} bästa enligt AI-prioritering:

DINA SÖKKRITERIER
${criteria}
${aiSection}
MATCHANDE BOSTÄDER (PRIORITERADE)
${listingRows}

${listings.length > 20 ? `...och ${listings.length - 20} till. Sök själv på:\nhttps://qasa.com/se/sv/search?area=se%2Flund\n` : ''}

TIPS
• Klicka på länkarna för att se fullständig annons med bilder
• Skapa konto på Qasa för att kontakta hyresvärden direkt
• Kolla även: afbostader.se, lkf.se, bostadsportal.se

Lycka till! 🏠

---
Skickat från Hitta boende i Lund
https://bostadsletning-lund.vercel.app`;
}

export function SendSearchEmail({ filters }: Props) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [topRecommendation, setTopRecommendation] = useState<string>('');

  const handleOpen = async () => {
    setShowModal(true);
    setLoading(true);
    setError(null);
    setAiSummary('');
    setTopRecommendation('');
    try {
      // Fetch real listings
      const results = await fetchRealListings(filters);
      setListings(results);

      if (results.length > 0) {
        // Analyze with AI
        const analysis = await analyzeListingsWithAI(results, filters);
        setListings(analysis.listings);
        setAiSummary(analysis.summary);
        setTopRecommendation(analysis.topRecommendation || '');
      }
    } catch (err) {
      setError('Kunde inte hämta listningar just nu');
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const emailBody = buildEmailBody(filters, listings, aiSummary, topRecommendation);
  const subject = `${listings.length} bostäder i Lund matchar dina krav`;

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
        onClick={handleOpen}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1c2b3a] text-white rounded-xl font-medium text-sm hover:bg-[#2a3f57] transition-colors shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Skicka matchande bostäder via email
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Skicka matchande bostäder</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Riktiga annonser baserade på dina filter</p>
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
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-600">
                  💰 {filters.minPrice > 0 ? `${filters.minPrice.toLocaleString('sv-SE')}–` : ''}
                  {filters.maxPrice.toLocaleString('sv-SE')} kr/mån
                </span>
                <span className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-600">
                  🏠 {filters.minRooms}–{filters.maxRooms} rum
                </span>
                {filters.furnished && <span className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-600">🛋️ Möblerad</span>}
                {filters.petFriendly && <span className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-600">🐾 Husdjur</span>}
              </div>
            </div>

            {/* Listings preview */}
            <div className="px-6 py-4 border-b border-gray-100">
              {loading && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                    <p className="text-sm text-gray-500">Hämtar matchande bostäder från Qasa...</p>
                  </div>
                  <p className="text-xs text-gray-400 px-2">Analyserar med AI...</p>
                </div>
              )}

              {error && (
                <div className="py-3 text-sm text-red-500">{error}</div>
              )}

              {!loading && !error && listings.length > 0 && (
                <>
                  {aiSummary && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <p className="text-xs font-semibold text-blue-900 mb-1">🤖 AI-ANALYS</p>
                      <p className="text-xs text-blue-800">{aiSummary}</p>
                    </div>
                  )}

                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                    {listings.length} matchande bostäder (sorterade efter relevans)
                  </p>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {listings.slice(0, 10).map(listing => (
                      <div key={listing.id} className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                        {listing.imageUrl && (
                          <img src={listing.imageUrl} alt="" className="w-10 h-10 rounded object-cover shrink-0 flex-none" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2 mb-0.5">
                            {listing.priority && (
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                listing.priority === 1 ? 'bg-emerald-100 text-emerald-700' :
                                listing.priority === 2 ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                #{listing.priority}
                              </span>
                            )}
                            <p className="text-xs font-medium text-gray-900 truncate">{listing.title}</p>
                          </div>
                          <p className="text-xs text-gray-500 mb-1">
                            {listing.price.toLocaleString('sv-SE')} kr/mån
                            {listing.rooms ? ` · ${listing.rooms} rum` : ''}
                            {listing.area ? ` · ${listing.area} m²` : ''}
                          </p>
                          {listing.highlights && listing.highlights.length > 0 && (
                            <p className="text-xs text-gray-600">{listing.highlights.join(' ')}</p>
                          )}
                          {listing.reason && (
                            <p className="text-xs text-gray-500 italic">ℹ️ {listing.reason}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {listings.length > 10 && (
                      <p className="text-xs text-gray-400 text-center py-1">...och {listings.length - 10} till i emailet</p>
                    )}
                  </div>
                </>
              )}

              {!loading && !error && listings.length === 0 && (
                <p className="text-sm text-gray-500 py-3">Inga bostäder hittades med dessa filter. Prova att bredda sökningen.</p>
              )}
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
                  disabled={!recipientEmail || loading || listings.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1c2b3a] text-white rounded-xl text-sm font-medium hover:bg-[#2a3f57] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Öppna i email-klient
                </button>

                <button
                  onClick={handleCopy}
                  disabled={loading || listings.length === 0}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
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
