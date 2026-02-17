import React, { useState } from 'react';
import { Building2, MapPin, CreditCard, Phone, Mail, Edit2, Save, X } from 'lucide-react';
import { BusinessInfo } from '@/hooks/useBusinessInfo';
import BusinessInfoCapture from './BusinessInfoCapture';

interface BusinessInfoDisplayProps {
  businessInfo: BusinessInfo | null;
  onUpdate: (businessInfo: Omit<BusinessInfo, 'id' | 'created_at' | 'updated_at'>) => void;
  businessId: string;
}

const BusinessInfoDisplay: React.FC<BusinessInfoDisplayProps> = ({ 
  businessInfo, 
  onUpdate, 
  businessId 
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = (updatedInfo: Omit<BusinessInfo, 'id' | 'created_at' | 'updated_at'>) => {
    onUpdate(updatedInfo);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <BusinessInfoCapture
        onComplete={handleSave}
        onCancel={handleCancel}
        businessId={businessId}
        initialData={businessInfo || undefined}
        isEditMode={true}
      />
    );
  }

  if (!businessInfo) {
    return (
      <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex items-center">
          <Building2 className="h-5 w-5 text-yellow-600 mr-2" />
          <span className="text-yellow-800 font-medium">No business information available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-blue-800 flex items-center">
          <Building2 className="h-5 w-5 mr-2" />
          Business Information
        </h3>
        <button
          onClick={handleEdit}
          className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Edit2 className="h-4 w-4 mr-1" />
          Edit
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium text-gray-700">Business ID:</span>
          <span className="ml-2 text-gray-900 font-mono">{businessInfo.business_id}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700">Business Name:</span>
          <span className="ml-2 text-gray-900">{businessInfo.business_name}</span>
        </div>
        <div className="md:col-span-2">
          <span className="font-medium text-gray-700">Address:</span>
          <span className="ml-2 text-gray-900">{businessInfo.address}</span>
        </div>
        {businessInfo.gst_number && (
          <div>
            <span className="font-medium text-gray-700">GST Number:</span>
            <span className="ml-2 text-gray-900 font-mono">{businessInfo.gst_number}</span>
          </div>
        )}
        {businessInfo.phone && (
          <div>
            <span className="font-medium text-gray-700">Phone:</span>
            <span className="ml-2 text-gray-900">{businessInfo.phone}</span>
          </div>
        )}
        {businessInfo.email && (
          <div>
            <span className="font-medium text-gray-700">Email:</span>
            <span className="ml-2 text-gray-900">{businessInfo.email}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessInfoDisplay;
