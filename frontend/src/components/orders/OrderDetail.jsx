import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Save, ChevronDown, ChevronRight, X, Upload, Check, Trash2, FileText, Plus } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';
import { getPhotoUrl, getPhotoUrlOriginal } from '../../utils/images';
import InvoicePreviewModal from './InvoicePreviewModal';
import { syncYalidineOrder, getParcelStatus } from '../../api/yalidine';
import ProductSelect from './ProductSelect';

export default function OrderDetail({ order, onBack, onUpdate, userRole, onDeleteOrder }) {
  const [editMode, setEditMode] = useState(false);
  const [localOrder, setLocalOrder] = useState(order);
  const [expandedProducts, setExpandedProducts] = useState({});
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(true);
  
  // Yalidine States
  const [liveYalidineStatus, setLiveYalidineStatus] = useState(null);
  const [isSyncingYalidine, setIsSyncingYalidine] = useState(false);

  // Product Editing States
  const [isEditingProducts, setIsEditingProducts] = useState(false);
  const [tempProducts, setTempProducts] = useState([]);
  const [stockProducts, setStockProducts] = useState([]);
  const [showAddRow, setShowAddRow] = useState(false);
  const [newProduct, setNewProduct] = useState({
    inventoryItemId: '',
    quantity: 1,
    unitPrice: 0,
    type: '',
    article_type: 'stock'
  });

  const fetchedOrderRef = useRef(null);

  const fetchStockProducts = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/stock`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('aurea_token')}` }
      });
      setStockProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching stock products:', error);
    }
  };

  const startEditingProducts = () => {
    fetchStockProducts();
    setTempProducts(localOrder.products || []);
    setIsEditingProducts(true);
    setShowAddRow(false);
  };

  const handleTempProductChange = (idOrTempId, field, value) => {
    setTempProducts(prev => prev.map(p => {
      const isMatch = p.id ? Number(p.id) === Number(idOrTempId) : p.tempId === idOrTempId;
      if (isMatch) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const handleRemoveTempProduct = (idOrTempId) => {
    setTempProducts(prev => prev.filter(p => (p.id ? Number(p.id) !== Number(idOrTempId) : p.tempId !== idOrTempId)));
  };

  const getProductLabel = (sp) => {
    let labelParts = [];
    if (sp.color) labelParts.push(sp.color);
    if (sp.dimension) labelParts.push(sp.dimension);
    if (sp.size) labelParts.push(`Taille: ${sp.size}`);
    const label = labelParts.length > 0 ? labelParts.join(' - ') : '';
    return label ? `${sp.name} (${label})` : sp.name;
  };

  const handleNewProductSelect = (itemId) => {
    if (!itemId) {
      setNewProduct(prev => ({ ...prev, inventoryItemId: '', type: '', unitPrice: 0 }));
      return;
    }
    const item = stockProducts.find(sp => String(sp.id) === String(itemId));
    if (item) {
      setNewProduct(prev => ({
        ...prev,
        inventoryItemId: itemId,
        type: getProductLabel(item),
        unitPrice: item.price || 0
      }));
    }
  };

  const handleConfirmAddProduct = () => {
    if (!newProduct.type) {
      alert("Veuillez sélectionner un produit.");
      return;
    }
    if (newProduct.quantity <= 0) {
      alert("La quantité doit être supérieure à 0.");
      return;
    }

    const selectedStockItem = stockProducts.find(sp => String(sp.id) === String(newProduct.inventoryItemId));
    const tempId = `temp_${Date.now()}`;
    const added = {
      ...newProduct,
      tempId,
      unit_price: newProduct.unitPrice,
      inventory_item_id: newProduct.inventoryItemId,
      imageUrl: selectedStockItem?.image_url || null,
      status: 'En attente'
    };

    setTempProducts(prev => [...prev, added]);
    setNewProduct({
      inventoryItemId: '',
      quantity: 1,
      unitPrice: 0,
      type: '',
      article_type: 'stock'
    });
    setShowAddRow(false);
  };

  const handleCancelAddProduct = () => {
    setNewProduct({
      inventoryItemId: '',
      quantity: 1,
      unitPrice: 0,
      type: '',
      article_type: 'stock'
    });
    setShowAddRow(false);
  };

  const handleCancelProductEdit = () => {
    setIsEditingProducts(false);
    setTempProducts([]);
    setShowAddRow(false);
  };

  const handleSaveProductEdit = async () => {
    try {
      const invalidProduct = tempProducts.find(p => !p.quantity || p.quantity <= 0);
      if (invalidProduct) {
        alert("Tous les produits doivent avoir une quantité supérieure à 0.");
        return;
      }

      const payload = {
        ...localOrder,
        products: tempProducts
      };

      const response = await axios.put(`${API_BASE_URL}/orders/${localOrder.id}`, payload, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('aurea_token')}` }
      });

      if (response.data && response.data.order) {
        setLocalOrder(response.data.order);
        setIsEditingProducts(false);
      }
    } catch (error) {
      console.error("Error updating order products:", error);
      alert("Erreur: Impossible de sauvegarder les modifications des produits. " + (error.response?.data?.error || error.message));
    }
  };

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

  // Fetch Yalidine Live Status
  useEffect(() => {
    if (userRole === 'admin' && localOrder.yalidine_status === 'success' && localOrder.yalidine_tracking) {
       getParcelStatus(localOrder.yalidine_tracking)
         .then(res => setLiveYalidineStatus(res.last_status))
         .catch(err => console.error("Could not fetch live yalidine status", err));
    }
  }, [userRole, localOrder.yalidine_status, localOrder.yalidine_tracking]);

  const handleSyncYalidine = async () => {
    setIsSyncingYalidine(true);
    try {
      const result = await syncYalidineOrder(localOrder.id);
      setLocalOrder(prev => ({
        ...prev,
        ...result.order,
        products: prev.products || [],
        photos: prev.photos || []
      }));
    } catch (err) {
      alert("Erreur lors de la synchronisation Yalidine: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSyncingYalidine(false);
    }
  };

  const toggleProduct = (productId) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const updateProductStatus = (productId, newStatus) => {
    const updated = {
      ...localOrder,
      products: (localOrder.products || []).map(p =>
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
        products: (localOrder.products || []).map(p =>
          p.id === productId ? { ...p, image_url: updatedProduct.image_url } : p
        )
      };
      setLocalOrder(updatedOrder);

    } catch (error) {
      console.error('Error uploading product image:', error);
      alert("Erreur: Impossible d'uploader l'image");
    }
  };

  const handleDeleteProductImage = async (productId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer l'image de ce produit ?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/orders/products/${productId}/image`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('aurea_token')}` }
      });
      setLocalOrder(prev => ({
        ...prev,
        products: prev.products.map(p => p.id === productId ? { ...p, image_url: null } : p)
      }));
    } catch (error) {
      console.error('Error deleting product image:', error);
      alert("Erreur lors de la suppression de l'image du produit.");
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette photo ?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/orders/photos/${photoId}`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('aurea_token')}` }
      });
      setLocalOrder(prev => ({
        ...prev,
        photos: prev.photos.filter(p => p.id !== photoId)
      }));
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert("Erreur lors de la suppression de la photo.");
    }
  };
  const handleAddPhoto = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('photos', files[i]);
    }
    // Set type as 'client' or determine by user role.
    formData.append('type', 'client');

    try {
      const response = await fetch(`${API_BASE_URL}/orders/${order.id}/photos`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('aurea_token')}`
        },
        body: formData
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      const data = await response.json();
      setLocalOrder(prev => ({
        ...prev,
        photos: [...(prev.photos || []), ...data.photos]
      }));
    } catch (error) {
      console.error('Error adding photos:', error);
      alert("Erreur: Impossible d'ajouter la/les photo(s)");
    }
    e.target.value = '';
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
    ? (localOrder.products || []).reduce(
      (sum, p) => sum + (Number(p.quantity) || 1) * (Number(p.unit_price ?? p.unitPrice) || 0),
      0
    )
    : Number(localOrder.products_subtotal || 0);
  const totalAmount = productsSubtotal;

  const getStatusClass = (status) => {
    if (status === 'Livré' || status === 'Récupérée') return 'bg-gray-700 text-gray-300';
    if (status === 'Expédié') return 'bg-green-900 text-green-300';
    if (status === 'En production' || status === 'Réalisée') return 'bg-yellow-900 text-yellow-300';
    if (status === 'En design') return 'bg-purple-900 text-purple-300';
    if (status === 'Retourné') return 'bg-red-900 text-red-300';
    return 'bg-[#5B58EB] text-white'; // Nouvelle commande
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
            className="text-[#56E1E9] hover:text-[#56E1E9] mb-2 flex items-center gap-2 transition"
          >
            ← Retour aux commandes
          </button>
          <h2 className="text-2xl md:text-3xl font-bold text-white">Commande #{order.seq_id || order.id}</h2>
        </div>

        <div className="flex flex-wrap gap-2 md:gap-4 w-full md:w-auto mt-2 md:mt-0">
          {!editMode ? (
            <>
              {userRole !== 'designer' && (
                <button
                  onClick={() => setInvoiceModalOpen(true)}
                  className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm"
                >
                  <FileText size={20} />
                  Générer Facture
                </button>
              )}
              <button
                onClick={() => setEditMode(true)}
                className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2 bg-[linear-gradient(135deg,_#5B58EB,_#09fbff)] hover:opacity-90 text-white rounded-lg transition shadow-sm"
              >
                <Edit2 size={20} />
                Modifier
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Êtes-vous sûr de vouloir supprimer la commande #${order.seq_id || order.id} ?`)) {
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

      <div className={`grid grid-cols-1 ${!(userRole === 'designer' && localOrder.source !== 'atelier') ? 'md:grid-cols-2' : ''} gap-4 md:gap-6 mb-6 md:mb-8`}>
        <div className="bg-[#112C70] rounded-lg p-4 md:p-6">
          <h3 className="text-lg font-semibold text-white mb-3 md:mb-4">Informations Destinataire</h3>
          <div className="space-y-2">
            <p className="text-white font-medium">{localOrder.clientName || localOrder.client_name}</p>
            <p className="text-gray-400">
              📞 {localOrder.phone} {localOrder.phone2 || localOrder.phone2 ? `/ ${localOrder.phone2 || localOrder.phone2}` : ''}
            </p>
            <p className="text-gray-400 text-sm mt-2 border-t border-gray-700 pt-2">
              {localOrder.source !== 'atelier' && localOrder.deliveryType !== 'sur_place' && localOrder.delivery_type !== 'sur_place' && (
                <span className="block text-gray-300 mb-1">Livraison: {localOrder.deliveryType === 'stop_desk' || localOrder.delivery_type === 'stop_desk' || localOrder.deliveryType === 'bureau' || localOrder.delivery_type === 'bureau' ? 'Point relais / Au bureau (Stop Desk)' : 'À domicile'}
                  {localOrder.delivery_carrier === 'guepex' && (
                    <span className="inline-block px-2 py-0.5 bg-orange-900/50 text-orange-400 text-xs rounded-full border border-orange-800 ml-2">📦 Guepex</span>
                  )}
                  {localOrder.delivery_carrier === 'yalidine' && (
                    <span className="inline-block px-2 py-0.5 bg-blue-900/50 text-blue-400 text-xs rounded-full border border-blue-800 ml-2">📦 Yalidine</span>
                  )}
                  {!localOrder.delivery_carrier && localOrder.delivery_type === 'domicile' && (
                    <span className="inline-block px-2 py-0.5 bg-orange-900/50 text-orange-400 text-xs rounded-full border border-orange-800 ml-2">📦 Guepex</span>
                  )}
                  {!localOrder.delivery_carrier && localOrder.delivery_type === 'stop_desk' && (
                    <span className="inline-block px-2 py-0.5 bg-blue-900/50 text-blue-400 text-xs rounded-full border border-blue-800 ml-2">📦 Yalidine</span>
                  )}
                </span>
              )}
              <span className="block">📍 {localOrder.wilaya || localOrder.wilaya ? `${localOrder.wilaya || localOrder.wilaya}${localOrder.commune ? ` - ${localOrder.commune}` : ''}` : ''}</span>
              {(localOrder.deliveryType === 'stop_desk' || localOrder.delivery_type === 'stop_desk' || localOrder.deliveryType === 'bureau' || localOrder.delivery_type === 'bureau') && (
                <span className="block text-[#56E1E9]">🏢 {localOrder.stopDeskAgency || localOrder.stop_desk_agency || 'Au bureau'}</span>
              )}
              <span className="block mt-1">🏠 Adresse: {localOrder.address ? localOrder.address : 'Non spécifiée'}</span>
            </p>
          </div>
        </div>

        {!(userRole === 'designer' && localOrder.source !== 'atelier') && (
          <div className="bg-[#112C70] rounded-lg p-4 md:p-6">
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
                {userRole === 'designer' && (
                  <>
                    <p className="text-gray-400">Prix Total des produits: <span className="text-white font-medium">{productsSubtotal.toLocaleString()} DA</span></p>
                    <p className="text-gray-400">Versement (Acompte): <span className="text-white font-medium text-emerald-400">{(Number(localOrder.versement) || 0).toLocaleString()} DA</span></p>
                    <p className="text-gray-400">Reste à payer: <span className="text-[#BB63FF] font-bold">{(Math.max(0, productsSubtotal - (Number(localOrder.versement) || 0))).toLocaleString()} DA</span></p>
                  </>
                )}
              </div>
              {editMode && userRole === 'designer' ? (
                <div className="mt-4 space-y-2">
                  <label className="block text-gray-400 text-sm">Versement (Acompte) (DA)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={localOrder.versement ?? ''}
                    onChange={(e) => setLocalOrder(prev => ({ ...prev, versement: Number(e.target.value) || 0 }))}
                    className="w-full max-w-[140px] p-2 bg-[#0A2353] border border-gray-600 text-white rounded outline-none focus:border-[#56E1E9]"
                  />
                </div>
              ) : null}
              <div className="mt-4 border-t border-gray-700 pt-3">
                <p className="text-gray-300 font-medium text-lg">
                  Prix Total: <span className="text-[#BB63FF] font-bold">{totalAmount.toLocaleString()} DA</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Yalidine Info Section (Admin Only) */}
      {userRole === 'admin' && (
        <div className="bg-[#112C70] rounded-lg p-4 md:p-6 mb-6 md:mb-8 border border-blue-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">Informations Livraison Yalidine</h3>
            {(localOrder.yalidine_status === 'failed' || localOrder.yalidine_status === 'pending') && (
              <button
                onClick={handleSyncYalidine}
                disabled={isSyncingYalidine}
                className="px-4 py-2 bg-[linear-gradient(135deg,_#5B58EB,_#09fbff)] text-white text-sm font-semibold rounded-md shadow-md disabled:opacity-50"
              >
                {isSyncingYalidine ? 'Synchronisation...' : 'Réessayer la synchronisation'}
              </button>
            )}
          </div>
          
          <div className="space-y-3">
            {localOrder.yalidine_status === 'success' && localOrder.yalidine_tracking && (
              <>
                <p className="text-gray-300">
                  <span className="font-medium text-gray-400">Numéro de Suivi: </span>
                  <span className="text-[#56E1E9] font-bold tracking-wider">{localOrder.yalidine_tracking}</span>
                </p>
                <p className="text-gray-300">
                  <span className="font-medium text-gray-400">État d'expédition (En direct): </span>
                  <span className="inline-block px-2 py-1 bg-green-900/50 text-green-400 text-xs rounded-full border border-green-800">
                    {liveYalidineStatus || 'Chargement...'}
                  </span>
                </p>
                {localOrder.yalidine_label_url && (
                  <p className="pt-2">
                    <a href={localOrder.yalidine_label_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-[#BB63FF] hover:text-[#56E1E9] text-sm font-medium transition-colors">
                      <FileText size={16} className="mr-1" /> Imprimer le bordereau
                    </a>
                  </p>
                )}
              </>
            )}

            {localOrder.yalidine_status === 'failed' && (
              <div className="p-3 bg-red-900/30 border border-red-800 rounded-md">
                <p className="text-red-400 font-medium">Synchronisation Yalidine échouée</p>
                <p className="text-sm text-red-300 mt-1">{localOrder.yalidine_error || "Erreur inconnue"}</p>
              </div>
            )}

            {(localOrder.yalidine_status === 'pending' || !localOrder.yalidine_status) && (
              <p className="text-blue-300 italic">Synchronisation Yalidine en cours...</p>
            )}
          </div>
        </div>
      )}

      {/* Progress Steps UI */}
      <div className="bg-[#112C70] rounded-lg p-4 md:p-6 mb-6 md:mb-8">
        <h3 className="text-xl font-semibold text-white mb-6 md:mb-8">État de la commande</h3>
        <div className="overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="relative mx-4 sm:mx-10 mb-6 min-w-[600px]">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-700 -z-0"></div>
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[linear-gradient(135deg,_#5B58EB,_#09fbff)] -z-0 transition-all duration-500"
              style={{ width: `${(Math.max(0, currentStepIdx) / (statusSteps.length - 1)) * 100}%` }}
            ></div>
            <div className="flex justify-between relative z-10 w-full">
              {(statusSteps || []).map((step, idx) => {
                const isCompleted = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return (
                  <div key={step} className="flex flex-col items-center">
                    <button
                      onClick={() => editMode && updateOrderStatus(step)}
                      disabled={!editMode}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${isCompleted ? 'bg-[linear-gradient(135deg,_#5B58EB,_#09fbff)] text-white shadow-[0_0_15px_rgba(9,251,255,0.5)]' : 'bg-[#112C70] text-gray-400 border-2 border-gray-600'
                        } ${editMode ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
                    >
                      {isCompleted && !isCurrent ? <Check size={20} /> : idx + 1}
                    </button>
                    <span className={`absolute top-12 whitespace-nowrap text-xs font-medium ${isCurrent ? 'text-[#56E1E9] font-bold' : 'text-gray-400'}`}>
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
      <div className="bg-[#112C70] rounded-lg p-4 md:p-6 mb-6 md:mb-8">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h3 className="text-xl font-semibold text-white">Photos Jointes</h3>
          {userRole && (
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-[linear-gradient(135deg,_#5B58EB,_#09fbff)] hover:opacity-90 text-white rounded-lg transition shadow-sm text-sm font-medium">
              <Upload size={16} />
              Ajouter des photos
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleAddPhoto}
              />
            </label>
          )}
        </div>
        {localOrder.photos && localOrder.photos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(localOrder.photos || []).map(photo => (
              <div key={photo.id} className="bg-[#0A2353] rounded-lg overflow-hidden border border-gray-700 group">
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
                <div className="p-4 bg-[#0A2353] flex flex-col gap-3 border-t border-gray-800">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300 truncate max-w-[60%] font-medium" title={photo.filename}>
                      {photo.filename}
                    </span>
                    <a
                      href={getPhotoUrlOriginal(photo.filename)}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#56E1E9] hover:text-[#56E1E9] text-sm font-semibold flex items-center gap-1"
                    >
                      ⬇ Télécharger
                    </a>
                  </div>
                  {userRole && (
                    <div className="flex justify-end items-center pt-2 border-t border-gray-800">
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400 transition px-2 py-1 bg-[#112C70] rounded border border-gray-700 hover:border-red-500"
                        title="Supprimer la photo"
                      >
                        <Trash2 size={14} />
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-[#0A2353]/50 rounded-lg border border-gray-800 border-dashed">
            <p className="text-gray-400">Aucune photo jointe à cette commande.</p>
          </div>
        )}
      </div>

      <div className="bg-[#112C70] rounded-lg p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Produits de la commande</h3>
          {(userRole === 'admin' || userRole === 'designer') && !isEditingProducts && (
            <button
              onClick={startEditingProducts}
              className="px-4 py-2 bg-[linear-gradient(135deg,_#5B58EB,_#09fbff)] text-white text-sm font-semibold rounded-md shadow-md hover:opacity-90 transition"
            >
              Modifier les produits
            </button>
          )}
        </div>

        {isEditingProducts ? (
          <>
            {tempProducts.length === 0 ? (
              <p className="text-gray-400 italic mb-4">Aucun produit dans la commande.</p>
            ) : (
              (tempProducts || []).map((product, index) => {
                const tempKey = product.id || product.tempId || index;
                return (
                  <div key={tempKey} className="bg-[#0A2353] rounded-lg mb-4 p-4 border border-gray-700">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      {/* Left Part: Product details */}
                      <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
                        <div className="h-12 w-12 rounded bg-[#112C70] overflow-hidden border border-gray-700 flex-shrink-0 flex items-center justify-center">
                          {product.imageUrl || product.image_url ? (
                            <img
                              src={getPhotoUrl(product.imageUrl || product.image_url, { width: 100 })}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] text-gray-500 italic">No image</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-white font-medium truncate">{product.type}</h4>
                          <div className="flex gap-2 mt-1">
                            {product.article_type === 'manuel' ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-[#BB63FF]/20 text-[#BB63FF] border border-[#BB63FF]/30 rounded-full">
                                Manuel
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-900/30 text-emerald-400 border border-emerald-800/30 rounded-full">
                                Stock
                              </span>
                            )}
                            {product.status && (
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${getStatusClass(product.status)}`}>
                                {product.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Part: Edit fields */}
                      <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-gray-800">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">Qté:</span>
                          <input
                            type="number"
                            min="1"
                            value={product.quantity}
                            onChange={(e) => handleTempProductChange(product.id || product.tempId, 'quantity', Number(e.target.value) || 1)}
                            className="w-16 p-2 bg-[#112C70] border border-gray-650 rounded text-white text-center font-medium focus:border-[#56E1E9] outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">Prix:</span>
                          <input
                            type="number"
                            min="0"
                            value={product.unit_price ?? product.unitPrice ?? 0}
                            onChange={(e) => handleTempProductChange(product.id || product.tempId, 'unit_price', Number(e.target.value) || 0)}
                            className="w-24 p-2 bg-[#112C70] border border-gray-650 rounded text-white text-center font-medium focus:border-[#56E1E9] outline-none"
                          />
                          <span className="text-sm text-gray-400">DA</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTempProduct(product.id || product.tempId)}
                          className="p-2 text-red-500 hover:text-red-400 hover:bg-red-900/20 rounded-md transition ml-2"
                          title="Supprimer le produit"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Add new product selector row */}
            {showAddRow ? (
              <div className="bg-[#0A2353] rounded-lg p-4 border border-dashed border-[#56E1E9] mt-4">
                <h4 className="text-sm font-semibold text-[#56E1E9] mb-3">Sélectionner un produit du stock</h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-6">
                    <label className="block text-xs text-gray-400 mb-1">Produit de stock</label>
                    <ProductSelect
                      value={newProduct.inventoryItemId}
                      onChange={(e) => handleNewProductSelect(e.target.value)}
                      stockProducts={stockProducts}
                      placeholder="Choisir un produit du stock..."
                    />
                    {(() => {
                      const selectedItem = stockProducts.find(sp => String(sp.id) === String(newProduct.inventoryItemId));
                      if (selectedItem) {
                        const isOutOfStock = selectedItem.quantity <= 0;
                        if (isOutOfStock) {
                          return (
                            <div className="text-yellow-400 text-xs mt-1 flex items-center gap-1 font-medium animate-pulse">
                              ⚠️ Rupture de stock (0 disponible)
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-green-400 text-xs mt-1 flex items-center gap-1 font-medium">
                              ✓ Disponible ({selectedItem.quantity} en stock)
                            </div>
                          );
                        }
                      }
                      return null;
                    })()}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Quantité</label>
                    <input
                      type="number"
                      min="1"
                      value={newProduct.quantity}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, quantity: Number(e.target.value) || 1 }))}
                      className="w-full p-2.5 bg-[#112C70] border border-gray-600 rounded text-white text-center font-medium focus:border-[#56E1E9] outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Prix (DA)</label>
                    <input
                      type="number"
                      min="0"
                      value={newProduct.unitPrice}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, unitPrice: Number(e.target.value) || 0 }))}
                      className="w-full p-2.5 bg-[#112C70] border border-gray-600 rounded text-white text-center font-medium focus:border-[#56E1E9] outline-none"
                    />
                  </div>

                  <div className="md:col-span-2 flex gap-2">
                    <button
                      type="button"
                      onClick={handleCancelAddProduct}
                      className="p-2.5 bg-gray-750 hover:bg-gray-700 text-white rounded transition flex-1 flex items-center justify-center"
                      title="Annuler"
                    >
                      <X size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmAddProduct}
                      className="p-2.5 bg-green-600 hover:bg-green-700 text-white rounded transition flex-1 flex items-center justify-center"
                      title="Ajouter au panier"
                    >
                      <Check size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddRow(true)}
                className="w-full py-3 border border-dashed border-gray-750 hover:border-[#56E1E9] text-gray-400 hover:text-[#56E1E9] rounded-lg transition flex items-center justify-center gap-2 mt-4"
              >
                <Plus size={18} />
                <span>Ajouter un produit</span>
              </button>
            )}

            {/* Save/Cancel Product Edit Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-800">
              <button
                type="button"
                onClick={handleCancelProductEdit}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded-md transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveProductEdit}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-md transition"
              >
                Sauvegarder les produits
              </button>
            </div>
          </>
        ) : (
          loadingDetail && (!localOrder.products || localOrder.products.length === 0) ? (
            <p className="text-gray-400 italic">Chargement des articles...</p>
          ) : (
            (localOrder.products || []).map(product => (
              <div key={product.id} className="bg-[#0A2353] rounded-lg mb-4 overflow-hidden">
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
                    <div className="flex-1 flex items-center gap-2">
                      <h4 className="text-lg font-medium text-white">
                        {product.type} × {product.quantity || 1}
                      </h4>
                      {product.article_type === 'manuel' && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#BB63FF]/20 text-[#BB63FF] border border-[#BB63FF]/30 rounded-full">
                          Manuel
                        </span>
                      )}
                    </div>
                  </div>

                  <div onClick={(e) => e.stopPropagation()} className="w-full md:w-auto flex justify-end">
                    {editMode ? (
                      <select
                        value={product.status || 'Nouvelle commande'}
                        onChange={(e) => updateProductStatus(product.id, e.target.value)}
                        className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#56E1E9] w-full md:w-auto"
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
                            <div className="flex flex-col gap-3">
                              <div className="h-40 w-40 md:h-48 md:w-48 rounded-lg overflow-hidden border border-gray-700 bg-[#0A2353] group relative">
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
                              {userRole && (
                                <div className="flex gap-2 mt-1">
                                  <button
                                    onClick={() => handleDeleteProductImage(product.id)}
                                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400 transition px-2 py-1 bg-[#112C70] rounded border border-gray-700 hover:border-red-500"
                                  >
                                    <Trash2 size={14} />
                                    Supprimer
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-3">
                              <p className="text-gray-500 text-sm italic">Aucune photo associée</p>
                              {userRole && (
                                <label className="cursor-pointer flex items-center gap-2 text-sm text-[#56E1E9] hover:text-[#56E1E9] transition w-fit px-4 py-2 bg-[#112C70] rounded-lg border border-gray-700 hover:border-[#56E1E9] shadow-sm">
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
            ))
          )
        )}
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