import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function FamilySetup() {
  const [familyName, setFamilyName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/routes/family', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: familyName }),
      });

      if (response.ok) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Failed to create family:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/routes/family/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: inviteEmail }),
      });

      if (response.ok) {
        setInviteEmail('');
        alert('Inbjudan skickad!');
      }
    } catch (error) {
      console.error('Failed to send invite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Skapa familjegrupp</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Familjegrupp</h2>
        <p className="text-gray-600 mb-4">Skapa en familjegrupp så kan ni alla dela bostäder och ansökningar.</p>

        <form onSubmit={handleCreateFamily} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Familjenamn
            </label>
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="T.ex. Anderssons"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {isLoading ? 'Skapar...' : 'Skapa familjegrupp'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Bjud in familjemedlemmar</h2>
        <p className="text-gray-600 mb-4">Bjud in din dotter och andra familjemedlemmar för att söka tillsammans.</p>

        <form onSubmit={handleInviteMember} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-post
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="dotter@email.se"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 text-white font-medium py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
          >
            {isLoading ? 'Skickar inbjudan...' : 'Skicka inbjudan'}
          </button>
        </form>

        <button
          onClick={() => navigate('/dashboard')}
          className="mt-6 w-full border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition"
        >
          Hoppa över och gå till dashboard
        </button>
      </div>
    </div>
  );
}
