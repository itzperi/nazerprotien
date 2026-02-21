import React, { useState, useEffect, useRef } from 'react';
import { toCents, computeTotals } from '@/lib/utils';
import { Search, Plus, Calculator, Check, X, Users, History, Printer, FileText, MessageCircle, Calendar, LogOut, Package, BarChart3, Truck, RefreshCw, Building2, CreditCard, QrCode, Layout } from 'lucide-react';
import jsPDF from 'jspdf';
import Login from '../components/Login';
import CustomerManager from '../components/CustomerManager';
import Products from '../components/Products';
import SalesDashboard from '../components/SalesDashboard';
import EditBillPage from '../components/EditBillPage';
import LoadManager from '../components/LoadManager';
import ShopRegistration from '../components/ShopRegistration';
import WalkInBilling from '../components/WalkInBilling';
import { QRSettings } from '../components/QRSettings';
import { generateESCPOSReceipt } from '@/lib/receipt-formatter';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useBusinessInfo } from '../hooks/useBusinessInfo';
import BusinessInfoCapture from '../components/BusinessInfoCapture';
import BusinessInfoDisplay from '../components/BusinessInfoDisplay';
import PurchasePage from '../components/PurchasePage';
import SalaryPage from '../components/SalaryPage';
import ErrorBoundary from '../components/ErrorBoundary';
import TestPage from '../components/TestPage';
import SimpleLoadManager from '../components/SimpleLoadManager';
import SimpleProducts from '../components/SimpleProducts';
import BillCustomization from '../components/BillCustomization';
import { supabase } from '@/integrations/supabase/client';
import PrinterSelector from '../components/PrinterSelector';
import { printerService } from '@/lib/printer-service';
import { toast } from 'sonner';

interface BillItem {
  no: number;
  item: string;
  weight: string;
  rate: string;
  amount: number;
}

