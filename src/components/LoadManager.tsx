
import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SupplierAutocomplete from './SupplierAutocomplete';

interface LoadEntry {
  id?: number;
  entry_date: string;
  no_of_boxes: number;
  quantity_with_box: number;
  no_of_boxes_after: number;
  quantity_after_box: number;
}

interface LoadManagerProps {
  businessId: string;
  suppliersExternal?: { id: number; name: string }[];
  getSupplierSuggestions?: (searchTerm: string) => Promise<{ id: number; name: string }[]>;
  addSupplier?: (name: string) => Promise<void>;
}

const LoadManager: React.FC<LoadManagerProps> = ({ 
  businessId, 
  suppliersExternal, 
  getSupplierSuggestions, 
  addSupplier 
}) => {
  const [entries, setEntries] = useState<LoadEntry[]>([]);
  const [newEntry, setNewEntry] = useState<LoadEntry>({
    entry_date: new Date().toISOString().split('T')[0],
    no_of_boxes: 0,
    quantity_with_box: 0,
    no_of_boxes_after: 0,
    quantity_after_box: 0
  });
  const [currentStock, setCurrentStock] = useState(0);
  const [weeklyConsumption, setWeeklyConsumption] = useState(0);
  const [suggestedPurchase, setSuggestedPurchase] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<{id:number,name:string}[]>([]);
  const [suppliers, setSuppliers] = useState<{id:number,name:string}[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | ''>('');
  const [selectedSupplierName, setSelectedSupplierName] = useState('');

  // Load existing entries and inventory
  useEffect(() => {
    loadData();
  }, [businessId]);

  // Keep suppliers in sync with external state if provided
  useEffect(() => {
    if (suppliersExternal && suppliersExternal.length >= 0) {
      setSuppliers(suppliersExternal);
    }
  }, [suppliersExternal]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('[LOAD MANAGER] Loading data for business:', businessId);
      
      // Load load entries with error handling
      try {
        const { data: entriesData, error: entriesError } = await supabase
          .from('load_entries')
          .select('*')
          .eq('business_id', businessId)
          .order('entry_date', { ascending: false });

        if (entriesError) {
          console.error('[LOAD MANAGER] Error loading entries:', entriesError);
          // Don't fail completely, just show empty entries
          setEntries([]);
        } else {
          console.log('[LOAD MANAGER] Loaded entries:', entriesData);
          setEntries(entriesData || []);
        }
      } catch (entriesErr) {
        console.error('[LOAD MANAGER] Exception loading entries:', entriesErr);
        setEntries([]);
      }

      // Load current inventory with error handling
      try {
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('inventory')
          .select('*')
          .eq('business_id', businessId)
          .single();

        if (inventoryError && inventoryError.code !== 'PGRST116') {
          console.error('[LOAD MANAGER] Error loading inventory:', inventoryError);
          setCurrentStock(0);
        } else {
          const stock = (inventoryData as any)?.chicken_stock_kg || 0;
          setCurrentStock(stock);
          console.log('[LOAD MANAGER] Current stock:', stock);
        }
        
        // Calculate weekly consumption (simple average of last 4 weeks)
        await calculateWeeklyConsumption();
      } catch (inventoryErr) {
        console.error('[LOAD MANAGER] Exception loading inventory:', inventoryErr);
        setCurrentStock(0);
      }

      // Load products and suppliers for dropdowns with error handling
      try {
        const [productsResult, suppliersResult] = await Promise.allSettled([
          supabase.from('products').select('id,name').eq('business_id', businessId).order('name'),
          suppliersExternal ? Promise.resolve({ data: suppliersExternal }) : supabase.from('suppliers').select('id,name').eq('business_id', businessId).order('name')
        ]);
        
        // Handle products result
        if (productsResult.status === 'fulfilled' && productsResult.value.data) {
          setProducts(productsResult.value.data);
          console.log('[LOAD MANAGER] Loaded products:', productsResult.value.data.length);
        } else {
          console.error('[LOAD MANAGER] Error loading products:', productsResult.status === 'rejected' ? productsResult.reason : 'No data');
          setProducts([]);
        }
        
        // Handle suppliers result
        if (suppliersResult.status === 'fulfilled') {
          const suppliersData = (suppliersResult.value as any)?.data || [];
          setSuppliers(suppliersData);
          console.log('[LOAD MANAGER] Loaded suppliers:', suppliersData.length);
        } else {
          console.error('[LOAD MANAGER] Error loading suppliers:', suppliersResult.status === 'rejected' ? suppliersResult.reason : 'No data');
          setSuppliers([]);
        }
      } catch (dropdownErr) {
        console.error('[LOAD MANAGER] Exception loading dropdowns:', dropdownErr);
        setProducts([]);
        setSuppliers([]);
      }
      
    } catch (error) {
      console.error('[LOAD MANAGER] Critical error loading data:', error);
      // Set safe defaults
      setEntries([]);
      setCurrentStock(0);
      setProducts([]);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeeklyConsumption = async () => {
    try {
      // Get bills from last 4 weeks to calculate average consumption
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      
      const { data: bills, error } = await supabase
        .from('bills')
        .select('items, created_at')
        .eq('business_id', businessId)
        .gte('created_at', fourWeeksAgo.toISOString());

      if (error) {
        console.error('Error calculating consumption:', error);
        return;
      }

      let totalConsumption = 0;
      bills?.forEach(bill => {
        if (bill.items && Array.isArray(bill.items)) {
          (bill.items as any[]).forEach((item: any) => {
            if (item.weight) {
              totalConsumption += parseFloat(item.weight);
            }
          });
        }
      });

      const weeklyAvg = totalConsumption / 4;
      setWeeklyConsumption(weeklyAvg);
      setSuggestedPurchase(Math.ceil(weeklyAvg * 1.2)); // 20% buffer
      
    } catch (error) {
      console.error('Error calculating consumption:', error);
    }
  };

  const handleInputChange = (field: keyof LoadEntry, value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    setNewEntry(prev => ({ ...prev, [field]: numValue }));
  };

  const handleSaveEntry = async () => {
    try {
      if (!newEntry.no_of_boxes || !newEntry.quantity_with_box || !newEntry.quantity_after_box) {
        alert('Please fill in all required fields');
        return;
      }
      if (!selectedProductId || !selectedSupplierId) {
        alert('Please select product and supplier');
        return;
      }

      setSaving(true);
      console.log('[LOAD MANAGER] Saving entry:', newEntry);

      // Try using the safe database function first
      try {
        const { data: entryId, error: rpcError } = await supabase.rpc('safe_add_load_entry', {
          p_business_id: businessId,
          p_entry_date: newEntry.entry_date,
          p_no_of_boxes: Number(newEntry.no_of_boxes),
          p_quantity_with_box: Number(newEntry.quantity_with_box),
          p_no_of_boxes_after: Number(newEntry.no_of_boxes_after),
          p_quantity_after_box: Number(newEntry.quantity_after_box),
          p_product_id: Number(selectedProductId),
          p_supplier_id: Number(selectedSupplierId)
        });

        if (rpcError) {
          console.warn('[LOAD MANAGER] RPC function failed, trying direct insert:', rpcError);
          throw new Error(`RPC failed: ${rpcError.message}`);
        }

        console.log('[LOAD MANAGER] Entry saved successfully via RPC, ID:', entryId);
      } catch (rpcError) {
        console.warn('[LOAD MANAGER] RPC failed, trying direct insert:', rpcError);
        
        // Fallback to direct insertion
        const entryToInsert = {
          business_id: businessId,
          entry_date: newEntry.entry_date,
          no_of_boxes: Number(newEntry.no_of_boxes),
          quantity_with_box: Number(newEntry.quantity_with_box),
          no_of_boxes_after: Number(newEntry.no_of_boxes_after),
          quantity_after_box: Number(newEntry.quantity_after_box),
          product_id: Number(selectedProductId),
          supplier_id: Number(selectedSupplierId)
        };

        console.log('[LOAD MANAGER] Entry to insert:', entryToInsert);

        const { data, error } = await supabase
          .from('load_entries')
          .insert([entryToInsert])
          .select()
          .single();

        if (error) {
          console.error('[LOAD MANAGER] Supabase error details:', error);
          alert('Error saving entry: ' + error.message);
          return;
        }

        console.log('[LOAD MANAGER] Entry saved successfully via direct insert:', data);
      }
      
      // Reset form
      setNewEntry({
        entry_date: new Date().toISOString().split('T')[0],
        no_of_boxes: 0,
        quantity_with_box: 0,
        no_of_boxes_after: 0,
        quantity_after_box: 0
      });
      setSelectedProductId('');
      setSelectedSupplierId('');
      setSelectedSupplierName('');

      // Reload data to get updated inventory and entries
      await loadData();
      alert('Entry saved successfully!');
      
    } catch (error) {
      console.error('[LOAD MANAGER] Unexpected error saving entry:', error);
      alert('Unexpected error saving entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this entry? This will also delete all related salary and purchase data.')) {
      return;
    }

    try {
      // Use the database function for cascade delete
      const { error } = await supabase.rpc('delete_load_entry_with_cascade', {
        p_load_id: id,
        p_business_id: businessId
      });

      if (error) {
        console.error('Error deleting entry:', error);
        alert('Error deleting entry');
        return;
      }

      await loadData();
      alert('Entry deleted successfully!');
      
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Error deleting entry. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading load management data...</p>
        <p className="text-sm text-gray-500 mt-2">Please wait while we fetch your data...</p>
      </div>
    );
  }

  // Show error state if no data could be loaded
  if (products.length === 0 && suppliers.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-4">
          <h3 className="font-semibold">No Data Available</h3>
          <p>Please add products and suppliers first to use load management.</p>
          <p className="text-sm mt-2">You can add products and suppliers from the Products page.</p>
        </div>
        <div className="space-x-4">
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry Loading
          </button>
          <button
            onClick={() => {
              // This would need to be passed as a prop to navigate to products page
              console.log('Navigate to products page to add data');
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Go to Products Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Load Management</h2>
        <div className="text-sm text-gray-600">
          Current Stock: <span className="font-bold text-green-600">{currentStock.toFixed(2)} kg</span>
        </div>
      </div>

      {/* Stock Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800">Current Stock</h3>
          <p className="text-2xl font-bold text-blue-900">{currentStock.toFixed(2)} kg</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h3 className="font-semibold text-orange-800">Weekly Consumption</h3>
          <p className="text-2xl font-bold text-orange-900">{weeklyConsumption.toFixed(2)} kg</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-800">Suggested Purchase</h3>
          <p className="text-2xl font-bold text-green-900">{suggestedPurchase.toFixed(2)} kg</p>
        </div>
      </div>

      {/* New Entry Form */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Add New Load Entry</h3>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={newEntry.entry_date}
              onChange={(e) => handleInputChange('entry_date', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value ? Number(e.target.value) : '')}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select product</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Supplier</label>
            {getSupplierSuggestions && addSupplier ? (
              <SupplierAutocomplete
                value={selectedSupplierName}
                onChange={(name) => {
                  setSelectedSupplierName(name);
                  const supplier = suppliers.find(s => s.name === name);
                  setSelectedSupplierId(supplier ? supplier.id : '');
                }}
                onAddSupplier={async (name) => {
                  await addSupplier(name);
                  // Refresh suppliers list
                  const { data: suppliersData } = await supabase
                    .from('suppliers')
                    .select('id, name')
                    .eq('business_id', businessId)
                    .order('name');
                  setSuppliers(suppliersData || []);
                  setSelectedSupplierName(name);
                  const newSupplier = suppliersData?.find(s => s.name === name);
                  if (newSupplier) {
                    setSelectedSupplierId(newSupplier.id);
                  }
                }}
                getSupplierSuggestions={getSupplierSuggestions}
                placeholder="Search or add supplier..."
                className="w-full"
              />
            ) : (
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value ? Number(e.target.value) : '')}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select supplier</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">No of Boxes</label>
            <input
              type="number"
              value={newEntry.no_of_boxes || ''}
              onChange={(e) => handleInputChange('no_of_boxes', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantity with Box (kg)</label>
            <input
              type="number"
              step="0.1"
              value={newEntry.quantity_with_box || ''}
              onChange={(e) => handleInputChange('quantity_with_box', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="10.0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">No of Boxes After</label>
            <input
              type="number"
              value={newEntry.no_of_boxes_after || ''}
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
              value={newEntry.quantity_after_box || ''}
              onChange={(e) => handleInputChange('quantity_after_box', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="8.5"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleSaveEntry}
            disabled={saving}
            className={`px-4 py-2 ${saving ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg`}
          >
            <Save className="inline mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </div>

      {/* Entries History */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Load History</h3>
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
                      onClick={() => entry.id && handleDeleteEntry(entry.id)}
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

export default LoadManager;
