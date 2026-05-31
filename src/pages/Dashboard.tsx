import { useState, useMemo } from 'react';
import { FilterPanel } from '../components/Listings/FilterPanel';
import type { FilterValues } from '../components/Listings/FilterPanel';
import { ListingCard } from '../components/Listings/ListingCard';
import { SourcesPanel } from '../components/SourcesPanel';
import { AreasGuide } from '../components/AreasGuide';
import { EmailSubscribe } from '../components/EmailSubscribe';
import { MOCK_LISTINGS } from '../data/mockListings';
import type { Listing } from '../types';

type Tab = 'listings' | 'sources' | 'areas' | 'applications' | 'settings';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'listings',     label: 'Annonser',       icon: '🏠' },
  { id: 'sources',      label: 'Källor',         icon: '🔍' },
  { id: 'areas',        label: 'Områden',        icon: '📍' },
  { id: 'applications', label: 'Mina val',       icon: '📋' },
  { id: 'settings',     label: 'Notifikationer', icon: '📬' },
];

const SORT_OPTIONS = [
  { id: 'newest',    label: 'Nyast' },
  { id: 'price_asc', label: 'Billigast' },
  { id: 'price_desc',label: 'Dyrast' },
  { id: 'area_desc', label: 'Störst' },
];

function applyFilters(listings: Listing[], filters: FilterValues): Listing[] {
  return listings.filter((l) => {
    if (l.price < filters.minPrice || l.price > filters.maxPrice) return false;
    if (l.rooms) {
      if (l.rooms < filters.minRooms || l.rooms > filters.maxRooms) return false;
    }
    if (l.area) {
      if (l.area < filters.minArea || l.area > filters.maxArea) return false;
    }
    if (filters.selectedAreas.length > 0) {
      const match = filters.selectedAreas.some((area) =>
        l.address.toLowerCase().includes(area.toLowerCase())
      );
      if (!match) return false;
    }
    if (filters.petFriendly && !l.petFriendly) return false;
    if (filters.furnished && !l.hasFurnished) return false;
    if (filters.sources.length > 0 && !filters.sources.includes(l.source)) return false;
    return true;
  });
}

function applySort(listings: Listing[], sort: string): Listing[] {
  return [...listings].sort((a, b) => {
    switch (sort) {
      case 'price_asc':  return a.price - b.price;
      case 'price_desc': return b.price - a.price;
      case 'area_desc':  return (b.area ?? 0) - (a.area ?? 0);
      case 'newest':
      default:
        return new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime();
    }
  });
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('listings');
  const [filters, setFilters] = useState<FilterValues>({
    minPrice: 0,
    maxPrice: 20000,
    minRooms: 1,
    maxRooms: 5,
    minArea: 0,
    maxArea: 150,
    selectedAreas: [],
    petFriendly: false,
    furnished: false,
    sources: ['blocket', 'bostadsportal', 'qasa', 'hyresratter', 'lkf', 'afbostader', 'facebook'],
  });
  const [sort, setSort] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => applySort(applyFilters(MOCK_LISTINGS, filters), sort), [filters, sort]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Hitta boende i Lund för I&amp;F</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-100">
              {filtered.length} annonser
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex gap-1 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6">

        {activeTab === 'listings' && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar (filter) – desktop */}
            <aside className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-[105px]">
                <FilterPanel onFilterChange={setFilters} />
              </div>
            </aside>

            {/* Main listing area */}
            <div className="flex-1 min-w-0">
              {/* Mobile filter toggle */}
              <div className="lg:hidden mb-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700"
                >
                  <span>Filter & sökning</span>
                  <svg className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showFilters && (
                  <div className="mt-2">
                    <FilterPanel onFilterChange={setFilters} />
                  </div>
                )}
              </div>

              {/* Sort + count */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  {filtered.length === 0
                    ? 'Inga annonser matchar dina filter'
                    : `${filtered.length} ${filtered.length === 1 ? 'annons' : 'annonser'}`}
                </p>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Listings grid */}
              {filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                  <p className="text-4xl mb-3">🔍</p>
                  <p className="text-gray-500 text-lg font-medium">Inga annonser hittades</p>
                  <p className="text-gray-400 text-sm mt-1">Prova att bredda dina filter</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}

              {/* Demo notice */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
                <strong>Demo-data</strong> – Dessa annonser är exempeldata. Nästa steg är att koppla till riktiga källor (Blocket, Bostadsportal, LKF) via API/scraping för att visa verkliga annonser automatiskt.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sources' && (
          <div className="max-w-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Källor & bostadsköer</h2>
              <p className="text-gray-600 text-sm mt-1">
                Var du hittar hyresrätter i Lund, och viktigast – köer du bör anmäla dig till omedelbart.
              </p>
            </div>
            <SourcesPanel />
          </div>
        )}

        {activeTab === 'areas' && (
          <div className="max-w-3xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Lunds stadsdelar</h2>
              <p className="text-gray-600 text-sm mt-1">
                Översikt över populära områden – pris, pendling och karaktär.
              </p>
            </div>
            <AreasGuide />
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="max-w-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Mina val</h2>
              <p className="text-gray-600 text-sm mt-1">
                Annonser du markerat som intressant, ansökt om eller fått svar på.
              </p>
            </div>
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-gray-500">Inga markerade annonser ännu.</p>
              <p className="text-gray-400 text-sm mt-1">
                Gå till Annonser och markera dem du är intresserad av.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-lg">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Notifikationer</h2>
              <p className="text-gray-600 text-sm mt-1">
                Prenumerera på daglig sammanfattning eller direktnotis när nya annonser dyker upp.
              </p>
            </div>
            <EmailSubscribe />
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              <strong>OBS:</strong> E-post kräver att backend-servern är igång (Railway). Se <code>SETUP.md</code> för deployment-instruktioner. Konfigurera <code>SENDGRID_API_KEY</code> eller SMTP i <code>.env</code>.
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
