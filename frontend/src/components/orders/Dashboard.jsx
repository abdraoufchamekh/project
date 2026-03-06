import React from 'react';
import { Package } from 'lucide-react';
import { getStatusColor } from '../../utils/constants';

export default function Dashboard({ orders, userRole, userId, onSelectOrder }) {
  const filteredOrders = userRole === 'designer'
    ? orders.filter(o => o.assignedDesigner === userId)
    : orders;

  const getOrderStatus = (products) => {
    if (!products || products.length === 0) return 'En attente';
    if (products.every(p => p.status === 'Livré')) return 'Livré';
    if (products.some(p => p.status === 'Expédié')) return 'Expédié';
    if (products.some(p => p.status === 'En impression')) return 'En impression';
    if (products.some(p => p.status === 'Design en cours')) return 'Design en cours';
    return 'En attente';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">Commandes</h2>
        <p className="text-gray-400 mt-2">
          {filteredOrders.length} commande(s) {userRole === 'designer' && 'assignée(s)'}
        </p>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-12 text-center">
          <Package size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">Aucune commande trouvée</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
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
                  <td className="px-6 py-4 text-white">{order.clientName}</td>
                  <td className="px-6 py-4 text-gray-400">{order.phone}</td>
                  <td className="px-6 py-4 text-gray-400">{order.products.length}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(getOrderStatus(order.products))}`}>
                      {getOrderStatus(order.products)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{order.createdAt}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onSelectOrder(order)}
                      className="text-blue-500 hover:text-blue-400 transition font-medium"
                    >
                      Voir détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}