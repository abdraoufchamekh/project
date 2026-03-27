import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../../utils/constants';
import ProductFormModal from './ProductFormModal';

export default function StockManagement() {
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.get(`${API_BASE_URL}/stock`, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('aurea_token')}`
          }
      });
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching stock:', error);
      alert('Erreur: Impossible de charger le stock');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/stock/${productId}`, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('aurea_token')}`
          }
      });
      fetchStock();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Erreur: Impossible de supprimer le produit');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleOpenModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    fetchStock(); // Refresh list
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">Gestion de Stock</h2>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-4 py-2 bg-[linear-gradient(135deg,_#03ccff,_#09fbff,_#d403e1)] hover:opacity-90 text-white rounded-lg transition shadow-lg"
        >
          <Plus size={20} />
          <span>Ajouter un article</span>
        </button>
      </div>

      <div className="bg-[#112C70] rounded-xl border border-gray-700 overflow-hidden flex-1 flex flex-col shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0A2353]/50 border-b border-gray-700">
                <th className="p-4 text-gray-300 font-semibold">Article</th>
                <th className="p-4 text-gray-300 font-semibold">Couleur</th>
                <th className="p-4 text-gray-300 font-semibold">Dimension</th>
                <th className="p-4 text-gray-300 font-semibold">Taille</th>
                <th className="p-4 text-gray-300 font-semibold text-center">Quantité</th>
                <th className="p-4 text-gray-300 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#03ccff] mx-auto mb-4"></div>
                    Chargement du stock...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">Aucun article en stock</td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-750 transition-colors group">
                    <td className="p-4 align-middle">
                      <div className="font-medium text-white">{product.name}</div>
                    </td>
                    <td className="p-4 align-middle text-gray-400">
                      {product.color ? <span className="bg-[#112C70] border border-gray-600 px-2 py-0.5 rounded text-pink-300 text-sm">{product.color}</span> : <span className="text-gray-600">-</span>}
                    </td>
                    <td className="p-4 align-middle text-gray-400">
                      {product.dimension ? <span className="bg-[#112C70] border border-gray-600 px-2 py-0.5 rounded text-[#03ccff] text-sm">{product.dimension}</span> : <span className="text-gray-600">-</span>}
                    </td>
                    <td className="p-4 align-middle text-gray-400">
                      {product.size ? <span className="bg-[#112C70] border border-gray-600 px-2 py-0.5 rounded text-green-300 text-sm">{product.size}</span> : <span className="text-gray-600">-</span>}
                    </td>
                    <td className="p-4 align-middle text-center">
                      <div className={`text-sm font-bold ${product.quantity > 5 ? 'text-green-500' : product.quantity > 0 ? 'text-orange-500' : 'text-red-500'}`}>
                        {product.quantity}
                      </div>
                    </td>
                    <td className="p-4 align-middle text-right space-x-2">
                       <button 
                         onClick={() => handleEditProduct(product)}
                         className="text-gray-400 hover:text-[#03ccff] transition p-2 bg-[#112C70] rounded opacity-0 group-hover:opacity-100 focus:opacity-100"
                         title="Modifier"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                         onClick={() => handleDeleteProduct(product.id)}
                         className="text-gray-400 hover:text-red-400 transition p-2 bg-[#112C70] rounded opacity-0 group-hover:opacity-100 focus:opacity-100"
                         title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ProductFormModal 
          isOpen={isModalOpen} 
          onClose={handleModalClose} 
          editingProduct={editingProduct} 
        />
      )}
    </div>
  );
}
