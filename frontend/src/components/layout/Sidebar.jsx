import React from 'react';
import { Plus, Package, Users, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ active, setActive }) {
  const { logout, user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Commandes', icon: Package, roles: ['admin', 'designer'] },
    { id: 'create', label: 'Nouvelle Commande', icon: Plus, roles: ['admin'] },
    { id: 'designers', label: 'Designers', icon: Users, roles: ['admin'] },
    { id: 'settings', label: 'Paramètres', icon: Settings, roles: ['admin'] }
  ];

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-blue-500">Auréa Déco</h1>
        <p className="text-sm text-gray-400 mt-1">{user?.name}</p>
        <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems
          .filter(item => item.roles.includes(user?.role))
          .map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  active === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition"
        >
          <LogOut size={20} />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
}