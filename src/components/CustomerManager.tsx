
import React, { useState } from 'react';
import { Plus, Edit, Save, X, Trash2, FileText, Upload } from 'lucide-react';
import BulkCustomerImport from './BulkCustomerImport';

interface Customer {
  name: string;
  phone: string;
  balance: number;
}

interface CustomerManagerProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => Promise<void>;
  onUpdateCustomer: (index: number, customer: Customer) => Promise<void>;
  onDeleteCustomer?: (customerName: string) => Promise<void>;
  onDownloadCustomerData?: (customerName: string) => void;
  onDownloadAllCustomersData?: () => void;
  businessId: string;
}

const CustomerManager: React.FC<CustomerManagerProps> = ({ 
  customers, 
  onAddCustomer, 
  onUpdateCustomer,
  onDeleteCustomer,
  onDownloadCustomerData,
  onDownloadAllCustomersData,
  businessId
}) => {
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', balance: 0 });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingCustomer, setEditingCustomer] = useState({ name: '', phone: '', balance: 0 });
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim()) {
      alert('Please enter a customer name');
      return;
    }
    
    if (!newCustomer.phone.trim()) {
      alert('Please enter a phone number');
      return;
    }

    // Check if customer already exists by name
    const existingCustomerByName = customers.find(c => c.name.toLowerCase() === newCustomer.name.toLowerCase());
    if (existingCustomerByName) {
      alert('A customer with this name already exists');
      return;
    }

    // Check if customer already exists by phone
    const existingCustomerByPhone = customers.find(c => c.phone === newCustomer.phone);
    if (existingCustomerByPhone) {
      alert('A customer with this phone number already exists');
      return;
    }

    setIsLoading(true);
    try {
      await onAddCustomer(newCustomer);
      setNewCustomer({ name: '', phone: '', balance: 0 });
      alert('Customer added successfully!');
    } catch (error) {
      alert('Error adding customer. Please try again.');
      console.error('Error adding customer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditStart = (index: number, customer: Customer) => {
    setEditingIndex(index);
    setEditingCustomer({ ...customer });
  };

  const handleEditSave = async () => {
    if (editingIndex === null) return;
    
    if (!editingCustomer.name.trim()) {
      alert('Please enter a customer name');
      return;
    }
    
    if (!editingCustomer.phone.trim()) {
      alert('Please enter a phone number');
      return;
    }

    // Check if name already exists (excluding current customer)
    const existingCustomerByName = customers.find((c, i) => 
      i !== editingIndex && c.name.toLowerCase() === editingCustomer.name.toLowerCase()
    );
    if (existingCustomerByName) {
      alert('A customer with this name already exists');
      return;
    }

    // Check if phone already exists (excluding current customer)
    const existingCustomerByPhone = customers.find((c, i) => 
      i !== editingIndex && c.phone === editingCustomer.phone
    );
    if (existingCustomerByPhone) {
      alert('A customer with this phone number already exists');
      return;
    }

    setIsLoading(true);
    try {
      await onUpdateCustomer(editingIndex, editingCustomer);
      setEditingIndex(null);
      alert('Customer updated successfully!');
    } catch (error) {
      alert('Error updating customer. Please try again.');
      console.error('Error updating customer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditingCustomer({ name: '', phone: '', balance: 0 });
  };

  const handleDeleteClick = (index: number) => {
    setDeleteConfirmIndex(index);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmIndex === null || !onDeleteCustomer) return;
    
    const customerToDelete = customers[deleteConfirmIndex];
    
    setIsLoading(true);
    try {
      await onDeleteCustomer(customerToDelete.name);
      setDeleteConfirmIndex(null);
      alert('Customer deleted successfully!');
    } catch (error) {
      alert(`Error deleting customer: ${error instanceof Error ? error.message : 'Please try again.'}`);
      console.error('Error deleting customer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmIndex(null);
  };

  const handleBulkImport = async (customersToImport: Customer[]) => {
    for (const customer of customersToImport) {
      await onAddCustomer(customer);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bulk Import Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-purple-800">Bulk Customer Import</h3>
            <p className="text-sm text-purple-600">Import multiple customers from Santhosh Chicken report data</p>
          </div>
          <button
            onClick={() => setShowBulkImport(!showBulkImport)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            <Upload className="inline mr-2 h-4 w-4" />
            {showBulkImport ? 'Hide Import' : 'Show Import'}
          </button>
        </div>
        
        {showBulkImport && (
          <div className="mt-4">
            <BulkCustomerImport
              existingCustomers={customers}
              onBulkImport={handleBulkImport}
              businessId={businessId}
            />
          </div>
        )}
      </div>

      {/* Add New Customer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Add New Customer</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            value={newCustomer.name}
            onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Customer Name"
          />
          <input
            type="tel"
            value={newCustomer.phone}
            onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Phone Number"
          />
          <input
            type="number"
            step="0.01"
            value={newCustomer.balance}
            onChange={(e) => setNewCustomer({...newCustomer, balance: parseFloat(e.target.value) || 0})}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Initial Balance"
          />
          <button
            onClick={handleAddCustomer}
            disabled={isLoading}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="inline mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Adding...
              </>
            ) : (
              <>
                <Plus className="inline mr-2 h-4 w-4" />
                Add Customer
              </>
            )}
          </button>
        </div>
      </div>

      {/* Customer List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Customer List ({customers.length})</h3>
          {onDownloadAllCustomersData && (
            <button
              onClick={onDownloadAllCustomersData}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              title="Download all customers data"
            >
              <FileText className="inline mr-2 h-4 w-4" />
              Download All Data
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-3 text-left">Name</th>
                <th className="border border-gray-300 p-3 text-left">Phone</th>
                <th className="border border-gray-300 p-3 text-left">Balance</th>
                <th className="border border-gray-300 p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, index) => (
                <tr key={`${customer.name}-${customer.phone}`}>
                  <td className="border border-gray-300 p-3">
                    {editingIndex === index ? (
                      <input
                        type="text"
                        value={editingCustomer.name}
                        onChange={(e) => setEditingCustomer({...editingCustomer, name: e.target.value})}
                        className="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      customer.name
                    )}
                  </td>
                  <td className="border border-gray-300 p-3">
                    {editingIndex === index ? (
                      <input
                        type="tel"
                        value={editingCustomer.phone}
                        onChange={(e) => setEditingCustomer({...editingCustomer, phone: e.target.value})}
                        className="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      customer.phone
                    )}
                  </td>
                  <td className="border border-gray-300 p-3">
                    {editingIndex === index ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editingCustomer.balance}
                        onChange={(e) => setEditingCustomer({...editingCustomer, balance: parseFloat(e.target.value) || 0})}
                        className="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      `₹${customer.balance.toFixed(2)}`
                    )}
                  </td>
                  <td className="border border-gray-300 p-3">
                    {editingIndex === index ? (
                      <div className="flex gap-2">
                        <button
                          onClick={handleEditSave}
                          disabled={isLoading}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          title="Save"
                        >
                          {isLoading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={handleEditCancel}
                          disabled={isLoading}
                          className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditStart(index, customer)}
                          disabled={isLoading}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {onDownloadCustomerData && (
                          <button
                            onClick={() => onDownloadCustomerData(customer.name)}
                            disabled={isLoading}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            title="Download customer data"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        )}
                        {onDeleteCustomer && (
                          <button
                            onClick={() => handleDeleteClick(index)}
                            disabled={isLoading}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Delete Customer</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>{customers[deleteConfirmIndex]?.name}</strong>? 
              This action cannot be undone and will remove all associated data.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDeleteCancel}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="inline mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManager;
