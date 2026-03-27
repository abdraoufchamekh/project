import React, { useState, useEffect, useRef } from 'react';
import { Package, Search, Filter, X, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { getStatusColor, API_BASE_URL } from '../../utils/constants';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

const Dashboard = ({ orders, userRole, userId, onSelectOrder, onDeleteOrder, fetchOrders, pagination, globalStats = {}, onNavigateToStatus, isFetchingOrders }) => {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    wilaya: '',
    date: '',
    source: ''
  });
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const debouncedSearch = useDebouncedValue(filters.search, 400);
  const skipSearchEffect = useRef(true);

  useEffect(() => {
    // Fetch out of stock notifications
    const fetchNotifications = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/notifications`, {
            headers: { Authorization: `Bearer ${sessionStorage.getItem('aurea_token')}` }
        });
        if (data.notifications) {
           setOutOfStockItems(data.notifications);
        }
      } catch (error) {
         console.error('Error fetching stock notifications:', error);
      }
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (skipSearchEffect.current) {
      skipSearchEffect.current = false;
      return;
    }
    if (fetchOrders) fetchOrders({ ...filters, search: debouncedSearch, page: 1 });
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handlePageChange = (newPage) => {
    if (!pagination || newPage < 1 || newPage > pagination.totalPages) return;
    if (fetchOrders) fetchOrders({ ...filters, page: newPage });
  };

  const applyFilters = () => {
    if (fetchOrders) fetchOrders({ ...filters, page: 1 });
  };

  const clearFilters = () => {
    const emptyFilters = { search: '', status: '', wilaya: '', date: '', source: '' };
    setFilters(emptyFilters);
    if (fetchOrders) fetchOrders({ ...emptyFilters, page: 1 });
  };

  // Use globalStats to avoid showing stats only for the current 50 paginated items
  const isNewFormat = globalStats && globalStats.global;
  const adminStats = isNewFormat ? globalStats.admin : {};
  const atelStats = isNewFormat ? globalStats.atelier : {};
  const glbStats = isNewFormat ? globalStats.global : globalStats;

  const getCount = (sourceStats, statusList) => {
    return statusList.reduce((acc, status) => acc + (sourceStats[status] || 0), 0);
  };

  const atelierStatsObj = {
    // Active Admin orders
    totalLigne: getCount(adminStats, ['Nouvelle commande', 'En design', 'En production', 'Réalisée', 'Récupérée']),
    // Active Atelier orders
    totalAtelier: getCount(atelStats, ['Nouvelle commande', 'En production', 'Réalisée', 'Récupérée']),
    nouvelle: atelStats['Nouvelle commande'] || 0,
    realisee: atelStats['Réalisée'] || 0,
    recuperee: atelStats['Récupérée'] || 0
  };

  const stats = {
    enAtelier: atelierStatsObj.totalAtelier,
    inProgress: atelierStatsObj.totalLigne,
    delivered: glbStats['Livré'] || 0,
    returned: glbStats['Retourné'] || 0
  };

  let filteredOrders = orders;

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Commandes</h2>
          <p className="text-gray-400 mt-2">
            Aperçu des performances de votre activité
          </p>
        </div>
      </div>

      {outOfStockItems.length > 0 && (
        <div className="bg-red-900/40 border border-red-500/50 rounded-lg p-4 mb-8 flex items-start gap-4">
          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={24} />
          <div>
            <h3 className="text-red-400 font-bold mb-1">Alerte Stock</h3>
            <ul className="text-sm border-l-2 border-red-500/30 pl-3 ml-1 text-red-300 space-y-1 mt-2">
              {outOfStockItems.map(item => {
                let labelParts = [];
                if (item.color) labelParts.push(item.color);
                if (item.dimension) labelParts.push(item.dimension);
                if (item.size) labelParts.push(`Taille: ${item.size}`);
                const label = labelParts.length > 0 ? `(${labelParts.join(' - ')})` : '';
                return (
                  <li key={item.id}>
                    L'article <strong>{item.product_name || item.name} {label}</strong> est en rupture. Déficit actuel : <strong>{item.deficit}</strong> unités.
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {userRole === 'designer' ? (
          [
            { label: 'En ligne', value: atelierStatsObj.totalLigne, color: 'text-purple-400', targetKey: 'en-ligne' },
            { label: 'En atelier', value: atelierStatsObj.totalAtelier, color: 'text-[#03ccff]', targetKey: 'en-atelier' },
            { label: 'Réalisée', value: atelierStatsObj.realisee, color: 'text-yellow-500', targetKey: 'atelier-realisee' },
            { label: 'Récupérée', value: atelierStatsObj.recuperee, color: 'text-green-500', targetKey: 'atelier-recuperee' }
          ].map((stat, idx) => (
            <div key={idx} className="bg-[#112C70] rounded-lg p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-gray-400 text-sm font-medium">{stat.label}</h3>
                <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
              </div>
              <button
                onClick={() => onNavigateToStatus && onNavigateToStatus(stat.targetKey)}
                className="mt-4 text-sm text-[#03ccff] hover:text-[#03ccff] underline text-left transition"
              >
                Voir plus
              </button>
            </div>
          ))
        ) : (
          [
            { label: 'En ligne', value: stats.inProgress, color: 'text-yellow-500', targetKey: 'en-ligne' },
            { label: 'En atelier', value: stats.enAtelier, color: 'text-[#03ccff]', targetKey: 'en-atelier' },
            { label: 'Livrées', value: stats.delivered, color: 'text-green-500', targetKey: 'livrees' },
            { label: 'Retournées', value: stats.returned, color: 'text-red-500', targetKey: 'retournees' }
          ].map((stat, idx) => (
            <div key={idx} className="bg-[#112C70] rounded-lg p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-gray-400 text-sm font-medium">{stat.label}</h3>
                <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
              </div>
              <button
                onClick={() => onNavigateToStatus && onNavigateToStatus(stat.targetKey)}
                className="mt-4 text-sm text-[#03ccff] hover:text-[#03ccff] underline text-left transition"
              >
                Voir plus
              </button>
            </div>
          ))
        )}
      </div>

      <div className="bg-[#112C70] rounded-lg p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full relative">
            <label className="block text-xs font-medium text-gray-400 mb-1">Recherche</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                placeholder="Nom ou tel..."
                className="w-full bg-gray-700 text-white text-sm rounded px-3 py-2 pl-9 focus:outline-none focus:ring-1 focus:ring-[#03ccff]"
              />
            </div>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-gray-400 mb-1">Statut</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full bg-gray-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#03ccff]"
            >
              <option value="">Tous</option>
              <option value="Nouvelle commande">Nouvelle</option>
              <option value="En design">En design</option>
              <option value="En production">En prod</option>
              <option value="Réalisée">Réalisée</option>
              <option value="Récupérée">Récupérée</option>
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-gray-400 mb-1">Source</label>
            <select
              name="source"
              value={filters.source}
              onChange={handleFilterChange}
              className="w-full bg-gray-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#03ccff]"
            >
              <option value="">Toutes</option>
              <option value="admin">En ligne</option>
              <option value="atelier">Atelier</option>
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-gray-400 mb-1">Wilaya</label>
            <input
              type="text"
              name="wilaya"
              value={filters.wilaya}
              onChange={handleFilterChange}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              placeholder="Ex: Alger"
              className="w-full bg-gray-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#03ccff]"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-gray-400 mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              className="w-full bg-gray-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#03ccff]"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto pt-4 md:pt-0">
            <button
              onClick={clearFilters}
              title="Réinitialiser"
              className="px-3 py-2 border border-gray-600 text-gray-400 hover:text-white rounded hover:bg-gray-700 transition flex items-center justify-center flex-1 md:flex-none"
            >
              <X size={16} />
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-[linear-gradient(135deg,_#03ccff,_#09fbff,_#d403e1)] text-white text-sm font-medium rounded hover:bg-blue-700 transition flex items-center justify-center gap-2 flex-1 md:flex-none whitespace-nowrap"
            >
              <Filter size={16} /> Appliquer
            </button>
          </div>
        </div>
      </div>

      {isFetchingOrders && filteredOrders.length === 0 ? (
        <div className="bg-[#112C70] rounded-lg p-12 text-center animate-pulse">
           <div className="h-8 bg-gray-700 rounded w-1/4 mx-auto mb-6"></div>
           <div className="space-y-4">
             <div className="h-10 bg-gray-700 rounded w-full"></div>
             <div className="h-10 bg-gray-700 rounded w-full"></div>
             <div className="h-10 bg-gray-700 rounded w-full"></div>
           </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-[#112C70] rounded-lg p-12 text-center">
          <Package size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">Aucune commande trouvée</p>
        </div>
      ) : (
        <div className={`bg-[#112C70] rounded-lg overflow-hidden relative ${isFetchingOrders ? 'ring-1 ring-[#03ccff]/30' : ''}`}>
          {isFetchingOrders && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-[linear-gradient(135deg,_#03ccff,_#09fbff,_#d403e1)]/80 animate-pulse z-10" aria-hidden />
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
            <thead className="bg-[#0A2353] border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">ID</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Client</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Téléphone</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Produits</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Statut</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-750 transition">
                  <td className="px-6 py-4 text-white font-medium">#{order.id}</td>
                  <td className="px-6 py-4 text-white">{order.clientName || order.client_name || `${order.first_name || ''} ${order.last_name || ''}`.trim() || 'Inconnu'}</td>
                  <td className="px-6 py-4 text-gray-400">{order.phone}</td>
                  <td className="px-6 py-4 text-gray-400">
                    {order.product_count ?? order.products?.length ?? 0}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status || 'Nouvelle commande')}`}>
                      {order.status || 'Nouvelle commande'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {order.created_at
                      ? String(order.created_at).slice(0, 10)
                      : order.createdAt || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-4 items-center">
                      <button
                        onClick={() => onSelectOrder(order)}
                        className="text-[#03ccff] hover:text-[#03ccff] transition font-medium"
                      >
                        Voir détails
                      </button>

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div className="p-4 border-t border-gray-700 flex items-center justify-between">
              <span className="text-sm text-gray-400">
                Page {pagination.currentPage} sur {pagination.totalPages} ({pagination.totalOrders} commandes Actives)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 transition"
                >
                  Précédent
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages}
                  className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 transition"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(Dashboard);