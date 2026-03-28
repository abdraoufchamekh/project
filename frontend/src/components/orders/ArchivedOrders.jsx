import React, { useState, useEffect, useRef, memo } from 'react';
import { Archive, Search, Filter, X } from 'lucide-react';
import { getStatusColor } from '../../utils/constants';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

function ArchivedOrders({ orders, userRole, userId, onSelectOrder, onDeleteOrder, fetchOrders, pagination, globalStats = {} }) {
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        wilaya: '',
        date: ''
    });
    const debouncedSearch = useDebouncedValue(filters.search, 400);
    const skipSearchEffect = useRef(true);

    useEffect(() => {
        if (skipSearchEffect.current) {
            skipSearchEffect.current = false;
            return;
        }
        if (fetchOrders) fetchOrders({ ...filters, search: debouncedSearch, page: 1, status: filters.status || 'Livré,Retourné' });
    }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handlePageChange = (newPage) => {
        if (!pagination || newPage < 1 || newPage > pagination.totalPages) return;
        if (fetchOrders) {
            fetchOrders({ ...filters, page: newPage, status: filters.status || 'Livré,Retourné' });
        }
    };

    const applyFilters = () => {
        if (fetchOrders) {
            // Apply status filter or default to all archived statuses
            fetchOrders({ ...filters, page: 1, status: filters.status || 'Livré,Retourné' });
        }
    };

    const clearFilters = () => {
        const emptyFilters = { search: '', status: '', wilaya: '', date: '' };
        setFilters(emptyFilters);
        if (fetchOrders) fetchOrders({ status: 'Livré,Retourné', page: 1 });
    };

    let archivedOrders = orders;
    
    // Safety filter on frontend visuals, but backend pagination will dominate now
    archivedOrders = archivedOrders.filter(o => o.status === 'Livré' || o.status === 'Retourné');

    const glbStats = globalStats && globalStats.global ? globalStats.global : globalStats;
    
    const stats = {
        total: pagination ? pagination.totalOrders : 0,
        delivered: glbStats['Livré'] || 0,
        returned: glbStats['Retourné'] || 0
    };

    return (
        <div className="p-8">
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Archive className="text-gray-400" />
                        Commandes Archivées
                    </h2>
                    <p className="text-gray-400 mt-2">
                        Historique des commandes livrées ou retournées
                    </p>
                </div>


            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Total Archivées', value: stats.total, color: 'text-gray-300' },
                    { label: 'Livrées', value: stats.delivered, color: 'text-green-500' },
                    { label: 'Retournées', value: stats.returned, color: 'text-red-500' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-[#112C70] rounded-lg p-6">
                        <h3 className="text-gray-400 text-sm font-medium">{stat.label}</h3>
                        <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
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
                                className="w-full bg-gray-700 text-white text-sm rounded px-3 py-2 pl-9 focus:outline-none focus:ring-1 focus:ring-[#56E1E9]"
                            />
                        </div>
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-medium text-gray-400 mb-1">Statut</label>
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full bg-gray-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#56E1E9]"
                        >
                            <option value="">Tous les statuts</option>
                            <option value="Livré">Livré</option>
                            <option value="Retourné">Retourné</option>
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
                            className="w-full bg-gray-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#56E1E9]"
                        />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-medium text-gray-400 mb-1">Date</label>
                        <input
                            type="date"
                            name="date"
                            value={filters.date}
                            onChange={handleFilterChange}
                            className="w-full bg-gray-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#56E1E9]"
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
                            className="px-4 py-2 bg-[linear-gradient(135deg,_#5B58EB,_#09fbff)] hover:opacity-90 text-white text-sm font-medium rounded transition flex items-center justify-center gap-2 flex-1 md:flex-none whitespace-nowrap"
                        >
                            <Filter size={16} /> Appliquer
                        </button>
                    </div>
                </div>
            </div>

            {archivedOrders.length === 0 ? (
                <div className="bg-[#112C70] rounded-lg p-12 text-center">
                    <Archive size={48} className="mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">Aucune commande archivée trouvée</p>
                </div>
            ) : (
                <div className="bg-[#112C70] rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                        <thead className="bg-[#0A2353] border-b border-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-[#B0D8E0]">ID</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-[#B0D8E0]">Client</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-[#B0D8E0]">Téléphone</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-[#B0D8E0]">Produits</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-[#B0D8E0]">Statut</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-[#B0D8E0]">Date</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-[#B0D8E0]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {archivedOrders.map(order => (
                                <tr key={order.id} className="hover:bg-[#112C70]/70 transition">
                                    <td className="px-6 py-4 text-white font-medium">#{order.id}</td>
                                    <td className="px-6 py-4 text-gray-300">{order.clientName || order.client_name || `${order.first_name || ''} ${order.last_name || ''}`.trim() || 'Inconnu'}</td>
                                    <td className="px-6 py-4 text-gray-500">{order.phone}</td>
                                    <td className="px-6 py-4 text-gray-500">{order.product_count ?? order.products?.length ?? 0}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status || 'Nouvelle commande')}`}>
                                            {order.status || 'Nouvelle commande'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {order.created_at ? String(order.created_at).slice(0, 10) : order.createdAt || '—'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-4 items-center">
                                            <button
                                                onClick={() => onSelectOrder(order)}
                                                className="text-[#56E1E9] hover:text-[#56E1E9] transition font-medium"
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
                                Page {pagination.currentPage} sur {pagination.totalPages} ({pagination.totalOrders} archivées au total)
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
}

export default memo(ArchivedOrders);
