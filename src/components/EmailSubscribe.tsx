import { useState } from 'react';

type Frequency = 'daily' | 'realtime';

export function EmailSubscribe() {
  const [email, setEmail] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/email/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, frequency }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Något gick fel');
      }

      setSubscribed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte spara e-post');
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="text-3xl mb-2">✅</div>
        <p className="font-semibold text-green-800">Prenumeration sparad!</p>
        <p className="text-sm text-green-700 mt-1">
          {frequency === 'daily'
            ? `${email} får en daglig sammanfattning kl 08:00`
            : `${email} notifieras direkt när nya annonser dyker upp`}
        </p>
        <button
          onClick={() => setSubscribed(false)}
          className="mt-3 text-xs text-green-600 hover:underline"
        >
          Ändra inställningar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">📬</span>
        <div>
          <h3 className="font-semibold text-gray-900">E-postnotifikationer</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Få en daglig sammanfattning eller direktnotis vid nya annonser.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            E-postadress
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="din@email.se"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hur ofta?
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFrequency('daily')}
              className={`px-4 py-3 rounded-lg border text-sm text-left transition ${
                frequency === 'daily'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">📅 Daglig digest</div>
              <div className="text-xs mt-0.5 opacity-75">Varje dag kl 08:00</div>
            </button>
            <button
              type="button"
              onClick={() => setFrequency('realtime')}
              className={`px-4 py-3 rounded-lg border text-sm text-left transition ${
                frequency === 'realtime'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">⚡ Direkt</div>
              <div className="text-xs mt-0.5 opacity-75">Inom minuter</div>
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition text-sm"
        >
          {loading ? 'Sparar...' : 'Aktivera notifikationer'}
        </button>
      </form>
    </div>
  );
}
