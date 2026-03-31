import React, { useState } from 'react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { getStatusColor, API_BASE_URL } from '../../utils/constants';

export default function OrderStatusDropdown({ order, userRole }) {
  const queryClient = useQueryClient();
  const [currentStatus, setCurrentStatus] = useState(order.status || 'Nouvelle commande');
  const [isUpdating, setIsUpdating] = useState(false);

  const canEdit = userRole === 'admin' || userRole === 'designer';

  if (!canEdit) {
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(currentStatus)}`}>
        {currentStatus}
      </span>
    );
  }

  const statusSteps = order.source === 'atelier' ? [
    'Nouvelle commande',
    'Réalisée',
    'Récupérée'
  ] : [
    'Nouvelle commande',
    'En design',
    'En production',
    'Expédié',
    'Livré',
    'Retourné'
  ];

  const handleStatusChange = async (e) => {
    e.stopPropagation();
    const newStatus = e.target.value;
    if (newStatus === currentStatus) return;

    const previousStatus = currentStatus;
    setCurrentStatus(newStatus);
    setIsUpdating(true);

    try {
      await axios.put(`${API_BASE_URL}/orders/${order.id}`, { ...order, status: newStatus }, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('aurea_token')}` }
      });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: ['orderStats'] });
    } catch (error) {
      console.error('Error updating status:', error);
      setCurrentStatus(previousStatus);
      alert('Erreur: Impossible de mettre à jour le statut');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative inline-block w-full max-w-[140px]" onClick={(e) => e.stopPropagation()}>
      <select
        value={currentStatus}
        onChange={handleStatusChange}
        disabled={isUpdating}
        className={`w-full px-3 py-1.5 rounded-full text-xs font-medium appearance-none cursor-pointer outline-none border-none focus:ring-2 focus:ring-[#56E1E9] text-center pl-3 pr-6 transition-colors ${getStatusColor(currentStatus)} ${isUpdating ? 'opacity-70 cursor-not-allowed' : ''}`}
        style={{ textAlignLast: 'center' }}
      >
        {statusSteps.map(status => (
          <option key={status} value={status} className="bg-[#112C70] text-gray-300">
            {status}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-current opacity-70">
        <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
        </svg>
      </div>
    </div>
  );
}
