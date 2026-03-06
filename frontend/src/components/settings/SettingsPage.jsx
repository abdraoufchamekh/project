import React, { useState } from 'react';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    companyName: 'Auréa Déco',
    email: 'contact@aurea.dz',
    phone: '0555 000 000',
    address: 'Sétif, Algérie',
    yalidineApiKey: '',
    yalidineEnabled: false,
    emailNotifications: true,
    smsNotifications: false
  });

  const handleSave = () => {
    // Save settings to backend
    alert('Paramètres enregistrés avec succès!');
  };

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-white mb-8">Paramètres</h2>

      <div className="space-y-6">
        {/* Company Information */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Informations Entreprise</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nom de l'entreprise
              </label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Adresse
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Yalidine Integration */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Intégration Yalidine</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={settings.yalidineEnabled}
                onChange={(e) => setSettings({ ...settings, yalidineEnabled: e.target.checked })}
                className="w-5 h-5 rounded bg-gray-700 border-gray-600 cursor-pointer"
              />
              <label className="text-gray-300">Activer l'intégration Yalidine</label>
            </div>

            {settings.yalidineEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Clé API Yalidine
                </label>
                <input
                  type="text"
                  value={settings.yalidineApiKey}
                  onChange={(e) => setSettings({ ...settings, yalidineApiKey: e.target.value })}
                  placeholder="Entrez votre clé API Yalidine"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Obtenez votre clé API depuis votre tableau de bord Yalidine
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                className="w-5 h-5 rounded bg-gray-700 border-gray-600 cursor-pointer"
              />
              <label className="text-gray-300">Notifications par email</label>
            </div>

            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={settings.smsNotifications}
                onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                className="w-5 h-5 rounded bg-gray-700 border-gray-600 cursor-pointer"
              />
              <label className="text-gray-300">Notifications par SMS</label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
          >
            <Save size={20} />
            Enregistrer les paramètres
          </button>
        </div>
      </div>
    </div>
  );
}