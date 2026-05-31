import { RENTAL_SOURCES } from '../data/rentalSources';
import type { IntegrationStatus } from '../data/rentalSources';

const STATUS_CONFIG: Record<IntegrationStatus, {
  label: string;
  badge: string;
  dot: string;
  row: string;
}> = {
  live:    { label: 'Live data',    badge: 'bg-green-100 text-green-800 border-green-200',  dot: 'bg-green-500',  row: 'bg-white' },
  mock:    { label: 'Demodata',     badge: 'bg-yellow-100 text-yellow-800 border-yellow-200', dot: 'bg-yellow-400', row: 'bg-yellow-50/30' },
  planned: { label: 'Planerad',     badge: 'bg-blue-100 text-blue-700 border-blue-200',     dot: 'bg-blue-400',   row: 'bg-white' },
  manual:  { label: 'Manuell länk', badge: 'bg-gray-100 text-gray-600 border-gray-200',     dot: 'bg-gray-400',   row: 'bg-white' },
};

const counts = {
  live:    RENTAL_SOURCES.filter(s => s.integration === 'live').length,
  mock:    RENTAL_SOURCES.filter(s => s.integration === 'mock').length,
  planned: RENTAL_SOURCES.filter(s => s.integration === 'planned').length,
  manual:  RENTAL_SOURCES.filter(s => s.integration === 'manual').length,
};

export function IntegrationStatus() {
  return (
    <div>
      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {(Object.entries(STATUS_CONFIG) as [IntegrationStatus, typeof STATUS_CONFIG[IntegrationStatus]][]).map(([status, cfg]) => (
          <div key={status} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.badge} mb-2`}>
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`}></span>
              {cfg.label}
            </div>
            <p className="text-2xl font-bold text-gray-900">{counts[status]}</p>
            <p className="text-xs text-gray-500">källo{counts[status] === 1 ? 'r' : 'r'}</p>
          </div>
        ))}
      </div>

      {/* Important notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex gap-3">
        <span className="text-xl shrink-0">⚠️</span>
        <div>
          <p className="font-semibold text-yellow-800 text-sm">Alla annonser i appen är just nu demodata</p>
          <p className="text-yellow-700 text-xs mt-1">
            Annonserna du ser är exempeldata för att visa hur appen fungerar. Ingen av källorna är ännu kopplad
            till live-data. Se tabellen nedan för vad som krävs för att aktivera varje källa.
          </p>
        </div>
      </div>

      {/* Detail table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Källa</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide hidden sm:table-cell">Typ</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide hidden lg:table-cell">Vad krävs för live?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {RENTAL_SOURCES.map((source) => {
              const cfg = STATUS_CONFIG[source.integration];
              return (
                <tr key={source.id} className={`${cfg.row} hover:bg-gray-50 transition`}>
                  <td className="px-4 py-3">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-gray-900 hover:text-blue-600 transition"
                    >
                      {source.name}
                    </a>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs text-gray-500 capitalize">{source.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <p className="text-xs text-gray-500 max-w-xs">{source.integrationNote}</p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend / next steps */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h4 className="font-semibold text-gray-800 text-sm mb-2">Enklaste vägen till live-data</h4>
          <ol className="space-y-1.5 text-xs text-gray-600 list-decimal list-inside">
            <li><strong>Blocket</strong> – starta med detta, störst utbud</li>
            <li><strong>LKF</strong> – enkel HTML-sida att skrapa</li>
            <li><strong>Bostadsportal / Hyresrätter.se</strong> – RSS via rss.app</li>
            <li><strong>AF Bostäder</strong> – scraping om dotter är student</li>
          </ol>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h4 className="font-semibold text-gray-800 text-sm mb-2">Vad "live" skulle innebära</h4>
          <ul className="space-y-1.5 text-xs text-gray-600">
            <li>✅ Riktiga annonser visas automatiskt</li>
            <li>✅ E-postdigest innehåller faktiska nyheter</li>
            <li>✅ Filter och sökning fungerar mot verklig data</li>
            <li>⏱ Kräver ca 1–2 veckors extra backend-arbete</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
