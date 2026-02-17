
import React, { useState } from 'react';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';

interface Product {
  id: number;
  name: string;
}

interface ProductsProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (id: number, name: string) => void;
  onDeleteProduct: (id: number) => void;
  suppliers?: { id: number; name: string }[];
  onAddSupplier?: (name: string) => Promise<void> | void;
  onDeleteSupplier?: (id: number) => Promise<void> | void;
  getSupplierSuggestions?: (searchTerm: string) => Promise<{ id: number; name: string }[]>;
  businessId?: string;
}

const Products: React.FC<ProductsProps> = ({ 
  products, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct,
  suppliers = [],
  onAddSupplier,
  onDeleteSupplier,
  getSupplierSuggestions,
  businessId
}) => {
  const [newProductName, setNewProductName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [deleteConfirmSupplier, setDeleteConfirmSupplier] = useState<{ id: number; name: string } | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState(false);

  const handleAddProduct = () => {
    if (newProductName.trim()) {
      onAddProduct({
        id: Date.now(),
        name: newProductName.trim()
      });
      setNewProductName('');
    }
  };

  const handleEditStart = (id: number, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleEditSave = () => {
    if (editingId !== null && editingName.trim()) {
      onUpdateProduct(editingId, editingName.trim());
      setEditingId(null);
      setEditingName('');
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleAddSupplier = async () => {
    const name = newSupplierName.trim();
    if (!name || !onAddSupplier) return;
    try {
      await onAddSupplier(name);
      setNewSupplierName('');
    } catch (e) {
      const msg = (e as any)?.message || 'Unknown error';
      alert('Failed to add supplier: ' + msg);
      console.error('Failed to add supplier:', e);
    }
  };

  const handleDeleteSupplier = async (supplier: { id: number; name: string }) => {
    setDeleteConfirmSupplier(supplier);
  };

  const confirmDeleteSupplier = async () => {
    if (!deleteConfirmSupplier || !onDeleteSupplier) return;
    
    setDeletingSupplier(true);
    try {
      await onDeleteSupplier(deleteConfirmSupplier.id);
      setDeleteConfirmSupplier(null);
      alert(`Supplier "${deleteConfirmSupplier.name}" and all related data deleted successfully!`);
    } catch (e) {
      const msg = (e as any)?.message || 'Unknown error';
      alert('Failed to delete supplier: ' + msg);
      console.error('Failed to delete supplier:', e);
    } finally {
      setDeletingSupplier(false);
    }
  };

  const cancelDeleteSupplier = () => {
    setDeleteConfirmSupplier(null);
  };

  return (
    <div className="space-y-6">
      {/* Add New Product */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Add New Product</h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Product Name (e.g., Fish, Prawns, etc.)"
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
        <form
          className="flex gap-4 mb-4"
          onSubmit={(e) => { e.preventDefault(); handleAddSupplier(); }}
        >
          <input
            type="text"
            value={newSupplierName}
            onChange={(e) => setNewSupplierName(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="Supplier Name"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            disabled={!onAddSupplier}
          >
            <Plus className="inline mr-2 h-4 w-4" />
            Add Supplier
          </button>
        </form>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {suppliers.map((s, idx) => (
            <div key={`${s.id || s}-${idx}`} className="bg-white border border-gray-200 rounded-lg p-3 flex justify-between items-center">
              <span className="font-medium">{typeof s === 'string' ? s : s.name}</span>
              {onDeleteSupplier && typeof s === 'object' && s.id && (
                <button
                  onClick={() => handleDeleteSupplier(s)}
                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                  title="Delete supplier and all related data"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
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
            <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4">
              {editingId === product.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleEditSave()}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleEditSave}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="font-medium">{product.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditStart(product.id, product.name)}
                      className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteProduct(product.id)}
                      className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
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

export default Products;
