import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';

export default function ProductFormModal({ isOpen, onClose, editingProduct }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [dimension, setDimension] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name || '');
      setColor(editingProduct.color || '');
      setDimension(editingProduct.dimension || '');
      setSize(editingProduct.size || '');
      setQuantity(editingProduct.quantity || 0);
      setImage(null);
    } else {
      setName('');
      setColor('');
      setDimension('');
      setSize('');
      setQuantity(0);
      setImage(null);
    }
  }, [editingProduct]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      alert('Veuillez entrer le nom de l\'article');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    if (color) formData.append('color', color);
    if (dimension) formData.append('dimension', dimension);
    if (size) formData.append('size', size);
    formData.append('quantity', quantity ? parseInt(quantity) : 0);
    if (image) {
      formData.append('image', image);
    }

    try {
      if (editingProduct) {
        await axios.put(`${API_BASE_URL}/stock/${editingProduct.id}`, formData, {
          headers: { 
            Authorization: `Bearer ${sessionStorage.getItem('aurea_token')}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        await axios.post(`${API_BASE_URL}/stock`, formData, {
          headers: { 
            Authorization: `Bearer ${sessionStorage.getItem('aurea_token')}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      onClose(); // Parent will refresh
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Erreur lors de la sauvegarde du produit');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#112C70] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-700 sticky top-0 bg-[#112C70] z-10">
          <h2 className="text-xl font-bold text-white">
            {editingProduct ? 'Modifier l\'article' : 'Ajouter un article'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Nom de l'article *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-[#0A2353] border border-gray-700 rounded text-white outline-none focus:border-[#56E1E9] transition"
                required
                placeholder="Ex: Couvre lit"
              />
            </div>

            <div className="flex space-x-4">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-gray-300">Couleur</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full p-2.5 bg-[#0A2353] border border-gray-700 rounded text-white outline-none focus:border-[#56E1E9] transition"
                  placeholder="Ex: Blanc"
                />
              </div>

              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-gray-300">Dimension</label>
                <input
                  type="text"
                  value={dimension}
                  onChange={(e) => setDimension(e.target.value)}
                  className="w-full p-2.5 bg-[#0A2353] border border-gray-700 rounded text-white outline-none focus:border-[#56E1E9] transition"
                  placeholder="Ex: 30x40"
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-gray-300">Taille</label>
                <input
                  type="text"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full p-2.5 bg-[#0A2353] border border-gray-700 rounded text-white outline-none focus:border-[#56E1E9] transition"
                  placeholder="Ex: XXL"
                />
              </div>

              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-gray-300">Quantité *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full p-2.5 bg-[#0A2353] border border-gray-700 rounded text-white outline-none focus:border-[#56E1E9] transition font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Photo de l'article (Optionnel)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
                className="w-full p-2.5 bg-[#0A2353] border border-gray-700 rounded text-gray-300 outline-none focus:border-[#56E1E9] transition"
              />
              {editingProduct?.image_url && !image && (
                <p className="text-xs text-[#56E1E9] mt-1">L'article a déjà une photo. Téléchargez pour la remplacer.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[linear-gradient(135deg,_#5B58EB,_#56E1E9)] hover:opacity-90 text-white rounded transition shadow"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
