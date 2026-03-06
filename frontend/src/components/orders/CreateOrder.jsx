import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { productTypes } from '../../utils/constants';

export default function CreateOrder({ onSave }) {
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [products, setProducts] = useState([{
    type: 'Cadre',
    quantity: 1,
    unitPrice: 0
  }]);

  const addProduct = () => {
    setProducts([...products, { type: 'Cadre', quantity: 1, unitPrice: 0 }]);
  };

  const removeProduct = (idx) => {
    setProducts(products.filter((_, i) => i !== idx));
  };

  const updateProduct = (idx, field, value) => {
    const updated = [...products];
    updated[idx][field] = value;
    setProducts(updated);
  };

  const handleSubmit = () => {
    if (!clientName || !phone) {
      alert('Veuillez remplir le nom et le téléphone du client');
      return;
    }

    if (products.some(p => p.unitPrice <= 0)) {
      alert('Veuillez entrer un prix valide pour tous les produits');
      return;
    }

    const newOrder = {
      id: Date.now(),
      clientName,
      phone,
      address,
      createdAt: new Date().toISOString().split('T')[0],
      assignedDesigner: 2, // Default designer
      products: products.map((p, i) => ({
        id: Date.now() + i,
        type: p.type,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        status: 'En attente',
        clientImages: 0,
        designerImages: 0
      }))
    };

    onSave(newOrder);

    // Reset form
    setClientName('');
    setPhone('');
    setAddress('');
    setProducts([{ type: 'Cadre', quantity: 1, unitPrice: 0 }]);
  };

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-white mb-8">Nouvelle Commande</h2>

      <div className="bg-gray-800 rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom du Client <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Nom complet"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Téléphone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="0555 000 000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Adresse
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Adresse complète"
            />
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">Produits</h3>
            <button
              onClick={addProduct}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              <Plus size={20} />
              Ajouter produit
            </button>
          </div>

          {products.map((product, idx) => (
            <div key={idx} className="bg-gray-900 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium text-white">Produit {idx + 1}</h4>
                {products.length > 1 && (
                  <button
                    onClick={() => removeProduct(idx)}
                    className="text-red-500 hover:text-red-400 transition"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Type
                  </label>
                  <select
                    value={product.type}
                    onChange={(e) => updateProduct(idx, 'type', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    {productTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Quantité
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={product.quantity}
                    onChange={(e) => updateProduct(idx, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Prix Unitaire (DA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={product.unitPrice}
                    onChange={(e) => updateProduct(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-700">
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
          >
            Créer la commande
          </button>
        </div>
      </div>
    </div>
  );
}