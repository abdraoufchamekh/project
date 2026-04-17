import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X, Upload, Loader2 } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';
import { getWilayas, getCommunes } from '../../api/yalidine';
import { getGeupexWilayas, getGeupexCommunes } from '../../api/guepex';

export default function CreateOrder({ onSave }) {
  // Destinataire
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [showPhone2, setShowPhone2] = useState(false);
  const [wilaya, setWilaya] = useState('');
  const [wilayaId, setWilayaId] = useState(null);

  // Yalidine Data
  const [wilayasData, setWilayasData] = useState([]);
  const [communesData, setCommunesData] = useState([]);
  const [commune, setCommune] = useState('');
  const [communeId, setCommuneId] = useState(null);
  const [loadingCommunes, setLoadingCommunes] = useState(false);
  const [customCommune, setCustomCommune] = useState('');
  const [address, setAddress] = useState('');

  const [agenciesData, setAgenciesData] = useState([]);
  const [agency, setAgency] = useState('');
  const [agencyId, setAgencyId] = useState(null);
  const [loadingAgencies, setLoadingAgencies] = useState(false);

  // Livraison
  const [deliveryType, setDeliveryType] = useState('domicile');
  const [hasExchange, setHasExchange] = useState(false);

  // Assurance
  const [hasInsurance, setHasInsurance] = useState(false);
  const [declaredValue, setDeclaredValue] = useState('');

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

  // Derived total — always in sync with products, no separate state
  const totalPrice = useMemo(() => {
    return products.reduce((sum, p) => {
      const qty = Number(p.quantity) || 0;
      const price = Number(p.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
  }, [products]);

  useEffect(() => {
    fetchStock();
    fetchWilayasData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchWilayasData = async (type = deliveryType) => {
    try {
      if (type === 'stop_desk') {
        const data = await getGeupexWilayas();
        setWilayasData(data || []);
      } else {
        const data = await getWilayas();
        setWilayasData(data || []);
      }
    } catch (err) {
      console.error('Error fetching wilayas:', err);
    }
  };

  useEffect(() => {
    if (wilaya && wilayasData.length > 0) {
      const selectedW = wilayasData.find(w => w.name === wilaya);
      if (selectedW) {
        fetchCommunesData(selectedW.wilaya_id || selectedW.id || selectedW.has_id, deliveryType);
      }
    } else {
      setCommunesData([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wilaya, wilayasData, deliveryType]);

  const fetchCommunesData = async (wId, type = deliveryType) => {
    try {
      if (!wId) return;
      setLoadingCommunes(true);
      if (type === 'stop_desk') {
        const data = await getGeupexCommunes(wId);
        // Guepex API returns all communes, we must filter those supporting stop desk
        const filteredData = (data || []).filter(c => c.has_stop_desk === 1 || c.has_stop_desk === '1' || c.has_stop_desk === true);
        setCommunesData(filteredData);
      } else {
        const data = await getCommunes(wId);
        setCommunesData(data || []);
      }
    } catch (err) {
      console.error('Error fetching communes:', err);
    } finally {
      setLoadingCommunes(false);
    }
  };

  const handleWilayaChange = (e) => {
    const selectedName = e.target.value;
    setWilaya(selectedName);
    setCommune(''); setCommuneId(null);
    setAgency(''); setAgencyId(null);
    setCommunesData([]); setAgenciesData([]);

    const selectedW = wilayasData.find(w => w.name === selectedName);
    if (selectedW) {
      const wId = selectedW.wilaya_id || selectedW.id || selectedW.has_id;
      setWilayaId(wId);
      // Data fetching is securely handled by the useEffect above
    }
  };

  const handleCommuneChange = async (e) => {
    const selectedName = e.target.value;
    setCommune(selectedName);
    setAgency(''); setAgencyId(null); setAgenciesData([]);

    // Custom commune check
    if (selectedName === 'Autre') {
      setCommuneId(null);
      return;
    }

    const selectedC = communesData.find(c => c.name === selectedName);
    if (selectedC) {
      const cId = selectedC.commune_id || selectedC.id;
      setCommuneId(cId);
      if (deliveryType === 'stop_desk') {
        setLoadingAgencies(true);
        try {
          const res = await axios.get(`${API_BASE_URL}/guepex/agencies/${cId}`, {
            headers: { Authorization: `Bearer ${sessionStorage.getItem('aurea_token')}` }
          });
          setAgenciesData(res.data || []);
        } catch (e) {
          console.error('Failed to load agencies:', e);
        } finally {
          setLoadingAgencies(false);
        }
      }
    }
  };

  const handleDeliveryTypeChange = async (newType) => {
    setDeliveryType(newType);
    setWilaya(''); setWilayaId(null); setWilayasData([]);
    setCommune(''); setCommuneId(null); setCommunesData([]);
    setAgency(''); setAgencyId(null); setAgenciesData([]);
    
    // Repopulate root dropdown
    await fetchWilayasData(newType);
  };


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

  // Immutable update: new object for the row so other rows and fields are never overwritten
  const updateProduct = (idx, field, value) => {
    setProducts(prev => prev.map((p, i) =>
      i === idx ? { ...p, [field]: value } : p
    ));
  };

  // Batch update when selecting a product (type, unitPrice, inventoryItemId) in one setState to avoid stale state
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
      // Even if upload fails, we don't block. The imageUrl remains empty.
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
      clientName: `${firstName} ${lastName}`,
      phone,
      phone2: showPhone2 ? phone2 : null,
      wilaya,
      wilaya_id: wilayaId ? Number(wilayaId) : null,
      commune: deliveryType === 'stop_desk' ? commune : (commune === 'Autre' ? customCommune : commune),
      commune_id: communeId ? Number(communeId) : null,
      address: deliveryType === 'stop_desk' ? null : address,
      deliveryType,
      stop_desk_agency: agency || null,
      agency_id: agencyId ? Number(agencyId) : null,
      isFreeDelivery,
      hasExchange,
      hasInsurance,
      declaredValue: hasInsurance ? declaredValue : null,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Nouvelle commande',
      deliveryFee: 0,
      delivery_fee: 0,
      discount: 0,
      source: 'admin',
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
    setPhone2('');
    setShowPhone2(false);
    setWilaya('');
    setCommune('');
    setCommuneId(null);
    setWilayaId(null);
    setCustomCommune('');
    setAddress('');
    setDeliveryType('domicile');
    setAgency('');
    setAgencyId(null);
    setAgenciesData([]);
    setHasExchange(false);
    setHasInsurance(false);
    setDeclaredValue('');
    setProducts([{ type: '', quantity: 1, unitPrice: 0, inventoryItemId: '', article_type: 'stock', imageUrl: '', isUploading: false }]);
    setPhotos([]);
  };


  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-8">Ajouter un colis</h2>

      <div className="bg-[#112C70] rounded-lg p-6 space-y-8">

        {/* Destinataire & Assignation */}
        <div className="bg-gray-700/50 rounded-lg overflow-hidden border border-gray-600">
          <div className="p-4 bg-[#112C70] border-b border-gray-600">
            <h3 className="font-bold text-gray-200">Détails de la commande</h3>
          </div>
          <div className="p-4 space-y-4">

            {/* Designer Assignment Removed */}

            <hr className="border-gray-600/50 my-4" />

            <div className="flex flex-col md:flex-row bg-[#112C70]/80 rounded border border-gray-600 overflow-hidden mt-4">
              <span className="w-full md:w-1/3 p-2 text-gray-400 border-b md:border-b-0 md:border-r border-gray-600">Nom du client</span>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full md:w-2/3 p-2 bg-transparent text-white outline-none" />
            </div>

            <div className="flex flex-col md:flex-row bg-[#112C70]/80 rounded border border-gray-600 overflow-hidden mt-4">
              <span className="w-full md:w-1/3 p-2 text-gray-400 border-b md:border-b-0 md:border-r border-gray-600">Prénom</span>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full md:w-2/3 p-2 bg-transparent text-white outline-none" />
            </div>

            <div className="flex flex-col md:flex-row bg-[#112C70]/80 rounded border border-gray-600 overflow-hidden mt-4">
              <span className="w-full md:w-1/3 p-2 text-gray-400 border-b md:border-b-0 md:border-r border-gray-600">Téléphone 1</span>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full md:w-2/3 p-2 bg-transparent text-white outline-none" />
            </div>

            {!showPhone2 ? (
              <button
                onClick={() => setShowPhone2(true)}
                className="bg-transparent text-[#56E1E9] border-[#56E1E9] border px-4 py-2 rounded transition w-full md:w-auto mt-4"
              >
                Ajouter un autre téléphone
              </button>
            ) : (
              <div className="flex flex-col md:flex-row bg-[#112C70]/80 rounded border border-gray-600 overflow-hidden relative mt-4">
                <span className="w-full md:w-1/3 p-2 text-gray-400 border-b md:border-b-0 md:border-r border-gray-600">Téléphone 2</span>
                <input type="tel" value={phone2} onChange={(e) => setPhone2(e.target.value)} className="w-full md:w-2/3 p-2 bg-transparent text-white outline-none" />
                <button onClick={() => { setShowPhone2(false); setPhone2(''); }} className="absolute right-2 top-2 text-gray-500 hover:text-red-400 bg-[#112C70]/80 p-1 md:p-0 rounded-full md:bg-transparent md:rounded-none">
                  <X size={20} />
                </button>
              </div>
            )}

            <div className="flex flex-col md:flex-row bg-[#112C70]/80 rounded border border-gray-600 overflow-hidden mt-4">
              <span className="w-full md:w-1/3 p-2 text-gray-400 font-medium border-b md:border-b-0 md:border-r border-gray-600">Type de livraison</span>
              <div className="w-full md:w-2/3 flex p-2 gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-white">
                  <input type="radio" value="domicile" checked={deliveryType === 'domicile'} onChange={() => handleDeliveryTypeChange('domicile')} className="w-4 h-4 accent-[#56E1E9] text-[#56E1E9] bg-[#0A2353] border-gray-600 focus:ring-[#56E1E9]" />
                  À domicile
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-white">
                  <input type="radio" value="stop_desk" checked={deliveryType === 'stop_desk'} onChange={() => handleDeliveryTypeChange('stop_desk')} className="w-4 h-4 accent-[#56E1E9] text-[#56E1E9] bg-[#0A2353] border-gray-600 focus:ring-[#56E1E9]" />
                  Au bureau / Stop Desk
                </label>
              </div>
            </div>

            <div className="flex flex-col md:flex-row bg-[#112C70]/80 rounded border border-gray-600 overflow-hidden mt-4">
              <span className="w-full md:w-1/3 p-2 text-red-400 font-medium border-b md:border-b-0 md:border-r border-gray-600">Wilaya</span>
              <select
                value={wilaya}
                onChange={handleWilayaChange}
                className="w-full md:w-2/3 p-2 outline-none bg-[#112C70] text-white"
              >
                <option value="">Choisissez</option>
                {wilayasData.map(w => (
                  <option key={w.wilaya_id || w.id || w.name} value={w.name}>{w.name}</option>
                ))}
              </select>
            </div>

            {/* COMMUNE DROPDOWN */}
            <div className="flex flex-col md:flex-row bg-[#112C70]/80 rounded border border-gray-600 overflow-hidden mt-4">
              <span className={`w-full md:w-1/3 p-2 font-medium border-b md:border-b-0 md:border-r border-gray-600 ${!wilayaId ? 'text-red-400' : 'text-gray-400'}`}>Commune</span>
              <div className="w-full md:w-2/3 flex flex-col">
                <select
                  value={commune}
                  onChange={handleCommuneChange}
                  disabled={!wilayaId || loadingCommunes}
                  className="w-full p-2 outline-none bg-[#112C70] text-white disabled:opacity-50"
                >
                  <option value="">
                    {loadingCommunes ? '⏳ Chargement...' : !wilayaId ? 'Choisissez d\'abord la wilaya' : 'Choisissez une commune'}
                  </option>
                  {communesData.map((c, i) => (
                    <option key={c.commune_id || c.id || i} value={c.name}>{c.name}</option>
                  ))}
                  {wilayaId && deliveryType === 'domicile' && <option value="Autre" className="text-[#56E1E9] font-bold">Autre (Saisir manuellement)...</option>}
                </select>
                {commune === 'Autre' && deliveryType === 'domicile' && (
                  <input
                    type="text"
                    value={customCommune}
                    onChange={(e) => setCustomCommune(e.target.value)}
                    placeholder="Saisissez le nom de la commune"
                    className="w-full p-2 bg-[#0A2353] border-t border-gray-600 text-white outline-none"
                  />
                )}
              </div>
            </div>

            {/* AGENCE DROPDOWN — STOP DESK ONLY */}
            {deliveryType === 'stop_desk' && (
              <div className="flex flex-col md:flex-row bg-[#112C70]/80 rounded border border-gray-600 overflow-hidden mt-4">
                <span className="w-full md:w-1/3 p-2 text-gray-400 font-medium border-b md:border-b-0 md:border-r border-gray-600">Agence</span>
                <select
                  value={agency}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    setAgency(selectedName);
                    const selectedA = agenciesData.find(a => a.name === selectedName || a.agency_name === selectedName);
                    if (selectedA) setAgencyId(selectedA.center_id || selectedA.id || selectedA.agency_id);
                  }}
                  disabled={!communeId || loadingAgencies}
                  className="w-full md:w-2/3 p-2 outline-none bg-[#112C70] text-white disabled:opacity-50"
                >
                  <option value="">
                    {loadingAgencies ? '⏳ Chargement...' : !communeId ? 'Choisissez d\'abord la commune' : agenciesData.length === 0 ? 'Aucune agence disponible' : 'Choisissez une agence'}
                  </option>
                  {agenciesData.map((a, i) => (
                    <option key={a.center_id || a.id || i} value={a.name || a.agency_name}>{a.name || a.agency_name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* ADRESSE POSTALE — DOMICILE ONLY */}
            {deliveryType === 'domicile' && (
              <div className="flex flex-col md:flex-row bg-[#112C70]/80 rounded border border-gray-600 overflow-hidden mt-4">
                <span className="w-full md:w-1/3 p-2 text-gray-400 border-b md:border-b-0 md:border-r border-gray-600">L'adresse postale</span>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full md:w-2/3 p-2 bg-transparent text-white outline-none" />
              </div>
            )}
          </div>
        </div>

        {/* Le colis */}
        <div className="bg-gray-700/50 rounded-lg overflow-hidden border border-gray-600">
          <div className="p-4 bg-[#112C70] border-b border-gray-600">
            <h3 className="font-bold text-gray-200">Le colis</h3>
          </div>
          <div className="p-4 space-y-4">

            {/* Products Array integration */}
            <div className="border border-gray-600 rounded p-4 mb-4 bg-[#112C70]/80">
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-300 font-medium">Produit(s) à livrer</span>
                <button onClick={addProduct} className="text-[#56E1E9] hover:text-[#56E1E9] flex items-center text-sm transition font-medium">
                  <Plus size={16} className="mr-1" /> Ajouter un produit
                </button>
              </div>

              {/* Table Headers for better UX on desktop */}
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
                                <><Upload size={18} /> <span className="text-sm">Choisir une photo (optionnel)</span></>
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

              <div className="pt-4 mt-6 border-t border-gray-600 flex justify-between items-center">
                <span className="text-gray-300 font-bold uppercase text-sm -mt-2">PRIX TOTAL DES PRODUITS</span>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl text-[#BB63FF] font-bold">
                      {Number(totalPrice || 0).toLocaleString()} DA
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row bg-[#112C70]/80 rounded border border-[#56E1E9]/50 overflow-hidden mt-4">
              <span className="w-full md:w-1/3 p-2 text-[#56E1E9] font-medium border-b md:border-b-0 md:border-r border-gray-600">Prix Total</span>
              <div className="w-full md:w-2/3 p-2 bg-transparent text-[#BB63FF] font-bold flex items-center">
                {Number(totalPrice || 0).toLocaleString()} DA
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer text-gray-300 mt-2">
              <input
                type="checkbox"
                checked={hasExchange}
                onChange={(e) => setHasExchange(e.target.checked)}
                className="w-4 h-4 mt-1 rounded text-[#56E1E9] accent-[#56E1E9] border-gray-600 bg-[#0A2353] focus:ring-[#5B58EB]"
              />
              <span className="flex-1 text-sm">
                Demander un échange après livraison (ceci va créer un second bordereau pour le retour de l'objet à échanger)
              </span>
            </label>
          </div>
        </div>

        {/* Assurance du colis */}
        <div className="bg-gray-700/50 rounded-lg overflow-hidden border border-gray-600">
          <div className="p-4 bg-[#112C70] border-b border-gray-600 flex items-center gap-2">
            <h3 className="font-bold text-gray-200">Assurance du colis</h3>
            <span className="border border-[#56E1E9] text-[#56E1E9] text-xs px-2 py-1 rounded">En savoir plus</span>
          </div>
          <div className="p-4 space-y-4">
            <p className="text-gray-300 font-medium mb-2">Voulez vous souscrire à l'assurance?</p>

            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer text-gray-300 text-sm">
                <input
                  type="radio"
                  name="insurance"
                  value="no"
                  checked={!hasInsurance}
                  onChange={() => { setHasInsurance(false); setDeclaredValue(''); }}
                  className="w-4 h-4 mt-1 text-[#56E1E9] accent-[#56E1E9] bg-[#0A2353] border-gray-600 focus:ring-[#5B58EB]"
                />
                Non (aucun frais, remboursement maximum de 5000da)
              </label>
              <label className="flex items-start gap-2 cursor-pointer text-gray-300 text-sm">
                <input
                  type="radio"
                  name="insurance"
                  value="yes"
                  checked={hasInsurance}
                  onChange={() => setHasInsurance(true)}
                  className="w-4 h-4 mt-1 text-[#56E1E9] accent-[#56E1E9] bg-[#0A2353] border-gray-600 focus:ring-[#5B58EB]"
                />
                Oui (frais 0% de la valeur déclarée, remboursement intégral de la valeur déclarée)
              </label>
            </div>

            {hasInsurance && (
              <div className="mt-4">
                <div className="flex flex-col md:flex-row bg-[#112C70]/80 rounded border border-gray-600 overflow-hidden mb-4">
                  <span className="w-full md:w-1/3 p-2 text-gray-400 border-b md:border-b-0 md:border-r border-gray-600">Valeur déclarée</span>
                  <input
                    type="number"
                    value={declaredValue}
                    onChange={(e) => setDeclaredValue(e.target.value)}
                    onWheel={(e) => e.target.blur()}
                    className="w-full md:w-2/3 p-2 bg-transparent text-white outline-none"
                    placeholder="La valeur du contenu du colis"
                  />
                </div>
              </div>
            )}

            <div className="bg-[#112C70]/50 rounded border border-gray-600 p-4 space-y-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-gray-400">Frais remboursement</span>
                <span className="text-red-400">- DZD</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium border-t border-gray-600 pt-2">
                <span className="text-gray-400">Type de remboursement</span>
                <span className="text-gray-200">-</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold border-t border-gray-600 pt-2">
                <span className="text-gray-200">Montant remboursable</span>
                <span className="text-green-400">- DZD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Photos (Custom extension for backend logic) */}
        <div className="bg-gray-700/50 rounded-lg overflow-hidden border border-gray-600">
          <div className="p-4 bg-[#112C70] border-b border-gray-600">
            <h3 className="font-bold text-gray-200">Photos jointes (Optionnel)</h3>
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
            className="px-8 py-3 bg-[linear-gradient(135deg,_#5B58EB,_#09fbff)] disabled:opacity-50 hover:opacity-90 text-white rounded font-medium shadow-lg w-full md:w-auto md:min-w-[300px]"
          >
            Créer le colis
          </button>
        </div>

      </div>
    </div>
  );
}