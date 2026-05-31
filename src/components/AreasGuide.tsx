import { useState } from 'react';
import { LUND_AREAS } from '../data/lundAreas';
import type { LundArea } from '../data/lundAreas';

const POPULARITY_CONFIG = {
  high:   { label: 'Populärt',   color: 'bg-red-100 text-red-700' },
  medium: { label: 'Bra utbud',  color: 'bg-yellow-100 text-yellow-700' },
  low:    { label: 'Lugnt',      color: 'bg-green-100 text-green-700' },
};

function AreaCard({ area }: { area: LundArea }) {
  const pop = POPULARITY_CONFIG[area.popularity];
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{area.name}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full ${pop.color} shrink-0 ml-2`}>
          {pop.label}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-3">{area.description}</p>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 w-16 shrink-0">Centrum</span>
          <span className="text-gray-700">{area.distanceToCentrum}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 w-16 shrink-0">Hyra</span>
          <span className="text-gray-700 font-medium">{area.priceRange}</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {area.characteristics.map((c) => (
          <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {c}
          </span>
        ))}
        {area.studentFriendly && (
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
            Studentvänligt
          </span>
        )}
      </div>
    </div>
  );
}

export function AreasGuide() {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? LUND_AREAS : LUND_AREAS.slice(0, 4);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-800">Områden i Lund</h2>
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-blue-600 hover:underline"
        >
          {showAll ? 'Visa färre' : `Visa alla ${LUND_AREAS.length}`}
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visible.map((area) => (
          <AreaCard key={area.id} area={area} />
        ))}
      </div>
    </div>
  );
}
