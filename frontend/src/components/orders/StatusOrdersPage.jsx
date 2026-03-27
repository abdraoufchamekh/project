import React, { useState, useEffect, useRef } from 'react';
import { Package, Search, Filter, X, ArrowLeft } from 'lucide-react';
import { getStatusColor } from '../../utils/constants';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

function StatusOrdersPage({ config, orders, onSelectOrder, fetchOrders, pagination }) {
    const [filters, setFilters] = useState({
        search: '',
        status: config?.status || '',
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
        if (fetchOrders && config) fetchOrders({ ...config, ...filters, search: debouncedSearch, page: 1 });
    }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

    // When config changes, reset filters (list fetch is driven by App + React Query)
    useEffect(() => {
        if (config) {
            setFilters(prev => ({
                ...prev,
                status: config.status || '',
                search: '',
                wilaya: '',
                date: ''
            }));
        }
    }, [config]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handlePageChange = (newPage) => {
        if (!pagination || newPage < 1 || newPage > pagination.totalPages) return;
        if (fetchOrders) {
            fetchOrders({ ...config, ...filters, page: newPage });
        }
    };

    const applyFilters = () => {
        if (fetchOrders) fetchOrders({ ...config, ...filters, page: 1 });
    };

    const clearFilters = () => {
        const emptyFilters = { search: '', status: config?.status || '', wilaya: '', date: '' };
        setFilters(emptyFilters);
        if (fetchOrders) fetchOrders({ ...config, ...emptyFilters, page: 1 });
    };

    const filteredOrders = orders || [];

    return (
        <div className="p-8">
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <button 
                        onClick={config?.onBack}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
                    >
                        <ArrowLeft size={20} />
                        Retour au Dashboard
                    </button>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Package className="text-[#03ccff]" />
                        Commandes : {config?.title || 'Vue Filtrée'}
                    </h2>
                    <p className="text-gray-400 mt-2">
                        Aperçu des commandes pour ce statut spécifique
                    </p>
                </div>
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
                            disabled={!!config?.status} // Lock status if config defines it exactly
                        >
                            {config?.status ? (
                                <option value={config.status}>{config.title}</option>
                            ) : (
                                <>
                                    <option value="">Tous</option>
                                    <option value="Nouvelle commande">Nouvelle</option>
                                    <option value="En design">En design</option>
                                    <option value="En production">En prod</option>
                                    <option value="Livré">Livré</option>
                                    <option value="Retourné">Retourné</option>
                                </>
                            )}
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

            {filteredOrders.length === 0 ? (
                <div className="bg-[#112C70] rounded-lg p-12 text-center">
                    <Package size={48} className="mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">Aucune commande trouvée</p>
                </div>
            ) : (
                <div className="bg-[#112C70] rounded-lg overflow-hidden">
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
                                    <td className="px-6 py-4 text-gray-400">{order.product_count ?? order.products?.length ?? 0}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status || 'Nouvelle commande')}`}>
                                            {order.status || 'Nouvelle commande'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400">
                                        {order.created_at ? String(order.created_at).slice(0, 10) : order.createdAt || '—'}
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
                                Page {pagination.currentPage} sur {pagination.totalPages} ({pagination.totalOrders} commandes au total)
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

export default React.memo(StatusOrdersPage);
