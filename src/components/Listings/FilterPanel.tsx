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

const DEFAULT_FILTERS: FilterValues = {
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
  { id: 'blocket', label: 'Blocket' },
  { id: 'bostadsportal', label: 'Bostadsportal' },
  { id: 'qasa', label: 'Qasa' },
  { id: 'hyresratter', label: 'Hyresrätter.se' },
  { id: 'lkf', label: 'LKF' },
  { id: 'afbostader', label: 'AF Bostäder' },
  { id: 'facebook', label: 'Facebook' },
];

interface FilterPanelProps {
  onFilterChange: (filters: FilterValues) => void;
}

export function FilterPanel({ onFilterChange }: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterValues>(DEFAULT_FILTERS);
  const [isExpanded, setIsExpanded] = useState(true);

  const update = (partial: Partial<FilterValues>) => {
    const next = { ...filters, ...partial };
    setFilters(next);
    onFilterChange(next);
  };

  const toggleArea = (areaName: string) => {
    const selected = filters.selectedAreas.includes(areaName)
      ? filters.selectedAreas.filter((a) => a !== areaName)
      : [...filters.selectedAreas, areaName];
    update({ selectedAreas: selected });
  };

  const toggleSource = (sourceId: string) => {
    const sources = filters.sources.includes(sourceId)
      ? filters.sources.filter((s) => s !== sourceId)
      : [...filters.sources, sourceId];
    update({ sources });
  };

  const reset = () => {
    setFilters(DEFAULT_FILTERS);
    onFilterChange(DEFAULT_FILTERS);
  };

  const activeCount =
    (filters.selectedAreas.length > 0 ? 1 : 0) +
    (filters.minPrice > 0 || filters.maxPrice < 20000 ? 1 : 0) +
    (filters.minRooms > 1 || filters.maxRooms < 5 ? 1 : 0) +
    (filters.minArea > 0 || filters.maxArea < 150 ? 1 : 0) +
    (filters.petFriendly ? 1 : 0) +
    (filters.furnished ? 1 : 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          <span className="font-semibold text-gray-800">Filter</span>
          {activeCount > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); reset(); }}
              className="text-xs text-gray-500 hover:text-red-600 transition"
            >
              Rensa
            </button>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="px-5 pb-5 space-y-6 border-t border-gray-100 pt-4">

          {/* Hyra per månad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hyra per månad: {filters.minPrice.toLocaleString('sv-SE')} – {filters.maxPrice.toLocaleString('sv-SE')} kr
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => update({ minPrice: Number(e.target.value) })}
                min={0}
                max={filters.maxPrice}
                step={500}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Min"
              />
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => update({ maxPrice: Number(e.target.value) })}
                min={filters.minPrice}
                max={30000}
                step={500}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Max"
              />
            </div>
          </div>

          {/* Antal rum */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Antal rum: {filters.minRooms} – {filters.maxRooms === 5 ? '5+' : filters.maxRooms}
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => {
                const inRange = n >= filters.minRooms && n <= filters.maxRooms;
                return (
                  <button
                    key={n}
                    onClick={() => {
                      if (filters.minRooms === n && filters.maxRooms === n) {
                        update({ minRooms: 1, maxRooms: 5 });
                      } else if (n < filters.minRooms) {
                        update({ minRooms: n });
                      } else if (n > filters.maxRooms) {
                        update({ maxRooms: n });
                      } else {
                        update({ minRooms: n, maxRooms: n });
                      }
                    }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                      inRange
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {n === 5 ? '5+' : n}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kvadratmeter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Storlek: {filters.minArea} – {filters.maxArea === 150 ? '150+' : filters.maxArea} m²
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                value={filters.minArea}
                onChange={(e) => update({ minArea: Number(e.target.value) })}
                min={0}
                max={filters.maxArea}
                step={5}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Min m²"
              />
              <input
                type="number"
                value={filters.maxArea}
                onChange={(e) => update({ maxArea: Number(e.target.value) })}
                min={filters.minArea}
                max={300}
                step={5}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Max m²"
              />
            </div>
          </div>

          {/* Områden */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Områden i Lund {filters.selectedAreas.length > 0 && `(${filters.selectedAreas.length} valda)`}
            </label>
            <div className="flex flex-wrap gap-2">
              {LUND_AREAS.map((area) => {
                const selected = filters.selectedAreas.includes(area.name);
                return (
                  <button
                    key={area.id}
                    onClick={() => toggleArea(area.name)}
                    title={area.description}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                      selected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {area.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Önskemål */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Önskemål</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.petFriendly}
                  onChange={(e) => update({ petFriendly: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Husdjur OK</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.furnished}
                  onChange={(e) => update({ furnished: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Möblerad</span>
              </label>
            </div>
          </div>

          {/* Källor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Källor att visa</label>
            <div className="flex flex-wrap gap-2">
              {SOURCE_OPTIONS.map((src) => {
                const selected = filters.sources.includes(src.id);
                return (
                  <button
                    key={src.id}
                    onClick={() => toggleSource(src.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                      selected
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-500 border-gray-300 hover:border-green-400'
                    }`}
                  >
                    {src.label}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
