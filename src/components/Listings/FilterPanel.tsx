import { useState } from 'react';
import { LUND_AREAS } from '../../data/lundAreas';

export interface FilterValues {
  minPrice: number;
  maxPrice: number;
  minRooms: number;
  maxRooms: number;
  minArea: number;
  maxArea: number;
  selectedAreas: string[];
  petFriendly: boolean;
  furnished: boolean;
  sources: string[];
}

const DEFAULT: FilterValues = {
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
};

const SOURCE_OPTIONS = [
  { id: 'qasa',          label: 'Qasa',          live: true },
  { id: 'afbostader',    label: 'AF Bostäder',    live: true },
  { id: 'lkf',           label: 'LKF',            live: true },
  { id: 'bostadsportal', label: 'Bostadsportal',  live: true },
  { id: 'hyresratter',   label: 'Hyresrätter',    live: true },
  { id: 'blocket',       label: 'Blocket',        live: false },
  { id: 'facebook',      label: 'Facebook',       live: false },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2.5">{title}</p>
      {children}
    </div>
  );
}

interface FilterPanelProps {
  onFilterChange: (f: FilterValues) => void;
}

export function FilterPanel({ onFilterChange }: FilterPanelProps) {
  const [f, setF] = useState<FilterValues>(DEFAULT);

  const update = (partial: Partial<FilterValues>) => {
    const next = { ...f, ...partial };
    setF(next);
    onFilterChange(next);
  };

  const toggleArea = (name: string) =>
    update({ selectedAreas: f.selectedAreas.includes(name) ? f.selectedAreas.filter(a => a !== name) : [...f.selectedAreas, name] });

  const toggleSource = (id: string) =>
    update({ sources: f.sources.includes(id) ? f.sources.filter(s => s !== id) : [...f.sources, id] });

  const activeCount =
    (f.selectedAreas.length ? 1 : 0) +
    (f.minPrice > 0 || f.maxPrice < 20000 ? 1 : 0) +
    (f.minRooms > 1 || f.maxRooms < 5 ? 1 : 0) +
    (f.minArea > 0 || f.maxArea < 150 ? 1 : 0) +
    (f.petFriendly ? 1 : 0) +
    (f.furnished ? 1 : 0);

  const reset = () => { setF(DEFAULT); onFilterChange(DEFAULT); };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          <span className="font-semibold text-gray-900 text-sm">Sök &amp; filtrera</span>
          {activeCount > 0 && (
            <span className="bg-[#1c2b3a] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button onClick={reset} className="text-xs text-gray-400 hover:text-red-500 transition font-medium">
            Rensa
          </button>
        )}
      </div>

      <div className="px-5 py-5 space-y-6">

        {/* Hyra */}
        <Section title="Hyra per månad">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{f.minPrice.toLocaleString('sv-SE')} kr</span>
              <span>{f.maxPrice === 20000 ? '20 000+' : f.maxPrice.toLocaleString('sv-SE')} kr</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={f.minPrice} min={0} max={f.maxPrice} step={500}
                onChange={e => update({ minPrice: +e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c2b3a] focus:border-transparent"
                placeholder="Min kr" />
              <input type="number" value={f.maxPrice} min={f.minPrice} max={30000} step={500}
                onChange={e => update({ maxPrice: +e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c2b3a] focus:border-transparent"
                placeholder="Max kr" />
            </div>
          </div>
        </Section>

        {/* Rum */}
        <Section title="Antal rum">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map(n => {
              const active = n >= f.minRooms && n <= f.maxRooms;
              return (
                <button key={n}
                  onClick={() => {
                    if (f.minRooms === n && f.maxRooms === n) update({ minRooms: 1, maxRooms: 5 });
                    else if (n < f.minRooms) update({ minRooms: n });
                    else if (n > f.maxRooms) update({ maxRooms: n });
                    else update({ minRooms: n, maxRooms: n });
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                    active
                      ? 'bg-[#1c2b3a] text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                  }`}>
                  {n === 5 ? '5+' : n}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Storlek */}
        <Section title="Storlek (m²)">
          <div className="grid grid-cols-2 gap-2">
            <input type="number" value={f.minArea} min={0} max={f.maxArea} step={5}
              onChange={e => update({ minArea: +e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c2b3a] focus:border-transparent"
              placeholder="Min m²" />
            <input type="number" value={f.maxArea} min={f.minArea} max={300} step={5}
              onChange={e => update({ maxArea: +e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c2b3a] focus:border-transparent"
              placeholder="Max m²" />
          </div>
        </Section>

        {/* Områden */}
        <Section title={`Område i Lund${f.selectedAreas.length ? ` (${f.selectedAreas.length})` : ''}`}>
          <div className="flex flex-wrap gap-1.5">
            {LUND_AREAS.map(area => {
              const sel = f.selectedAreas.includes(area.name);
              return (
                <button key={area.id} onClick={() => toggleArea(area.name)} title={area.description}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    sel
                      ? 'bg-[#1c2b3a] text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                  }`}>
                  {area.name}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Önskemål */}
        <Section title="Önskemål">
          <div className="space-y-2">
            {[
              { key: 'petFriendly', label: 'Husdjur tillåtet' },
              { key: 'furnished',   label: 'Möblerad' },
            ].map(opt => (
              <label key={opt.key} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded flex items-center justify-center transition border ${
                  f[opt.key as keyof FilterValues]
                    ? 'bg-[#1c2b3a] border-[#1c2b3a]'
                    : 'bg-white border-gray-300 group-hover:border-gray-500'
                }`}
                  onClick={() => update({ [opt.key]: !f[opt.key as keyof FilterValues] })}>
                  {f[opt.key as keyof FilterValues] && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </Section>

        {/* Källor */}
        <Section title="Visa källor">
          <div className="space-y-1.5">
            {SOURCE_OPTIONS.map(src => {
              const sel = f.sources.includes(src.id);
              return (
                <label key={src.id} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded flex items-center justify-center transition border ${
                    sel
                      ? 'bg-[#1c2b3a] border-[#1c2b3a]'
                      : 'bg-white border-gray-300 group-hover:border-gray-500'
                  }`}
                    onClick={() => toggleSource(src.id)}>
                    {sel && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-gray-700 flex-1">{src.label}</span>
                  {src.live && (
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </Section>

      </div>
    </div>
  );
}
