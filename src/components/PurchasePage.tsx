import React, { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SupplierAutocomplete from './SupplierAutocomplete';

interface PurchasePageProps {
  businessId: string;
  suppliersExternal?: Supplier[];
}

interface Product { id: number; name: string; }
interface Supplier { id: number; name: string; }

const PurchasePage: React.FC<PurchasePageProps> = ({ businessId, suppliersExternal }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [productId, setProductId] = useState<number | ''>('');
  const [supplierInput, setSupplierInput] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [quantityKg, setQuantityKg] = useState<string>('');
  const [pricePerKg, setPricePerKg] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Get supplier suggestions function
  const getSupplierSuggestions = async (searchTerm: string = '') => {
    try {
      const { data, error } = await supabase.rpc('get_supplier_suggestions', {
        p_business_id: businessId,
        p_search_term: searchTerm
      });
      
      if (error) {
        console.error('Error fetching supplier suggestions:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getSupplierSuggestions:', error);
      return [];
    }
  };

  // Add supplier function
  const addSupplier = async (name: string) => {
    const clean = name.trim();
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([{ name: clean, business_id: businessId }])
        .select('id, name')
        .single();

      if (error) {
        // Handle duplicate gracefully: fetch existing and return
        // Postgres unique violation
        // @ts-ignore
        if (error.code === '23505') {
          const { data: existing, error: fetchErr } = await supabase
            .from('suppliers')
            .select('id, name')
            .eq('business_id', businessId)
            .ilike('name', clean)
            .limit(1)
            .single();
          if (fetchErr) {
            console.error('Fetch existing supplier failed after duplicate:', fetchErr);
            throw error;
          }
          // Ensure local state contains it
          setSuppliers(prev => {
            const exists = prev.find(s => s.id === existing.id);
            return exists ? prev : [...prev, existing as any];
          });
          return existing as any;
        }
        console.error('Error adding supplier:', error);
        throw error;
      }

      setSuppliers(prev => [...prev, data as any]);
      return data as any;
    } catch (err) {
      console.error('Error adding supplier:', err);
      throw err;
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [{ data: p }, sRes, purchasesRes] = await Promise.all([
          supabase.from('products').select('id,name').eq('business_id', businessId).order('name'),
          suppliersExternal ? Promise.resolve({ data: suppliersExternal }) : Promise.resolve({ data: [] }),
          supabase.from('purchases').select('*').eq('business_id', businessId).order('date', { ascending: false })
        ] as any);
        setProducts(p || []);
        setSuppliers((sRes as any)?.data || []);
        setPurchases((purchasesRes as any)?.data || []);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [businessId, suppliersExternal]);

  const billAmount = useMemo(() => {
    const q = parseFloat(quantityKg) || 0;
    const r = parseFloat(pricePerKg) || 0;
    return q * r;
  }, [quantityKg, pricePerKg]);

  const filteredSuppliers = useMemo(() => {
    const term = supplierInput.toLowerCase();
    return term ? suppliers.filter(s => s.name.toLowerCase().includes(term)) : suppliers;
  }, [supplierInput, suppliers]);

  const handleSave = async () => {
    // Resolve supplier automatically if user typed a name but didn't click a suggestion
    let supplierToUse: Supplier | null = selectedSupplier;
    if (!supplierToUse && supplierInput.trim()) {
      const typed = supplierInput.trim();
      // Try find in local list first (case-insensitive)
      supplierToUse = suppliers.find(s => s.name.toLowerCase() === typed.toLowerCase()) || null;
      // If not found, create it
      if (!supplierToUse) {
        try {
          const created = await addSupplier(typed);
          supplierToUse = created as unknown as Supplier;
          // Ensure local state is in sync for immediate use
          setSelectedSupplier(supplierToUse);
        } catch (e: any) {
          alert('Failed to create supplier: ' + (e?.message || 'Unknown error'));
          return;
        }
      }
    }

    if (!productId || !supplierToUse) {
      alert('Select product and supplier');
      return;
    }
    if (!quantityKg || !pricePerKg) {
      alert('Enter quantity and price per KG');
      return;
    }
    setSaving(true);
    try {
      const quantity = parseFloat(quantityKg) || 0;
      const price = parseFloat(pricePerKg) || 0;
      const totalAmount = quantity * price;
      const paid = parseFloat(paidAmount) || 0;
      const balance = totalAmount - paid;

      const insertData = {
        business_id: businessId,
        date: date,
        purchase_date: date,
        product_id: Number(productId),
        supplier_id: supplierToUse.id,
        quantity_kg: quantity,
        price_per_kg: price,
        total_amount: totalAmount,
        paid_amount: paid,
        balance_amount: balance
      } as any;

      console.log('Saving purchase:', insertData);

      const { data: savedPurchase, error } = await supabase.from('purchases').insert([insertData]).select().single();
      if (error) throw error;
      
      // Add the new purchase to the list
      setPurchases(prev => [savedPurchase, ...prev]);
      
      // reset form
      setProductId('');
      setSelectedSupplier(null);
      setSupplierInput('');
      setQuantityKg('');
      setPricePerKg('');
      setPaidAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      alert('Purchase saved successfully!');
    } catch (e: any) {
      console.error('Error saving purchase', e);
      alert('Failed to save purchase: ' + (e?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading purchase data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Purchase Page</h2>
      
      {/* Purchase Form */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Add New Purchase</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
        <div>
          <label className="block text-sm font-medium mb-1">Supplier</label>
          <SupplierAutocomplete
            value={supplierInput}
            onChange={(value) => {
              setSupplierInput(value);
              // Find and set selected supplier if it matches
              const matchingSupplier = suppliers.find(s => s.name.toLowerCase() === value.toLowerCase());
              setSelectedSupplier(matchingSupplier || null);
            }}
            onAddSupplier={addSupplier}
            getSupplierSuggestions={getSupplierSuggestions}
            businessId={businessId}
            placeholder="Type supplier name or add new"
            className="w-full"
          />
        </div>
          <div>
            <label className="block text-sm font-medium mb-1">Product</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : '')}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select product</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">Quantity (KG)</label>
            <input
              type="number"
              step="0.01"
              value={quantityKg}
              onChange={(e) => setQuantityKg(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price per KG</label>
            <input
              type="number"
              step="0.01"
              value={pricePerKg}
              onChange={(e) => setPricePerKg(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bill Amount</label>
            <input
              type="number"
              value={billAmount.toFixed(2)}
              readOnly
              className="w-full p-2 border border-gray-300 rounded bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Paid Amount</label>
            <input
              type="number"
              step="0.01"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-2 ${saving ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg`}
          >
            <Save className="inline mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </div>
      
      {/* Purchase History */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Purchase History ({purchases.length})</h3>
        
        {purchases.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded">
              <h4 className="font-semibold">No Purchases Yet</h4>
              <p>Add your first purchase using the form above.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">Date</th>
                  <th className="border border-gray-300 p-2 text-left">Product</th>
                  <th className="border border-gray-300 p-2 text-left">Supplier</th>
                  <th className="border border-gray-300 p-2 text-left">Quantity (kg)</th>
                  <th className="border border-gray-300 p-2 text-left">Price/kg</th>
                  <th className="border border-gray-300 p-2 text-left">Total Amount</th>
                  <th className="border border-gray-300 p-2 text-left">Paid Amount</th>
                  <th className="border border-gray-300 p-2 text-left">Balance</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => {
                  const product = products.find(p => p.id === purchase.product_id);
                  const supplier = suppliers.find(s => s.id === purchase.supplier_id);
                  
                  return (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2">{purchase.date || purchase.purchase_date}</td>
                      <td className="border border-gray-300 p-2">{product?.name || 'N/A'}</td>
                      <td className="border border-gray-300 p-2">{supplier?.name || 'N/A'}</td>
                      <td className="border border-gray-300 p-2">{purchase.quantity_kg || 0}</td>
                      <td className="border border-gray-300 p-2">₹{purchase.price_per_kg || 0}</td>
                      <td className="border border-gray-300 p-2 font-semibold">₹{purchase.total_amount || 0}</td>
                      <td className="border border-gray-300 p-2">₹{purchase.paid_amount || 0}</td>
                      <td className="border border-gray-300 p-2">
                        <span className={`px-2 py-1 rounded text-sm ${
                          (purchase.balance_amount || 0) > 0 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          ₹{purchase.balance_amount || 0}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchasePage;