interface Bill {
  id: number;
  billNumber?: string;
  customer: string;
  customerPhone: string;
  date: string;
  items: BillItem[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod: 'cash' | 'upi' | 'check' | 'cash_gpay';
  upiType?: string;
  bankName?: string;
  checkNumber?: string;
  cashAmount?: number;
  gpayAmount?: number;
  timestamp: Date;
}

type UserType = 'owner' | 'staff';
type BusinessId = 'santhosh1' | 'santhosh2' | 'vasan' | 'vasan_chicken_perambur' | 'demo1_business' | 'demo2_business' | 'demo3_business' | 'demo4_business' | 'demo5_business' | 'demo6_business' | 'demo7_business' | 'demo8_business' | 'demo9_business' | 'demo10_business';

const Index = () => {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<UserType>('staff');
  const [businessId, setBusinessId] = useState<BusinessId>('santhosh1');

  // Shop registration state
  const [showShopRegistration, setShowShopRegistration] = useState(false);
  const [shopDetails, setShopDetails] = useState<{
    shopName: string;
    address: string;
    gstNumber: string;
  } | null>(null);
  const [shopDetailsLoaded, setShopDetailsLoaded] = useState(false);

  // Business information capture state
  const [showBusinessInfoCapture, setShowBusinessInfoCapture] = useState(false);
  const [businessInfoCaptured, setBusinessInfoCaptured] = useState(false);

  // Walk-in customer state
  const [isWalkInMode, setIsWalkInMode] = useState(false);

  // Customer requirement toggle - when true, customer details are required
  const [requireCustomerDetails, setRequireCustomerDetails] = useState(true);

  // QR code state
  const [uploadedQRCode, setUploadedQRCode] = useState<string | null>(null);
  const [includeQRInPrint, setIncludeQRInPrint] = useState(false);

  // Supabase data hook
  const {
    products,
    customers,
    bills,
    loading,
    suppliers,
    addProduct,
    updateProduct,
    deleteProduct,
    addCustomer,
    safeCreateCustomer,
    updateCustomer,
    updateCustomerBalance,
    deleteCustomer,
    addSupplier,
    addBill,
    updateBill,
    deleteBill,
    getLatestBalanceByPhone,
    refreshCustomersData,
    getRealTimeBalance,
    getRealTimeBalanceByPhone,
    refreshProducts
  } = useSupabaseData(isLoggedIn ? businessId : '');

  // Business information hook
  const {
    businessInfo,
    loading: businessInfoLoading,
    saveBusinessInfo,
    updateBusinessInfo,
    hasBusinessInfo
  } = useBusinessInfo(isLoggedIn ? businessId : '');

  // State management
  const [currentView, setCurrentView] = useState('billing');
  const [suppliersInput, setSuppliersInput] = useState('');

  // Billing form state
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState('');
  const [customerInput, setCustomerInput] = useState('');
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [showAddCustomerPhonePrompt, setShowAddCustomerPhonePrompt] = useState(false);
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [billItems, setBillItems] = useState<BillItem[]>([
    { no: 1, item: '', weight: '', rate: '', amount: 0 }
  ]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [calcError, setCalcError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const [cleaningCharge, setCleaningCharge] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState('');

  // Updated payment method state with cash+gpay option
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'check' | 'cash_gpay'>('cash');
  const [upiType, setUpiType] = useState('');
  const [bankName, setBankName] = useState('');
  const [checkNumber, setCheckNumber] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [gpayAmount, setGpayAmount] = useState('');

  // Add supplier state
  const [newSupplierName, setNewSupplierName] = useState('');

  // Balance tracking state
  const [balanceCustomer, setBalanceCustomer] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customerHistory, setCustomerHistory] = useState<Bill[]>([]);
  const [addBalanceCustomer, setAddBalanceCustomer] = useState('');
  const [addBalanceAmount, setAddBalanceAmount] = useState('');

  // Balance tracking state
  const [previousBalance, setPreviousBalance] = useState(0);

  // Customer suggestions state for real-time balance updates
  const [customerSuggestionsWithBalance, setCustomerSuggestionsWithBalance] = useState<Array<{ name: string, phone: string, balance: number }>>([]);

  // WhatsApp bill sharing function
  const sendBillToWhatsApp = (phone: string, billData: any) => {
    const validItems = billItems.filter(item => item.item && item.weight && item.rate);
    const itemsTotal = validItems.reduce((sum, item) => sum + item.amount, 0);
    const extraCharges = (parseFloat(cleaningCharge) || 0) + (parseFloat(deliveryCharge) || 0);
    const totalAmount = previousBalance + itemsTotal + extraCharges;
    const paid = (paymentMethod === 'cash_gpay')
      ? ((parseFloat(cashAmount) || 0) + (parseFloat(gpayAmount) || 0))
      : (parseFloat(paymentAmount) || 0);
    const newBalance = Math.max(totalAmount - paid, 0);
    const advance = Math.max(paid - totalAmount, 0);

    const billContent = `
🏪 ${shopDetails?.shopName || 'BILLING SYSTEM'}
📍 ${shopDetails?.address || ''}
${shopDetails?.gstNumber ? `🧾 GST: ${shopDetails.gstNumber}` : ''}

📋 BILL DETAILS
════════════════
👤 Customer: ${selectedCustomer || 'Walk-in Customer'}
📱 Phone: ${phone}
📅 Date: ${new Date().toLocaleDateString('en-IN')}
⏰ Time: ${new Date().toLocaleTimeString('en-IN', { hour12: true })}

🛒 ITEMS:
${validItems.map(item =>
      `• ${item.item} - ${item.weight}kg @ ₹${item.rate}/kg = ₹${item.amount.toFixed(2)}`
    ).join('\n')}

🧹 Cleaning: ₹${(parseFloat(cleaningCharge) || 0).toFixed(2)}
🚚 Delivery: ₹${(parseFloat(deliveryCharge) || 0).toFixed(2)}

💰 BILL SUMMARY:
────────────────
Previous Balance: ₹${previousBalance.toFixed(2)}
Current Items: ₹${itemsTotal.toFixed(2)}
Extra Charges: ₹${extraCharges.toFixed(2)}
Total Amount: ₹${totalAmount.toFixed(2)}
Payment Amount: ₹${paid.toFixed(2)}
New Balance: ₹${newBalance.toFixed(2)}${advance > 0 ? `\nAdvance Payment: ₹${advance.toFixed(2)}` : ''}

Thank you for your business! 🙏
    `.trim();

    const encodedMessage = encodeURIComponent(billContent);
    const cleanPhone = phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // Refs
  const customerInputRef = useRef<HTMLInputElement>(null);

  // Additional state for bill confirmation - Updated to handle both scenarios
  const [showBillActions, setShowBillActions] = useState(false);
  const [confirmedBill, setConfirmedBill] = useState<Bill | null>(null);
  const [isBalanceOnlyBill, setIsBalanceOnlyBill] = useState(false);

  // Filter customers based on input with real-time balance fetching
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerInput.toLowerCase())
  );

  // Update customer suggestions with fresh balances when input changes
  useEffect(() => {
    const updateCustomerSuggestions = async () => {
      if (customerInput && filteredCustomers.length > 0) {
        console.log(`[CUSTOMER SUGGESTIONS] Updating balances for ${filteredCustomers.length} customers`);

        const suggestionsWithBalance = await Promise.all(
          filteredCustomers.map(async (customer) => {
            try {
              const realTimeBalance = await getRealTimeBalance(customer.name);
              return {
                name: customer.name,
                phone: customer.phone,
                balance: realTimeBalance
              };
            } catch (error) {
              console.error(`[CUSTOMER SUGGESTIONS] Error fetching balance for ${customer.name}:`, error);
              return {
                name: customer.name,
                phone: customer.phone,
                balance: customer.balance // Fallback to cached balance
              };
            }
          })
        );

        setCustomerSuggestionsWithBalance(suggestionsWithBalance);
        console.log(`[CUSTOMER SUGGESTIONS] Updated balances:`,
          suggestionsWithBalance.map(c => `${c.name}: ₹${c.balance}`));
      } else {
        setCustomerSuggestionsWithBalance([]);
      }
    };

    // Debounce the balance fetching to avoid too many API calls
    const timeoutId = setTimeout(updateCustomerSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [customerInput, filteredCustomers.length]);

  // Calculate amount for each item
  // const calculateAmount = (weight: string, rate: string) => {
  //   const w = parseFloat(weight) || 0;
  //   const r = parseFloat(rate) || 0;
  //   return w * r;
  // };

  // Update total amount
  useEffect(() => {
    const total = billItems.reduce((sum, item) => sum + item.amount, 0);
    setTotalAmount(total);
  }, [billItems]);

  // QR Settings State
  const [qrSettings, setQrSettings] = useState<{ enabled: boolean, imagePath: string | null }>({ enabled: false, imagePath: null });

  // Fetch QR Settings on load or login
  useEffect(() => {
    if (isLoggedIn && businessId) {
      const fetchQrSettings = async () => {
        try {
          const { data, error } = await supabase
            .from('shops_logins')
            .select('qr_enabled, qr_image_path')
            .eq('business_id', businessId)
            .single();

          if (data && !error) {
            const qrData = data as any;
            setQrSettings({
              enabled: qrData.qr_enabled || false,
              imagePath: qrData.qr_image_path
            });
          }
        } catch (e) {
          console.error("Failed to fetch QR settings", e);
        }
      };
      fetchQrSettings();
    }
  }, [isLoggedIn, businessId]);

  // Handle login
  const handleLogin = async (type: UserType, id: BusinessId) => {
    setUserType(type);
    setBusinessId(id);
    setIsLoggedIn(true);

    // Special handling for Vasan - skip shop registration, use pre-populated business info
    if (id === 'vasan' || id === 'vasan_chicken_perambur') {
      // Vasan's business info is pre-populated in the database
      // No need for shop registration
      setShopDetails({
        shopName: 'Vasan Chicken Perambur',
        address: '61, Vadivelu Mudali St, Chinnaiyan Colony, Perambur, Chennai, Tamil Nadu 600011',
        gstNumber: '33BBMPP2764G1ZH'
      });
      setShopDetailsLoaded(true);
      console.log('[LOGIN] Set Vasan shop details:', {
        shopName: 'Vasan Chicken Perambur',
        businessId: id
      });
      return;
    }

    // For mathan (santhosh1) - use pre-populated business info
    if (id === 'santhosh1') {
      setShopDetails({
        shopName: 'Santhosh Chicken 1',
        address: 'Your Business Address',
        gstNumber: '22AAAAA0000A1Z5'
      });
      setShopDetailsLoaded(true);
      return;
    }

    // For other business IDs, check if business info exists
    // This will be handled by the business info hook and show capture if needed
  };

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView('billing');
    setShowShopRegistration(false);
    setShopDetails(null);
    setShopDetailsLoaded(false);
    setShowBusinessInfoCapture(false);
    setBusinessInfoCaptured(false);
    setIsWalkInMode(false);
    resetForm();
  };

  // Handle customer selection - BULLETPROOF REAL-TIME BALANCE FETCH
  const handleCustomerSelect = async (customerName: string) => {
    try {
      console.log(`[BILLING PAGE] Customer selected: ${customerName}`);

      const customer = customers.find(c => c.name === customerName);
      const customerPhone = customer?.phone || '';

      setSelectedCustomer(customerName);
      setSelectedCustomerPhone(customerPhone);
      setCustomerInput(customerName);
      setShowCustomerSuggestions(false);

      // CRITICAL: Always fetch the latest balance from database, NEVER use cached data
      if (customer) {
        console.log(`[BILLING PAGE] Fetching real-time balance for: ${customerName}`);

        const realTimeBalance = await getRealTimeBalance(customerName);
        setPreviousBalance(realTimeBalance);

        console.log(`[BILLING PAGE] Balance set for billing page: ₹${realTimeBalance}`);

        // Verify consistency with customer list
        const customerInList = customers.find(c => c.name === customerName);
        if (customerInList && Math.abs(customerInList.balance - realTimeBalance) > 0.01) {
          console.warn(`[BILLING PAGE] Balance mismatch detected! List: ₹${customerInList.balance}, DB: ₹${realTimeBalance}`);
          // Force refresh customers to sync
          await refreshCustomersData();
        }
      } else {
        console.log(`[BILLING PAGE] Customer not found in list, setting balance to 0`);
        setPreviousBalance(0);
      }
    } catch (error) {
      console.error(`[BILLING PAGE] Error selecting customer ${customerName}:`, error);
      setPreviousBalance(0);
      alert('Error fetching customer balance. Please try again.');
    }
  };

  // Handle manual phone entry - BULLETPROOF REAL-TIME BALANCE FETCH
  const handlePhoneChange = async (phone: string) => {
    try {
      setSelectedCustomerPhone(phone);

      console.log(`[BILLING PAGE] Phone entered: ${phone}`);

      // Auto-fill previous balance when phone is entered - FETCH REAL-TIME FROM DATABASE
      if (phone.length >= 10) { // Valid phone number length
        console.log(`[BILLING PAGE] Fetching balance for phone: ${phone}`);

        const result = await getRealTimeBalanceByPhone(phone);
        setPreviousBalance(result.balance);

        console.log(`[BILLING PAGE] Balance retrieved for phone ${phone}: ₹${result.balance}`);

        // Auto-fill customer name if found
        if (result.name && !selectedCustomer) {
          setSelectedCustomer(result.name);
          setCustomerInput(result.name);
          console.log(`[BILLING PAGE] Auto-filled customer name: ${result.name}`);
        }

        // Verify consistency
        if (result.name) {
          const customerInList = customers.find(c => c.name === result.name);
          if (customerInList && Math.abs(customerInList.balance - result.balance) > 0.01) {
            console.warn(`[BILLING PAGE] Phone lookup balance mismatch! List: ₹${customerInList.balance}, DB: ₹${result.balance}`);
            await refreshCustomersData();
          }
        }
      } else {
        setPreviousBalance(0);
        console.log(`[BILLING PAGE] Phone incomplete, balance reset to 0`);
      }
    } catch (error) {
      console.error(`[BILLING PAGE] Error handling phone change for ${phone}:`, error);
      setPreviousBalance(0);
    }
  };

  // Auto-add missing customer flow
  useEffect(() => {
    if (!customerInput || customers.find(c => c.name.toLowerCase() === customerInput.toLowerCase())) {
      setShowAddCustomerPhonePrompt(false);
      return;
    }
    // If typed name not in list, prompt for phone
    setShowAddCustomerPhonePrompt(true);
  }, [customerInput, customers.length]);

  const handleAddCustomerIfNeeded = async () => {
    const name = customerInput.trim();
    if (!name) return true;
    const exists = customers.some(c => c.name.toLowerCase() === name.toLowerCase());
    if (exists) return true;
    const phone = newCustomerPhone.trim();
    if (!/^\d{10}$/.test(phone)) {
      alert('Enter 10-digit mobile number to add new customer');
      return false;
    }
    try {
      await addCustomer({ name, phone, balance: 0 });
      setSelectedCustomer(name);
      setSelectedCustomerPhone(phone);
      setShowAddCustomerPhonePrompt(false);
      await refreshCustomersData();
      return true;
    } catch (e) {
      console.error('Failed to auto-add customer', e);
      alert('Failed to add customer. Please try again.');
      return false;
    }
  };

  // Enhanced walk-in customer handling with comprehensive error handling
  const handleWalkInCustomerCreation = async (phone: string) => {
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        alert('Please enter a valid 10-digit phone number');
        return false;
      }

      console.log(`[WALK-IN] Processing phone: ${cleanPhone} for business: ${businessId}`);

      // Check if customer already exists in local state
      const existingCustomer = customers.find(c => c.phone === cleanPhone);
      if (existingCustomer) {
        console.log(`[WALK-IN] Found existing customer: ${existingCustomer.name}`);
        setSelectedCustomer(existingCustomer.name);
        setSelectedCustomerPhone(cleanPhone);
        return true;
      }

      // Try database function first
      try {
        console.log(`[WALK-IN] Attempting database function for phone: ${cleanPhone}`);
        const { data: customerId, error: rpcError } = await (supabase as any).rpc('create_or_get_walkin_customer', {
          p_phone: cleanPhone,
          p_business_id: businessId
        });

        if (rpcError) {
          console.warn(`[WALK-IN] RPC function failed:`, rpcError);
          throw new Error(`RPC failed: ${rpcError.message}`);
        }

        if (customerId) {
          console.log(`[WALK-IN] Customer created/found with ID: ${customerId}`);
          // Refresh customers data to get the new customer
          await refreshCustomersData();

          // Find the customer in the refreshed list
          const newCustomer = customers.find(c => c.phone === cleanPhone);
          if (newCustomer) {
            setSelectedCustomer(newCustomer.name);
            setSelectedCustomerPhone(cleanPhone);
            console.log(`[WALK-IN] Successfully set customer: ${newCustomer.name}`);
            return true;
          } else {
            console.warn(`[WALK-IN] Customer ID returned but not found in refreshed list`);
            throw new Error('Customer created but not found in list');
          }
        } else {
          throw new Error('No customer ID returned from database function');
        }
      } catch (rpcError) {
        console.warn(`[WALK-IN] Database function failed, trying direct insertion:`, rpcError);

        // Fallback: Direct customer creation
        const walkInName = `Walk-in Customer (${cleanPhone})`;
        console.log(`[WALK-IN] Creating customer directly: ${walkInName}`);

        try {
          // Try the enhanced safe creation first
          const customerData = await safeCreateCustomer(walkInName, cleanPhone, 0);
          setSelectedCustomer(customerData.customer_name);
          setSelectedCustomerPhone(cleanPhone);
          console.log(`[WALK-IN] Safe creation successful: ${customerData.customer_name}`);
          return true;
        } catch (safeError) {
          console.warn(`[WALK-IN] Safe creation failed, trying direct:`, safeError);
          try {
            await addCustomer({ name: walkInName, phone: cleanPhone, balance: 0 });
            setSelectedCustomer(walkInName);
            setSelectedCustomerPhone(cleanPhone);
            console.log(`[WALK-IN] Direct creation successful: ${walkInName}`);
            return true;
          } catch (directError) {
            console.error(`[WALK-IN] Direct creation also failed:`, directError);

            // Last resort: Check if customer exists in database but not in local state
            try {
              const { data: existingData, error: checkError } = await supabase
                .from('customers')
                .select('name, phone')
                .eq('phone', cleanPhone)
                .eq('business_id', businessId)
                .single();

              if (!checkError && existingData) {
                console.log(`[WALK-IN] Found existing customer in database: ${existingData.name}`);
                setSelectedCustomer(existingData.name);
                setSelectedCustomerPhone(cleanPhone);
                await refreshCustomersData(); // Refresh to sync local state
                return true;
              }
            } catch (checkError) {
              console.error(`[WALK-IN] Database check failed:`, checkError);
            }

            throw new Error(`All customer creation methods failed. Last error: ${directError}`);
          }
        }
      }
    } catch (e) {
      console.error('[WALK-IN] Critical error in walk-in customer creation:', e);

      // Provide specific error messages based on error type
      let errorMessage = 'Failed to create walk-in customer. Please try again.';
      if (e instanceof Error) {
        if (e.message.includes('duplicate key') || e.message.includes('unique constraint')) {
          errorMessage = 'Customer with this phone number already exists. Please refresh the page.';
        } else if (e.message.includes('permission') || e.message.includes('policy')) {
          errorMessage = 'Database permission error. Please contact support.';
        } else if (e.message.includes('network') || e.message.includes('connection')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
      }

      alert(errorMessage);
      return false;
    }
  };

  // Refresh balance from database - BULLETPROOF MANUAL REFRESH
  const refreshCustomerBalance = async () => {
    try {
      if (!selectedCustomer) {
        console.log('[BILLING PAGE] No customer selected for balance refresh');
        return;
      }

      console.log(`[BILLING PAGE] Manual balance refresh requested for: ${selectedCustomer}`);

      const realTimeBalance = await getRealTimeBalance(selectedCustomer);
      setPreviousBalance(realTimeBalance);

      console.log(`[BILLING PAGE] Manual refresh complete: ₹${realTimeBalance}`);

      // Also refresh the customers list to sync with CustomerManager
      await refreshCustomersData();

      // Show success feedback
      alert(`Balance refreshed: ₹${realTimeBalance.toFixed(2)}`);
    } catch (error) {
      console.error(`[BILLING PAGE] Error refreshing balance for ${selectedCustomer}:`, error);
      alert('Error refreshing balance. Please try again.');
    }
  };

  // Keyboard navigation handler for billing table
  const handleKeyPress = (e: React.KeyboardEvent, rowIndex: number, fieldName: 'item' | 'weight' | 'rate' | 'amount_input') => {
    if (e.key === 'Enter') {
      e.preventDefault();

      // Navigate to next field in sequence: item -> rate -> amount -> next item
      let nextFieldName: string;
      let nextRowIndex = rowIndex;

      if (fieldName === 'item') {
        nextFieldName = `rate-${rowIndex}`;
      } else if (fieldName === 'rate') {
        nextFieldName = `amount_input-${rowIndex}`;
      } else { // amount_input
        // Move to next row's item field
        nextRowIndex = rowIndex + 1;
        nextFieldName = `item-${nextRowIndex}`;
      }

      // Focus the next field
      const nextElement = document.getElementById(nextFieldName);
      if (nextElement) {
        nextElement.focus();
      }
    }
  };

  // Handle bill item changes with default item selection - UPDATED to use Chicken Live as default
  const handleItemChange = (index: number, field: keyof BillItem | 'amount_input', value: string) => {
    const newItems = [...billItems];

    if (field === 'amount_input') {
      const amount = parseFloat(value) || 0;
      newItems[index].amount = amount;

      const rate = parseFloat(newItems[index].rate) || 0;
      if (rate > 0 && amount > 0) {
        newItems[index].weight = (amount / rate).toFixed(3);
      } else {
        newItems[index].weight = '';
      }
    } else {
      (newItems[index] as any)[field] = value;
    }

    // Auto-fill rate from Today's Price when Item is selected
    if (field === 'item') {
      const selectedProduct = products.find(p => p.name === value);
      if (selectedProduct && (selectedProduct as any).todays_price) {
        newItems[index].rate = (selectedProduct as any).todays_price.toString();
        // Recalculate weight if amount exists
        if (newItems[index].amount > 0) {
          newItems[index].weight = (newItems[index].amount / parseFloat(newItems[index].rate)).toFixed(3);
        }
      }
    }

    // Auto-fill rate from Today's Price when Weight is entered (if rate is empty)
    if (field === 'weight' && !newItems[index].rate) {
      const selectedProduct = products.find(p => p.name === newItems[index].item);
      if (selectedProduct && (selectedProduct as any).todays_price) {
        newItems[index].rate = (selectedProduct as any).todays_price.toString();
      }
    }

    // Auto-fill weight from amount if rate changes
    if (field === 'rate') {
      const rate = parseFloat(newItems[index].rate) || 0;
      // Also update amount if weight is manually set and amount is 0 (fallback for edge cases)
      if (rate > 0 && newItems[index].amount > 0) {
        newItems[index].weight = (newItems[index].amount / rate).toFixed(3);
      } else if (rate === 0) {
        newItems[index].weight = '';
      }
    }

    setBillItems(newItems);

    // Add new row if this is the last row and has content
    if (index === billItems.length - 1 && billItems.length < 10 &&
      (newItems[index].item || newItems[index].amount > 0 || newItems[index].rate)) {
      // Default to "Chicken Live" for new rows
      const chickenLiveProduct = products.find(p => p.name.toLowerCase().includes('chicken live')) ||
        products.find(p => p.name.toLowerCase().includes('live')) ||
        products[0]; // fallback to first product
      setBillItems([...newItems, {
        no: newItems.length + 1,
        item: chickenLiveProduct ? chickenLiveProduct.name : 'Chicken Live',
        weight: '',
        rate: '',
        amount: 0
      }]);
    }
  };

  // ENHANCED PAYMENT VALIDATION FUNCTION
  const validatePaymentAmount = (paidAmount: number, requiredAmount: number): { isValid: boolean; message: string } => {
    const tolerance = 0.01; // Allow 1 cent tolerance for rounding
    const difference = Math.abs(paidAmount - requiredAmount);

    if (difference > tolerance) {
      if (paidAmount > requiredAmount) {
        return {
          isValid: false,
          message: `Payment amount (₹${paidAmount.toFixed(2)}) exceeds required amount (₹${requiredAmount.toFixed(2)}) by ₹${(paidAmount - requiredAmount).toFixed(2)}. Please enter the exact amount.`
        };
      } else {
        return {
          isValid: false,
          message: `Payment amount (₹${paidAmount.toFixed(2)}) is insufficient. Required: ₹${requiredAmount.toFixed(2)}. Shortfall: ₹${(requiredAmount - paidAmount).toFixed(2)}.`
        };
      }
    }

    return { isValid: true, message: '' };
  };

  // Save shop details
  const handleShopRegistrationComplete = async (details: { shopName: string; address: string; gstNumber: string }) => {
    try {
      // Save shop details as a special customer record
      await supabase
        .from('customers')
        .upsert({
          business_id: businessId,
          name: '_SHOP_DETAILS_',
          phone: `${details.shopName}|${details.address}`,
          balance: 0,
          gst_number: details.gstNumber
        });

      setShopDetails(details);
      setShopDetailsLoaded(true);
      setShowShopRegistration(false);

      // For Vasan user, mark registration as completed in localStorage
      if (businessId === 'vasan') {
        localStorage.setItem(`shop_registration_completed_${businessId}`, 'true');
      }

      alert('Shop details saved successfully!');
    } catch (error) {
      console.error('Error saving shop details:', error);
      alert('Error saving shop details. Please try again.');
    }
  };

  const handleShopRegistrationCancel = () => {
    setShowShopRegistration(false);
    handleLogout(); // Logout if they cancel registration
  };

  // Quick add customer from billing page and auto-complete bill
  const handleQuickAddCustomerAndConfirm = async () => {
    try {
      const name = customerInput.trim();
      const phone = newCustomerPhone.trim();
      if (!name) {
        alert('Enter customer name');
        return;
      }
      if (!/^\d{10}$/.test(phone)) {
        alert('Enter a valid 10-digit phone');
        return;
      }
      await addCustomer({ name, phone, balance: 0 });
      setSelectedCustomer(name);
      setSelectedCustomerPhone(phone);
      setShowAddCustomerPhonePrompt(false);
      await refreshCustomersData();

      // Decide which confirmation path to take
      const validItems = billItems.filter(item => item.item && item.weight && item.rate);
      const hasPayment = paymentMethod === 'cash_gpay'
        ? ((parseFloat(cashAmount) || 0) + (parseFloat(gpayAmount) || 0)) > 0
        : (parseFloat(paymentAmount) || 0) > 0;

      if (hasPayment) {
        await handleConfirmBill();
      } else {
        await handleConfirmBillWithoutPayment();
      }
    } catch (err) {
      console.error('Quick add customer failed:', err);
      alert('Failed to add customer. Please try again.');
    }
  };

  // Business information capture handlers
  const handleBusinessInfoComplete = async (businessInfo: any) => {
    try {
      await saveBusinessInfo(businessInfo);
      setBusinessInfoCaptured(true);
      setShowBusinessInfoCapture(false);
    } catch (error) {
      console.error('Error saving business information:', error);
      alert('Error saving business information. Please try again.');
    }
  };

  const handleBusinessInfoCancel = () => {
    setShowBusinessInfoCapture(false);
    handleLogout(); // Logout if they cancel business info capture
  };

  const handleBusinessInfoUpdate = async (updatedInfo: any) => {
    try {
      await updateBusinessInfo(updatedInfo);
      console.log('Business information updated successfully');
    } catch (error) {
      console.error('Error updating business information:', error);
      alert('Error updating business information. Please try again.');
    }
  };

  // Updated function to show confirmation dialog with enhanced validation
  const handleShowConfirmDialog = async () => {
    // Local variables to handle state updates within the function scope (Fixes stale state bug)
    let finalCustomerName = selectedCustomer;
    let finalCustomerPhone = selectedCustomerPhone;
    let isWalkIn = isWalkInMode;

    // Check if customer is required
    if (requireCustomerDetails) {
      if (!finalCustomerName && !isWalkIn) {
        alert('Please select a customer or enable walk-in mode');
        return;
      }

      if (isWalkIn && !finalCustomerPhone) {
        alert('Please enter phone number for walk-in customer');
        return;
      }
    } else {
      // Validation disabled (Rush Mode): Ensure defaults if missing
      if (!finalCustomerName && !isWalkIn) {
        // Auto-generate walk-in customer with RETRY LOGIC & FALLBACKS
        let attempts = 0;
        const maxAttempts = 3;
        let success = false;

        while (attempts < maxAttempts && !success) {
          try {
            attempts++;
            const timestamp = Date.now().toString();
            // Add random suffix to ensure uniqueness even in same millisecond
            const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            // Use 99 prefix + last 5 of timestamp + 3 random digits for better distribution
            const walkInPhone = `99${timestamp.slice(-5)}${randomSuffix}`;
            const walkInName = `Walk-in Customer (${walkInPhone})`;

            console.log(`[RUSH MODE] Auto-generating customer (Attempt ${attempts}/${maxAttempts}): ${walkInName}, ${walkInPhone}`);

            // Try 1: Safe RPC Creation
            try {
              await safeCreateCustomer(walkInName, walkInPhone, 0);
              console.log(`[RUSH MODE] RPC creation successful`);
            } catch (rpcError) {
              console.warn(`[RUSH MODE] RPC failed, trying direct insert`, rpcError);
              // Try 2: Direct Insert Fallback (if RPC fails/timeouts/perm issues)
              await addCustomer({ name: walkInName, phone: walkInPhone, balance: 0 });
              console.log(`[RUSH MODE] Direct insert successful`);
            }

            // Update local variables for immediate use
            finalCustomerName = walkInName;
            finalCustomerPhone = walkInPhone;
            isWalkIn = true;

            // Update state for UI
            setSelectedCustomer(walkInName);
            setSelectedCustomerPhone(walkInPhone);
            setIsWalkInMode(true);

            success = true;

          } catch (e) {
            console.warn(`[RUSH MODE] Failed to auto-generate walk-in customer (Attempt ${attempts})`, e);
            if (attempts >= maxAttempts) {
              console.error("All attempts to generate walk-in customer failed");
              alert("Failed to generate walk-in customer system. Please try again.");
              return; // Stop execution
            }
            // Small random delay before retry
            await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
          }
        }
      }
    }

    // Check if it's a balance-only payment or has items
    const validItems = billItems.filter(item => item.item && item.weight && item.rate);
    const existingBalance = customers.find(c => c.name === finalCustomerName)?.balance || 0;
    const hasPaymentAmount = paymentAmount && parseFloat(paymentAmount) > 0;

    // Allow balance-only payment if customer has existing balance and payment amount is entered
    if (validItems.length === 0 && existingBalance <= 0 && !hasPaymentAmount) {
      alert('Please add at least one item or enter payment amount for balance payment');
      return;
    }

    // If customer name typed doesn't exist, prompt for phone and auto-add
    if (!isWalkIn && finalCustomerName && !customers.find(c => c.name.toLowerCase() === finalCustomerName.toLowerCase())) {
      const phone = window.prompt('New customer detected. Enter 10-digit mobile number to add:');
      if (!phone) {
        alert('Phone number is required to add new customer');
        return;
      }
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        alert('Please enter a valid 10-digit mobile number');
        return;
      }
      try {
        await addCustomer({ name: finalCustomerName, phone: cleanPhone, balance: 0 });
        setSelectedCustomerPhone(cleanPhone);
        finalCustomerPhone = cleanPhone; // Update local variable
      } catch (e) {
        alert('Failed to add customer. Please try again.');
        return;
      }
    }

    // PAYMENT VALIDATION: Allow overpayments for advance credits
    if (hasPaymentAmount) {
      const paidAmount = parseFloat(paymentAmount);
      const itemsTotal = validItems.reduce((sum, item) => sum + item.amount, 0);
      const extraCharges = (parseFloat(cleaningCharge) || 0) + (parseFloat(deliveryCharge) || 0);

      if (validItems.length === 0 && existingBalance > 0) {
        // Balance-only payment: Allow overpayment for advance credit
        const potentialNewBalance = existingBalance - paidAmount;
        if (potentialNewBalance < 0) {
          // Show advance payment message
          const advanceAmount = Math.abs(potentialNewBalance);
          console.log(`Advance payment: ₹${advanceAmount.toFixed(2)} will be credited to customer`);
        }
      } else {
        // Regular bill with items: Allow overpayment for advance credit
        const totalBillAmount = existingBalance + itemsTotal + extraCharges;
        const potentialNewBalance = totalBillAmount - paidAmount;
        if (potentialNewBalance < 0) {
          // Show advance payment message
          const advanceAmount = Math.abs(potentialNewBalance);
          console.log(`Advance payment: ₹${advanceAmount.toFixed(2)} will be credited to customer`);
        }
      }

      setShowConfirmDialog(true);
    } else {
      // No payment amount - direct bill creation for balance
      // We must pass the correct customer details to the next function
      // NOTE: handleConfirmBillWithoutPayment relies on state, which is updated asynchronously.
      // But since we updated state above, and React batches, we might be OK?
      // NO, state updates inside event handlers are not immediately reflected in other function calls if they rely on closure state.
      // We need to pass arguments or ensure handleConfirmBillWithoutPayment uses the latest data.
      // REFACTOR: Modify handleConfirmBillWithoutPayment to accept optional overrides or check refs.
      // For now, let's update strict vars.
      // Actually, passing data via state is risky here.
      // Better to call a refactored version of confirm logic that accepts arguments.
      // Given constraints, we will rely on Ref or pass params.
      // Check validation pass?

      // Since we can't easily refactor the downstream functions in this single block replacement without changing their signatures,
      // and they depend on 'selectedCustomer' state...
      // We rely on the fact that we called setSelectedCustomer above. 
      // BUT `handleConfirmBillWithoutPayment` uses `selectedCustomer` from its closure.
      // This is the tricky part. 
      // Workaround: We will manually update the relevant refs or ensure we wait? We can't wait for state.

      // SAFE FIX: We will update the `addBill` call IN THIS FUNCTION if possible? 
      // No, `handleConfirmBillWithoutPayment` logic is complex.

      // Alternative: Use a Ref to store the "pending" transaction customer.
      // Or simply pass the customer data to the confirm functions?
      // They take no arguments currently.

      // Let's modify the downstream calls to use `finalCustomerName`? 
      // We can't change their signature here easily as they are defined elsewhere in the file.
      // Wait, `handleConfirmBillWithoutPayment` is defined in the same file.
      // I can only edit this block. 

      // We will assume `handleConfirmBillWithoutPayment` reads from STATE. 
      // If we called `setSelectedCustomer`, the state update is queued.
      // If we call `handleConfirmBillWithoutPayment` immediately, it sees OLD state.

      // TEMPORARY FIX: We can invoke the logic directly here or use a timeout?
      // Timeout is bad.

      // Best approach: We assume the user clicks "Confirm" on the dialog later? 
      // Wait. `handleShowConfirmDialog` just shows the dialog OR calls `handleConfirmBillWithoutPayment` (for no payment).
      // If `hasPaymentAmount` is false, it calls `handleConfirmBillWithoutPayment()`.

      // If we are in this block, and we just generated a customer, `handleConfirmBillWithoutPayment` will FAIL due to stale state.
      // I MUST refactor `handleConfirmBillWithoutPayment` to start accepting args, OR inline its logic.

      // Let's UPDATE the confirm functions to read from a Mutable Ref if permitted, or just Pass Arguments to them (and I'll need to update their definitions too).
      // Since I am already replacing a huge chunk, I should update the downstream functions if they are within range.
      // Checking file lines... `handleConfirmBillWithoutPayment` is at line 930. 
      // My replacement range EndLine is 1118.
      // `handleConfirmBillWithoutPayment` IS inside the replacement range!
      // I CAN REFACTOR EVERYTHING!

      handleConfirmBillWithoutPayment(finalCustomerName, finalCustomerPhone);
    }
  };

