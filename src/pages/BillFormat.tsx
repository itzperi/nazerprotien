import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BillCustomization from '@/components/BillCustomization';
import { ArrowLeft } from 'lucide-react';

const BillFormat = () => {
    const location = useLocation();
    const navigate = useNavigate();
    // Default to 'santhosh1' or handle error if not passed, but ideally passed via state or context
    // In Index.tsx we see businessId is managed. 
    // We can pass it via router state or use a context if available.
    // For now, let's try to get it from location state, or fallback.
    const businessId = location.state?.businessId || 'santhosh1';

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="mb-4">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                </button>
            </div>
            <div className="max-w-[1600px] mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Bill Format</h1>
                    <p className="text-gray-500">Customize your bill layout, printer settings, and templates.</p>
                </div>
                <BillCustomization businessId={businessId} />
            </div>
        </div>
    );
};

export default BillFormat;
