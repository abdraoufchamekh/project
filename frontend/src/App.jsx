import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/auth/LoginPage';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/orders/Dashboard';
import CreateOrder from './components/orders/CreateOrder';
import OrderDetail from './components/orders/OrderDetail';
import DesignersPage from './components/designers/DesignersPage';
import SettingsPage from './components/settings/SettingsPage';

// Mock initial orders
const initialOrders = [
  {
    id: 1,
    clientName: 'Fatima Benali',
    phone: '0555 123 456',
    address: 'Cité 20 Août, Sétif',
    createdAt: '2025-10-15',
    assignedDesigner: 2,
    products: [
      {
        id: 101,
        type: 'Cadre',
        quantity: 2,
        unitPrice: 1500,
        status: 'Design en cours',
        clientImages: 2,
        designerImages: 1
      },
      {
        id: 102,
        type: 'Couvre',
        quantity: 1,
        unitPrice: 3000,
        status: 'En attente',
        clientImages: 1,
        designerImages: 0
      }
    ]
  },
  {
    id: 2,
    clientName: 'Ahmed Mansouri',
    phone: '0661 234 567',
    address: 'El Hidhab, Sétif',
    createdAt: '2025-10-16',
    assignedDesigner: 2,
    products: [
      {
        id: 201,
        type: 'Drap',
        quantity: 3,
        unitPrice: 2500,
        status: 'En attente',
        clientImages: 1,
        designerImages: 0
      }
    ]
  }
];

function MainApp() {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState(null);

  if (!user) {
    return <LoginPage />;
  }

  const handleSaveOrder = (newOrder) => {
    setOrders([newOrder, ...orders]);
    setActivePage('dashboard');
  };

  const handleUpdateOrder = (updatedOrder) => {
    setOrders(orders.map(o => (o.id === updatedOrder.id ? updatedOrder : o)));
    setSelectedOrder(null);
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar active={activePage} setActive={setActivePage} />

      <div className="flex-1 overflow-auto">
        {selectedOrder ? (
          <OrderDetail
            order={selectedOrder}
            onBack={() => setSelectedOrder(null)}
            onUpdate={handleUpdateOrder}
            userRole={user.role}
          />
        ) : activePage === 'dashboard' ? (
          <Dashboard
            orders={orders}
            userRole={user.role}
            userId={user.id}
            onSelectOrder={setSelectedOrder}
          />
        ) : activePage === 'create' ? (
          <CreateOrder onSave={handleSaveOrder} />
        ) : activePage === 'designers' ? (
          <DesignersPage />
        ) : (
          <SettingsPage />
        )}
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