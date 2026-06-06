import { useState, useMemo, useEffect } from 'react';
import { FilterPanel } from '../components/Listings/FilterPanel';
import type { FilterValues } from '../components/Listings/FilterPanel';
import { ListingCard } from '../components/Listings/ListingCard';
import { SourcesPanel } from '../components/SourcesPanel';
import { AreasGuide } from '../components/AreasGuide';
import { EmailSubscribe } from '../components/EmailSubscribe';
import { IntegrationStatus } from '../components/IntegrationStatus';
import { SendSearchEmail } from '../components/SendSearchEmail';
import type { Listing } from '../types';

type Tab = 'listings' | 'sources' | 'areas' | 'applications' | 'settings';

const TABS: { id: Tab; label: string }[] = [
  { id: 'listings',     label: 'Lediga bostäder' },
  { id: 'sources',      label: 'Källor & status' },
  { id: 'areas',        label: 'Stadsdelar' },
  { id: 'applications', label: 'Mina val' },
  { id: 'settings',     label: 'Notifikationer' },
];

const SORT_OPTIONS = [
  { id: 'newest',     label: 'Nyast publicerad' },
  { id: 'price_asc',  label: 'Lägst hyra' },
  { id: 'price_desc', label: 'Högst hyra' },
  { id: 'area_desc',  label: 'Störst bostad' },
];

function applyFilters(listings: Listing[], f: FilterValues): Listing[] {
  return listings.filter(l => {
    if (l.price < f.minPrice || l.price > f.maxPrice) return false;
    if (l.rooms && (l.rooms < f.minRooms || l.rooms > f.maxRooms)) return false;
    if (l.area && (l.area < f.minArea || l.area > f.maxArea)) return false;
    if (f.selectedAreas.length > 0) {
      if (!f.selectedAreas.some(a => l.address.toLowerCase().includes(a.toLowerCase()))) return false;
    }
    if (f.petFriendly && !l.petFriendly) return false;
    if (f.furnished && !l.hasFurnished) return false;
    if (f.sources.length > 0 && !f.sources.includes(l.source)) return false;
    return true;
  });
}