  // Enhanced bill confirmation without payment with comprehensive error handling
  // Updated to accept overrides for customer details to fix stale state issues
  const handleConfirmBillWithoutPayment = async (overrideName?: string, overridePhone?: string) => {
    try {
      // Use overrides if provided, otherwise fall back to state
      const targetName = overrideName || selectedCustomer;
      const targetPhone = overridePhone || selectedCustomerPhone;

      // Re-validate if needed (though handleShowConfirmDialog presumably did it)
      if (!targetName) return;

      // We skip handleAddCustomerIfNeeded here because we likely handled it upstream or it's a walk-in

      // Calculate current items total (display only)
      const itemsTotal = billItems.filter(item => item.item && item.weight && item.rate).reduce((sum, item) => sum + item.amount, 0);
      const extraCharges = (parseFloat(cleaningCharge) || 0) + (parseFloat(deliveryCharge) || 0);
      const validItems = billItems.filter(item => item.item && item.weight && item.rate);

      // Running balance calculation: Total = Previous Balance + Current Items + Charges
      const totalBillAmount = previousBalance + itemsTotal + extraCharges;
      const newBalance = totalBillAmount - 0; // No payment, so new balance = total bill amount

      // Create bill record using TARGET details
      const billRecord = {
        customer: targetName,
        customerPhone: targetPhone,
        date: selectedDate,
        items: validItems,
        totalAmount: itemsTotal + extraCharges, // transaction amount includes charges
        paidAmount: 0,
        balanceAmount: newBalance, // Amount to carry forward
        cleaningCharge: parseFloat(cleaningCharge) || 0,
        deliveryCharge: parseFloat(deliveryCharge) || 0,
        advanceAmount: 0,
        paymentMethod: 'cash' as const,
      };

      console.log('Attempting to save bill without payment:', billRecord);

      // Add to billing history with error handling
      const savedBill = await addBill(billRecord);

      if (!savedBill) {
        throw new Error('Failed to save bill to database');
      }

      // Set confirmed bill and show actions
      setConfirmedBill(savedBill);
      setIsBalanceOnlyBill(true);
      setShowBillActions(true);

      // Critical: Refresh customers data to sync balance across all views
      await refreshCustomersData();

      console.log('Bill confirmation without payment completed successfully');

    } catch (error) {
      console.error('Error during bill confirmation without payment:', error);

      // Provide user-friendly error feedback
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      alert(`Failed to confirm bill: ${errorMessage}\n\nPlease try again or contact support if the problem persists.`);
    }
  };

  // Enhanced bill confirmation with comprehensive error handling
  // Note: This is called by the Dialog "Confirm" button usually.
  // The Dialog Confirm button will trigger this. The state `selectedCustomer` SHOULD be updated by then because of the render cycle?
  // When `setShowConfirmDialog(true)` happens, the component re-renders showing the dialog.
  // The User then clicks "Yes/Confirm".
  // By that time, `useState` updates from the previous render cycle should be applied!
  // So `handleConfirmBill` (called from dialog) MIGHT be safe.
  // BUT `handleConfirmBillWithoutPayment` is called IMMEDIATELY in the same stack. So it NEEDS arguments.

  const handleConfirmBill = async () => {
    try {
      const ok = await handleAddCustomerIfNeeded();
      if (!ok) return;
      let paidAmount = 0;
      setCalcError(null);

      // Calculate paid amount based on payment method with validation
      if (paymentMethod === 'cash_gpay') {
        const cash = parseFloat(cashAmount) || 0;
        const gpay = parseFloat(gpayAmount) || 0;

        // Validate individual amounts
        if (cash < 0 || gpay < 0) {
          alert('Cash and GPay amounts cannot be negative. Please enter valid amounts.');
          return;
        }

        if (cash === 0 && gpay === 0) {
          alert('Please enter at least one payment amount (Cash or GPay).');
          return;
        }

        paidAmount = cash + gpay;
      } else {
        paidAmount = parseFloat(paymentAmount) || 0;

        if (paidAmount <= 0) {
          alert('Payment amount must be greater than zero.');
          return;
        }
      }

      // Calculate using cents to avoid precision
      const { toCents, computeTotals } = await import('../lib/utils');
      const itemsTotalC = toCents(
        billItems
          .filter(item => item.item && item.weight && item.rate)
          .reduce((sum, item) => sum + (item.amount || 0), 0)
      );
      const cleaningC = toCents(cleaningCharge);
      const deliveryC = toCents(deliveryCharge);
      const previousBalanceC = toCents(previousBalance);
      const paidC = toCents(paidAmount);
      const validItems = billItems.filter(item => item.item && item.weight && item.rate);

      // Running balance calculation with defensive checks
      let totalBillAmount = 0, newBalance = 0, requiredAmount = 0, transactionAmount = 0, advanceAmount = 0;

      if (validItems.length === 0 && previousBalance > 0) {
        // This is a balance-only payment (no new items, just paying existing balance)
        totalBillAmount = previousBalance; // Total is just the previous balance
        transactionAmount = 0; // No purchase amount for payment-only transactions
        newBalance = Math.max(previousBalance - paidAmount, 0); // Clamp to zero
        requiredAmount = previousBalance; // For validation, but partial payments are allowed
        advanceAmount = Math.max(paidAmount - previousBalance, 0);

        // Allow overpayment for advance credit on balance-only payments
        if (paidAmount > previousBalance) {
          const advanceAmount = paidAmount - previousBalance;
          console.log(`Advance payment: ₹${advanceAmount.toFixed(2)} will be credited to customer`);
        }
      } else {
        // Regular bill with items: Total = Previous Balance + Current Items + Charges
        const result = computeTotals({
          previousBalance: previousBalanceC,
          itemsTotal: itemsTotalC,
          deliveryCharge: deliveryC,
          cleaningCharge: cleaningC,
          paidAmount: paidC,
        });
        transactionAmount = result.transactionAmount / 100;
        totalBillAmount = result.totalAmount / 100;
        newBalance = result.newBalance / 100;
        requiredAmount = result.totalAmount / 100;
        advanceAmount = result.advanceAmount / 100;

        // Allow overpayment for advance credit on regular bills
        if (paidAmount > totalBillAmount) {
          const advanceAmount = paidAmount - totalBillAmount;
          console.log(`Advance payment: ₹${advanceAmount.toFixed(2)} will be credited to customer`);
        }
      }

      // Create bill record with running balance logic
      const billRecord = {
        customer: selectedCustomer,
        customerPhone: selectedCustomerPhone,
        date: selectedDate,
        items: validItems,
        totalAmount: transactionAmount,
        paidAmount,
        balanceAmount: newBalance,
        cleaningCharge: parseFloat(cleaningCharge) || 0,
        deliveryCharge: parseFloat(deliveryCharge) || 0,
        advanceAmount: advanceAmount || 0,
        paymentMethod,
        upiType: paymentMethod === 'upi' ? upiType : undefined,
        bankName: paymentMethod === 'check' ? bankName : undefined,
        checkNumber: paymentMethod === 'check' ? checkNumber : undefined,
        cashAmount: paymentMethod === 'cash_gpay' ? parseFloat(cashAmount) || 0 : undefined,
        gpayAmount: paymentMethod === 'cash_gpay' ? parseFloat(gpayAmount) || 0 : undefined,
      };

      console.log('Attempting to save bill:', billRecord);

      // Add to billing history with error handling
      const savedBill = await addBill(billRecord);

      if (!savedBill) {
        throw new Error('Failed to save bill to database');
      }

      // Set confirmed bill and show actions
      setConfirmedBill(savedBill);
      setIsBalanceOnlyBill(validItems.length === 0);
      setShowBillActions(true);

      // Critical: Refresh customers data to sync balance across all views
      await refreshCustomersData();

      console.log('Bill confirmation completed successfully');

    } catch (error) {
      console.error('Error during bill confirmation:', error);

      // Provide user-friendly error feedback
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      alert(`Failed to confirm bill: ${errorMessage}\n\nPlease try again or contact support if the problem persists.`);
    } finally {
      setShowConfirmDialog(false);
    }
  };

  // Real-time computed totals for UI display using integer cents
  const computedSummary = React.useMemo(() => {
    try {
      const validItems = billItems.filter(item => item.item && item.weight && item.rate);
      const itemsTotal = validItems.reduce((sum, item) => sum + (item.amount || 0), 0);
      const paid = paymentMethod === 'cash_gpay'
        ? (parseFloat(cashAmount) || 0) + (parseFloat(gpayAmount) || 0)
        : (parseFloat(paymentAmount) || 0);

      const result = computeTotals({
        previousBalance: toCents(previousBalance),
        itemsTotal: toCents(itemsTotal),
        deliveryCharge: toCents(deliveryCharge),
        cleaningCharge: toCents(cleaningCharge),
        paidAmount: toCents(paid),
      });

      return {
        total: result.totalAmount / 100,
        newBalance: result.newBalance / 100,
        transaction: result.transactionAmount / 100,
      };
    } catch (e) {
      return { total: 0, newBalance: 0, advance: 0, transaction: 0 };
    }
  }, [billItems, previousBalance, cleaningCharge, deliveryCharge, paymentAmount, paymentMethod, cashAmount, gpayAmount]);

  // Generate bill content using running balance system - ENHANCED for Vasan business with BOLD formatting and QR code support
  const generateBillContent = (bill: Bill, uiPreviousBalance: number) => {
    // Uses the new strict ESC/POS formatter
    const shop = shopDetails || {
      shopName: 'BUSINESS NAME',
      address: 'Address Line 1',
      gstNumber: ''
    };

    // Parse address parts if possible
    const addressParts = (shop.address || '').split(',');
    const addrLine1 = addressParts[0] || '';
    const addrLine2 = addressParts.slice(1, 3).join(', ') || ''; // Naive split
    const city = addressParts.slice(3).join(', ') || '';

    // Calculate totals for display
    const itemsTotal = bill.items.reduce((sum, item) => sum + item.amount, 0);
    const extraCharges = (bill as any).cleaningCharge + (bill as any).deliveryCharge;

    // Logic to match strict format expectations
    const billData = {
      shopName: shop.shopName || 'SHOP NAME',
      shopAddressLine1: addrLine1,
      shopAddressLine2: addrLine2,
      shopCity: city,
      shopPhone1: userType === 'owner' ? '9876543210' : '9876543210',

      billNumber: bill.billNumber || 'N/A',
      billDate: formatDate(bill.date), // DD-MM-YYYY
      billTime: new Date(bill.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cashierName: userType === 'owner' ? 'Owner' : 'Staff',

      items: bill.items.map(i => ({
        name: i.item,
        quantity: parseFloat(i.weight) || 0,
        rate: parseFloat(i.rate) || 0,
        amount: i.amount
      })),

      grossAmount: itemsTotal,
      coinage: 0,
      netAmount: bill.totalAmount,

      totalItemsCount: bill.items.length,
      totalQuantity: bill.items.reduce((sum, i) => sum + (parseFloat(i.weight) || 0), 0),

      openingBalance: uiPreviousBalance,
      billAmount: bill.totalAmount,
      paidAmount: bill.paidAmount,
      closingBalance: bill.balanceAmount,

      footerMessage1: 'Thank You!! Visit Again!!',
      footerMessage2: 'FRESH!! FRESH!!'
    };

    // Use the strict formatter
    return generateESCPOSReceipt(billData);
  };

  // Print current billing form (frontend view) - UPDATED with running balance system
  const printCurrentBillingForm = () => {
    if (!selectedCustomer) {
      alert('Please select a customer first');
      return;
    }

    const validItems = billItems.filter(item => item.item && (item.weight || item.rate));
    if (validItems.length === 0) {
      alert('Please add at least one item to print');
      return;
    }

    // Use the previousBalance state (from latest bill) instead of customer table balance
    const itemsTotal = billItems.reduce((sum, item) => sum + item.amount, 0);
    const extraCharges = (parseFloat(cleaningCharge) || 0) + (parseFloat(deliveryCharge) || 0);
    const totalBillAmount = previousBalance + itemsTotal + extraCharges;
    const paidAmount = (paymentMethod === 'cash_gpay')
      ? ((parseFloat(cashAmount) || 0) + (parseFloat(gpayAmount) || 0))
      : (parseFloat(paymentAmount) || 0);
    const newBalance = Math.max(totalBillAmount - paidAmount, 0);
    const advanceAmount = Math.max(paidAmount - totalBillAmount, 0);

    const time = new Date().toLocaleTimeString();

    // Get dynamic business info for print
    let printBusinessName = shopDetails?.shopName || 'BILLING SYSTEM';
    let printAddress = shopDetails?.address || 'Address not set';
    let printContactInfo = '';

    if (businessId === 'vasan_chicken_perambur' || businessId === 'vasan') {
      printContactInfo = `Phone: +91 9876543210
WhatsApp: +91 9876543210
Email: vasanchicken@gmail.com`;
    } else if (businessId === 'santhosh1') {
      printContactInfo = `Phone: 9840217992
WhatsApp: 7200226930
Email: mathangopal5467@yahoo.com`;
    } else {
      printContactInfo = `Phone: ${businessInfo?.phone || 'N/A'}
Email: ${businessInfo?.email || 'N/A'}`;
    }

    const printContent = `
${printBusinessName.toUpperCase()} - BILLING PREVIEW
==================================
${printAddress}
${shopDetails?.gstNumber ? `GST: ${shopDetails.gstNumber}` : ''}
${printContactInfo}

Date: ${selectedDate}
Time: ${time}
Customer: ${selectedCustomer}
Phone: ${selectedCustomerPhone}

ITEMS:
------
${validItems.map((item, index) =>
      `${index + 1}. ${item.item} - ${item.weight}kg @ ₹${item.rate}/kg = ₹${item.amount.toFixed(2)}`
    ).join('\n')}

--------------------------------
Previous Balance: ₹${previousBalance.toFixed(2)}
Current Items: ₹${itemsTotal.toFixed(2)}
Cleaning Charge: ₹${(parseFloat(cleaningCharge) || 0).toFixed(2)}
Delivery Charge: ₹${(parseFloat(deliveryCharge) || 0).toFixed(2)}
Total Bill Amount: ₹${totalBillAmount.toFixed(2)}
Payment Amount: ₹${paidAmount.toFixed(2)}
New Balance: ₹${newBalance.toFixed(2)}${advanceAmount > 0 ? `\nAdvance Payment: ₹${advanceAmount.toFixed(2)}` : ''}
================================

** BILLING PREVIEW - NOT CONFIRMED **
Use "Confirm Bill" to save this bill.
    `.trim();

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Billing Preview - ${selectedCustomer}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
              body {
                font-family: 'Roboto', sans-serif;
                font-weight: 700;
                padding: 20px;
                line-height: 1.4;
                background: white;
              }
              pre {
                white-space: pre-wrap;
                font-size: 16px;
                margin: 0;
                font-family: 'Roboto', sans-serif;
                font-weight: 700;
              }
              @media print {
                body { margin: 0; padding: 10px; font-weight: 700; }
                pre { font-size: 14px; font-weight: 700; }
              }
            </style>
          </head>
          <body>
            <pre>${printContent}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Enhanced Print function with error handling and user feedback
  // Enhanced Print bill function with mobile rendering support and Bluetooth integration
  const printBill = async (bill: Bill) => {
    try {
      // Generate ESC/POS content strictly
      const printContent = generateBillContent(bill, previousBalance);

      // Get QR code from Global Settings
      const qrCode = (qrSettings.enabled && qrSettings.imagePath) ? qrSettings.imagePath : undefined;

      // Check if we have a connected Bluetooth printer
      const isBluetoothConnected = printerService.isConnected();

      if (isBluetoothConnected) {
        toast.info("Printing to Bluetooth printer...");
        // Mobile Bluetooth printing currently supports raw text.
        // If we need QR support here, we would need to encode it.
        // For now, print the strict text format.
        await printerService.printRaw(printContent);

        // If QR code is vital for Bluetooth, we should mention that limitation.
        // But user requirements focus on System/Thermal layout mostly or implied 'print' generally.
      } else {
        // Fallback to robust system printing with mobile delays and QR code support
        await printerService.printViaSystem(printContent, `Bill - ${bill.customer}`, qrCode);
      }

      setTimeout(() => {
        toast.success('Print command sent!');
      }, 1000);

    } catch (error) {
      console.error('Error printing bill:', error);
      toast.error('Error preparing bill for printing.');
    }
  };

  // Save as PDF document with proper formatting
  const saveAsDocument = async (bill: Bill) => {
    try {
      // Dynamic import for jsPDF to avoid build issues
      const { jsPDF } = await import('jspdf');

      const billContent = await generateBillContent(bill, previousBalance);

      // Create new PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Set font and size for better readability
      pdf.setFont('courier', 'normal');
      pdf.setFontSize(10);

      // Split content into lines and add to PDF
      const lines = billContent.split('\n');
      let yPosition = 20;
      const lineHeight = 4;
      const pageHeight = pdf.internal.pageSize.height;

      lines.forEach((line, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.text(line, 10, yPosition);
        yPosition += lineHeight;
      });

      // Save the PDF
      const fileName = `Bill_${bill.customer.replace(/\s+/g, '_')}_${bill.date}_${bill.id}.pdf`;
      pdf.save(fileName);

      // Show success message
      alert('Bill PDF downloaded successfully!');

    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to text file if PDF generation fails
      const billContent = await generateBillContent(bill, previousBalance);
      const blob = new Blob([billContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bill_${bill.customer}_${bill.date}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('PDF generation failed. Downloaded as text file instead.');
    }
  };

  // Streamlined Send to WhatsApp without unnecessary alerts
  const sendToWhatsApp = async (bill: Bill) => {
    try {
      const billContent = await generateBillContent(bill, previousBalance);
      const encodedMessage = encodeURIComponent(billContent);
      const phoneNumber = bill.customerPhone.replace(/\D/g, '');

      // Validate phone number
      if (!phoneNumber || phoneNumber.length < 10) {
        alert('Invalid phone number. Please check the customer phone number.');
        return;
      }

      // Create WhatsApp URL with proper formatting
      const whatsappUrl = `https://wa.me/91${phoneNumber}?text=${encodedMessage}`;

      // Open WhatsApp in new window
      window.open(whatsappUrl, '_blank');

    } catch (error) {
      console.error('Error sending to WhatsApp:', error);
      alert('Error preparing WhatsApp message. Please try again.');
    }
  };

  // Streamlined Send to SMS without unnecessary alerts
  const sendToSms = async (bill: Bill) => {
    try {
      const billContent = await generateBillContent(bill, previousBalance);
      const phoneNumber = bill.customerPhone.replace(/\D/g, '');

      // Validate phone number
      if (!phoneNumber || phoneNumber.length < 10) {
        alert('Invalid phone number. Please check the customer phone number.');
        return;
      }

      // Create SMS URL
      const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(billContent)}`;

      // Try to open SMS app
      const link = document.createElement('a');
      link.href = smsUrl;
      link.click();

    } catch (error) {
      console.error('Error sending to SMS:', error);
      alert('Error preparing SMS message. Please try again.');
    }
  };

  // New function to handle "Bill for Next Customer"
  const handleNextCustomer = () => {
    setShowBillActions(false);
    setConfirmedBill(null);
    setIsBalanceOnlyBill(false);
    resetForm();
    if (customerInputRef.current) {
      customerInputRef.current.focus();
    }
  };

  // Handle cancel confirmation
  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
    // Clear form and focus on customer input
    resetForm();
    if (customerInputRef.current) {
      customerInputRef.current.focus();
    }
  };

  // Reset form with default item - UPDATED to clear cash/gpay amounts and reset previous balance
  const resetForm = () => {
    setSelectedCustomer('');
    setSelectedCustomerPhone('');
    setCustomerInput('');
    setPreviousBalance(0); // Reset previous balance
    // Default to "Chicken Live" instead of empty
    const chickenLiveProduct = products.find(p => p.name.toLowerCase().includes('chicken live')) ||
      products.find(p => p.name.toLowerCase().includes('live')) ||
      products[0]; // fallback to first product
    setBillItems([{
      no: 1,
      item: chickenLiveProduct ? chickenLiveProduct.name : 'Chicken Live',
      weight: '',
      rate: '',
      amount: 0
    }]);
    setPaymentAmount('');
    setPaymentMethod('cash');
    setUpiType('');
    setBankName('');
    setCheckNumber('');
    setCashAmount('');
    setGpayAmount('');
    setCurrentBill(null);
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Legacy local supplier add removed in favor of DB-backed addSupplier from hook

  // Get customer history with improved date filtering
  const getCustomerHistory = () => {
    if (!balanceCustomer) {
      alert('Please select a customer first');
      return;
    }

    let filteredHistory = bills.filter(bill => bill.customer === balanceCustomer);

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date

      filteredHistory = filteredHistory.filter(bill => {
        const billDate = new Date(bill.date);
        return billDate >= start && billDate <= end;
      });
    }

    // Sort bills in ascending order (oldest first)
    filteredHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setCustomerHistory(filteredHistory);

    if (filteredHistory.length === 0) {
      alert('No bills found for the selected customer and date range.');
    }
  };

  // Add balance to customer
  const handleAddBalance = async () => {
    if (!addBalanceCustomer || !addBalanceAmount) {
      alert('Please select customer and enter amount');
      return;
    }

    const amount = parseFloat(addBalanceAmount);
    const customer = customers.find(c => c.name === addBalanceCustomer);
    if (customer) {
      const newBalance = customer.balance + amount;
      await updateCustomerBalance(addBalanceCustomer, newBalance);
    }

    setAddBalanceCustomer('');
    setAddBalanceAmount('');
    alert(`Balance added successfully!`);
  };

  // Get customer balance for display - ALWAYS fetch from database for accuracy
  const getCustomerBalance = (customerName: string) => {
    const customer = customers.find(c => c.name === customerName);
    // CRITICAL: Use the database balance from customers state, not computed from bills
    return customer?.balance || 0;
  };

  // Get last billed date for a customer
  const getLastBilledDate = (customerName: string) => {
    const customer = customers.find(c => c.name === customerName);
    if (customer?.phone) {
      const customerBills = bills.filter(bill => bill.customerPhone === customer.phone);
      if (customerBills.length > 0) {
        const latestBill = customerBills.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        return latestBill.date;
      }
    }
    return null;
  };

  const getCustomerTransactionHistory = (customerName: string) => {
    return bills.filter(bill => bill.customer === customerName);
  };

  // Format date to DD-MM-YYYY
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Generate history content for printing/sharing
  const generateHistoryContent = (bills: Bill[], customerName: string) => {
    // Get correct business name based on businessId
    let businessName = '';
    if (businessId === 'vasan_chicken_perambur' || businessId === 'vasan') {
      businessName = 'Vasan Chicken Perambur';
    } else if (businessId === 'santhosh1') {
      businessName = 'Santhosh Chicken 1';
    } else if (businessId === 'santhosh2') {
      businessName = 'Santhosh Chicken 2';
    } else {
      businessName = shopDetails?.shopName || 'Business';
    }

    return `
${businessName.toUpperCase()} - CUSTOMER HISTORY
==================================
Customer: ${customerName}

PURCHASE HISTORY:
================
${bills.map((bill, index) => {
      const currentItemsTotal = bill.items.reduce((sum, item) => sum + item.amount, 0);

      return `
Bill No: ${bill.billNumber || 'N/A'} - Date: ${formatDate(bill.date)}
${bill.items.map(item =>
        `• ${item.item} - ${item.weight}kg @ ₹${item.rate}/kg = ₹${item.amount.toFixed(2)}`
      ).join('\n')}
Total: ₹${currentItemsTotal.toFixed(2)}
Paid: ₹${bill.paidAmount.toFixed(2)}
Balance: ₹${bill.balanceAmount.toFixed(2)}
Payment: ${bill.paymentMethod === 'cash' ? 'Cash' :
          bill.paymentMethod === 'upi' ? `UPI - ${bill.upiType}` :
            bill.paymentMethod === 'cash_gpay' ? `Cash + GPay` :
              `Check/DD - ${bill.bankName} - ${bill.checkNumber}`}
-----------------------------------
`;
    }).join('')}

==================================
Thank you for your business!
    `.trim();
  };

  // Print history
  const printHistory = () => {
    if (customerHistory.length === 0) return;

    const content = generateHistoryContent(customerHistory, balanceCustomer);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>History - ${balanceCustomer}</title>
            <style>
              body { font-family: monospace; padding: 20px; }
              pre { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <pre>${content}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Download history as high-quality PDF
  const downloadHistory = () => {
    if (customerHistory.length === 0) return;

    // Get correct business name based on businessId
    let businessName = '';
    if (businessId === 'vasan_chicken_perambur' || businessId === 'vasan') {
      businessName = 'Vasan Chicken Perambur';
    } else if (businessId === 'santhosh1') {
      businessName = 'Santhosh Chicken 1';
    } else if (businessId === 'santhosh2') {
      businessName = 'Santhosh Chicken 2';
    } else {
      businessName = shopDetails?.shopName || 'Business';
    }

    // Create new PDF document with proper margins
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Helpers
    const formatMoney = (v: number) => `Rs ${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const drawRight = (text: string, x: number, y: number) => {
      const w = doc.getTextWidth(text);
      doc.text(text, x - w, y);
    };

    // Helper function to add header to each page
    const addHeader = (pageNum: number) => {
      doc.setPage(pageNum);

      // Business header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(25, 25, 25);
      doc.text(businessName.toUpperCase(), margin, 15);

      // Subtitle
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text('Customer Purchase History', margin, 25);

      // Date and time
      const currentDate = new Date().toLocaleDateString('en-IN');
      const currentTime = new Date().toLocaleTimeString('en-IN');
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated: ${currentDate} at ${currentTime}`, margin, 32);

      // Line separator
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, 35, pageWidth - margin, 35);
    };

    // Helper function to add footer to each page
    const addFooter = (pageNum: number, totalPages: number) => {
      doc.setPage(pageNum);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
      doc.text('Generated by Billing System', margin, pageHeight - 10);
    };

    // Add first page header
    addHeader(1);
    yPosition = 45;

    // Customer information section
    doc.setFontSize(14);
    doc.setTextColor(25, 25, 25);
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOMER INFORMATION', margin, yPosition);
    yPosition += 12;

    // Customer details box
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, yPosition - 5, contentWidth, 25, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, yPosition - 5, contentWidth, 25, 'S');

    const customer = customers.find(c => c.name === balanceCustomer);
    if (customer) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);

      doc.text(`Name: ${customer.name}`, margin + 5, yPosition + 3);
      doc.text(`Phone: ${customer.phone}`, margin + 5, yPosition + 10);
      doc.text(`Current Balance: ${formatMoney(customer.balance)}`, margin + 5, yPosition + 17);
    }

    yPosition += 35;

    // Purchase history section
    doc.setFontSize(14);
    doc.setTextColor(25, 25, 25);
    doc.setFont('helvetica', 'bold');
    doc.text('PURCHASE HISTORY', margin, yPosition);
    yPosition += 15;

    // Table headers with proper alignment
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);

    // Header background
    doc.setFillColor(168, 85, 247); // Purple background
    doc.rect(margin, yPosition - 5, contentWidth, 10, 'F');

    // Header text with proper column positions
    const colDate = margin + 5;
    const colBill = margin + 40;
    const colItems = margin + 80;
    const colTotal = margin + 155;
    const colPaid = margin + 185;
    const colBal = margin + 215;
    doc.text('Date', colDate, yPosition);
    doc.text('Bill No', colBill, yPosition);
    doc.text('Items', colItems, yPosition);
    doc.text('Total', colTotal - doc.getTextWidth('Total'), yPosition);
    doc.text('Paid', colPaid - doc.getTextWidth('Paid'), yPosition);
    doc.text('Balance', colBal - doc.getTextWidth('Balance'), yPosition);
    yPosition += 15;

    // Table rows with proper alignment
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);

    customerHistory.forEach((bill, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        const currentPage = doc.getCurrentPageInfo().pageNumber;
        doc.addPage();
        addHeader(currentPage + 1);
        yPosition = 45;

        // Re-add table headers
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.setFillColor(168, 85, 247);
        doc.rect(margin, yPosition - 5, contentWidth, 10, 'F');
        doc.text('Date', colDate, yPosition);
        doc.text('Bill No', colBill, yPosition);
        doc.text('Items', colItems, yPosition);
        doc.text('Total', colTotal - doc.getTextWidth('Total'), yPosition);
        doc.text('Paid', colPaid - doc.getTextWidth('Paid'), yPosition);
        doc.text('Balance', colBal - doc.getTextWidth('Balance'), yPosition);
        yPosition += 15;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
      }

      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, yPosition - 3, contentWidth, 8, 'F');
      }

      const currentItemsTotal = bill.items.reduce((sum, item) => sum + item.amount, 0);
      const billDate = formatDate(bill.date);
      const itemsSummary = bill.items.map(item => `${item.item} (${item.weight}kg)`).join(', ');
      const truncatedItems = itemsSummary.length > 25 ? itemsSummary.substring(0, 25) + '...' : itemsSummary;

      doc.setFontSize(9);
      doc.text(billDate, colDate, yPosition);
      doc.text(bill.billNumber || 'N/A', colBill, yPosition);
      doc.text(truncatedItems, colItems, yPosition);

      // Numbers in monospaced font and right aligned
      doc.setFont('courier', 'normal');
      drawRight(formatMoney(currentItemsTotal), colTotal, yPosition);
      drawRight(formatMoney(bill.paidAmount), colPaid, yPosition);
      drawRight(formatMoney(bill.balanceAmount), colBal, yPosition);
      doc.setFont('helvetica', 'normal');

      yPosition += 10;
    });

    // Summary section
    yPosition += 10;
    doc.setFontSize(14);
    doc.setTextColor(25, 25, 25);
    doc.setFont('helvetica', 'bold');
    doc.text('SUMMARY', margin, yPosition);
    yPosition += 12;

    // Calculate totals
    const totalBilled = customerHistory.reduce((sum, bill) => sum + bill.items.reduce((itemSum, item) => itemSum + item.amount, 0), 0);
    const totalPaid = customerHistory.reduce((sum, bill) => sum + bill.paidAmount, 0);
    const totalBalance = customerHistory.reduce((sum, bill) => sum + bill.balanceAmount, 0);

    // Summary box
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, yPosition - 5, contentWidth, 30, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, yPosition - 5, contentWidth, 30, 'S');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);

    const summaryInfo = [
      `Total Bills: ${customerHistory.length}`,
      `Total Billed: ${formatMoney(totalBilled)}`,
      `Total Paid: ${formatMoney(totalPaid)}`,
      `Outstanding Balance: ${formatMoney(totalBalance)}`
    ];

    summaryInfo.forEach((info, index) => {
      doc.text(info, margin + 5, yPosition + 3 + (index * 6));
    });

    // Add footers to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      addFooter(i, totalPages);
    }

    // Save the PDF
    doc.save(`History_${balanceCustomer}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Streamlined Send history to WhatsApp
  const sendHistoryToWhatsApp = () => {
    if (customerHistory.length === 0) return;

    const content = generateHistoryContent(customerHistory, balanceCustomer);
    const encodedMessage = encodeURIComponent(content);
    const phoneNumber = customerHistory[0]?.customerPhone?.replace(/\D/g, '') || '';
    const whatsappUrl = `https://wa.me/91${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // Initialize form with default item on component mount
  useEffect(() => {
    if (products.length > 0 && billItems.length === 1 && !billItems[0].item) {
      const chickenLiveProduct = products.find(p => p.name.toLowerCase().includes('chicken live')) ||
        products.find(p => p.name.toLowerCase().includes('live')) ||
        products[0];
      if (chickenLiveProduct) {
        setBillItems([{
          no: 1,
          item: chickenLiveProduct.name,
          weight: '',
          rate: '',
          amount: 0
        }]);
      }
    }
  }, [products]);

  // Manual balance update function
  const updateCustomerBalanceManually = async () => {
    if (!selectedCustomer) return;

    const customer = customers.find(c => c.name === selectedCustomer);
    const existingBalance = customer ? customer.balance : 0;
    const itemsTotal = billItems.filter(item => item.item && item.weight && item.rate).reduce((sum, item) => sum + item.amount, 0);
    const paidAmount = parseFloat(paymentAmount) || 0;

    // Calculate new balance: Previous balance + Current purchase - Payment
    const newBalance = existingBalance + itemsTotal - paidAmount;

    // Update customer balance
    await updateCustomerBalance(selectedCustomer, newBalance);

    alert(`Customer balance updated successfully!\nPrevious Balance: ₹${existingBalance.toFixed(2)}\nNew Items: ₹${itemsTotal.toFixed(2)}\nPayment: ₹${paidAmount.toFixed(2)}\nNew Balance: ₹${newBalance.toFixed(2)}`);
  };

  // Generate comprehensive customer data for download
  const generateCustomerData = (customerName: string) => {
    const customer = customers.find(c => c.name === customerName);
    const customerBills = bills.filter(bill => bill.customer === customerName);

    if (!customer) {
      alert('Customer not found');
      return;
    }

    const currentDate = new Date().toLocaleDateString('en-IN');
    const currentTime = new Date().toLocaleTimeString('en-IN');

    // Get correct business name based on businessId
    let businessName = '';
    if (businessId === 'vasan_chicken_perambur' || businessId === 'vasan') {
      businessName = 'Vasan Chicken Perambur';
    } else if (businessId === 'santhosh1') {
      businessName = 'Santhosh Chicken 1';
    } else if (businessId === 'santhosh2') {
      businessName = 'Santhosh Chicken 2';
    } else {
      businessName = shopDetails?.shopName || 'Business';
    }

    let content = `${businessName.toUpperCase()} - CUSTOMER DATA REPORT
================================================
Generated on: ${currentDate} at ${currentTime}
Business: ${businessName}

CUSTOMER INFORMATION:
====================
Name: ${customer.name}
Phone: ${customer.phone}
Current Balance: ₹${customer.balance.toFixed(2)}

BILLING HISTORY:
===============
Total Bills: ${customerBills.length}
Total Amount: ₹${customerBills.reduce((sum, bill) => sum + bill.totalAmount, 0).toFixed(2)}
Total Paid: ₹${customerBills.reduce((sum, bill) => sum + bill.paidAmount, 0).toFixed(2)}
Total Balance: ₹${customerBills.reduce((sum, bill) => sum + bill.balanceAmount, 0).toFixed(2)}

DETAILED BILLS:
===============
`;

    if (customerBills.length === 0) {
      content += 'No bills found for this customer.\n';
    } else {
      customerBills.forEach((bill, index) => {
        // Calculate previous balance for this bill
        const previousBills = customerBills.filter(b => b.id < bill.id);
        const previousBalance = previousBills.reduce((sum, b) => sum + b.balanceAmount, 0);
        const currentItemsTotal = bill.items.reduce((sum, item) => sum + item.amount, 0);
        const totalBillAmount = previousBalance + currentItemsTotal;

        content += `\nBill #${index + 1} - ${bill.billNumber || 'N/A'}
Date: ${formatDate(bill.date)}
Time: ${bill.timestamp.toLocaleTimeString('en-IN')}
----------------------------------------
Items:
`;

        bill.items.forEach((item, itemIndex) => {
          content += `${itemIndex + 1}. ${item.item} - ${item.weight}kg @ ₹${item.rate}/kg = ₹${item.amount.toFixed(2)}\n`;
        });

        content += `----------------------------------------
Previous Balance: ₹${previousBalance.toFixed(2)}
Current Items: ₹${currentItemsTotal.toFixed(2)}
Total Amount: ₹${totalBillAmount.toFixed(2)}
Paid Amount: ₹${bill.paidAmount.toFixed(2)}
Balance Amount: ₹${bill.balanceAmount.toFixed(2)}
Payment Method: ${bill.paymentMethod.toUpperCase()}`;

        if (bill.paymentMethod === 'upi' && bill.upiType) {
          content += ` (${bill.upiType})`;
        } else if (bill.paymentMethod === 'check' && bill.bankName) {
          content += ` (${bill.bankName} - ${bill.checkNumber})`;
        } else if (bill.paymentMethod === 'cash_gpay') {
          content += ` (Cash: ₹${bill.cashAmount?.toFixed(2) || '0.00'} + GPay: ₹${bill.gpayAmount?.toFixed(2) || '0.00'})`;
        }

        content += '\n';
      });
    }

    content += `\n================================================
Report End
Generated by Billing System`;

    return content;
  };

  // Download customer data as high-quality PDF
  const downloadCustomerData = (customerName: string) => {
    const customer = customers.find(c => c.name === customerName);
    const customerBills = bills.filter(bill => bill.customer === customerName);

    if (!customer) {
      alert('Customer not found');
      return;
    }

    // Get correct business name based on businessId
    let businessName = '';
    if (businessId === 'vasan_chicken_perambur' || businessId === 'vasan') {
      businessName = 'Vasan Chicken Perambur';
    } else if (businessId === 'santhosh1') {
      businessName = 'Santhosh Chicken 1';
    } else if (businessId === 'santhosh2') {
      businessName = 'Santhosh Chicken 2';
    } else {
      businessName = shopDetails?.shopName || 'Business';
    }

    // Create new PDF document with proper margins
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Helpers
    const formatMoney = (v: number) => `Rs ${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const drawRight = (text: string, x: number, y: number) => {
      // right align using text width
      const w = doc.getTextWidth(text);
      doc.text(text, x - w, y);
    };

    // Helper function to add header to each page
    const addHeader = (pageNum: number) => {
      doc.setPage(pageNum);

      // Business header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(25, 25, 25);
      doc.text(businessName.toUpperCase(), margin, 15);

      // Subtitle
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text('Customer Data Report', margin, 25);

      // Date and time
      const currentDate = new Date().toLocaleDateString('en-IN');
      const currentTime = new Date().toLocaleTimeString('en-IN');
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated: ${currentDate} at ${currentTime}`, margin, 32);

      // Line separator
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, 35, pageWidth - margin, 35);
    };

    // Helper function to add footer to each page
    const addFooter = (pageNum: number, totalPages: number) => {
      doc.setPage(pageNum);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
      doc.text('Generated by Billing System', margin, pageHeight - 10);
    };

    // Add first page header
    addHeader(1);
    yPosition = 45;

    // Customer information section
    doc.setFontSize(14);
    doc.setTextColor(25, 25, 25);
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOMER INFORMATION', margin, yPosition);
    yPosition += 12;

    // Customer details box
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, yPosition - 5, contentWidth, 25, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, yPosition - 5, contentWidth, 25, 'S');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);

    doc.text(`Name: ${customer.name}`, margin + 5, yPosition + 3);
    doc.text(`Phone: ${customer.phone}`, margin + 5, yPosition + 10);
    doc.text(`Current Balance: ${formatMoney(customer.balance)}`, margin + 5, yPosition + 17);

    yPosition += 35;

    // Purchase history section
    if (customerBills.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(25, 25, 25);
      doc.setFont('helvetica', 'bold');
      doc.text('PURCHASE HISTORY', margin, yPosition);
      yPosition += 15;

      // Table headers with proper alignment
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);

      // Header background
      doc.setFillColor(59, 130, 246);
      doc.rect(margin, yPosition - 5, contentWidth, 10, 'F');

      // Header text with proper column positions
      const colDate = margin + 5;
      const colBill = margin + 40;
      const colItems = margin + 80;
      const colTotal = margin + 155; // right edge
      const colPaid = margin + 185;  // right edge
      const colBal = margin + 215;  // right edge
      doc.text('Date', colDate, yPosition);
      doc.text('Bill No', colBill, yPosition);
      doc.text('Items', colItems, yPosition);
      doc.text('Total', colTotal - doc.getTextWidth('Total'), yPosition);
      doc.text('Paid', colPaid - doc.getTextWidth('Paid'), yPosition);
      doc.text('Balance', colBal - doc.getTextWidth('Balance'), yPosition);
      yPosition += 15;

      // Table rows with proper alignment
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);

      customerBills.forEach((bill, index) => {
        // Check for new page
        if (yPosition > pageHeight - 40) {
          const currentPage = doc.getCurrentPageInfo().pageNumber;
          doc.addPage();
          addHeader(currentPage + 1);
          yPosition = 45;
          // Re-add table headers
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          doc.setFillColor(59, 130, 246);
          doc.rect(margin, yPosition - 5, contentWidth, 10, 'F');
          doc.text('Date', colDate, yPosition);
          doc.text('Bill No', colBill, yPosition);
          doc.text('Items', colItems, yPosition);
          doc.text('Total', colTotal - doc.getTextWidth('Total'), yPosition);
          doc.text('Paid', colPaid - doc.getTextWidth('Paid'), yPosition);
          doc.text('Balance', colBal - doc.getTextWidth('Balance'), yPosition);
          yPosition += 15;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(50, 50, 50);
        }

        // Alternate row colors
        if (index % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, yPosition - 3, contentWidth, 8, 'F');
        }

        const currentItemsTotal = bill.items.reduce((sum, item) => sum + item.amount, 0);
        const billDate = formatDate(bill.date);
        const itemsSummary = bill.items.map(item => `${item.item} (${item.weight}kg)`).join(', ');
        const truncatedItems = itemsSummary.length > 25 ? itemsSummary.substring(0, 25) + '...' : itemsSummary;

        doc.setFontSize(9);
        doc.text(billDate, colDate, yPosition);
        doc.text(bill.billNumber || 'N/A', colBill, yPosition);
        doc.text(truncatedItems, colItems, yPosition);

        // Numbers in monospaced font and right aligned
        doc.setFont('courier', 'normal');
        drawRight(formatMoney(currentItemsTotal), colTotal, yPosition);
        drawRight(formatMoney(bill.paidAmount), colPaid, yPosition);
        drawRight(formatMoney(bill.balanceAmount), colBal, yPosition);
        doc.setFont('helvetica', 'normal');

        yPosition += 10;
      });
    } else {
      doc.setFontSize(11);
      doc.setTextColor(150, 150, 150);
      doc.text('No purchase history found for this customer.', margin, yPosition);
    }

    // Add footers to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      addFooter(i, totalPages);
    }

    // Save the PDF
    doc.save(`Customer_${customerName}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Download all customers data as high-quality PDF
  const downloadAllCustomersData = () => {
    const currentDate = new Date().toLocaleDateString('en-IN');
    const currentTime = new Date().toLocaleTimeString('en-IN');

    // Get correct business name based on businessId
    let businessName = '';
    if (businessId === 'vasan_chicken_perambur' || businessId === 'vasan') {
      businessName = 'Vasan Chicken Perambur';
    } else if (businessId === 'santhosh1') {
      businessName = 'Santhosh Chicken 1';
    } else if (businessId === 'santhosh2') {
      businessName = 'Santhosh Chicken 2';
    } else {
      businessName = shopDetails?.shopName || 'Business';
    }

    // Create new PDF document with proper margins
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Helpers
    const formatMoney = (v: number) => `Rs ${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const drawRight = (text: string, x: number, y: number) => {
      const w = doc.getTextWidth(text);
      doc.text(text, x - w, y);
    };

    // Helper function to add header to each page
    const addHeader = (pageNum: number) => {
      doc.setPage(pageNum);

      // Business header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(25, 25, 25);
      doc.text(businessName.toUpperCase(), margin, 15);

      // Subtitle
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text('Complete Customer Data Report', margin, 25);

      // Date and time
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated: ${currentDate} at ${currentTime}`, margin, 32);

      // Line separator
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, 35, pageWidth - margin, 35);
    };

    // Helper function to add footer to each page
    const addFooter = (pageNum: number, totalPages: number) => {
      doc.setPage(pageNum);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
      doc.text('Generated by Billing System', margin, pageHeight - 10);
    };

    // Add first page header
    addHeader(1);
    yPosition = 45;

    // Summary section
    doc.setFontSize(14);
    doc.setTextColor(25, 25, 25);
    doc.setFont('helvetica', 'bold');
    doc.text('BUSINESS SUMMARY', margin, yPosition);
    yPosition += 15;

    // Calculate totals
    const totalRevenue = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
    const totalCollected = bills.reduce((sum, bill) => sum + bill.paidAmount, 0);
    const totalOutstanding = bills.reduce((sum, bill) => sum + bill.balanceAmount, 0);
    const totalCustomers = customers.length;
    const totalBills = bills.length;

    // Summary box
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, yPosition - 5, contentWidth, 40, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, yPosition - 5, contentWidth, 40, 'S');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);

    const summaryInfo = [
      `Total Customers: ${totalCustomers}`,
      `Total Bills: ${totalBills}`,
      `Total Revenue: ${formatMoney(totalRevenue)}`,
      `Total Collected: ${formatMoney(totalCollected)}`,
      `Total Outstanding: ${formatMoney(totalOutstanding)}`
    ];

    summaryInfo.forEach((info, index) => {
      doc.text(info, margin + 5, yPosition + 3 + (index * 7));
    });

    yPosition += 50;

    // Customer list section
    doc.setFontSize(14);
    doc.setTextColor(25, 25, 25);
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOMER LIST', margin, yPosition);
    yPosition += 15;

    // Table headers with proper alignment
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);

    // Header background
    doc.setFillColor(34, 197, 94);
    doc.rect(margin, yPosition - 5, contentWidth, 10, 'F');

    // Header text with proper column positions
    const colName = margin + 5;
    const colPhone = margin + 70;
    const colBal = margin + 145;   // right edge
    const colBilled = margin + 185; // right edge
    const colBills = margin + 215;  // right edge
    doc.text('Name', colName, yPosition);
    doc.text('Phone', colPhone, yPosition);
    doc.text('Balance', colBal - doc.getTextWidth('Balance'), yPosition);
    doc.text('Total Billed', colBilled - doc.getTextWidth('Total Billed'), yPosition);
    doc.text('Bills', colBills - doc.getTextWidth('Bills'), yPosition);
    yPosition += 15;

    // Customer rows with proper alignment
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);

    customers.forEach((customer, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        const currentPage = doc.getCurrentPageInfo().pageNumber;
        doc.addPage();
        addHeader(currentPage + 1);
        yPosition = 45;
        // Re-add table headers
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.setFillColor(34, 197, 94);
        doc.rect(margin, yPosition - 5, contentWidth, 10, 'F');
        doc.text('Name', colName, yPosition);
        doc.text('Phone', colPhone, yPosition);
        doc.text('Balance', colBal - doc.getTextWidth('Balance'), yPosition);
        doc.text('Total Billed', colBilled - doc.getTextWidth('Total Billed'), yPosition);
        doc.text('Bills', colBills - doc.getTextWidth('Bills'), yPosition);
        yPosition += 15;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
      }

      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, yPosition - 3, contentWidth, 8, 'F');
      }

      const customerBills = bills.filter(bill => bill.customer === customer.name);
      const totalBilled = customerBills.reduce((sum, bill) => sum + bill.totalAmount, 0);

      doc.setFontSize(9);
      doc.text(customer.name, colName, yPosition);
      doc.text(customer.phone, colPhone, yPosition);
      doc.setFont('courier', 'normal');
      drawRight(formatMoney(customer.balance), colBal, yPosition);
      drawRight(formatMoney(totalBilled), colBilled, yPosition);
      drawRight(String(customerBills.length), colBills, yPosition);
      doc.setFont('helvetica', 'normal');

      yPosition += 10;
    });

    // Add footers to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      addFooter(i, totalPages);
    }

