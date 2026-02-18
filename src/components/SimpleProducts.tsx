import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SimpleProductsProps {
  businessId: string;
  onProductUpdate?: () => void;
}

const SimpleProducts: React.FC<SimpleProductsProps> = ({ businessId, onProductUpdate }) => {
  const [products, setProducts] = useState<{ id: number, name: string, todays_price?: number }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: number, name: string }[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingPrice, setEditingPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteConfirmSupplier, setDeleteConfirmSupplier] = useState<{ id: number; name: string } | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState(false);

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
        .select('id, name, todays_price')
        .eq('business_id', businessId)
        .order('name');

      if (productsError) {
        console.error('Error loading products:', productsError);
      } else {
        setProducts((productsData || []) as any);
      }

      // Load suppliers
      const { data: suppliersData, error: suppliersError } = await (supabase as any)
        .from('suppliers')
        .select('id, name')
        .eq('business_id', businessId)
        .order('name');

      if (suppliersError) {
        console.error('Error loading suppliers:', suppliersError);
      } else {
        setSuppliers((suppliersData || []) as any);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newProductName.trim()) return;

    try {
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert([{
          business_id: businessId,
          name: newProductName.trim(),
          todays_price: newProductPrice ? parseFloat(newProductPrice) : 0
        }] as any)
        .select()
        .single();

      if (error) {
        console.error('Error adding product:', error);
        alert('Error adding product: ' + error.message);
        return;
      }

      setProducts(prev => [...prev, newProduct]);
      setNewProductName('');
      setNewProductPrice('');
      if (onProductUpdate) onProductUpdate();
      alert('Product added successfully!');
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error adding product. Please try again.');
    }
  };

  const handleAddSupplier = async () => {
    if (!newSupplierName.trim()) return;

    try {
      const { data: newSupplier, error } = await (supabase as any)
        .from('suppliers')
        .insert([{ business_id: businessId, name: newSupplierName.trim() }])
        .select()
        .single();

      if (error) {
        console.error('Error adding supplier:', error);
        alert('Error adding supplier: ' + error.message);
        return;
      }

      setSuppliers(prev => [...prev, newSupplier]);
      setNewSupplierName('');
      alert('Supplier added successfully!');
    } catch (error) {
      console.error('Error adding supplier:', error);
      alert('Error adding supplier. Please try again.');
    }
  };

  const handleEditStart = (product: { id: number, name: string, todays_price?: number }) => {
    setEditingId(product.id);
    setEditingName(product.name);
    setEditingPrice(product.todays_price?.toString() || '');
  };

  const handleEditSave = async () => {
    if (editingId === null || !editingName.trim()) return;

    try {
      const updates: any = { name: editingName.trim() };
      if (editingPrice) {
        updates.todays_price = parseFloat(editingPrice);
      }

      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', editingId);

      if (error) {
        console.error('Error updating product:', error);
        alert('Error updating product: ' + error.message);
        return;
      }

      setProducts(prev => prev.map(p =>
        p.id === editingId ? { ...p, ...updates } : p
      ));
      setEditingId(null);
      setEditingName('');
      setEditingPrice('');
      if (onProductUpdate) onProductUpdate();
      alert('Product updated successfully!');
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error updating product. Please try again.');
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingName('');
    setEditingPrice('');
  };

  const handleDeleteSupplier = async (supplier: { id: number; name: string }) => {
    setDeleteConfirmSupplier(supplier);
  };

  const confirmDeleteSupplier = async () => {
    if (!deleteConfirmSupplier) return;

    setDeletingSupplier(true);
    try {
      // Use the database function for cascade delete
      const { error } = await (supabase.rpc as any)('delete_supplier_with_cascade', {
        p_supplier_id: deleteConfirmSupplier.id,
        p_business_id: businessId
      });

      if (error) {
        console.error('Error deleting supplier:', error);
        alert('Error deleting supplier: ' + error.message);
        return;
      }

      // Update local state
      setSuppliers(prev => prev.filter(s => s.id !== deleteConfirmSupplier.id));
      setDeleteConfirmSupplier(null);
      alert(`Supplier "${deleteConfirmSupplier.name}" and all related data deleted successfully!`);
    } catch (error) {
      console.error('Error deleting supplier:', error);
      alert('Error deleting supplier. Please try again.');
    } finally {
      setDeletingSupplier(false);
    }
  };

  const cancelDeleteSupplier = () => {
    setDeleteConfirmSupplier(null);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product: ' + error.message);
        return;
      }

      setProducts(prev => prev.filter(p => p.id !== id));
      if (onProductUpdate) onProductUpdate();
      alert('Product deleted successfully!');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product. Please try again.');
    }
  };

  const handleInlinePriceUpdate = async (productId: number, newPrice: number) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ todays_price: newPrice } as any)
        .eq('id', productId)
        .eq('business_id', businessId);

      if (error) {
        console.error('Error updating price:', error);
        return;
      }

      setProducts(prev => prev.map(p =>
        p.id === productId ? { ...p, todays_price: newPrice } : p
      ));
      if (onProductUpdate) onProductUpdate();
    } catch (error) {
      console.error('Error updating price:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading products and suppliers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Manage Products</h2>
        <p className="text-sm text-gray-600">Business ID: {businessId}</p>
      </div>

      {/* Add New Product */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Add New Product</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Product Name (e.g., Fish, Prawns)"
            onKeyPress={(e) => e.key === 'Enter' && handleAddProduct()}
          />
          <input
            type="number"
            value={newProductPrice}
            onChange={(e) => setNewProductPrice(e.target.value)}
            className="w-full md:w-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Today's Price"
            step="0.01"
            onKeyPress={(e) => e.key === 'Enter' && handleAddProduct()}
          />
          <button
            onClick={handleAddProduct}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Plus className="inline mr-2 h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Suppliers Section */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Suppliers</h3>
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={newSupplierName}
            onChange={(e) => setNewSupplierName(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="Supplier Name"
            onKeyPress={(e) => e.key === 'Enter' && handleAddSupplier()}
          />
          <button
            onClick={handleAddSupplier}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            <Plus className="inline mr-2 h-4 w-4" />
            Add Supplier
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="bg-white border border-gray-200 rounded-lg p-3 flex justify-between items-center">
              <span className="font-medium">{supplier.name}</span>
              <button
                onClick={() => handleDeleteSupplier(supplier)}
                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                title="Delete supplier and all related data"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {suppliers.length === 0 && (
            <div className="text-gray-500">No suppliers yet. Add your first supplier above.</div>
          )}
        </div>
      </div>

      {/* Products List */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Products List ({products.length})</h3>

        {products.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded">
              <h4 className="font-semibold">No Products Available</h4>
              <p>Add your first product using the form above.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                {editingId === product.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Product Name</label>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && handleEditSave()}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Today's Price (₹/kg)</label>
                      <input
                        type="number"
                        value={editingPrice}
                        onChange={(e) => setEditingPrice(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        step="0.01"
                        onKeyPress={(e) => e.key === 'Enter' && handleEditSave()}
                      />
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        onClick={handleEditSave}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                      >
                        <Save className="h-4 w-4 mr-1" /> Save
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center"
                      >
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-lg">{product.name}</h4>
                        <div className="text-sm text-gray-600 mt-1">
                          Today's Price:
                          <div className="mt-1 relative rounded-md shadow-sm max-w-[120px]">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                              <span className="text-gray-500 sm:text-sm">₹</span>
                            </div>
                            <input
                              type="number"
                              defaultValue={product.todays_price || ''}
                              className="block w-full rounded-md border-gray-300 pl-6 py-1.5 focus:border-green-500 focus:ring-green-500 sm:text-sm font-bold text-green-700 bg-green-50"
                              placeholder="0.00"
                              step="0.01"
                              onBlur={(e) => {
                                const newPrice = parseFloat(e.target.value);
                                if (!isNaN(newPrice) && newPrice !== product.todays_price) {
                                  handleInlinePriceUpdate(product.id, newPrice);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur();
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end mt-4 border-t pt-3">
                      <button
                        onClick={() => handleEditStart(product)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center"
                      >
                        <Edit className="h-3 w-3 mr-1" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center"
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Delete Supplier</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>{deleteConfirmSupplier.name}</strong>?
              This will also delete all related data including:
            </p>
            <ul className="text-sm text-gray-600 mb-6 list-disc list-inside">
              <li>All salary entries for this supplier</li>
              <li>All purchase entries for this supplier</li>
              <li>All load entries for this supplier</li>
            </ul>
            <p className="text-red-600 text-sm mb-6 font-medium">
              ⚠️ This action cannot be undone!
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDeleteSupplier}
                disabled={deletingSupplier}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSupplier}
                disabled={deletingSupplier}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {deletingSupplier ? (
                  <>
                    <div className="inline mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Supplier'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleProducts;