function applySort(listings: Listing[], sort: string): Listing[] {
  return [...listings].sort((a, b) => {
    switch (sort) {
      case 'price_asc':  return a.price - b.price;
      case 'price_desc': return b.price - a.price;
      case 'area_desc':  return (b.area ?? 0) - (a.area ?? 0);
      default:           return new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime();
    }
  });
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('listings');
  const [sort, setSort] = useState('newest');
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterValues>({
    minPrice: 0,
    maxPrice: 20000,
    minRooms: 1,
    maxRooms: 5,
    minArea: 0,
    maxArea: 150,
    maxPricePerSqm: 0,
    selectedAreas: [],
    petFriendly: false,
    leaseType: 'all',
    availableFrom: '',
    furnished: false,
    sources: ['blocket', 'bostadsportal', 'qasa', 'hyresratter', 'lkf', 'afbostader'],
  });

  // Fetch listings from API
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        // Get token from localStorage (set during login)
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Ej inloggad');
          setLoading(false);
          return;
        }

        const res = await fetch('http://localhost:3000/api/routes/listings', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const data = await res.json();
        setListings(data.listings || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch listings:', err);
        setError(err instanceof Error ? err.message : 'Kunde inte hämta listningar');
        setListings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const filtered = useMemo(
    () => applySort(applyFilters(listings, filters), sort),
    [listings, filters, sort]
  );

  return (
    <div className="min-h-screen bg-[#f5f4f0]">

      {/* ── Hero header ─────────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-[#1c2b3a]">
        {/* Background image of Lund University */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1600&q=70')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1c2b3a]/60 to-[#1c2b3a]/90" />

        <div className="relative max-w-7xl mx-auto px-6">
          {/* Top bar */}
          <div className="flex items-center justify-between py-5 border-b border-white/10">
            <div>
              <h1 className="text-white font-bold text-xl tracking-tight">
                Hitta boende i Lund
              </h1>
              <p className="text-white/50 text-xs mt-0.5">för I&amp;F · Familjedashboard</p>
            </div>
            <span className="text-xs text-white/60 bg-white/10 px-3 py-1.5 rounded-full">
              {filtered.length} {filtered.length === 1 ? 'annons' : 'annonser'}
            </span>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-8 py-5">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{listings.length}</p>
              <p className="text-xs text-white/50 mt-0.5">Totalt</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-400">
                {listings.filter(l => {
                  const d = (Date.now() - new Date(l.listedAt).getTime()) / 86_400_000;
                  return d < 1;
                }).length}
              </p>
              <p className="text-xs text-white/50 mt-0.5">Nya idag</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-3xl font-bold text-white">
                {listings.length > 0 ? Math.round(listings.reduce((s, l) => s + l.price, 0) / listings.length / 100) * 100 : '-'}
              </p>
              <p className="text-xs text-white/50 mt-0.5">Snittshyra kr</p>
            </div>
          </div>

          {/* Tab nav */}
          <nav className="flex gap-0.5 -mb-px">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 text-sm font-medium rounded-t-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#f5f4f0] text-[#1c2b3a]'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* ── LISTINGS tab ──────────────────────────────────────────── */}
        {activeTab === 'listings' && (
          <div className="flex gap-8">

            {/* Sidebar – desktop */}
            <aside className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-6 space-y-4">
                <FilterPanel onFilterChange={setFilters} />
                <SendSearchEmail filters={filters} />
              </div>
            </aside>

            {/* Content area */}
            <div className="flex-1 min-w-0">

              {/* Mobile filter toggle */}
              <div className="lg:hidden mb-4">
                <button
                  onClick={() => setShowMobileFilter(!showMobileFilter)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                    </svg>
                    Filter &amp; sökning
                  </span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${showMobileFilter ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showMobileFilter && (
                  <div className="mt-2">
                    <FilterPanel onFilterChange={setFilters} />
                  </div>
                )}
              </div>

              {/* Sort + count */}
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-gray-600">
                  {filtered.length === 0
                    ? <span className="text-gray-400">Inga annonser matchar filtren</span>
                    : <><span className="font-semibold text-gray-900">{filtered.length}</span> {filtered.length === 1 ? 'annons' : 'annonser'}</>
                  }
                </p>
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer shadow-sm"
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Loading state */}
              {loading && (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <p className="text-gray-600 font-medium text-lg mt-4">Hämtar annonser...</p>
                </div>
              )}

              {/* Error state */}
              {error && !loading && (
                <div className="text-center py-20 bg-white rounded-2xl border border-red-100">
                  <p className="text-5xl mb-4">⚠️</p>
                  <p className="text-gray-600 font-medium text-lg">Kunde inte hämta annonser</p>
                  <p className="text-gray-400 text-sm mt-1">{error}</p>
                </div>
              )}

              {/* Grid */}
              {!loading && !error && (
                <>
                  {filtered.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                      <p className="text-5xl mb-4">🔍</p>
                      <p className="text-gray-600 font-medium text-lg">
                        {listings.length === 0 ? 'Inga annonser ännu' : 'Inga annonser matchar filtren'}
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        {listings.length === 0 ? 'Scraperna körs var 15:e minut' : 'Prova att bredda filtren'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                      {filtered.map(listing => (
                        <ListingCard key={listing.id} listing={listing} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── SOURCES tab ───────────────────────────────────────────── */}
        {activeTab === 'sources' && (
          <div className="max-w-3xl space-y-10">
            <div>
              <h2 className="text-2xl font-bold text-[#1c2b3a] mb-1">Integrationsstatus</h2>
              <p className="text-gray-500 text-sm">Vilka källor är live och vilka visar demodata.</p>
            </div>
            <IntegrationStatus />
            <hr className="border-gray-200" />
            <div>
              <h2 className="text-2xl font-bold text-[#1c2b3a] mb-1">Köer &amp; portaler</h2>
              <p className="text-gray-500 text-sm">Anmäl dig till köer och kolla externa portaler direkt.</p>
            </div>
            <SourcesPanel />
          </div>
        )}

        {/* ── AREAS tab ─────────────────────────────────────────────── */}
        {activeTab === 'areas' && (
          <div className="max-w-3xl">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#1c2b3a]">Lunds stadsdelar</h2>
              <p className="text-gray-500 text-sm mt-1">Hitta rätt område – pris, pendling och karaktär.</p>
            </div>
            <AreasGuide />
          </div>
        )}

        {/* ── APPLICATIONS tab ──────────────────────────────────────── */}
        {activeTab === 'applications' && (
          <div className="max-w-2xl">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#1c2b3a]">Mina val</h2>
              <p className="text-gray-500 text-sm mt-1">Bostäder du markerat och trackrar.</p>
            </div>
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <p className="text-5xl mb-4">📋</p>
              <p className="text-gray-600 font-medium">Inga markerade annonser ännu</p>
              <p className="text-gray-400 text-sm mt-1">Gå till Lediga bostäder och markera dem du gillar</p>
            </div>
          </div>
        )}

        {/* ── SETTINGS tab ──────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="max-w-md">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#1c2b3a]">Notifikationer</h2>
              <p className="text-gray-500 text-sm mt-1">Prenumerera på daglig sammanfattning eller direktnotis.</p>
            </div>
            <EmailSubscribe />
            <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
              Kräver backend-servern + e-postkonfiguration i <code className="bg-amber-100 px-1 rounded">.env.local</code>.
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
