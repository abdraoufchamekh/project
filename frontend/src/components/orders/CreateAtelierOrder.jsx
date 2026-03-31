import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X, Upload, Loader2 } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';

export default function CreateAtelierOrder({ onSave }) {
  // Destinataire
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState(''); // Kept minimal phone in case it's needed
  const [versement, setVersement] = useState(0);

  // Colis (Produits & Photos)
  const [stockProducts, setStockProducts] = useState([]);
  const [products, setProducts] = useState([{
    type: '',
    quantity: 1,
    unitPrice: 0,
    inventoryItemId: '',
    article_type: 'stock',
    imageUrl: '',
    isUploading: false
  }]);
  const [photos, setPhotos] = useState([]);

  // Derived total
  const totalPrice = useMemo(() => {
    return products.reduce((sum, p) => {
      const qty = Number(p.quantity) || 0;
      const price = Number(p.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
  }, [products]);

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/stock`, {
          headers: { Authorization: `Bearer ${sessionStorage.getItem('aurea_token')}` }
      });
      setStockProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching stock:', error);
    }
  };

  const addProduct = () => {
    setProducts([...products, { 
      type: '', quantity: 1, unitPrice: 0, inventoryItemId: '', 
      article_type: 'stock', imageUrl: '', isUploading: false 
    }]);
  };

  const removeProduct = (idx) => {
    setProducts(products.filter((_, i) => i !== idx));
  };

  const updateProduct = (idx, field, value) => {
    setProducts(prev => prev.map((p, i) =>
      i === idx ? { ...p, [field]: value } : p
    ));
  };

  const setProductFromStock = (idx, inventoryItemId, typeLabel, unitPriceFromStock) => {
    setProducts(prev => prev.map((p, i) =>
      i === idx
        ? { ...p, inventoryItemId, type: typeLabel, unitPrice: unitPriceFromStock ?? p.unitPrice, article_type: 'stock' }
        : p
    ));
  };
  
  const handleImageUpload = async (idx, file) => {
    if (!file) return;
    
    updateProduct(idx, 'isUploading', true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const res = await axios.post(`${API_BASE_URL}/orders/upload-image`, formData, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('aurea_token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      updateProduct(idx, 'imageUrl', res.data.url);
    } catch (err) {
      console.error('Error uploading product image:', err);
      alert('Erreur lors du téléchargement de l\'image.');
    } finally {
      updateProduct(idx, 'isUploading', false);
    }
  };

  const handleSubmit = () => {
    const newOrder = {
      id: Date.now(),
      firstName,
      lastName,
      clientName: `${firstName} ${lastName}`.trim(),
      phone: phone, 
      phone2: null,
      wilaya: 'Atelier',
      commune: 'Atelier',
      address: 'Sur place',
      deliveryType: 'sur_place',
      isFreeDelivery: true,
      hasExchange: false,
      hasInsurance: false,
      declaredValue: null,
      status: 'Nouvelle commande',
      deliveryFee: 0,
      discount: 0,
      source: 'atelier',
      versement: Number(versement) || 0,
      products: products.map((p, i) => ({
        id: Date.now() + i,
        type: p.type,
        quantity: Number(p.quantity) || 1,
        unitPrice: Number(p.unitPrice) || 0,
        status: 'En attente',
        inventoryItemId: p.article_type === 'stock' ? p.inventoryItemId : undefined,
        article_type: p.article_type || 'stock',
        imageUrl: p.imageUrl || null
      }))
    };

    onSave(newOrder, photos);

    // Reset form
    setFirstName('');
    setLastName('');
    setPhone('');
    setProducts([{ type: '', quantity: 1, unitPrice: 0, inventoryItemId: '', article_type: 'stock', imageUrl: '', isUploading: false }]);
    setPhotos([]);
    setVersement(0);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-8">Ajouter une commande (Sur place)</h2>

      <div className="bg-[#112C70] rounded-lg p-6 space-y-8">

        {/* Client Info */}
        <div className="bg-gray-700/50 rounded-lg overflow-hidden border border-gray-600">
          <div className="p-4 bg-[#112C70] border-b border-gray-600">
            <h3 className="font-bold text-gray-200">Informations du client</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row bg-[#112C70]/80 rounded border border-gray-600 overflow-hidden">
              <span className="w-full md:w-1/3 p-2 text-gray-400 border-b md:border-b-0 md:border-r border-gray-600">Nom du client</span>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full md:w-2/3 p-2 bg-transparent text-white outline-none" />
            </div>

            <div className="flex flex-col md:flex-row bg-[#112C70]/80 rounded border border-gray-600 overflow-hidden mt-4">
              <span className="w-full md:w-1/3 p-2 text-gray-400 border-b md:border-b-0 md:border-r border-gray-600">Prénom</span>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full md:w-2/3 p-2 bg-transparent text-white outline-none" />
            </div>

            <div className="flex flex-col md:flex-row bg-[#112C70]/80 rounded border border-gray-600 overflow-hidden mt-4">
              <span className="w-full md:w-1/3 p-2 text-gray-400 border-b md:border-b-0 md:border-r border-gray-600">Téléphone (Optionnel)</span>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full md:w-2/3 p-2 bg-transparent text-white outline-none" />
            </div>
          </div>
        </div>

        {/* Le colis */}
        <div className="bg-gray-700/50 rounded-lg overflow-hidden border border-gray-600">
          <div className="p-4 bg-[#112C70] border-b border-gray-600">
            <h3 className="font-bold text-gray-200">Produits</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="border border-gray-600 rounded p-4 mb-4 bg-[#112C70]/80">
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-300 font-medium">Produit(s) commandé(s)</span>
                <button onClick={addProduct} className="text-[#56E1E9] hover:text-[#56E1E9] flex items-center text-sm transition font-medium">
                  <Plus size={16} className="mr-1" /> Ajouter un produit
                </button>
              </div>

              <div className="hidden md:flex gap-4 mb-3 px-1">
                <div className="w-6/12 text-sm text-gray-400 font-medium">Type de produit</div>
                <div className="w-2/12 text-sm text-gray-400 font-medium text-center">Quantité</div>
                <div className="w-2/12 text-sm text-gray-400 font-medium text-center">Prix unitaire</div>
                <div className="w-2/12 text-sm text-gray-400 font-medium text-center">Total</div>
                <div className="w-1/12"></div>
              </div>

              <div className="space-y-4">
                {products.map((product, idx) => {
                  return (
                  <div key={idx} className="flex flex-col md:flex-row gap-4 items-start md:items-start bg-[#0A2353]/50 md:bg-transparent p-4 md:p-0 rounded-lg border border-gray-700 md:border-none">
                    
                    {/* Product Selection / Configuration */}
                    <div className="w-full md:w-6/12 flex flex-col gap-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="md:hidden text-xs text-gray-400 font-medium">Article</span>
                        <div className="flex gap-1 bg-[#0A2353] p-1 rounded-md border border-gray-600">
                           <button
                             onClick={(e) => { e.preventDefault(); updateProduct(idx, 'article_type', 'stock'); }}
                             className={`px-3 py-1 text-xs rounded transition-colors ${product.article_type !== 'manuel' ? 'bg-[#5B58EB] text-white shadow' : 'text-gray-400 hover:text-white'}`}
                           >
                             Depuis le stock
                           </button>
                           <button
                             onClick={(e) => { e.preventDefault(); updateProduct(idx, 'article_type', 'manuel'); }}
                             className={`px-3 py-1 text-xs rounded transition-colors ${product.article_type === 'manuel' ? 'bg-[#BB63FF] text-white shadow' : 'text-gray-400 hover:text-white'}`}
                           >
                             Ajouter manuellement
                           </button>
                        </div>
                      </div>

                      {product.article_type === 'manuel' ? (
                        <div className="flex flex-col gap-3">
                          <input
                            type="text"
                            placeholder="Nom de l'article"
                            value={product.type || ''}
                            onChange={(e) => updateProduct(idx, 'type', e.target.value)}
                            className="w-full p-2.5 bg-[#0A2353] border border-gray-600 text-white rounded outline-none focus:border-[#BB63FF] transition"
                            required
                          />
                          <div className="flex items-center gap-3">
                            <label className={`flex flex-1 items-center justify-center gap-2 p-2.5 rounded border border-dashed transition cursor-pointer ${product.isUploading ? 'bg-gray-700/50 border-gray-500 cursor-not-allowed' : 'bg-[#0A2353] border-gray-500 hover:border-[#BB63FF] text-gray-300'}`}>
                              {product.isUploading ? (
                                <><Loader2 size={18} className="animate-spin text-[#BB63FF]" /> <span className="text-sm">Téléchargement...</span></>
                              ) : (
                                <><Upload size={18} /> <span className="text-sm">Photo (optionnel)</span></>
                              )}
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                disabled={product.isUploading}
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleImageUpload(idx, e.target.files[0]);
                                  }
                                }} 
                              />
                            </label>
                            {product.imageUrl && (
                              <div className="w-11 h-11 rounded border border-gray-600 overflow-hidden flex-shrink-0 bg-gray-800 flex items-center justify-center">
                                <img src={product.imageUrl} alt="preview" className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <select
                          value={product.inventoryItemId || ''}
                          onChange={(e) => {
                            const pId = e.target.value;
                            const sp = stockProducts.find(s => s.id === parseInt(pId, 10));
                            if (sp) {
                              let labelParts = [];
                              if (sp.color) labelParts.push(sp.color);
                              if (sp.dimension) labelParts.push(sp.dimension);
                              if (sp.size) labelParts.push(`Taille: ${sp.size}`);
                              const label = labelParts.length > 0 ? labelParts.join(' - ') : '';
                              const fullType = label ? `${sp.name} (${label})` : sp.name;
                              const price = (sp.price !== undefined && sp.price !== null && sp.price !== '') ? Number(sp.price) : 0;
                              setProductFromStock(idx, pId, fullType, price);
                            } else {
                              setProductFromStock(idx, '', '', 0);
                            }
                          }}
                          className="w-full p-2.5 bg-[#0A2353] border border-gray-600 text-white rounded outline-none focus:border-[#5B58EB] transition"
                        >
                          <option value="">Sélectionner un produit...</option>
                          {stockProducts.map(sp => {
                            let labelParts = [];
                            if (sp.color) labelParts.push(sp.color);
                            if (sp.dimension) labelParts.push(sp.dimension);
                            if (sp.size) labelParts.push(`Taille: ${sp.size}`);
                            const label = labelParts.length > 0 ? labelParts.join(' - ') : '';
                            return (
                              <option key={sp.id} value={sp.id}>
                                {sp.name} {label ? `(${label})` : ''} - Stock: {sp.quantity}
                              </option>
                            );
                          })}
                        </select>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="w-full md:w-2/12 flex flex-col relative">
                      <span className="md:hidden text-xs text-gray-400 font-medium mb-1">Quantité</span>
                      <input
                        type="number" min="1" placeholder="Qté"
                        value={product.quantity || ''}
                        onChange={(e) => updateProduct(idx, 'quantity', parseInt(e.target.value) || '')}
                        onWheel={(e) => e.target.blur()}
                        className="w-full p-2.5 bg-[#0A2353] border border-gray-600 text-white rounded outline-none transition text-center focus:border-[#5B58EB] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>

                    {/* Unit price */}
                    <div className="w-full md:w-2/12 flex flex-col">
                      <span className="md:hidden text-xs text-gray-400 font-medium mb-1">Prix unitaire</span>
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="0"
                          step="10"
                          placeholder="0"
                          value={product.unitPrice || ''}
                          onChange={(e) => updateProduct(idx, 'unitPrice', e.target.value)}
                          onWheel={(e) => e.target.blur()}
                          className="w-full p-2.5 bg-[#0A2353] border border-gray-600 text-white rounded-l outline-none transition text-center focus:border-[#5B58EB] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="px-2 py-2.5 bg-[#0A2353] border border-l-0 border-gray-600 text-xs text-gray-400 rounded-r">DA</span>
                      </div>
                    </div>

                    {/* Line total */}
                    <div className="w-full md:w-2/12 flex flex-col">
                      <span className="md:hidden text-xs text-gray-400 font-medium mb-1">Total</span>
                      <div className="w-full p-2.5 bg-[#0A2353] border border-gray-600 text-[#BB63FF] rounded text-center font-semibold">
                        {((Number(product.quantity) || 0) * (Number(product.unitPrice) || 0)).toLocaleString()} DA
                      </div>
                    </div>

                    {/* Delete button */}
                    <div className="w-full md:w-1/12 flex items-start justify-end">
                      {products.length > 1 && (
                        <button
                          onClick={() => removeProduct(idx)}
                          className="mt-6 md:mt-1 text-red-500 hover:text-white hover:bg-red-600 p-2 rounded transition border border-transparent hover:border-red-500 flex items-center justify-center"
                          title="Supprimer ce produit"
                        >
                          <X size={20} />
                        </button>
                      )}
                    </div>

                  </div>
                  );
                })}
              </div>

              <div className="pt-4 mt-6 border-t border-gray-600 space-y-3">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-gray-400 uppercase">PRIX TOTAL DES PRODUITS</span>
                  <span className="text-[#BB63FF] font-bold">{Number(totalPrice || 0).toLocaleString()} DA</span>
                </div>
                
                <div className="flex justify-between items-center bg-[#0A2353]/50 p-3 rounded-lg border border-gray-700">
                  <span className="text-gray-300 font-bold uppercase text-sm">Versement (Acompte)</span>
                  <div className="flex items-center w-32">
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={versement || ''}
                      onChange={(e) => setVersement(Number(e.target.value) || 0)}
                      onWheel={(e) => e.target.blur()}
                      className="w-full p-2.5 bg-[#0A2353] border border-gray-600 text-white rounded-l outline-none transition text-center focus:border-[#5B58EB] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="px-2 py-2.5 bg-[#0A2353] border border-l-0 border-gray-600 text-xs text-gray-400 rounded-r">DA</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-300 font-bold uppercase text-sm">Reste à payer</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl text-[#BB63FF] font-bold">
                      {Math.max(0, totalPrice - versement).toLocaleString()} DA
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Photos (Custom extension for backend logic) */}
        <div className="bg-gray-700/50 rounded-lg overflow-hidden border border-gray-600">
          <div className="p-4 bg-[#112C70] border-b border-gray-600">
            <h3 className="font-bold text-gray-200">Photo du colis (Optionnel)</h3>
          </div>
          <div className="p-4">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setPhotos(Array.from(e.target.files))}
              className="w-full text-gray-300 bg-[#0A2353] p-2 rounded border border-gray-600 outline-none"
            />
            {photos.length > 0 && (
              <p className="mt-2 text-sm text-gray-400">{photos.length} photo(s) sélectionnée(s)</p>
            )}
          </div>
        </div>

        <div className="flex justify-center pt-6 pb-20">
          <button
            onClick={handleSubmit}
            disabled={products.some(p => p.isUploading)}
            className="px-8 py-3 bg-[linear-gradient(135deg,_#5B58EB,_#09fbff)] hover:opacity-90 disabled:opacity-50 text-white rounded font-medium shadow-lg w-full md:w-auto md:min-w-[300px]"
          >
            Créer la commande
          </button>
        </div>

      </div>
    </div>
  );
}
