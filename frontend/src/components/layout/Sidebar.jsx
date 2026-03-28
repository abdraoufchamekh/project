import React from 'react';
import { Plus, Package, Settings, LogOut, Archive, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ active, setActive, isOpen, setIsOpen }) {
  const { logout, user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Commandes', icon: Package, roles: ['admin', 'designer'] },
    { id: 'stock', label: 'Gestion de Stock', icon: Package, roles: ['admin'] },
    { id: 'archived', label: 'Archivées', icon: Archive, roles: ['admin', 'designer'] },
    { id: 'create', label: 'Nouvelle Commande', icon: Plus, roles: ['admin'] },
    { id: 'create-atelier', label: 'Nouvelle Commande', icon: Plus, roles: ['designer'] },
    { id: 'settings', label: 'Paramètres', icon: Settings, roles: ['admin'] }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0A2353] border-r border-gray-800 h-screen flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#56E1E9]">Auréa Déco</h1>
            <p className="text-sm text-gray-400 mt-1">{user?.name}</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-400 hover:text-white p-1">
             <X size={20} />
          </button>
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${active === item.id
                  ? 'bg-[linear-gradient(135deg,_#460071,_#BB63FF)] text-white'
                  : 'text-[#B0D8E0] hover:text-white'
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
          className="w-full flex items-center gap-3 px-4 py-3 text-[#B0D8E0] hover:text-white rounded-lg transition"
        >
          <LogOut size={20} />
          <span>Déconnexion</span>
        </button>
      </div>
      </div>
    </>
  );
}