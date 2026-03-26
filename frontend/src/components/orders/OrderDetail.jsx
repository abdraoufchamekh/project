import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Save, ChevronDown, ChevronRight, X, Upload, Check, Trash2, FileText } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';
import { getPhotoUrl, getPhotoUrlOriginal } from '../../utils/images';
import InvoicePreviewModal from './InvoicePreviewModal';

export default function OrderDetail({ order, onBack, onUpdate, userRole, onDeleteOrder }) {
  const [editMode, setEditMode] = useState(false);
  const [localOrder, setLocalOrder] = useState(order);
  const [expandedProducts, setExpandedProducts] = useState({});
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const fetchedOrderRef = useRef(null);

  // Fetch full order by ID so we always have delivery_fee, discount, and latest data from DB
  useEffect(() => {
    if (!order?.id) {
      setLocalOrder(order || {});
      fetchedOrderRef.current = order || null;
      setLoadingDetail(false);
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    axios.get(`${API_BASE_URL}/orders/${order.id}`, {
      headers: { Authorization: `Bearer ${sessionStorage.getItem('aurea_token')}` }
    })
      .then(({ data }) => {
        if (!cancelled && data.order) {
          fetchedOrderRef.current = data.order;
          setLocalOrder(data.order);
        }
      })
      .catch(() => {
        if (!cancelled) {
          fetchedOrderRef.current = order;
          setLocalOrder(order);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => { cancelled = true; };
  }, [order?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const updateOrderStatus = (newStatus) => {
    setLocalOrder({
      ...localOrder,
      status: newStatus
    });
  };

  const handleUploadProductImage = async (productId, file) => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await fetch(`${API_BASE_URL}/orders/products/${productId}/image`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('aurea_token')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const { product: updatedProduct } = await response.json();
      
      const updatedOrder = {
        ...localOrder,
        products: localOrder.products.map(p => 
          p.id === productId ? { ...p, image_url: updatedProduct.image_url } : p
        )
      };
      setLocalOrder(updatedOrder);
      
    } catch (error) {
      console.error('Error uploading product image:', error);
      alert("Erreur: Impossible d'uploader l'image");
    }
  };

  const handleSave = () => {
    onUpdate(localOrder);
    setEditMode(false);
  };

  const handleCancel = () => {
    setLocalOrder(fetchedOrderRef.current || order);
    setEditMode(false);
  };

  const productsSubtotal = (localOrder.products && localOrder.products.length > 0)
    ? localOrder.products.reduce(
        (sum, p) => sum + (Number(p.quantity) || 1) * (Number(p.unit_price ?? p.unitPrice) || 0),
        0
      )
    : Number(localOrder.products_subtotal || 0);
  const deliveryFeeAmount = Number(localOrder.delivery_fee ?? localOrder.deliveryFee ?? 0) || 0;
  const discountAmount = Number(localOrder.discount ?? 0) || 0;
  const versementAmount = Number(localOrder.versement ?? 0) || 0;
  const totalAmount = productsSubtotal + deliveryFeeAmount - discountAmount;
  const resteAPayer = Math.max(0, totalAmount - versementAmount);

  const getStatusClass = (status) => {
    if (status === 'Livré' || status === 'Récupérée') return 'bg-gray-700 text-gray-300';
    if (status === 'Expédié') return 'bg-green-900 text-green-300';
    if (status === 'En production' || status === 'Réalisée') return 'bg-yellow-900 text-yellow-300';
    if (status === 'En design') return 'bg-purple-900 text-purple-300';
    if (status === 'Retourné') return 'bg-red-900 text-red-300';
    return 'bg-blue-900 text-blue-300'; // Nouvelle commande
  };

  const statusSteps = localOrder.source === 'atelier' ? [
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

  const currentStepIdx = statusSteps.indexOf(localOrder.status || 'Nouvelle commande');

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
        <div>
          <button
            onClick={onBack}
            className="text-blue-500 hover:text-blue-400 mb-2 flex items-center gap-2 transition"
          >
            ← Retour aux commandes
          </button>
          <h2 className="text-2xl md:text-3xl font-bold text-white">Commande #{order.id}</h2>
        </div>

        <div className="flex flex-wrap gap-2 md:gap-4 w-full md:w-auto mt-2 md:mt-0">
          {!editMode ? (
            <>
              <button
                onClick={() => setInvoiceModalOpen(true)}
                className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm"
              >
                <FileText size={20} />
                Générer Facture
              </button>
              <button
                onClick={() => setEditMode(true)}
                className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-sm"
              >
                <Edit2 size={20} />
                Modifier
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Êtes-vous sûr de vouloir supprimer la commande #${order.id} ?`)) {
                    onDeleteOrder(order.id);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition shadow-sm"
                title="Supprimer la commande"
              >
                <Trash2 size={20} />
                Supprimer
              </button>
            </>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-gray-800 rounded-lg p-4 md:p-6">
          <h3 className="text-lg font-semibold text-white mb-3 md:mb-4">Informations Destinataire</h3>
          <div className="space-y-2">
            <p className="text-white font-medium">{localOrder.clientName || localOrder.client_name}</p>
            <p className="text-gray-400">
              📞 {localOrder.phone} {localOrder.phone2 || localOrder.phone2 ? `/ ${localOrder.phone2 || localOrder.phone2}` : ''}
            </p>
            <p className="text-gray-400 text-sm mt-2 border-t border-gray-700 pt-2">
              <span className="block text-gray-300 mb-1">Livraison: {localOrder.deliveryType === 'stop_desk' || localOrder.delivery_type === 'stop_desk' || localOrder.deliveryType === 'bureau' || localOrder.delivery_type === 'bureau' ? 'Point relais / Au bureau (Stop Desk)' : 'À domicile'}</span>
              <span className="block">📍 {localOrder.wilaya || localOrder.wilaya ? `${localOrder.wilaya || localOrder.wilaya}${localOrder.commune ? ` - ${localOrder.commune}` : ''}` : ''}</span>
              {(localOrder.deliveryType === 'stop_desk' || localOrder.delivery_type === 'stop_desk' || localOrder.deliveryType === 'bureau' || localOrder.delivery_type === 'bureau') && (
                <span className="block text-blue-300">🏢 {localOrder.stopDeskAgency || localOrder.stop_desk_agency || 'Au bureau'}</span>
              )}
              <span className="block mt-1">🏠 Adresse: {localOrder.address ? localOrder.address : 'Non spécifiée'}</span>
            </p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 md:p-6">
          <h3 className="text-lg font-semibold text-white mb-3 md:mb-4">Détails Commande</h3>
          <div className="space-y-2">
            <p className="text-gray-400">
              Date: <span className="text-white">{localOrder.createdAt || localOrder.created_at}</span>
            </p>
            <p className="text-gray-400">
              Produits: <span className="text-white">{localOrder.product_count || localOrder.products?.length || 0}</span>
            </p>
            {(localOrder.isFreeDelivery || localOrder.is_free_delivery) && (
              <span className="inline-block px-2 py-1 bg-green-900/50 text-green-400 text-xs rounded-full border border-green-800">
                Livraison gratuite
              </span>
            )}
            {(localOrder.hasExchange || localOrder.has_exchange) && (
              <span className="inline-block px-2 py-1 bg-yellow-900/50 text-yellow-400 text-xs rounded-full border border-yellow-800 ml-2">
                Échange
              </span>
            )}
            <div className="mt-4 space-y-1 text-sm">
              <p className="text-gray-400">Sous-total produits: <span className="text-white font-medium">{productsSubtotal.toLocaleString()} DA</span></p>
              <p className="text-gray-400">Frais de livraison: <span className="text-white font-medium">{deliveryFeeAmount.toLocaleString()} DA</span></p>
              <p className="text-gray-400">Remise: <span className="text-white font-medium">{discountAmount.toLocaleString()} DA</span></p>
              <p className="text-gray-400">Versement (Acompte): <span className="text-white font-medium text-emerald-400">{versementAmount.toLocaleString()} DA</span></p>
            </div>
            {editMode ? (
              <div className="mt-4 space-y-2">
                <label className="block text-gray-400 text-sm">Frais de livraison (DA)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={localOrder.delivery_fee ?? localOrder.deliveryFee ?? ''}
                  onChange={(e) => setLocalOrder(prev => ({ ...prev, delivery_fee: Number(e.target.value) || 0 }))}
                  className="w-full max-w-[140px] p-2 bg-gray-900 border border-gray-600 text-white rounded outline-none focus:border-blue-500"
                />
                <label className="block text-gray-400 text-sm mt-2">Remise (DA)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={localOrder.discount ?? ''}
                  onChange={(e) => setLocalOrder(prev => ({ ...prev, discount: Number(e.target.value) || 0 }))}
                  className="w-full max-w-[140px] p-2 bg-gray-900 border border-gray-600 text-white rounded outline-none focus:border-blue-500"
                />
                <label className="block text-gray-400 text-sm mt-2">Versement (DA)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={localOrder.versement ?? ''}
                  onChange={(e) => setLocalOrder(prev => ({ ...prev, versement: Number(e.target.value) || 0 }))}
                  className="w-full max-w-[140px] p-2 bg-gray-900 border border-gray-600 text-white rounded outline-none focus:border-blue-500"
                />
              </div>
            ) : null}
            <div className="mt-4 border-t border-gray-700 pt-3">
              <p className="text-gray-300 font-medium text-lg">
                Total: <span className="text-white font-bold">{totalAmount.toLocaleString()} DA</span>
              </p>
              <p className="text-gray-300 font-medium text-xl mt-1">
                Reste à payer: <span className="text-blue-400 font-bold">{resteAPayer.toLocaleString()} DA</span>
              </p>
            </div>
          </div>
        </div>


      </div>

      {/* Progress Steps UI */}
      <div className="bg-gray-800 rounded-lg p-4 md:p-6 mb-6 md:mb-8">
        <h3 className="text-xl font-semibold text-white mb-6 md:mb-8">État de la commande</h3>
        <div className="overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="relative mx-4 sm:mx-10 mb-6 min-w-[600px]">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-700 -z-0"></div>
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 -z-0 transition-all duration-500"
              style={{ width: `${(Math.max(0, currentStepIdx) / (statusSteps.length - 1)) * 100}%` }}
            ></div>
            <div className="flex justify-between relative z-10 w-full">
              {statusSteps.map((step, idx) => {
                const isCompleted = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return (
                  <div key={step} className="flex flex-col items-center">
                    <button
                      onClick={() => editMode && updateOrderStatus(step)}
                      disabled={!editMode}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${isCompleted ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-gray-800 text-gray-400 border-2 border-gray-600'
                        } ${editMode ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
                    >
                      {isCompleted && !isCurrent ? <Check size={20} /> : idx + 1}
                    </button>
                    <span className={`absolute top-12 whitespace-nowrap text-xs font-medium ${isCurrent ? 'text-blue-400 font-bold' : 'text-gray-400'}`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Photos Viewer */}
      <div className="bg-gray-800 rounded-lg p-4 md:p-6 mb-6 md:mb-8">
        <h3 className="text-xl font-semibold text-white mb-4 md:mb-6">Photos Jointes</h3>
        {localOrder.photos && localOrder.photos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {localOrder.photos.map(photo => (
              <div key={photo.id} className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700 group">
                <div className="h-64 overflow-hidden relative">
                  <img
                    src={getPhotoUrl(photo.filename, { width: 600 })}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a
                      href={getPhotoUrlOriginal(photo.filename)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-white font-medium flex items-center gap-2"
                    >
                      Agrandir
                    </a>
                  </div>
                </div>
                <div className="p-4 bg-gray-900 flex justify-between items-center border-t border-gray-800">
                  <span className="text-sm text-gray-300 truncate max-w-[60%] font-medium">
                    {photo.filename}
                  </span>
                  <a
                    href={getPhotoUrlOriginal(photo.filename)}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm font-semibold flex items-center gap-1"
                  >
                    ⬇ Télécharger
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-900/50 rounded-lg border border-gray-800 border-dashed">
            <p className="text-gray-400">Aucune photo jointe à cette commande.</p>
          </div>
        )}
      </div>

      <div className="bg-gray-800 rounded-lg p-4 md:p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Produits de la commande</h3>

        {loadingDetail && (!localOrder.products || localOrder.products.length === 0) ? (
          <p className="text-gray-400 italic">Chargement des articles...</p>
        ) : (
          localOrder.products.map(product => (
          <div key={product.id} className="bg-gray-900 rounded-lg mb-4 overflow-hidden">
            <div
              className="p-4 cursor-pointer hover:bg-gray-850 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition"
              onClick={() => toggleProduct(product.id)}
            >
              <div className="flex items-start md:items-center gap-3 w-full md:w-auto">
                <div className="mt-1 md:mt-0">
                  {expandedProducts[product.id] ? (
                    <ChevronDown size={20} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={20} className="text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-white">
                    {product.type} × {product.quantity || 1}
                  </h4>
                </div>
              </div>

              <div onClick={(e) => e.stopPropagation()} className="w-full md:w-auto flex justify-end">
                {editMode ? (
                  <select
                    value={product.status || 'Nouvelle commande'}
                    onChange={(e) => updateProductStatus(product.id, e.target.value)}
                    className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 w-full md:w-auto"
                  >
                    {statusSteps.map(status => (
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
                <div className="flex flex-col gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-400 mb-3">
                      🖼️ Photo de l'article
                    </h5>
                    <div className="space-y-4">
                      {product.image_url ? (
                        <div className="h-40 w-40 md:h-48 md:w-48 rounded-lg overflow-hidden border border-gray-700 bg-gray-900 group relative">
                          <img
                            src={getPhotoUrl(product.image_url, { width: 400 })}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <a 
                            href={getPhotoUrlOriginal(product.image_url)} 
                            target="_blank" 
                            rel="noreferrer"
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-sm font-semibold backdrop-blur-sm"
                          >
                            Agrandir
                          </a>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <p className="text-gray-500 text-sm italic">Aucune photo associée</p>
                          {userRole && (
                            <label className="cursor-pointer flex items-center gap-2 text-sm text-blue-500 hover:text-blue-400 transition w-fit px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-500 shadow-sm">
                              <Upload size={16} />
                              <span className="font-medium">Uploader l'image</span>
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleUploadProductImage(product.id, e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )))}
      </div>
      {/* Invoice Modal */}
      <InvoicePreviewModal 
        isOpen={invoiceModalOpen} 
        onClose={() => setInvoiceModalOpen(false)} 
        orderId={order.id} 
      />
    </div>
  );
}