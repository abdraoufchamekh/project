import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';

export default function ProductSelect({ value, onChange, stockProducts, placeholder = 'Sélectionner un produit...' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Automatically focus the search input when the dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Small timeout to ensure the element is rendered and interactive
      const timer = setTimeout(() => {
        searchInputRef.current.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Find currently selected product to show its label
  const selectedProduct = stockProducts.find(
    (sp) => String(sp.id) === String(value)
  );

  const getProductLabel = (sp) => {
    let labelParts = [];
    if (sp.color) labelParts.push(sp.color);
    if (sp.dimension) labelParts.push(sp.dimension);
    if (sp.size) labelParts.push(`Taille: ${sp.size}`);
    const label = labelParts.length > 0 ? labelParts.join(' - ') : '';
    return label ? `${sp.name} (${label})` : sp.name;
  };

  const getProductDisplayLabel = (sp) => {
    const label = getProductLabel(sp);
    return `${label} - Stock: ${sp.quantity}`;
  };

  // Filter products based on search query (case-insensitive match against name & characteristics)
  const filteredProducts = stockProducts.filter((sp) => {
    const label = getProductLabel(sp);
    return label.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSelect = (productId) => {
    // Mimic the native event structure so we don't have to change parent handlers
    onChange({
      target: {
        value: productId ? String(productId) : '',
      },
    });
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2.5 bg-[#0A2353] border border-gray-600 text-white rounded outline-none focus:border-[#5B58EB] transition flex items-center justify-between text-left"
      >
        <span className={selectedProduct ? 'text-white truncate pr-2' : 'text-gray-400 truncate pr-2'}>
          {selectedProduct ? getProductDisplayLabel(selectedProduct) : placeholder}
        </span>
        <ChevronDown size={18} className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-[#0A2353] border border-gray-600 rounded-md shadow-xl z-50 overflow-hidden flex flex-col max-h-[280px]">
          {/* Search Bar Pinned at Top */}
          <div className="p-2 border-b border-gray-600 bg-[#0A2353] sticky top-0 z-10 flex items-center">
            <Search size={16} className="text-gray-400 mr-2 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-white placeholder-gray-400 text-sm outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-white px-1 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Scrollable list */}
          <div className="overflow-y-auto flex-1 max-h-[220px]">
            <button
              type="button"
              onClick={() => handleSelect('')}
              className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-[#112C70] hover:text-white transition"
            >
              {placeholder}
            </button>
            
            {filteredProducts.length > 0 ? (
              filteredProducts.map((sp) => (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => handleSelect(sp.id)}
                  className={`w-full text-left px-3 py-2 text-sm text-white hover:bg-[#112C70] transition flex items-center justify-between ${
                    String(sp.id) === String(value) ? 'bg-[#112C70] font-semibold text-[#56E1E9]' : ''
                  }`}
                >
                  <span className="truncate pr-2">{getProductLabel(sp)}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">Stock: {sp.quantity}</span>
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-gray-400 text-center italic">
                Aucun produit trouvé
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
