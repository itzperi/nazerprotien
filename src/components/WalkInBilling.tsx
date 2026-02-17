import React, { useState, useEffect } from 'react';
import { Phone, User, Check, X, MessageCircle, Smartphone } from 'lucide-react';

interface BillItem {
  no: number;
  item: string;
  weight: string;
  rate: string;
  amount: number;
}

interface WalkInBillingProps {
  onPhoneUpdate: (phone: string) => void;
  selectedCustomerPhone: string;
  selectedCustomer: string;
  onCustomerUpdate: (customer: string) => void;
  previousBalance: number;
  billItems: BillItem[];
  totalAmount: number;
  onSendWhatsApp: (phone: string, billData: any) => void;
  onWalkInCustomerCreation?: (phone: string) => Promise<boolean>;
  shopDetails?: {
    shopName: string;
    address: string;
    gstNumber: string;
  };
  onPrint?: (bill: any) => Promise<void>;
  businessId?: string;
}

const WalkInBilling: React.FC<WalkInBillingProps> = ({
  onPhoneUpdate,
  selectedCustomerPhone,
  selectedCustomer,
  onCustomerUpdate,
  previousBalance,
  billItems,
  totalAmount,
  onSendWhatsApp,
  onWalkInCustomerCreation,
  shopDetails,
  onPrint,
  businessId
}) => {
  const [phoneNumber, setPhoneNumber] = useState(selectedCustomerPhone);
  const [isValidPhone, setIsValidPhone] = useState(false);
  const [showWhatsAppPreview, setShowWhatsAppPreview] = useState(false);

  useEffect(() => {
    setPhoneNumber(selectedCustomerPhone);
  }, [selectedCustomerPhone]);

  useEffect(() => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    setIsValidPhone(cleanPhone.length === 10);

    if (cleanPhone.length === 10) {
      onPhoneUpdate(phoneNumber);
      // Auto-create walk-in customer when valid phone is entered
      if (onWalkInCustomerCreation) {
        onWalkInCustomerCreation(cleanPhone);
      }
    }
  }, [phoneNumber, onPhoneUpdate, onWalkInCustomerCreation]);

  const formatPhoneDisplay = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 10) {
      return cleaned.replace(/(\d{5})(\d{5})/, '$1 $2');
    }
    return phone;
  };

  const generateBillContent = () => {
    const validItems = billItems.filter(item => item.item && item.weight && item.rate);
    const itemsTotal = validItems.reduce((sum, item) => sum + item.amount, 0);
    const newBalance = previousBalance + itemsTotal;

    return `
🏪 ${shopDetails?.shopName || 'BILLING SYSTEM'}
📍 ${shopDetails?.address || ''}
📞 Phone: ${selectedCustomerPhone}
${shopDetails?.gstNumber ? `🧾 GST: ${shopDetails.gstNumber}` : ''}

📋 BILL DETAILS
════════════════
👤 Customer: Walk-in Customer
📱 Phone: ${formatPhoneDisplay(selectedCustomerPhone)}
📅 Date: ${new Date().toLocaleDateString('en-IN')}
⏰ Time: ${new Date().toLocaleTimeString('en-IN', { hour12: true })}

🛒 ITEMS:
${validItems.map(item =>
      `• ${item.item} - ${item.weight}kg @ ₹${item.rate}/kg = ₹${item.amount.toFixed(2)}`
    ).join('\n')}

💰 BILL SUMMARY:
────────────────
Previous Balance: ₹${previousBalance.toFixed(2)}
Current Items: ₹${itemsTotal.toFixed(2)}
Total Amount: ₹${newBalance.toFixed(2)}

Thank you for your business! 🙏
    `.trim();
  };

  const handleSendWhatsApp = () => {
    if (!isValidPhone) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    const billContent = generateBillContent();
    const encodedMessage = encodeURIComponent(billContent);
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
    setShowWhatsAppPreview(false);
  };

  const handleSmsShare = () => {
    if (!isValidPhone) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    const billContent = generateBillContent();
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(billContent)}`;

    const link = document.createElement('a');
    link.href = smsUrl;
    link.click();

    setShowWhatsAppPreview(false);
  };

  const handlePrint = async () => {
    if (onPrint) {
      const validItems = billItems.filter(item => item.item && item.weight && item.rate);
      const itemsTotal = validItems.reduce((sum, item) => sum + item.amount, 0);

      // Create a temporary bill object for the centralized print logic
      const tempBill = {
        id: Date.now(),
        customer: selectedCustomer || 'Walk-in Customer',
        customerPhone: selectedCustomerPhone,
        date: new Date().toISOString().split('T')[0],
        items: validItems,
        totalAmount: previousBalance + itemsTotal,
        paidAmount: 0, // In preview mode, paid is 0
        balanceAmount: previousBalance + itemsTotal,
        paymentMethod: 'cash' as const,
        timestamp: new Date()
      };

      await onPrint(tempBill);
    } else {
      // Fallback if prop not provided (keeping local for safety but marked as deprecated)
      const billContent = generateBillContent();
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Walk-in Bill</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
                body { font-family: 'Roboto', sans-serif; font-weight: 700; padding: 20px; line-height: 1.4; }
                pre { white-space: pre-wrap; font-size: 16px; margin: 0; font-family: 'Roboto', sans-serif; font-weight: 700; }
                @media print { body { margin: 0; padding: 10px; font-weight: 700; } pre { font-size: 14px; font-weight: 700; } }
              </style>
            </head>
            <body>
              <pre>${billContent}</pre>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownload = () => {
    const billContent = generateBillContent();
    const blob = new Blob([billContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WalkIn_Bill_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-4">
      <div className="flex items-center mb-3">
        <User className="h-5 w-5 text-green-600 mr-2" />
        <h3 className="text-lg font-semibold text-green-800">Walk-in Customer</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer Phone Number *
          </label>
          <div className="relative">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className={`w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-green-500 transition-colors ${phoneNumber && !isValidPhone ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="Enter 10-digit phone number"
              maxLength={10}
            />
            <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            {phoneNumber && (
              <div className="absolute right-3 top-3">
                {isValidPhone ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <X className="h-5 w-5 text-red-500" />
                )}
              </div>
            )}
          </div>
          {phoneNumber && !isValidPhone && (
            <p className="text-red-500 text-sm mt-1">Enter a valid 10-digit phone number</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer Name (Auto-filled if exists)
          </label>
          <input
            type="text"
            value={selectedCustomer || 'Walk-in Customer'}
            onChange={(e) => onCustomerUpdate(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-gray-50"
            placeholder="Walk-in Customer"
            readOnly={!!selectedCustomer}
          />
        </div>
      </div>

      {isValidPhone && previousBalance > 0 && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Existing balance found: <strong>₹{previousBalance.toFixed(2)}</strong>
          </p>
        </div>
      )}

      {isValidPhone && totalAmount > 0 && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setShowWhatsAppPreview(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Share Bill
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
          >
            Print
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Download
          </button>
        </div>
      )}

      {/* WhatsApp Preview Modal */}
      {showWhatsAppPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Share Bill</h3>
              <button
                onClick={() => setShowWhatsAppPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">
                Send bill to {selectedCustomer || 'Walk-in Customer'} ({formatPhoneDisplay(phoneNumber)})
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <button
                onClick={handleSendWhatsApp}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={handleSmsShare}
                className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Smartphone className="h-5 w-5" />
                <span>SMS</span>
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-2">Bill Preview:</p>
              <div className="bg-white border border-gray-200 rounded p-3 max-h-32 overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap font-mono text-gray-700">
                  {generateBillContent()}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalkInBilling;