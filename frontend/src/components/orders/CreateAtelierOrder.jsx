import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X } from 'lucide-react';
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
    inventoryItemId: ''
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
    setProducts([...products, { type: '', quantity: 1, unitPrice: 0, inventoryItemId: '' }]);
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
        ? { ...p, inventoryItemId, type: typeLabel, unitPrice: unitPriceFromStock ?? p.unitPrice }
        : p
    ));
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
        inventoryItemId: p.inventoryItemId
      }))
    };

    onSave(newOrder, photos);

    // Reset form
    setFirstName('');
    setLastName('');
    setPhone('');
    setProducts([{ type: '', quantity: 1, unitPrice: 0, inventoryItemId: '' }]);
    setPhotos([]);
    setVersement(0);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-8">Ajouter une commande (Sur place)</h2>

      <div className="bg-gray-800 rounded-lg p-6 space-y-8">

        {/* Client Info */}
        <div className="bg-gray-700/50 rounded-lg overflow-hidden border border-gray-600">
          <div className="p-4 bg-gray-800 border-b border-gray-600">
            <h3 className="font-bold text-gray-200">Informations du client</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row bg-gray-800/80 rounded border border-gray-600 overflow-hidden">
              <span className="w-full md:w-1/3 p-2 text-gray-400 border-b md:border-b-0 md:border-r border-gray-600">Nom du client</span>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full md:w-2/3 p-2 bg-transparent text-white outline-none" />
            </div>

            <div className="flex flex-col md:flex-row bg-gray-800/80 rounded border border-gray-600 overflow-hidden mt-4">
              <span className="w-full md:w-1/3 p-2 text-gray-400 border-b md:border-b-0 md:border-r border-gray-600">Prénom</span>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full md:w-2/3 p-2 bg-transparent text-white outline-none" />
            </div>

            <div className="flex flex-col md:flex-row bg-gray-800/80 rounded border border-gray-600 overflow-hidden mt-4">
              <span className="w-full md:w-1/3 p-2 text-gray-400 border-b md:border-b-0 md:border-r border-gray-600">Téléphone (Optionnel)</span>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full md:w-2/3 p-2 bg-transparent text-white outline-none" />
            </div>
          </div>
        </div>

        {/* Le colis */}
        <div className="bg-gray-700/50 rounded-lg overflow-hidden border border-gray-600">
          <div className="p-4 bg-gray-800 border-b border-gray-600">
            <h3 className="font-bold text-gray-200">Produits</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="border border-gray-600 rounded p-4 mb-4 bg-gray-800/80">
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-300 font-medium">Produit(s) commandé(s)</span>
                <button onClick={addProduct} className="text-blue-500 hover:text-blue-400 flex items-center text-sm transition font-medium">
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
                  const selectedStockItem = stockProducts.find(sp => sp.id === parseInt(product.inventoryItemId, 10));

                  return (
                  <div key={idx} className="flex flex-col md:flex-row gap-4 items-start md:items-start bg-gray-900/50 md:bg-transparent p-4 md:p-0 rounded-lg border border-gray-700 md:border-none">
                    
                    {/* Product Selection */}
                    <div className="w-full md:w-6/12 flex flex-col gap-2">
                      <span className="md:hidden text-xs text-gray-400 font-medium">Type de produit</span>
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
                        className="w-full p-2.5 bg-gray-900 border border-gray-600 text-white rounded outline-none focus:border-blue-500 transition"
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
                    </div>

                    {/* Quantity */}
                    <div className="w-full md:w-2/12 flex flex-col relative">
                      <span className="md:hidden text-xs text-gray-400 font-medium mb-1">Quantité</span>
                      <input
                        type="number" min="1" placeholder="Qté"
                        value={product.quantity || ''}
                        onChange={(e) => updateProduct(idx, 'quantity', parseInt(e.target.value) || '')}
                        onWheel={(e) => e.target.blur()}
                        className="w-full p-2.5 bg-gray-900 border border-gray-600 text-white rounded outline-none transition text-center focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                          className="w-full p-2.5 bg-gray-900 border border-gray-600 text-white rounded-l outline-none transition text-center focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="px-2 py-2.5 bg-gray-900 border border-l-0 border-gray-600 text-xs text-gray-400 rounded-r">DA</span>
                      </div>
                    </div>

                    {/* Line total */}
                    <div className="w-full md:w-2/12 flex flex-col">
                      <span className="md:hidden text-xs text-gray-400 font-medium mb-1">Total</span>
                      <div className="w-full p-2.5 bg-gray-900 border border-gray-600 text-blue-300 rounded text-center font-semibold">
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
                  <span className="text-gray-300">{Number(totalPrice || 0).toLocaleString()} DA</span>
                </div>
                
                <div className="flex justify-between items-center bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                  <span className="text-gray-300 font-bold uppercase text-sm">Versement (Acompte)</span>
                  <div className="flex items-center w-32">
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={versement || ''}
                      onChange={(e) => setVersement(Number(e.target.value) || 0)}
                      onWheel={(e) => e.target.blur()}
                      className="w-full p-2.5 bg-gray-900 border border-gray-600 text-white rounded-l outline-none transition text-center focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="px-2 py-2.5 bg-gray-900 border border-l-0 border-gray-600 text-xs text-gray-400 rounded-r">DA</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-300 font-bold uppercase text-sm">Reste à payer</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl text-blue-400 font-bold">
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
          <div className="p-4 bg-gray-800 border-b border-gray-600">
            <h3 className="font-bold text-gray-200">Photo du colis (Optionnel)</h3>
          </div>
          <div className="p-4">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setPhotos(Array.from(e.target.files))}
              className="w-full text-gray-300 bg-gray-900 p-2 rounded border border-gray-600 outline-none"
            />
            {photos.length > 0 && (
              <p className="mt-2 text-sm text-gray-400">{photos.length} photo(s) sélectionnée(s)</p>
            )}
          </div>
        </div>

        <div className="flex justify-center pt-6 pb-20">
          <button
            onClick={handleSubmit}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium shadow-lg w-full md:w-auto md:min-w-[300px]"
          >
            Créer la commande
          </button>
        </div>

      </div>
    </div>
  );
}
