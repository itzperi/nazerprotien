import React, { useState } from 'react';
import { Building2, MapPin, CreditCard, Save, X } from 'lucide-react';

interface ShopDetails {
  shopName: string;
  address: string;
  gstNumber: string;
}

interface ShopRegistrationProps {
  onComplete: (shopDetails: ShopDetails) => void;
  onCancel: () => void;
  businessId: string;
}

const ShopRegistration: React.FC<ShopRegistrationProps> = ({ 
  onComplete, 
  onCancel, 
  businessId 
}) => {
  const [shopDetails, setShopDetails] = useState<ShopDetails>({
    shopName: '',
    address: '',
    gstNumber: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!shopDetails.shopName.trim()) {
      newErrors.shopName = 'Shop name is required';
    }

    if (!shopDetails.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!shopDetails.gstNumber.trim()) {
      newErrors.gstNumber = 'GST number is required';
    } else if (shopDetails.gstNumber.length !== 15) {
      newErrors.gstNumber = 'GST number must be 15 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      onComplete(shopDetails);
    } catch (error) {
      console.error('Error saving shop details:', error);
      alert('Error saving shop details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 w-full max-w-md mx-auto my-auto min-h-fit">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">
            Shop Registration
          </h2>
          <p className="text-gray-600 text-sm">
            Please provide your shop details to continue
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shop Name *
            </label>
            <div className="relative">
              <input
                type="text"
                value={shopDetails.shopName}
                onChange={(e) => setShopDetails(prev => ({ ...prev, shopName: e.target.value }))}
                className={`w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                  errors.shopName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your shop name"
              />
              <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>
            {errors.shopName && (
              <p className="text-red-500 text-sm mt-1">{errors.shopName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address *
            </label>
            <div className="relative">
              <textarea
                value={shopDetails.address}
                onChange={(e) => setShopDetails(prev => ({ ...prev, address: e.target.value }))}
                className={`w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none ${
                  errors.address ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your complete address"
                rows={3}
              />
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GST Number *
            </label>
            <div className="relative">
              <input
                type="text"
                value={shopDetails.gstNumber}
                onChange={(e) => setShopDetails(prev => ({ ...prev, gstNumber: e.target.value.toUpperCase() }))}
                className={`w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors font-mono ${
                  errors.gstNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
              />
              <CreditCard className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>
            {errors.gstNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.gstNumber}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              GST number should be 15 characters long
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <X className="inline mr-2 h-4 w-4" />
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <div className="inline mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="inline mr-2 h-4 w-4" />
                Save Details
              </>
            )}
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            These details will be used in your bills and reports
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShopRegistration;