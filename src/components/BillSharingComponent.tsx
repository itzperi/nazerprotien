import React, { useState } from 'react';
import { MessageCircle, Smartphone, Share2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BillData {
  billNumber?: string;
  customer: string;
  customerPhone: string;
  date: string;
  items: Array<{
    no: number;
    item: string;
    weight: string;
    rate: string;
    amount: number;
  }>;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod?: string;
}

interface ShopDetails {
  shopName: string;
  address: string;
  gstNumber?: string;
  phone?: string;
}

interface BillSharingComponentProps {
  bill: BillData;
  shopDetails?: ShopDetails;
  onClose?: () => void;
  showModal?: boolean;
}

const BillSharingComponent: React.FC<BillSharingComponentProps> = ({
  bill,
  shopDetails,
  onClose,
  showModal = false
}) => {
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared'>('idle');

  // Generate PDF URL (placeholder for now - can be integrated with actual PDF service)
  const generatePdfUrl = () => {
    const billId = bill.billNumber || `BILL-${Date.now()}`;
    return `https://your-domain.com/bills/${billId}.pdf`;
  };

  // Format bill content for sharing
  const formatBillContent = (includePdfLink = false) => {
    const pdfUrl = generatePdfUrl();
    
    const content = `🏪 ${shopDetails?.shopName || 'BILLING SYSTEM'}
${shopDetails?.address ? `📍 ${shopDetails.address}` : ''}
${shopDetails?.gstNumber ? `🧾 GST: ${shopDetails.gstNumber}` : ''}
${shopDetails?.phone ? `📞 ${shopDetails.phone}` : ''}

📋 BILL DETAILS
════════════════
${bill.billNumber ? `🧾 Bill No: ${bill.billNumber}` : ''}
👤 Customer: ${bill.customer}
📱 Phone: ${bill.customerPhone}
📅 Date: ${new Date(bill.date).toLocaleDateString('en-IN')}

🛒 ITEMS:
${bill.items.map(item => 
  `• ${item.item} - ${item.weight}kg @ ₹${item.rate}/kg = ₹${item.amount.toFixed(2)}`
).join('\n')}

💰 BILL SUMMARY:
────────────────
Total Amount: ₹${bill.totalAmount.toFixed(2)}
Paid Amount: ₹${bill.paidAmount.toFixed(2)}
Balance Amount: ₹${bill.balanceAmount.toFixed(2)}
${bill.paymentMethod ? `Payment: ${bill.paymentMethod.toUpperCase()}` : ''}

${includePdfLink ? `📄 Download Bill: ${pdfUrl}` : ''}

Thank you for your business! 🙏`;

    return content;
  };

  // Handle WhatsApp sharing
  const handleWhatsAppShare = () => {
    const phoneNumber = bill.customerPhone.replace(/\D/g, '');
    const message = formatBillContent(true);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/91${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    setShareStatus('shared');
    
    // Auto-close modal after sharing if it's a modal
    if (showModal && onClose) {
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  // Handle SMS sharing
  const handleSmsShare = () => {
    const phoneNumber = bill.customerPhone.replace(/\D/g, '');
    const message = formatBillContent(false); // SMS without PDF link due to length constraints
    
    // Create SMS link (works on most mobile devices)
    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    
    // Try to open SMS app
    const link = document.createElement('a');
    link.href = smsUrl;
    link.click();
    
    setShareStatus('shared');
    
    // Auto-close modal after sharing if it's a modal
    if (showModal && onClose) {
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  // Handle native sharing (if available)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Bill from ${shopDetails?.shopName || 'Shop'}`,
          text: formatBillContent(true),
          url: generatePdfUrl()
        });
        setShareStatus('shared');
      } catch (error) {
        console.log('Native sharing cancelled or failed');
      }
    }
  };

  const ShareContent = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <Share2 className="h-8 w-8 text-primary mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-gray-900">Share Bill</h3>
        <p className="text-sm text-gray-600">
          Send bill to {bill.customer} ({bill.customerPhone})
        </p>
      </div>

      {shareStatus === 'shared' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <Check className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm text-green-800">Bill shared successfully!</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* WhatsApp Button */}
        <Button
          onClick={handleWhatsAppShare}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white"
          size="lg"
        >
          <MessageCircle className="h-5 w-5" />
          <span>WhatsApp</span>
        </Button>

        {/* SMS Button */}
        <Button
          onClick={handleSmsShare}
          variant="outline"
          className="flex items-center justify-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
          size="lg"
        >
          <Smartphone className="h-5 w-5" />
          <span>SMS</span>
        </Button>
      </div>

      {/* Native Share (if supported) */}
      {navigator.share && (
        <Button
          onClick={handleNativeShare}
          variant="secondary"
          className="w-full flex items-center justify-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          <span>More Options</span>
        </Button>
      )}

      {/* Bill Preview */}
      <div className="mt-4 bg-gray-50 rounded-lg p-3">
        <p className="text-xs text-gray-600 mb-2">Preview:</p>
        <div className="bg-white border border-gray-200 rounded p-3 max-h-32 overflow-y-auto">
          <pre className="text-xs whitespace-pre-wrap font-mono text-gray-700">
            {formatBillContent(true).substring(0, 200)}...
          </pre>
        </div>
      </div>
    </div>
  );

  // If used as inline component (not modal)
  if (!showModal) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <ShareContent />
      </div>
    );
  }

  // Modal version
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Share Bill</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <ShareContent />
      </div>
    </div>
  );
};

export default BillSharingComponent;