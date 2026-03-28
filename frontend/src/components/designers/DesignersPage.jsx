import React, { useState } from 'react';
import { Plus, X, Mail, Briefcase } from 'lucide-react';

export default function DesignersPage() {
  const [designers, setDesigners] = useState([
    {
      id: 2,
      name: 'Atelier User',
      email: 'atelier@aurea.dz',
      activeOrders: 1,
      completedOrders: 5
    },
    {
      id: 3,
      name: 'Sarah Mokrani',
      email: 'sarah@aurea.dz',
      activeOrders: 3,
      completedOrders: 12
    },
    {
      id: 4,
      name: 'Karim Boudiaf',
      email: 'karim@aurea.dz',
      activeOrders: 2,
      completedOrders: 8
    }
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDesigner, setNewDesigner] = useState({ name: '', email: '', password: '' });

  const handleAddDesigner = () => {
    if (!newDesigner.name || !newDesigner.email || !newDesigner.password) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    if (newDesigner.password.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setDesigners([
      ...designers,
      {
        id: Date.now(),
        ...newDesigner,
        activeOrders: 0,
        completedOrders: 0
      }
    ]);
    setNewDesigner({ name: '', email: '', password: '' });
    setShowAddForm(false);
    alert('Membre ajouté avec succès!');
  };

  const handleDeleteDesigner = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
      setDesigners(designers.filter(d => d.id !== id));
      alert('Membre supprimé avec succès');
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">Gestion de l'Atelier</h2>
          <p className="text-gray-400 mt-2">{designers.length} membre(s) actif(s)</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[linear-gradient(135deg,_#5B58EB,_#56E1E9)] hover:opacity-90 text-white rounded-lg transition"
        >
          <Plus size={20} />
          Ajouter Membre
        </button>
      </div>

      {showAddForm && (
        <div className="bg-[#112C70] rounded-lg p-6 mb-6 border border-[#56E1E9]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">Nouveau Membre de l'Atelier</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-white transition"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newDesigner.name}
                  onChange={(e) => setNewDesigner({ ...newDesigner, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#56E1E9]"
                  placeholder="Nom et prénom"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newDesigner.email}
                  onChange={(e) => setNewDesigner({ ...newDesigner, email: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#56E1E9]"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newDesigner.password}
                  onChange={(e) => setNewDesigner({ ...newDesigner, password: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#56E1E9]"
                  placeholder="Min. 6 caractères"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleAddDesigner}
                className="px-6 py-2 bg-[linear-gradient(135deg,_#5B58EB,_#56E1E9)] hover:opacity-90 text-white rounded-lg transition font-medium"
              >
                ✓ Ajouter Membre
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewDesigner({ name: '', email: '', password: '' });
                }}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {designers.map(designer => (
          <div key={designer.id} className="bg-[#112C70] rounded-lg p-6 hover:shadow-lg transition">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {designer.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{designer.name}</h3>
                <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                  <Mail size={14} />
                  {designer.email}
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-4 bg-[#0A2353] p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm flex items-center gap-2">
                  <Briefcase size={16} />
                  Commandes actives:
                </span>
                <span className="text-[#56E1E9] font-bold text-lg">{designer.activeOrders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Commandes terminées:</span>
                <span className="text-green-400 font-bold text-lg">{designer.completedOrders}</span>
              </div>
              <div className="pt-2 border-t border-gray-700">
                <span className="text-gray-500 text-xs">Total commandes: </span>
                <span className="text-white font-semibold">
                  {designer.activeOrders + designer.completedOrders}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700 flex gap-2">
              <button className="flex-1 px-4 py-2 bg-[linear-gradient(135deg,_#5B58EB,_#56E1E9)] hover:opacity-90 text-white rounded-lg transition text-sm font-medium">
                ✏️ Modifier
              </button>
              <button
                onClick={() => handleDeleteDesigner(designer.id)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium"
              >
                🗑️ Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {designers.length === 0 && (
        <div className="bg-[#112C70] rounded-lg p-12 text-center">
          <Briefcase size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">Aucun membre pour le moment</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 text-[#56E1E9] hover:text-[#56E1E9]"
          >
            Ajouter le premier membre
          </button>
        </div>
      )}
    </div>
  );
}