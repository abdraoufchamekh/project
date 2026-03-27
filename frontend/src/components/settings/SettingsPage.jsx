import React, { useState, useEffect } from 'react';
import { Save, Loader2, Info } from 'lucide-react';
import { API_BASE_URL } from '../../utils/constants';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    company_name: '',
    vendor_name: '',
    activity: '',
    address: '',
    phone: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('aurea_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(prev => ({ ...prev, ...data }));
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des paramètres.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('aurea_token')}`
        },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) throw new Error('Failed to save settings');
      
      const updatedSettings = await response.json();
      setSettings(prev => ({ ...prev, ...updatedSettings }));
      setMessage({ type: 'success', text: 'Paramètres sauvegardés avec succès !' });
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde des paramètres. Assurez-vous d\'être administrateur.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin text-[#03ccff] mr-2" />
        <span className="text-gray-400">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Paramètres de l'entreprise</h2>
        <p className="text-gray-400">Gérez les informations de l'entreprise qui apparaîtront sur les factures générées.</p>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-900/50 text-green-400 border border-green-800' : 'bg-red-900/50 text-red-400 border border-red-800'
        }`}>
          <Info size={20} />
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[#112C70] rounded-lg p-6 shadow-xl border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">Nom de l'entreprise</label>
            <input
              type="text"
              name="company_name"
              value={settings.company_name || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#03ccff] focus:ring-1 focus:ring-[#03ccff]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nom du vendeur / gérant</label>
            <input
              type="text"
              name="vendor_name"
              value={settings.vendor_name || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#03ccff] focus:ring-1 focus:ring-[#03ccff]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Activité</label>
            <input
              type="text"
              name="activity"
              value={settings.activity || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#03ccff] focus:ring-1 focus:ring-[#03ccff]"
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">Adresse</label>
            <input
              type="text"
              name="address"
              value={settings.address || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#03ccff] focus:ring-1 focus:ring-[#03ccff]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Numéro de téléphone</label>
            <input
              type="text"
              name="phone"
              value={settings.phone || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#03ccff] focus:ring-1 focus:ring-[#03ccff]"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[linear-gradient(135deg,_#03ccff,_#09fbff,_#d403e1)] hover:opacity-90 disabled:bg-blue-800 disabled:opacity-50 text-white rounded-lg transition shadow-md font-medium"
          >
            {saving ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Save size={20} />
            )}
            Sauvegarder les paramètres
          </button>
        </div>
      </form>
    </div>
  );
}