    // Save the PDF
    doc.save(`All_Customers_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // Show business information capture if needed (for non-mathan, non-vasan users)
  if (isLoggedIn && !businessInfoLoading && !hasBusinessInfo && businessId !== 'santhosh1' && businessId !== 'vasan' && businessId !== 'vasan_chicken_perambur') {
    if (!showBusinessInfoCapture) {
      setShowBusinessInfoCapture(true);
    }
    return (
      <div className="min-h-screen bg-gray-50">
        <BusinessInfoCapture
          onComplete={handleBusinessInfoComplete}
          onCancel={handleBusinessInfoCancel}
          businessId={businessId}
        />
      </div>
    );
  }

  // For Vasan user, if shop registration is not completed, only show registration modal
  if (businessId === 'vasan' && showShopRegistration) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ShopRegistration
          onComplete={handleShopRegistrationComplete}
          onCancel={handleShopRegistrationCancel}
          businessId={businessId}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-2 sm:p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-3 sm:mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3">
            <h1 className="text-lg sm:text-2xl font-bold text-blue-600">
              {businessId === 'vasan' ? 'VASAN CHICKEN' : `Billing System ${businessId === 'santhosh2' ? '(Branch 2)' : ''}`}
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm text-gray-600">
                Logged in as: {userType === 'owner' ? 'Owner' : 'Staff'}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
              >
                <LogOut className="inline mr-1 h-4 w-4" />
                Logout
              </button>
            </div>
          </div>

          {/* Navigation - UPDATED to include Load page */}
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setCurrentView('billing')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg font-medium text-sm ${currentView === 'billing'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              <Calculator className="inline mr-1 h-4 w-4" />
              Billing
            </button>
            <button
              onClick={() => setCurrentView('editBill')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg font-medium text-sm ${currentView === 'editBill'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              <FileText className="inline mr-1 h-4 w-4" />
              Edit Bill
            </button>
            <a
              href="/bill-format"
              className="px-3 sm:px-4 py-1.5 rounded-lg font-medium text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 flex items-center"
            >
              <Layout className="inline mr-1 h-4 w-4" />
              Bill Settings
            </a>
            <button
              onClick={() => setCurrentView('load')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg font-medium text-sm ${currentView === 'load'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              <Truck className="inline mr-1 h-4 w-4" />
              Load
            </button>

            <button
              onClick={() => setCurrentView('qr-settings')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg font-medium text-sm ${currentView === 'qr-settings'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              <QrCode className="inline mr-1 h-4 w-4" />
              QR Settings
            </button>
            <button
              onClick={() => setCurrentView('bill-customization')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg font-medium text-sm ${currentView === 'bill-customization'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              <Layout className="inline mr-1 h-4 w-4" />
              Bill Format
            </button>
            <button
              onClick={() => setCurrentView('products')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg font-medium text-sm ${currentView === 'products'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              <Package className="inline mr-1 h-4 w-4" />
              Products
            </button>
            {userType === 'owner' && (
              <>
                <button
                  onClick={() => setCurrentView('customers')}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg font-medium text-sm ${currentView === 'customers'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  <Users className="inline mr-1 h-4 w-4" />
                  Manage Customers
                </button>
                <button
                  onClick={() => setCurrentView('balance')}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg font-medium text-sm ${currentView === 'balance'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  <History className="inline mr-1 h-4 w-4" />
                  Balance & History
                </button>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg font-medium text-sm ${currentView === 'dashboard'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  <BarChart3 className="inline mr-1 h-4 w-4" />
                  Sales Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('purchase')}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg font-medium text-sm ${currentView === 'purchase'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  <Package className="inline mr-1 h-4 w-4" />
                  Purchase
                </button>
                <button
                  onClick={() => setCurrentView('salary')}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg font-medium text-sm ${currentView === 'salary'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  <CreditCard className="inline mr-1 h-4 w-4" />
                  Salary
                </button>
                <button
                  onClick={() => setCurrentView('business-info')}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg font-medium text-sm ${currentView === 'business-info'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  <Building2 className="inline mr-1 h-4 w-4" />
                  Business Info
                </button>
              </>
            )}
          </div>
        </div>

        {/* Billing View */}
        {currentView === 'billing' && (
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <h2 className="text-lg sm:text-xl font-bold mb-3">Create Bill</h2>

            {/* Compact form layout for desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bill Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <Calendar className="absolute right-2 top-2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Walk-in Customer Option */}
              <div className="lg:col-span-3 mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isWalkInMode}
                    onChange={(e) => {
                      setIsWalkInMode(e.target.checked);
                      if (e.target.checked) {
                        setSelectedCustomer('');
                        setCustomerInput('');
                        setPreviousBalance(0);
                      }
                    }}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Walk-in Customer Mode</span>
                </label>
              </div>

              {/* Walk-in Billing Component */}
              {isWalkInMode && (
                <div className="lg:col-span-3">
                  <WalkInBilling
                    onPhoneUpdate={handlePhoneChange}
                    selectedCustomerPhone={selectedCustomerPhone}
                    selectedCustomer={selectedCustomer}
                    onCustomerUpdate={setSelectedCustomer}
                    previousBalance={previousBalance}
                    billItems={billItems}
                    totalAmount={totalAmount}
                    onSendWhatsApp={sendBillToWhatsApp}
                    onWalkInCustomerCreation={handleWalkInCustomerCreation}
                    shopDetails={shopDetails || undefined}
                    onPrint={printBill}
                    businessId={businessId}
                  />
                  <div className="mt-4">
                    <PrinterSelector />
                  </div>
                </div>
              )}

              {/* Walk-in Customer Toggle */}
              <div className="lg:col-span-2 mb-3 flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <input
                  type="checkbox"
                  id="require-customer"
                  checked={requireCustomerDetails}
                  onChange={(e) => setRequireCustomerDetails(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="require-customer" className="text-sm font-medium text-gray-700 flex-grow">
                  Require customer details
                </label>
                <span className="text-xs text-gray-500">
                  Disable for walk-in customers
                </span>
              </div>

              {/* Customer Selection - Only show when customer details are required */}
              {requireCustomerDetails && (
                <>
                  <div className="lg:col-span-2 relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name
                    </label>
                    <div className="relative">
                      <input
                        ref={customerInputRef}
                        type="text"
                        value={customerInput}
                        onChange={(e) => {
                          setCustomerInput(e.target.value);
                          setShowCustomerSuggestions(true);
                        }}
                        onFocus={() => setShowCustomerSuggestions(true)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Type customer name"
                      />
                      <Search className="absolute right-2 top-2 h-5 w-5 text-gray-400" />
                    </div>
                    {showAddCustomerPhonePrompt && (
                      <div className="mt-2 p-2 border border-yellow-300 bg-yellow-50 rounded">
                        <div className="text-sm text-yellow-800 mb-1">New customer. Enter mobile number to add:</div>
                        <input
                          type="tel"
                          value={newCustomerPhone}
                          onChange={(e) => setNewCustomerPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                          placeholder="10-digit mobile"
                          className="w-full p-2 border border-gray-300 rounded"
                          maxLength={10}
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={handleQuickAddCustomerAndConfirm}
                            className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                          >
                            Add Customer & Complete Bill
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Customer Suggestions with Real-Time Balances */}
                    {showCustomerSuggestions && customerInput && (
                      <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                        {customerSuggestionsWithBalance.length > 0 ? (
                          customerSuggestionsWithBalance.map((customer, index) => (
                            <div
                              key={index}
                              onClick={() => handleCustomerSelect(customer.name)}
                              className="p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium text-sm">{customer.name}</div>
                                  <div className="text-xs text-gray-500">{customer.phone}</div>
                                </div>
                                {customer.balance > 0 && (
                                  <span className="text-red-600 text-xs font-medium">
                                    Balance: ₹{customer.balance.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          // Fallback to filtered customers if real-time data isn't ready
                          filteredCustomers.map((customer, index) => (
                            <div
                              key={index}
                              onClick={() => handleCustomerSelect(customer.name)}
                              className="p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium text-sm">{customer.name}</div>
                                  <div className="text-xs text-gray-500">{customer.phone}</div>
                                </div>
                                {customer.balance > 0 && (
                                  <span className="text-red-600 text-xs font-medium">
                                    Balance: ₹{customer.balance.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Selected Customer Display with Balance and History - UPDATED with running balance system */}
            {selectedCustomer && (
              <div className="mb-3 space-y-2">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                    <div>
                      <strong className="text-blue-800 text-sm">Selected Customer:</strong>
                      <span className="ml-2 text-blue-900 font-medium text-sm">{selectedCustomer}</span>
                      <div className="text-xs text-gray-600">Phone: {selectedCustomerPhone}</div>
                    </div>
                    {previousBalance > 0 && (
                      <div className="text-left sm:text-right">
                        <div className="flex items-center gap-2 justify-start sm:justify-end">
                          <span className="text-red-600 font-bold text-lg">
                            Previous Balance: ₹{previousBalance.toFixed(2)}
                          </span>
                          <button
                            onClick={refreshCustomerBalance}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                            title="Refresh balance from database"
                          >
                            <RefreshCw size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Transaction History */}
                {getCustomerTransactionHistory(selectedCustomer).length > 0 && (
                  <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-1 text-sm">Recent Transactions:</h4>
                    <div className="max-h-20 overflow-y-auto">
                      {getCustomerTransactionHistory(selectedCustomer).slice(-3).map((bill, index) => (
                        <div key={index} className="text-xs text-yellow-700 border-b border-yellow-200 pb-1 mb-1 last:border-b-0">
                          <strong>{bill.date}:</strong> Total: ₹{bill.totalAmount.toFixed(2)},
                          Paid: ₹{bill.paidAmount.toFixed(2)},
                          Balance: ₹{bill.balanceAmount.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bill Items Table - Compact */}
            <div className="overflow-x-auto mb-3">
              <table className="w-full border-collapse border border-gray-300 min-w-[600px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-1.5 text-left text-sm">No</th>
                    <th className="border border-gray-300 p-1.5 text-left text-sm">Item</th>
                    <th className="border border-gray-300 p-1.5 text-left text-sm">Weight (kg)</th>
                    <th className="border border-gray-300 p-1.5 text-left text-sm">Rate (₹/kg)</th>
                    <th className="border border-gray-300 p-1.5 text-left text-sm">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {billItems.map((item, index) => (
                    <tr key={item.no}>
                      <td className="border border-gray-300 p-1 text-center text-sm">
                        {item.no}
                      </td>
                      <td className="border border-gray-300 p-1">
                        <select
                          id={`item-${index}`}
                          value={item.item}
                          onChange={(e) => handleItemChange(index, 'item', e.target.value)}
                          onKeyDown={(e) => handleKeyPress(e, index, 'item')}
                          className="w-full p-1.5 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">Select Item</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.name}>{product.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input
                          id={`weight-${index}`}
                          type="number"
                          step="0.1"
                          value={item.weight}
                          readOnly
                          className="w-full p-1.5 border border-gray-200 rounded text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                          placeholder="0.000"
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input
                          id={`rate-${index}`}
                          type="number"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                          onKeyDown={(e) => handleKeyPress(e, index, 'rate')}
                          className="w-full p-1.5 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="border border-gray-300 p-1 text-right font-medium text-sm">
                        <input
                          id={`amount_input-${index}`}
                          type="number"
                          step="0.01"
                          value={item.amount || ''}
                          onChange={(e) => handleItemChange(index, 'amount_input', e.target.value)}
                          onKeyDown={(e) => handleKeyPress(e, index, 'amount_input')}
                          className="w-full p-1.5 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 text-sm text-right font-medium"
                          placeholder="0.00"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Updated Total and Payment Section - UPDATED with running balance system and extra charges */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-3">
              <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                <div className="text-sm">Items Total: ₹{totalAmount.toFixed(2)}</div>
                <div className="text-sm">Cleaning Charge: ₹{(parseFloat(cleaningCharge) || 0).toFixed(2)}</div>
                <div className="text-sm">Delivery Charge: ₹{(parseFloat(deliveryCharge) || 0).toFixed(2)}</div>
                {selectedCustomer && previousBalance > 0 && (
                  <div className="text-sm text-red-600">Previous Balance: ₹{previousBalance.toFixed(2)}</div>
                )}
                <div className="text-xl font-bold border-t pt-1">
                  Total Bill Amount: ₹{computedSummary.total.toFixed(2)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cleaning Charge (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={cleaningCharge}
                  onChange={(e) => setCleaningCharge(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-2"
                  placeholder="0.00"
                />
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Charge (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={deliveryCharge}
                  onChange={(e) => setDeliveryCharge(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount paid"
                />
                {/* Real-time validation feedback */}
                {paymentAmount && (() => {
                  const paidAmount = parseFloat(paymentAmount) || 0;
                  const requiredAmount = computedSummary.total;
                  if (paidAmount > requiredAmount) {
                    return (
                      <div className="text-red-600 text-sm mt-1">
                        ⚠️ Exceeds required amount by ₹{(paidAmount - requiredAmount).toFixed(2)}
                      </div>
                    );
                  } else if (paidAmount > 0 && paidAmount < requiredAmount) {
                    return (
                      <div className="text-yellow-600 text-sm mt-1">
                        ℹ️ Partial payment: ₹{(requiredAmount - paidAmount).toFixed(2)} remaining
                      </div>
                    );
                  } else if (paidAmount === requiredAmount) {
                    return (
                      <div className="text-green-600 text-sm mt-1">
                        ✓ Full payment amount
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-lg font-bold">New Balance: ₹{computedSummary.newBalance.toFixed(2)}</div>
                {/* Advance intentionally removed per latest requirement */}
                <button
                  onClick={() => {
                    resetForm();
                    setCurrentBill(null);
                    setShowBillActions(false);
                    setConfirmedBill(null);
                    if (customerInputRef.current) {
                      customerInputRef.current.focus();
                    }
                  }}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center gap-1"
                >
                  <RefreshCw size={14} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Updated Confirmation section */}
            <div className="border-t pt-3">
              <div className="flex justify-center">
                <button
                  onClick={handleShowConfirmDialog}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  <Check className="inline mr-2 h-4 w-4" />
                  Confirm Bill
                </button>
              </div>
            </div>

            {/* Payment Method Confirmation Dialog - UPDATED with Cash+GPay option */}
            {showConfirmDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                  <h3 className="text-lg font-semibold mb-4">Payment Method</h3>

                  {/* Payment Method Selection */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="cash"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'cash')}
                        className="w-4 h-4"
                      />
                      <label htmlFor="cash" className="text-sm font-medium">Cash</label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="upi"
                        name="paymentMethod"
                        value="upi"
                        checked={paymentMethod === 'upi'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'upi')}
                        className="w-4 h-4"
                      />
                      <label htmlFor="upi" className="text-sm font-medium">UPI</label>
                    </div>

                    {paymentMethod === 'upi' && (
                      <div className="ml-6">
                        <select
                          value={upiType}
                          onChange={(e) => setUpiType(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select UPI Provider</option>
                          <option value="GPay">GPay</option>
                          <option value="PhonePe">PhonePe</option>
                          <option value="Paytm">Paytm</option>
                          <option value="BHIM">BHIM</option>
                          <option value="Amazon Pay">Amazon Pay</option>
                          <option value="Mobikwik">Mobikwik</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="check"
                        name="paymentMethod"
                        value="check"
                        checked={paymentMethod === 'check'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'check')}
                        className="w-4 h-4"
                      />
                      <label htmlFor="check" className="text-sm font-medium">Check/DD</label>
                    </div>

                    {paymentMethod === 'check' && (
                      <div className="ml-6 space-y-2">
                        <input
                          type="text"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="Bank Name"
                        />
                        <input
                          type="text"
                          value={checkNumber}
                          onChange={(e) => setCheckNumber(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="Check/DD Number"
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="cash_gpay"
                        name="paymentMethod"
                        value="cash_gpay"
                        checked={paymentMethod === 'cash_gpay'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'cash_gpay')}
                        className="w-4 h-4"
                      />
                      <label htmlFor="cash_gpay" className="text-sm font-medium">Cash + GPay</label>
                    </div>

                    {paymentMethod === 'cash_gpay' && (
                      <div className="ml-6 space-y-2">
                        <input
                          type="number"
                          step="0.01"
                          value={cashAmount}
                          onChange={(e) => setCashAmount(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="Cash Amount"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={gpayAmount}
                          onChange={(e) => setGpayAmount(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="GPay Amount"
                        />
                        <div className="text-sm">
                          <div className="text-gray-600">
                            Total: ₹{((parseFloat(cashAmount) || 0) + (parseFloat(gpayAmount) || 0)).toFixed(2)}
                          </div>
                          {/* Real-time validation feedback for mixed payments */}
                          {(() => {
                            const cash = parseFloat(cashAmount) || 0;
                            const gpay = parseFloat(gpayAmount) || 0;
                            const totalPaid = cash + gpay;
                            const itemsTotal = billItems.filter(item => item.item && item.weight && item.rate).reduce((sum, item) => sum + item.amount, 0);
                            const validItems = billItems.filter(item => item.item && item.weight && item.rate);

                            let requiredAmount;
                            if (validItems.length === 0 && previousBalance > 0) {
                              requiredAmount = previousBalance;
                            } else {
                              requiredAmount = previousBalance + itemsTotal;
                            }

                            if (totalPaid > requiredAmount) {
                              return (
                                <div className="text-red-600 text-xs mt-1">
                                  ⚠️ Exceeds required amount by ₹{(totalPaid - requiredAmount).toFixed(2)}
                                </div>
                              );
                            } else if (totalPaid > 0 && totalPaid < requiredAmount) {
                              return (
                                <div className="text-yellow-600 text-xs mt-1">
                                  ℹ️ Partial payment: ₹{(requiredAmount - totalPaid).toFixed(2)} remaining
                                </div>
                              );
                            } else if (totalPaid === requiredAmount) {
                              return (
                                <div className="text-green-600 text-xs mt-1">
                                  ✓ Full payment amount
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Validation Summary */}
                  {(() => {
                    let paidAmount = 0;
                    if (paymentMethod === 'cash_gpay') {
                      paidAmount = (parseFloat(cashAmount) || 0) + (parseFloat(gpayAmount) || 0);
                    } else {
                      paidAmount = parseFloat(paymentAmount) || 0;
                    }

                    const itemsTotal = billItems.filter(item => item.item && item.weight && item.rate).reduce((sum, item) => sum + item.amount, 0);
                    const validItems = billItems.filter(item => item.item && item.weight && item.rate);

                    let requiredAmount;
                    if (validItems.length === 0 && previousBalance > 0) {
                      requiredAmount = previousBalance;
                    } else {
                      const extraCharges = (parseFloat(cleaningCharge) || 0) + (parseFloat(deliveryCharge) || 0);
                      requiredAmount = previousBalance + itemsTotal + extraCharges;
                    }

                    const difference = paidAmount - requiredAmount;
                    const isValidPayment = paidAmount > 0 && paidAmount <= requiredAmount;

                    return (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                        <h4 className="font-medium text-gray-800 mb-2">Payment Summary</h4>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>Previous Balance:</span>
                            <span>₹{previousBalance.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Current Items:</span>
                            <span>₹{itemsTotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-medium border-t pt-1">
                            <span>Total Amount:</span>
                            <span>₹{requiredAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Payment Amount:</span>
                            <span className={paidAmount > requiredAmount ? 'text-red-600' : 'text-gray-900'}>
                              ₹{paidAmount.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between font-medium border-t pt-1">
                            <span>New Balance:</span>
                            <span>₹{(Math.max(requiredAmount - paidAmount, 0)).toFixed(2)}</span>
                          </div>
                          {paidAmount > 0 && paidAmount < requiredAmount && (
                            <div className="text-yellow-600 text-xs mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                              ℹ️ Partial payment: ₹{(requiredAmount - paidAmount).toFixed(2)} will remain as balance
                            </div>
                          )}
                          {paidAmount === requiredAmount && paidAmount > 0 && (
                            <div className="text-green-600 text-xs mt-2 p-2 bg-green-50 rounded border border-green-200">
                              ✓ Full payment - balance will be cleared
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* QR Code Upload Section */}
                  <div className="lg:col-span-3 border-t pt-3 mt-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Payment QR Code
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="include-qr"
                            checked={includeQRInPrint}
                            onChange={(e) => setIncludeQRInPrint(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="include-qr" className="text-sm text-gray-600">
                            Include in print
                          </label>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setUploadedQRCode(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full p-2 text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {uploadedQRCode && (
                        <div className="mt-2 flex items-center gap-3 p-2 bg-white rounded border border-gray-200">
                          <img src={uploadedQRCode} alt="QR Code" className="w-16 h-16 rounded" />
                          <span className="text-sm text-gray-600 flex-grow">QR Code uploaded</span>
                          <button
                            type="button"
                            onClick={() => setUploadedQRCode(null)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Confirmation Buttons with Validation */}
                  <div className="flex gap-4">
                    {(() => {
                      let paidAmount = 0;
                      if (paymentMethod === 'cash_gpay') {
                        paidAmount = (parseFloat(cashAmount) || 0) + (parseFloat(gpayAmount) || 0);
                      } else {
                        paidAmount = parseFloat(paymentAmount) || 0;
                      }

                      const itemsTotal = billItems.filter(item => item.item && item.weight && item.rate).reduce((sum, item) => sum + item.amount, 0);
                      const validItems = billItems.filter(item => item.item && item.weight && item.rate);

                      let requiredAmount;
                      if (validItems.length === 0 && previousBalance > 0) {
                        const extraCharges = (parseFloat(cleaningCharge) || 0) + (parseFloat(deliveryCharge) || 0);
                        requiredAmount = previousBalance + extraCharges;
                      } else {
                        const extraCharges = (parseFloat(cleaningCharge) || 0) + (parseFloat(deliveryCharge) || 0);
                        requiredAmount = previousBalance + itemsTotal + extraCharges;
                      }

                      const isValidPayment = paidAmount > 0;
                      const hasExcessPayment = false; // Allow all payments including overpayments

                      return (
                        <>
                          <button
                            onClick={handleConfirmBill}
                            disabled={!isValidPayment}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium ${!isValidPayment
                              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            title={!isValidPayment ? 'Please enter a payment amount' : 'Confirm payment'}
                          >
                            {!isValidPayment ? 'Enter Payment Amount' : 'Yes - Confirm'}
                          </button>
                          <button
                            onClick={handleCancelConfirm}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            No - Cancel
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Bill Actions - Comprehensive Post-Confirmation Interface */}
            {showBillActions && confirmedBill && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-6 mb-4 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                    <Check className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-green-800">
                      Bill Created Successfully!
                    </h3>
                    <p className="text-sm text-green-700">
                      Bill #{confirmedBill.billNumber || confirmedBill.id} has been saved securely
                    </p>
                  </div>
                </div>

                {/* Bill Summary */}
                <div className="bg-white rounded-lg p-4 mb-4 border border-green-100">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Customer:</span>
                      <p className="font-semibold">{confirmedBill.customer}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Amount:</span>
                      <p className="font-semibold">₹{confirmedBill.totalAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Paid:</span>
                      <p className="font-semibold text-green-600">₹{confirmedBill.paidAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Balance:</span>
                      <p className="font-semibold text-blue-600">₹{confirmedBill.balanceAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Clean, professional layout */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <button
                    onClick={() => saveAsDocument(confirmedBill)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                    title="Download bill as PDF"
                  >
                    <FileText className="h-5 w-5" />
                    📥 Download PDF
                  </button>
                  <button
                    onClick={() => sendToWhatsApp(confirmedBill)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                    title="Send bill to customer via WhatsApp"
                  >
                    <MessageCircle className="h-5 w-5" />
                    📲 WhatsApp
                  </button>
                  <button
                    onClick={() => sendToSms(confirmedBill)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                    title="Send bill to customer via SMS"
                  >
                    <MessageCircle className="h-5 w-5" />
                    📱 SMS
                  </button>
                  <button
                    onClick={() => printBill(confirmedBill)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                    title="Print bill"
                  >
                    <Printer className="h-5 w-5" />
                    🖨️ Print Bill
                  </button>
                </div>

                <div className="text-center">
                  <button
                    onClick={handleNextCustomer}
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-medium text-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                    title="Start a new bill for the next customer"
                  >
                    <Users className="inline mr-2 h-5 w-5" />
                    Bill for Next Customer
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Load View - NEW */}
        {currentView === 'load' && (
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="mb-4">
              <h2 className="text-lg sm:text-2xl font-bold mb-3">Load Management</h2>
              <p className="text-sm text-gray-600">Manage your inventory and load entries</p>
            </div>

            {/* Debug Info */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-800">Debug Info</h4>
              <p className="text-sm text-blue-700">Business ID: {businessId}</p>
              <p className="text-sm text-blue-700">Products Count: {products.length}</p>
              <p className="text-sm text-blue-700">Suppliers Count: {suppliers.length}</p>
            </div>

            <ErrorBoundary fallback={
              <div className="text-center py-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  <h3 className="font-semibold">Error Loading Load Manager</h3>
                  <p>There was an error loading the load management page. Please try again.</p>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Reload Page
                </button>
              </div>
            }>
              <SimpleLoadManager businessId={businessId} />
            </ErrorBoundary>
          </div>
        )}

        {/* Edit Bill View */}
        {currentView === 'editBill' && (
          <EditBillPage
            bills={bills}
            customers={customers}
            products={products}
            onUpdateBill={updateBill}
            onDeleteBill={deleteBill}
            shopDetails={shopDetails}
          />
        )}

        {/* Products View */}
        {currentView === 'products' && (
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <h2 className="text-lg sm:text-2xl font-bold mb-3">Manage Products</h2>

            {/* Debug Info */}
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
              <h4 className="font-semibold text-green-800">Debug Info</h4>
              <p className="text-sm text-green-700">Business ID: {businessId}</p>
              <p className="text-sm text-green-700">Products Count: {products.length}</p>
              <p className="text-sm text-green-700">Suppliers Count: {suppliers.length}</p>
              <p className="text-sm text-green-700">Loading: {loading ? 'Yes' : 'No'}</p>
            </div>

            {/* Business Information Display */}
            <ErrorBoundary fallback={
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-4">
                <h3 className="font-semibold">Business Info Error</h3>
                <p>Could not load business information. The products section will still work.</p>
              </div>
            }>
              <BusinessInfoDisplay
                businessInfo={businessInfo}
                onUpdate={handleBusinessInfoUpdate}
                businessId={businessId}
              />
            </ErrorBoundary>

            <ErrorBoundary fallback={
              <div className="text-center py-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  <h3 className="font-semibold">Error Loading Products</h3>
                  <p>There was an error loading the products page. Please try again.</p>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Reload Page
                </button>
              </div>
            }>
              <SimpleProducts
                businessId={businessId}
                onProductUpdate={refreshProducts}
              />
            </ErrorBoundary>
          </div>
        )}

        {/* Customer Management View */}
        {currentView === 'customers' && userType === 'owner' && (
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <h2 className="text-lg sm:text-2xl font-bold mb-3">Manage Customers & Suppliers</h2>

            {/* Business Information Display */}
            <BusinessInfoDisplay
              businessInfo={businessInfo}
              onUpdate={handleBusinessInfoUpdate}
              businessId={businessId}
            />

            <div className="grid grid-cols-1 gap-8">
              {/* Customer Management */}
              <CustomerManager
                customers={customers}
                onAddCustomer={async (c) => { await addCustomer(c); }}
                onUpdateCustomer={updateCustomer}
                onDeleteCustomer={deleteCustomer}
                onDownloadCustomerData={downloadCustomerData}
                onDownloadAllCustomersData={downloadAllCustomersData}
                businessId={businessId}
              />

              {/* Add Supplier */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Add New Supplier</h3>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={suppliersInput}
                    onChange={(e) => setSuppliersInput(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter supplier name"
                  />
                  <button
                    onClick={async () => {
                      if (!suppliersInput.trim()) return;
                      try { await addSupplier(suppliersInput.trim()); setSuppliersInput(''); } catch (e) { alert('Failed to add supplier'); }
                    }}
                    className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <h4 className="font-medium mb-2">Current Suppliers ({suppliers.length})</h4>
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {suppliers.map((supplier, index) => (
                    <div key={index} className="py-1 border-b border-gray-100 last:border-b-0">
                      {supplier}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Business Information Management View */}
        {currentView === 'business-info' && userType === 'owner' && (
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <h2 className="text-lg sm:text-2xl font-bold mb-3">Business Information Management</h2>

            <BusinessInfoDisplay
              businessInfo={businessInfo}
              onUpdate={handleBusinessInfoUpdate}
              businessId={businessId}
            />

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Information</h3>
              <p className="text-sm text-gray-600 mb-4">
                You can edit your business information at any time. Changes will be reflected across all pages and in your bills.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Business ID:</span>
                  <span className="ml-2 text-gray-900 font-mono">{businessId}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className="ml-2 text-green-600 font-medium">
                    {businessInfo ? 'Configured' : 'Not Configured'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Balance & History View - UPDATED table format with bill numbers and bigger balance font */}
        {currentView === 'balance' && userType === 'owner' && (
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <h2 className="text-lg sm:text-2xl font-bold mb-3">Customer Balance & History</h2>

            {/* Business Information Display */}
            <BusinessInfoDisplay
              businessInfo={businessInfo}
              onUpdate={handleBusinessInfoUpdate}
              businessId={businessId}
            />

            {/* Customer Selection and Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Customer
                </label>
                <select
                  value={balanceCustomer}
                  onChange={(e) => setBalanceCustomer(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose Customer</option>
                  {customers.map((customer, index) => (
                    <option key={index} value={customer.name}>{customer.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={getCustomerHistory}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Get History
                </button>
              </div>
            </div>

            {/* Current Balance - UPDATED with bigger font and last billed date */}
            {balanceCustomer && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <h3 className="text-lg font-semibold">
                  {balanceCustomer} - Current Balance:
                  <span className="text-red-600 ml-2 text-2xl font-bold">
                    ₹{getCustomerBalance(balanceCustomer).toFixed(2)}
                  </span>
                </h3>
                {getLastBilledDate(balanceCustomer) && (
                  <p className="text-sm text-gray-600 mt-1">
                    Last Billed: {formatDate(getLastBilledDate(balanceCustomer))}
                  </p>
                )}
              </div>
            )}

            {/* Customer History - UPDATED table format with formatted dates and action buttons */}
            {customerHistory.length > 0 && (
              <div className="space-y-4">
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    onClick={printHistory}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center"
                  >
                    <Printer className="mr-1 h-4 w-4" />
                    Print History
                  </button>
                  <button
                    onClick={sendHistoryToWhatsApp}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center"
                  >
                    <MessageCircle className="mr-1 h-4 w-4" />
                    WhatsApp
                  </button>
                  <button
                    onClick={downloadHistory}
                    className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center"
                  >
                    <FileText className="mr-1 h-4 w-4" />
                    Download
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-left">Date</th>
                        <th className="border border-gray-300 p-2 text-left">Bill No</th>
                        <th className="border border-gray-300 p-2 text-left">Items</th>
                        <th className="border border-gray-300 p-2 text-left">Rate</th>
                        <th className="border border-gray-300 p-2 text-right">Purchase</th>
                        <th className="border border-gray-300 p-2 text-right">Paid</th>
                        <th className="border border-gray-300 p-2 text-right">Total Balance</th>
                        <th className="border border-gray-300 p-2 text-left">Payment Mode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerHistory.map((bill, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2">{formatDate(bill.date)}</td>
                          <td className="border border-gray-300 p-2 font-mono">{bill.billNumber || 'N/A'}</td>
                          <td className="border border-gray-300 p-2">
                            {bill.items.map((item, idx) => (
                              <div key={idx} className="text-sm">
                                {item.item} - {item.weight}kg
                              </div>
                            ))}
                          </td>
                          <td className="border border-gray-300 p-2">
                            {bill.items.map((item, idx) => (
                              <div key={idx} className="text-sm">
                                ₹{item.rate}/kg
                              </div>
                            ))}
                          </td>
                          <td className="border border-gray-300 p-2 text-right">
                            ₹{bill.items.reduce((sum, item) => sum + (parseFloat(item.weight) * parseFloat(item.rate)), 0).toFixed(2)}
                          </td>
                          <td className="border border-gray-300 p-2 text-right text-lg font-bold text-green-600">₹{bill.paidAmount.toFixed(2)}</td>
                          <td className="border border-gray-300 p-2 text-right text-lg font-bold">₹{bill.balanceAmount.toFixed(2)}</td>
                          <td className="border border-gray-300 p-2">
                            {bill.paymentMethod === 'cash' ? 'Cash' :
                              bill.paymentMethod === 'upi' ? `UPI - ${bill.upiType}` :
                                bill.paymentMethod === 'cash_gpay' ? `Cash + GPay` :
                                  `Check/DD - ${bill.bankName}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sales Dashboard View */}
        {currentView === 'dashboard' && userType === 'owner' && (
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <SalesDashboard
              bills={bills}
              customers={customers}
              businessId={businessId}
            />
          </div>
        )}

