import React, { useState } from 'react';
import { Building2, MapPin, CreditCard, Save, X, Phone, Mail } from 'lucide-react';
import { BusinessInfo } from '@/hooks/useBusinessInfo';

interface BusinessInfoCaptureProps {
  onComplete: (businessInfo: Omit<BusinessInfo, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  businessId: string;
  initialData?: Partial<BusinessInfo>;
  isEditMode?: boolean;
}

const BusinessInfoCapture: React.FC<BusinessInfoCaptureProps> = ({ 
  onComplete, 
  onCancel, 
  businessId,
  initialData,
  isEditMode = false
}) => {
  const [businessInfo, setBusinessInfo] = useState({
    business_id: initialData?.business_id || businessId,
    business_name: initialData?.business_name || '',
    address: initialData?.address || '',
    gst_number: initialData?.gst_number || '',
    phone: initialData?.phone || '',
    email: initialData?.email || ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!businessInfo.business_name.trim()) {
      newErrors.business_name = 'Business name is required';
    }

    if (!businessInfo.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (businessInfo.gst_number && businessInfo.gst_number.length !== 15) {
      newErrors.gst_number = 'GST number must be 15 characters long';
    }

    if (businessInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (businessInfo.phone && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(businessInfo.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
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
      
      const completeBusinessInfo = {
        business_id: businessInfo.business_id.trim() || businessId,
        business_name: businessInfo.business_name.trim(),
        address: businessInfo.address.trim(),
        gst_number: businessInfo.gst_number.trim() || undefined,
        phone: businessInfo.phone.trim() || undefined,
        email: businessInfo.email.trim() || undefined
      };
      
      onComplete(completeBusinessInfo);
    } catch (error) {
      console.error('Error saving business information:', error);
      alert('Error saving business information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 w-full max-w-md mx-auto my-auto min-h-fit">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-blue-600 mb-2">
            {isEditMode ? 'Edit Business Information' : 'Business Information'}
          </h2>
          <p className="text-gray-600 text-sm">
            {isEditMode ? 'Update your business details' : 'Please provide your business details to continue'}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business ID
            </label>
            <div className="relative">
              <input
                type="text"
                value={businessInfo.business_id}
                onChange={(e) => setBusinessInfo(prev => ({ ...prev, business_id: e.target.value }))}
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter business ID (optional)"
              />
              <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>
            <p className="text-gray-500 text-xs mt-1">
              Business ID is optional. If not provided, system will use default.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Name *
            </label>
            <div className="relative">
              <input
                type="text"
                value={businessInfo.business_name}
                onChange={(e) => setBusinessInfo(prev => ({ ...prev, business_name: e.target.value }))}
                className={`w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.business_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your business name"
              />
              <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>
            {errors.business_name && (
              <p className="text-red-500 text-sm mt-1">{errors.business_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address *
            </label>
            <div className="relative">
              <textarea
                value={businessInfo.address}
                onChange={(e) => setBusinessInfo(prev => ({ ...prev, address: e.target.value }))}
                className={`w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
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
              GST Number
            </label>
            <div className="relative">
              <input
                type="text"
                value={businessInfo.gst_number}
                onChange={(e) => setBusinessInfo(prev => ({ ...prev, gst_number: e.target.value.toUpperCase() }))}
                className={`w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono ${
                  errors.gst_number ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
              />
              <CreditCard className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>
            {errors.gst_number && (
              <p className="text-red-500 text-sm mt-1">{errors.gst_number}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              GST number should be 15 characters long (optional)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                value={businessInfo.phone}
                onChange={(e) => setBusinessInfo(prev => ({ ...prev, phone: e.target.value }))}
                className={`w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="+91-9876543210"
              />
              <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={businessInfo.email}
                onChange={(e) => setBusinessInfo(prev => ({ ...prev, email: e.target.value }))}
                className={`w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="business@example.com"
              />
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
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
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <div className="inline mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="inline mr-2 h-4 w-4" />
                Save Information
              </>
            )}
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            This information will be used in your bills and reports
          </p>
        </div>
      </div>
    </div>
  );
};

export default BusinessInfoCapture;
