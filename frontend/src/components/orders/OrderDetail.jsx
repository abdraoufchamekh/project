import React, { useState } from 'react';
import { Edit2, Save, ChevronDown, ChevronRight, X, Upload } from 'lucide-react';
import { statuses } from '../../utils/constants';

export default function OrderDetail({ order, onBack, onUpdate, userRole }) {
  const [editMode, setEditMode] = useState(false);
  const [localOrder, setLocalOrder] = useState(order);
  const [expandedProducts, setExpandedProducts] = useState({});

  const toggleProduct = (productId) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const updateProductStatus = (productId, newStatus) => {
    const updated = {
      ...localOrder,
      products: localOrder.products.map(p =>
        p.id === productId ? { ...p, status: newStatus } : p
      )
    };
    setLocalOrder(updated);
  };

  const handleSave = () => {
    onUpdate(localOrder);
    setEditMode(false);
  };

  const handleCancel = () => {
    setLocalOrder(order);
    setEditMode(false);
  };

  const totalAmount = localOrder.products.reduce(
    (sum, p) => sum + p.quantity * p.unitPrice,
    0
  );

  const getStatusClass = (status) => {
    if (status === 'Livré') return 'bg-gray-700 text-gray-300';
    if (status === 'Expédié') return 'bg-green-900 text-green-300';
    if (status === 'En impression') return 'bg-purple-900 text-purple-300';
    if (status === 'Design en cours') return 'bg-blue-900 text-blue-300';
    return 'bg-yellow-900 text-yellow-300';
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <button
            onClick={onBack}
            className="text-blue-500 hover:text-blue-400 mb-2 flex items-center gap-2 transition"
          >
            ← Retour aux commandes
          </button>
          <h2 className="text-3xl font-bold text-white">Commande #{order.id}</h2>
        </div>

        <div className="flex gap-4">
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              <Edit2 size={20} />
              Modifier
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
              >
                <X size={20} />
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
              >
                <Save size={20} />
                Enregistrer
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Informations Client</h3>
          <div className="space-y-2">
            <p className="text-white font-medium">{localOrder.clientName}</p>
            <p className="text-gray-400">📞 {localOrder.phone}</p>
            <p className="text-gray-400">📍 {localOrder.address || 'Adresse non spécifiée'}</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Détails Commande</h3>
          <div className="space-y-2">
            <p className="text-gray-400">
              Date: <span className="text-white">{localOrder.createdAt}</span>
            </p>
            <p className="text-gray-400">
              Produits: <span className="text-white">{localOrder.products.length}</span>
            </p>
            <p className="text-white font-bold text-xl mt-4">
              {totalAmount.toLocaleString()} DA
            </p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Actions Livraison</h3>
          <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium flex items-center justify-center gap-2">
            📦 Expédier via Yalidine
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Intégration API à venir
          </p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Produits de la commande</h3>

        {localOrder.products.map(product => (
          <div key={product.id} className="bg-gray-900 rounded-lg mb-4 overflow-hidden">
            <div
              className="p-4 cursor-pointer hover:bg-gray-850 flex justify-between items-center transition"
              onClick={() => toggleProduct(product.id)}
            >
              <div className="flex items-center gap-4">
                {expandedProducts[product.id] ? (
                  <ChevronDown size={20} className="text-gray-400" />
                ) : (
                  <ChevronRight size={20} className="text-gray-400" />
                )}
                <div>
                  <h4 className="text-lg font-medium text-white">
                    {product.type} × {product.quantity}
                  </h4>
                  <p className="text-gray-400 text-sm">
                    {product.unitPrice.toLocaleString()} DA / unité • Total:{' '}
                    <span className="font-semibold text-white">
                      {(product.quantity * product.unitPrice).toLocaleString()} DA
                    </span>
                  </p>
                </div>
              </div>

              <div onClick={(e) => e.stopPropagation()}>
                {editMode ? (
                  <select
                    value={product.status}
                    onChange={(e) => updateProductStatus(product.id, e.target.value)}
                    className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(
                      product.status
                    )}`}
                  >
                    {product.status}
                  </span>
                )}
              </div>
            </div>

            {expandedProducts[product.id] && (
              <div className="p-4 border-t border-gray-800 bg-gray-850">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-400 mb-3">
                      📸 Images Client
                    </h5>
                    <div className="space-y-2">
                      <p className="text-gray-300">{product.clientImages || 0} image(s) uploadée(s)</p>
                      {userRole === 'admin' && (
                        <button className="text-sm text-blue-500 hover:text-blue-400 flex items-center gap-2">
                          <Upload size={16} />
                          Ajouter des images
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-400 mb-3">
                      🎨 Designs Finaux
                    </h5>
                    <div className="space-y-2">
                      <p className="text-gray-300">{product.designerImages || 0} design(s)</p>
                      {(userRole === 'designer' || userRole === 'admin') && (
                        <button className="text-sm text-blue-500 hover:text-blue-400 flex items-center gap-2">
                          <Upload size={16} />
                          Uploader designs
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}