        {/* Purchase Page View */}
        {currentView === 'purchase' && userType === 'owner' && (
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <h2 className="text-lg sm:text-2xl font-bold mb-3">Purchases</h2>
            <PurchasePage businessId={businessId} />
          </div>
        )}

        {/* Salary Page View */}
        {currentView === 'salary' && userType === 'owner' && (
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <h2 className="text-lg sm:text-2xl font-bold mb-3">Salary</h2>
            <ErrorBoundary>
              <SalaryPage businessId={businessId} />
            </ErrorBoundary>
          </div>
        )}

        {/* QR Settings View */}
        {currentView === 'qr-settings' && (
          <QRSettings businessId={businessId} />
        )}

        {/* Bill Customization View */}
        {currentView === 'bill-customization' && (
          <BillCustomization businessId={businessId} />
        )}

        {/* Shop Registration Modal */}
        {showShopRegistration && (
          <ShopRegistration
            onComplete={handleShopRegistrationComplete}
            onCancel={handleShopRegistrationCancel}
            businessId={businessId}
          />
        )}

        {/* Business Information Capture Modal */}
        {showBusinessInfoCapture && (
          <BusinessInfoCapture
            onComplete={handleBusinessInfoComplete}
            onCancel={handleBusinessInfoCancel}
            businessId={businessId}
          />
        )}
      </div>
    </div>
  );
};

export default Index;

