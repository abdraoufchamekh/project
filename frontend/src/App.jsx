import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Menu } from 'lucide-react';
import LoginPage from './components/auth/LoginPage';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/orders/Dashboard';
import ArchivedOrders from './components/orders/ArchivedOrders';
import CreateOrder from './components/orders/CreateOrder';
import CreateAtelierOrder from './components/orders/CreateAtelierOrder';
import OrderDetail from './components/orders/OrderDetail';
import SettingsPage from './components/settings/SettingsPage';
import StockManagement from './components/stock/StockManagement';
import StatusOrdersPage from './components/orders/StatusOrdersPage';

import axios from 'axios';
import { API_BASE_URL } from './utils/constants';

function MainApp() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isFetchingOrders, setIsFetchingOrders] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalOrders: 0 });
  const [globalStats, setGlobalStats] = useState({});
  const [statusPageConfig, setStatusPageConfig] = useState(null);

  const fetchStats = React.useCallback(async () => {
    try {
      const statsRes = await axios.get(`${API_BASE_URL}/orders/stats`, {
        params: { _t: Date.now() }
      });
      setGlobalStats(statsRes.data || {});
    } catch (err) { 
      console.error('Error fetching stats:', err);
    }
  }, []);

  const fetchOrders = React.useCallback(async (filters = {}, skipStats = true) => {
    try {
      setIsFetchingOrders(true);
      if (activePage === 'dashboard' && !filters.status) filters.excludeStatus = 'Livré,Retourné';
      
      const { data } = await axios.get(`${API_BASE_URL}/orders`, { 
        params: { ...filters, _t: Date.now() } 
      });
      
      setOrders(data.orders || []);
      setPagination({
        currentPage: data.currentPage || 1,
        totalPages: data.totalPages || 1,
        totalOrders: data.totalOrders || 0
      });

      // Only refetch stats on major actions (like save/delete), ignore on standard filter changes
      if (!skipStats) {
        fetchStats();
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsFetchingOrders(false);
    }
  }, [activePage, fetchStats]);

  React.useEffect(() => {
    if (user) fetchStats();
  }, [user, fetchStats]);

  React.useEffect(() => {
    if (!user) {
      setActivePage('dashboard');
      setSelectedOrder(null);
    } else if (activePage === 'dashboard' && !selectedOrder) {
      fetchOrders({ excludeStatus: 'Livré,Retourné', page: 1 });
    } else if (activePage === 'archived' && !selectedOrder) {
      fetchOrders({ status: 'Livré,Retourné', page: 1 });
    } else if (activePage === 'status-page' && !selectedOrder && statusPageConfig) {
      const { status, excludeStatus, source } = statusPageConfig;
      fetchOrders({ status, excludeStatus, source, page: 1 });
    }
  }, [user, activePage, selectedOrder, fetchOrders, statusPageConfig]);

  // Early returns moved below hooks

  const handleSaveOrder = React.useCallback(async (newOrderData, photos) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/orders`, newOrderData);
      const createdOrder = response.data.order;

      // Navigate instantly for performance
      setActivePage('dashboard');
      setIsSidebarOpen(false);
      fetchOrders({}, false); // Don't skip stats on new order

      // Upload photos non-blocking
      if (photos && photos.length > 0) {
        const formData = new FormData();
        photos.forEach(file => formData.append('photos', file));
        formData.append('type', 'client');
        axios.post(`${API_BASE_URL}/orders/${createdOrder.id}/photos`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        }).then(() => fetchOrders()).catch(err => {
          console.error('Background photo upload failed', err);
          alert("Commande créée, mais les photos n'ont pas pu être téléchargées.");
        });
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Erreur: Impossible de créer la commande');
    }
  }, [fetchOrders]);

  const handleSaveAtelierOrder = React.useCallback(async (newOrderData, photos) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/orders`, newOrderData);
      const createdOrder = response.data.order;

      // Navigate instantly for performance
      setActivePage('dashboard');
      setIsSidebarOpen(false);
      fetchOrders({}, false); // Update stats for new order

      // Upload photos non-blocking
      if (photos && photos.length > 0) {
        const formData = new FormData();
        photos.forEach(file => formData.append('photos', file));
        formData.append('type', 'designer');
        axios.post(`${API_BASE_URL}/orders/${createdOrder.id}/photos`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        }).then(() => fetchOrders()).catch(err => {
          console.error('Background photo upload failed', err);
          alert("Commande créée, mais les photos n'ont pas pu être téléchargées.");
        });
      }
    } catch (error) {
      console.error('Error creating atelier order:', error);
      alert('Erreur: Impossible de créer la commande');
    }
  }, [fetchOrders]);

  const handleUpdateOrder = React.useCallback(async (updatedOrder) => {
    try {
      await axios.put(`${API_BASE_URL}/orders/${updatedOrder.id}`, updatedOrder);
      // Update individual product statuses if we had changed them, actually the order update might not cover products if backend doesn't support it in put.
      // But OrderDetail only calls onUpdate at the end. For now, we update order state.
      setSelectedOrder(null);
      fetchOrders({}, false); // Update stats after a deletion or state change
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Erreur: Impossible de mettre à jour la commande');
    }
  }, [fetchOrders]);

  const handleDeleteOrder = React.useCallback(async (orderId) => {
    try {
      await axios.delete(`${API_BASE_URL}/orders/${orderId}`);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(null);
      }
      fetchOrders({}, false); // Update stats
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Erreur: Impossible de supprimer la commande');
    }
  }, [fetchOrders, selectedOrder]);

  const handleNavigateToStatus = React.useCallback((targetKey) => {
    let config = null;
    if (targetKey === 'en-atelier') config = { title: 'En atelier', source: 'atelier', excludeStatus: 'Livré,Retourné' };
    else if (targetKey === 'en-ligne') config = { title: 'En ligne', source: 'admin', excludeStatus: 'Livré,Retourné' };
    
    // Status specific flows within 'en atelier'
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
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
        {/* Mobile Header */}
        <div className="md:hidden bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between z-20">
          <h1 className="text-xl font-bold text-blue-500">Auréa Déco</h1>
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-400 hover:text-white transition p-1">
            <Menu size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-auto">
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