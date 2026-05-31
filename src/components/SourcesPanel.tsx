import { RENTAL_SOURCES } from '../data/rentalSources';
import type { RentalSource } from '../data/rentalSources';

const TYPE_CONFIG: Record<RentalSource['type'], { label: string; color: string }> = {
  portal: { label: 'Portal',   color: 'bg-blue-100 text-blue-700' },
  queue:  { label: 'Kö',       color: 'bg-yellow-100 text-yellow-700' },
  social: { label: 'Socialt',  color: 'bg-pink-100 text-pink-700' },
  direct: { label: 'Direkt',   color: 'bg-green-100 text-green-700' },
};

interface SourcesPanelProps {
  compact?: boolean;
}

export function SourcesPanel({ compact = false }: SourcesPanelProps) {
  const queues = RENTAL_SOURCES.filter((s) => s.type === 'queue');
  const portals = RENTAL_SOURCES.filter((s) => s.type !== 'queue');

  return (
    <div className="space-y-4">

      {/* Priority: queues */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h3 className="font-semibold text-amber-800 mb-1 flex items-center gap-2">
          <span>⚠</span> Anmäl dig till kö nu!
        </h3>
        <p className="text-sm text-amber-700 mb-3">
          Köpoäng samlas per månad. Ju längre din dotter väntar att anmäla sig, desto längre kötid.
        </p>
        <div className="space-y-2">
          {queues.map((source) => (
            <div key={source.id} className="bg-white rounded-lg p-3 border border-amber-100">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-medium text-gray-900 text-sm">{source.name}</span>
                  <p className="text-xs text-gray-600 mt-0.5">{source.description}</p>
                </div>
                <a
                  href={source.searchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition"
                >
                  Anmäl →
                </a>
              </div>
              {!compact && source.tips.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {source.tips.map((tip, i) => (
                    <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                      <span className="text-amber-400 shrink-0">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Portals */}
      <div>
        <h3 className="font-semibold text-gray-800 text-sm mb-2">Lediga annonser – kolla dagligen</h3>
        <div className="space-y-2">
          {portals.map((source) => (
            <div key={source.id} className="bg-white rounded-xl border border-gray-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-gray-900 text-sm">{source.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_CONFIG[source.type].color}`}>
                      {TYPE_CONFIG[source.type].label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{source.description}</p>
                </div>
                <a
                  href={source.searchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                >
                  Sök →
                </a>
              </div>

              {!compact && source.tips.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {source.tips.slice(0, 2).map((tip, i) => (
                    <li key={i} className="text-xs text-gray-400 flex items-start gap-1.5">
                      <span className="shrink-0">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
