import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SupplierAutocomplete from './SupplierAutocomplete';

interface SimpleLoadManagerProps {
  businessId: string;
}

const SimpleLoadManager: React.FC<SimpleLoadManagerProps> = ({ businessId }) => {
  const [entries, setEntries] = useState<any[]>([]);
  const [products, setProducts] = useState<{id: number, name: string}[]>([]);
  const [suppliers, setSuppliers] = useState<{id: number, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEntry, setNewEntry] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    no_of_boxes: '',
    quantity_with_box: '',
    no_of_boxes_after: '',
    quantity_after_box: '',
    supplier_name: '',
    product_id: ''
  });

  // Load data from database
  useEffect(() => {
    loadData();
  }, [businessId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name')
        .eq('business_id', businessId)
        .order('name');
      
      if (productsError) {
        console.error('Error loading products:', productsError);
      } else {
        setProducts(productsData || []);
      }

      // Load suppliers
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('business_id', businessId)
        .order('name');
      
      if (suppliersError) {
        console.error('Error loading suppliers:', suppliersError);
      } else {
        setSuppliers(suppliersData || []);
      }

      // Load load entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('load_entries')
        .select('*')
        .eq('business_id', businessId)
        .order('entry_date', { ascending: false });
      
      if (entriesError) {
        console.error('Error loading entries:', entriesError);
      } else {
        setEntries(entriesData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setNewEntry(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEntry = async () => {
    if (!newEntry.no_of_boxes || !newEntry.quantity_with_box || !newEntry.supplier_name || !newEntry.product_id) {
      alert('Please fill in all required fields including supplier name and product');
      return;
    }

    try {
      // Find or create supplier
      let supplierId = suppliers.find(s => s.name === newEntry.supplier_name)?.id;
      
      if (!supplierId) {
        // Create new supplier
        const { data: newSupplier, error: supplierError } = await supabase
          .from('suppliers')
          .insert([{ business_id: businessId, name: newEntry.supplier_name }])
          .select()
          .single();
        
        if (supplierError) {
          console.error('Error creating supplier:', supplierError);
          alert('Error creating supplier: ' + supplierError.message);
          return;
        }
        supplierId = newSupplier.id;
        setSuppliers(prev => [...prev, newSupplier]);
      }

      // Prepare entry data with all required fields
      const entryData = {
        business_id: businessId,
        entry_date: newEntry.entry_date,
        no_of_boxes: parseInt(newEntry.no_of_boxes) || 0,
        quantity_with_box: parseFloat(newEntry.quantity_with_box) || 0,
        no_of_boxes_after: parseInt(newEntry.no_of_boxes_after) || 0,
        quantity_after_box: parseFloat(newEntry.quantity_after_box) || 0,
        product_id: parseInt(newEntry.product_id),
        supplier_id: supplierId
      };

      console.log('Saving load entry:', entryData);

      // Save load entry to database
      const { data: savedEntry, error: entryError } = await supabase
        .from('load_entries')
        .insert([entryData])
        .select()
        .single();

      if (entryError) {
        console.error('Error saving entry:', entryError);
        alert('Error saving entry: ' + entryError.message);
        return;
      }

      console.log('Entry saved successfully:', savedEntry);
      setEntries(prev => [savedEntry, ...prev]);
      
      // Reset form
      setNewEntry({
        entry_date: new Date().toISOString().split('T')[0],
        no_of_boxes: '',
        quantity_with_box: '',
        no_of_boxes_after: '',
        quantity_after_box: '',
        supplier_name: '',
        product_id: ''
      });

      alert('Entry saved successfully!');
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Error saving entry. Please try again.');
    }
  };

  const handleDeleteEntry = (id: number) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      setEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading load management data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Load Management</h2>
        <div className="text-sm text-gray-600">
          Business ID: {businessId}
        </div>
      </div>

      {/* New Entry Form */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Add New Load Entry</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date *</label>
            <input
              type="date"
              value={newEntry.entry_date}
              onChange={(e) => handleInputChange('entry_date', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Supplier Name *</label>
            <SupplierAutocomplete
              value={newEntry.supplier_name}
              onChange={(value) => handleInputChange('supplier_name', value)}
              onAddSupplier={async (name) => {
                try {
                  const { data: newSupplier, error } = await supabase
                    .from('suppliers')
                    .insert([{ business_id: businessId, name }])
                    .select()
                    .single();
                  
                  if (error) {
                    console.error('Error creating supplier:', error);
                    alert('Error creating supplier: ' + error.message);
                    return;
                  }
                  
                  setSuppliers(prev => [...prev, newSupplier]);
                  alert('Supplier added successfully!');
                } catch (error) {
                  console.error('Error creating supplier:', error);
                  alert('Error creating supplier. Please try again.');
                }
              }}
              businessId={businessId}
              placeholder="Type supplier name..."
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Product *</label>
            <select
              value={newEntry.product_id}
              onChange={(e) => handleInputChange('product_id', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">No of Boxes *</label>
            <input
              type="number"
              value={newEntry.no_of_boxes}
              onChange={(e) => handleInputChange('no_of_boxes', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantity with Box (kg) *</label>
            <input
              type="number"
              step="0.1"
              value={newEntry.quantity_with_box}
              onChange={(e) => handleInputChange('quantity_with_box', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="10.0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">No of Boxes After</label>
            <input
              type="number"
              value={newEntry.no_of_boxes_after}
              onChange={(e) => handleInputChange('no_of_boxes_after', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantity After Box (kg)</label>
            <input
              type="number"
              step="0.1"
              value={newEntry.quantity_after_box}
              onChange={(e) => handleInputChange('quantity_after_box', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="8.5"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleSaveEntry}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Save className="inline mr-2 h-4 w-4" />
            Save Entry
          </button>
        </div>
      </div>

      {/* Entries History */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Load History ({entries.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Date</th>
                <th className="border border-gray-300 p-2 text-left">No of Boxes</th>
                <th className="border border-gray-300 p-2 text-left">Quantity with Box (kg)</th>
                <th className="border border-gray-300 p-2 text-left">No of Boxes After</th>
                <th className="border border-gray-300 p-2 text-left">Quantity After Box (kg)</th>
                <th className="border border-gray-300 p-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-2">{entry.entry_date}</td>
                  <td className="border border-gray-300 p-2">{entry.no_of_boxes}</td>
                  <td className="border border-gray-300 p-2">{entry.quantity_with_box}</td>
                  <td className="border border-gray-300 p-2">{entry.no_of_boxes_after}</td>
                  <td className="border border-gray-300 p-2">{entry.quantity_after_box}</td>
                  <td className="border border-gray-300 p-2">
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="border border-gray-300 p-4 text-center text-gray-500">
                    No entries found. Add your first load entry above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SimpleLoadManager;
