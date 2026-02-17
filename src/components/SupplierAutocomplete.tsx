import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SupplierAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddSupplier?: (name: string) => Promise<void>;
  getSupplierSuggestions?: (searchTerm: string) => Promise<{ id: number; name: string }[]>;
  placeholder?: string;
  className?: string;
  businessId: string;
}

const SupplierAutocomplete: React.FC<SupplierAutocompleteProps> = ({
  value,
  onChange,
  onAddSupplier,
  getSupplierSuggestions,
  placeholder = "Search or add supplier...",
  className = "",
  businessId
}) => {
  const [suggestions, setSuggestions] = useState<{ id: number; name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load suggestions when value changes
  useEffect(() => {
    const loadSuggestions = async () => {
      if (value.length < 1) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoading(true);
      try {
        let supplierData: { id: number; name: string }[] = [];

        if (getSupplierSuggestions) {
          supplierData = await getSupplierSuggestions(value);
        } else {
          // Fallback to direct database query
          const { data, error } = await supabase
            .from('suppliers')
            .select('id, name')
            .eq('business_id', businessId)
            .ilike('name', `%${value}%`)
            .order('name')
            .limit(10);

          if (error) {
            console.error('Error loading suppliers:', error);
          } else {
            supplierData = data || [];
          }
        }

        setSuggestions(supplierData);
        setShowSuggestions(supplierData.length > 0);
      } catch (error) {
        console.error('Error loading supplier suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(loadSuggestions, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [value, businessId, getSupplierSuggestions]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const handleSuggestionClick = (supplier: { id: number; name: string }) => {
    onChange(supplier.name);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSuggestionClick(suggestions[0]);
      } else if (value.trim() && onAddSupplier) {
        handleAddNewSupplier();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleAddNewSupplier = async () => {
    if (!value.trim() || !onAddSupplier) return;

    try {
      await onAddSupplier(value.trim());
      setShowSuggestions(false);
    } catch (error) {
      console.error('Error adding supplier:', error);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => value.length > 0 && suggestions.length > 0 && setShowSuggestions(true)}
        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder}
        autoComplete="off"
      />
      
      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((supplier) => (
            <div
              key={supplier.id}
              onClick={() => handleSuggestionClick(supplier)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900">{supplier.name}</div>
            </div>
          ))}
        </div>
      )}

      {showSuggestions && suggestions.length === 0 && value.length > 0 && !loading && onAddSupplier && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg"
        >
          <div
            onClick={handleAddNewSupplier}
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-blue-600"
          >
            <div className="font-medium">Add "{value}" as new supplier</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierAutocomplete;