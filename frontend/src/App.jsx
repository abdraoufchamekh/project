import React, { Suspense, useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Menu } from 'lucide-react';
import LoginPage from './components/auth/LoginPage';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/orders/Dashboard';
import ArchivedOrders from './components/orders/ArchivedOrders';
import StatusOrdersPage from './components/orders/StatusOrdersPage';

import axios from 'axios';
import { API_BASE_URL } from './utils/constants';
import { sanitizeOrderListParams, stableOrderListKey } from './utils/orderListParams';

const CreateOrder = React.lazy(() => import('./components/orders/CreateOrder'));
const CreateAtelierOrder = React.lazy(() => import('./components/orders/CreateAtelierOrder'));
const OrderDetail = React.lazy(() => import('./components/orders/OrderDetail'));
const SettingsPage = React.lazy(() => import('./components/settings/SettingsPage'));
const StockManagement = React.lazy(() => import('./components/stock/StockManagement'));

const pageFallback = (
  <div className="min-h-[40vh] flex items-center justify-center text-gray-400 text-sm">
    Chargement…
  </div>
);

function MainApp() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [listParams, setListParams] = useState(null);
  const [statusPageConfig, setStatusPageConfig] = useState(null);

  useEffect(() => {
    if (!user || selectedOrder) return;
    if (activePage === 'dashboard') {
      setListParams(sanitizeOrderListParams({ excludeStatus: 'Livré,Retourné', page: 1 }));
    } else if (activePage === 'archived') {
      setListParams(sanitizeOrderListParams({ status: 'Livré,Retourné', page: 1 }));
    } else if (activePage === 'status-page' && statusPageConfig) {
      const { status, excludeStatus, source } = statusPageConfig;
      setListParams(
        sanitizeOrderListParams({
          status: status || '',
          excludeStatus,
          source,
          page: 1
        })
      );
    } else if (['create', 'create-atelier', 'settings', 'stock'].includes(activePage)) {
      setListParams(null);
    }
  }, [user, activePage, selectedOrder, statusPageConfig]);

  const ordersQueryKey = useMemo(
    () => ['orders', activePage, stableOrderListKey(listParams)],
    [activePage, listParams]
  );

  const { data: ordersPayload, isFetching: isFetchingOrders } = useQuery({
    queryKey: ordersQueryKey,
    queryFn: async () => {
      const params = { ...sanitizeOrderListParams(listParams) };
      if (activePage === 'dashboard' && !params.status) {
        params.excludeStatus = params.excludeStatus || 'Livré,Retourné';
      }
      const { data } = await axios.get(`${API_BASE_URL}/orders`, { params });
      return data;
    },
    enabled: Boolean(user && listParams && !selectedOrder),
    placeholderData: (previousData) => previousData
  });

  const orders = ordersPayload?.orders ?? [];
  const pagination = useMemo(
    () =>
      ordersPayload
        ? {
            currentPage: ordersPayload.currentPage || 1,
            totalPages: ordersPayload.totalPages || 1,
            totalOrders: ordersPayload.totalOrders || 0
          }
        : { currentPage: 1, totalPages: 1, totalOrders: 0 },
    [ordersPayload]
  );

  const { data: globalStats = {} } = useQuery({
    queryKey: ['orderStats'],
    queryFn: () => axios.get(`${API_BASE_URL}/orders/stats`).then((r) => r.data),
    enabled: Boolean(user),
    staleTime: 30_000
  });

  const fetchOrders = useCallback(
    (filters = {}, skipStats = true) => {
      setListParams((prev) => {
        const merged = { ...(prev || {}), ...filters };
        if (activePage === 'dashboard' && !merged.status) {
          merged.excludeStatus = merged.excludeStatus || 'Livré,Retourné';
        }
        return sanitizeOrderListParams(merged);
      });
      if (!skipStats) {
        queryClient.invalidateQueries({ queryKey: ['orderStats'] });
      }
    },
    [activePage, queryClient]
  );

  const handleSaveOrder = useCallback(
    (newOrderData, photos) => {
      // Optimistic instant redirect
      setActivePage('dashboard');
      setIsSidebarOpen(false);

      // Background processing
      (async () => {
        try {
          const response = await axios.post(`${API_BASE_URL}/orders`, newOrderData);
          const createdOrder = response.data.order;

          await queryClient.invalidateQueries({ queryKey: ['orders'] });
          await queryClient.invalidateQueries({ queryKey: ['orderStats'] });

          if (photos && photos.length > 0) {
            const formData = new FormData();
            photos.forEach((file) => formData.append('photos', file));
            formData.append('type', 'client');
            axios
              .post(`${API_BASE_URL}/orders/${createdOrder.id}/photos`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              })
              .then(() => queryClient.invalidateQueries({ queryKey: ['orders'] }))
              .catch((err) => {
                console.error('Background photo upload failed', err);
                alert("Commande créée, mais les photos n'ont pas pu être téléchargées.");
              });
          }
        } catch (error) {
          console.error('Error creating order:', error);
          alert('Erreur: Impossible de créer la commande');
        }
      })();
    },
    [queryClient]
  );

  const handleSaveAtelierOrder = useCallback(
    (newOrderData, photos) => {
      // Optimistic instant redirect
      setActivePage('dashboard');
      setIsSidebarOpen(false);

      // Background processing
      (async () => {
        try {
          const response = await axios.post(`${API_BASE_URL}/orders`, newOrderData);
          const createdOrder = response.data.order;

          await queryClient.invalidateQueries({ queryKey: ['orders'] });
          await queryClient.invalidateQueries({ queryKey: ['orderStats'] });

          if (photos && photos.length > 0) {
            const formData = new FormData();
            photos.forEach((file) => formData.append('photos', file));
            formData.append('type', 'designer');
            axios
              .post(`${API_BASE_URL}/orders/${createdOrder.id}/photos`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              })
              .then(() => queryClient.invalidateQueries({ queryKey: ['orders'] }))
              .catch((err) => {
                console.error('Background photo upload failed', err);
                alert("Commande créée, mais les photos n'ont pas pu être téléchargées.");
              });
          }
        } catch (error) {
          console.error('Error creating atelier order:', error);
          alert('Erreur: Impossible de créer la commande');
        }
      })();
    },
    [queryClient]
  );

  const handleUpdateOrder = useCallback(
    async (updatedOrder) => {
      try {
        await axios.put(`${API_BASE_URL}/orders/${updatedOrder.id}`, updatedOrder);
        setSelectedOrder(null);
        await queryClient.invalidateQueries({ queryKey: ['orders'] });
        await queryClient.invalidateQueries({ queryKey: ['orderStats'] });
      } catch (error) {
        console.error('Error updating order:', error);
        alert('Erreur: Impossible de mettre à jour la commande');
      }
    },
    [queryClient]
  );

  const handleDeleteOrder = useCallback(
    async (orderId) => {
      try {
        await axios.delete(`${API_BASE_URL}/orders/${orderId}`);
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(null);
        }
        await queryClient.invalidateQueries({ queryKey: ['orders'] });
        await queryClient.invalidateQueries({ queryKey: ['orderStats'] });
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Erreur: Impossible de supprimer la commande');
      }
    },
    [queryClient, selectedOrder]
  );

  const handleNavigateToStatus = useCallback((targetKey) => {
    let config = null;
    if (targetKey === 'en-atelier') config = { title: 'En atelier', source: 'atelier', excludeStatus: 'Livré,Retourné' };
    else if (targetKey === 'en-ligne') config = { title: 'En ligne', source: 'admin', excludeStatus: 'Livré,Retourné' };
    else if (targetKey === 'atelier-nouvelle') config = { title: 'Nouvelle commande', status: 'Nouvelle commande', source: 'atelier' };
    else if (targetKey === 'atelier-realisee') config = { title: 'Réalisée', status: 'Réalisée', source: 'atelier' };
    else if (targetKey === 'atelier-recuperee') config = { title: 'Récupérée', status: 'Récupérée', source: 'atelier' };
    else if (targetKey === 'livrees') config = { title: 'Livrées', status: 'Livré' };
    else if (targetKey === 'retournees') config = { title: 'Retournées', status: 'Retourné' };

    if (config) {
      setStatusPageConfig(config);
      setActivePage('status-page');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A2353] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#03ccff]"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen bg-[#0A2353] overflow-hidden">
      <Sidebar
        active={activePage}
        setActive={(page) => {
          setActivePage(page);
          setIsSidebarOpen(false);
        }}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="md:hidden bg-[#0A2353] border-b border-gray-800 p-4 flex items-center justify-between z-20">
          <h1 className="text-xl font-bold text-[#03ccff]">Auréa Déco</h1>
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-400 hover:text-white transition p-1">
            <Menu size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <Suspense fallback={pageFallback}>
            {selectedOrder ? (
              <OrderDetail
                order={selectedOrder}
                onBack={() => setSelectedOrder(null)}
                onUpdate={handleUpdateOrder}
                userRole={user.role}
                onDeleteOrder={handleDeleteOrder}
              />
            ) : activePage === 'archived' ? (
              <ArchivedOrders
                orders={orders}
                userRole={user.role}
                userId={user.id}
                onSelectOrder={setSelectedOrder}
                onDeleteOrder={handleDeleteOrder}
                fetchOrders={fetchOrders}
                pagination={pagination}
                globalStats={globalStats}
              />
            ) : activePage === 'create' ? (
              <CreateOrder onSave={handleSaveOrder} />
            ) : activePage === 'create-atelier' ? (
              <CreateAtelierOrder onSave={handleSaveAtelierOrder} />
            ) : activePage === 'settings' && user.role === 'admin' ? (
              <SettingsPage />
            ) : activePage === 'stock' && user.role === 'admin' ? (
              <StockManagement />
            ) : activePage === 'status-page' && statusPageConfig ? (
              <StatusOrdersPage
                config={{
                  ...statusPageConfig,
                  onBack: () => {
                    setActivePage('dashboard');
                    setStatusPageConfig(null);
                  }
                }}
                orders={orders}
                onSelectOrder={setSelectedOrder}
                fetchOrders={fetchOrders}
                pagination={pagination}
              />
            ) : (
              <Dashboard
                orders={orders}
                userRole={user.role}
                userId={user.id}
                onSelectOrder={setSelectedOrder}
                onDeleteOrder={handleDeleteOrder}
                fetchOrders={fetchOrders}
                pagination={pagination}
                globalStats={globalStats}
                onNavigateToStatus={handleNavigateToStatus}
                isFetchingOrders={isFetchingOrders}
              />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
