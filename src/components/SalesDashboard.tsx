
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, Users, Wallet, CreditCard, Smartphone, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SalesDashboardProps {
  bills: any[];
  customers: any[];
  businessId: string;
}

type ProfitPeriod = 'daily' | 'weekly' | 'monthly';

const SalesDashboard: React.FC<SalesDashboardProps> = ({ bills, customers, businessId }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [productSales, setProductSales] = useState<any[]>([]);
  const [customerSales, setCustomerSales] = useState<any[]>([]);
  const [remainingQuantity, setRemainingQuantity] = useState(0);
  const [todayStats, setTodayStats] = useState({
    totalSales: 0,
    cashAmount: 0,
    upiAmount: 0,
    checkAmount: 0
  });
  const [profitPeriod, setProfitPeriod] = useState<ProfitPeriod>('daily');
  const [purchases, setPurchases] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<any[]>([]);

  useEffect(() => {
    calculateSalesData();
    fetchRemainingQuantity();
  }, [bills, selectedDate]);

  useEffect(() => {
    const load = async () => {
      const [{ data: pur }, { data: sal }] = await Promise.all([
        supabase
          .from('purchases')
          .select('purchase_date, quantity_kg, price_per_kg')
          .eq('business_id', businessId),
        supabase
          .from('salaries')
          .select('salary_date, amount')
          .eq('business_id', businessId)
      ]);
      setPurchases(pur || []);
      setSalaries(sal || []);
    };
    load();
  }, [businessId]);

  const fetchRemainingQuantity = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('chicken_stock_kg')
        .eq('business_id', businessId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setRemainingQuantity((data as any)?.chicken_stock_kg || 0);
    } catch (error) {
      console.error('Error fetching remaining quantity:', error);
    }
  };

  const calculateSalesData = () => {
    const todayBills = bills.filter(bill => bill.date === selectedDate);
    
    // Calculate product-wise sales
    const productMap = new Map();
    todayBills.forEach(bill => {
      bill.items.forEach((item: any) => {
        if (productMap.has(item.item)) {
          const existing = productMap.get(item.item);
          productMap.set(item.item, {
            name: item.item,
            sales: existing.sales + item.amount,
            quantity: existing.quantity + parseFloat(item.weight || '0')
          });
        } else {
          productMap.set(item.item, {
            name: item.item,
            sales: item.amount,
            quantity: parseFloat(item.weight || '0')
          });
        }
      });
    });
    setProductSales(Array.from(productMap.values()));

    // Calculate customer-wise sales
    const customerMap = new Map();
    todayBills.forEach(bill => {
      if (customerMap.has(bill.customer)) {
        customerMap.set(bill.customer, customerMap.get(bill.customer) + bill.totalAmount);
      } else {
        customerMap.set(bill.customer, bill.totalAmount);
      }
    });
    const customerSalesData = Array.from(customerMap.entries()).map(([name, amount]) => ({
      name,
      amount: amount as number
    }));
    setCustomerSales(customerSalesData);

    // Calculate payment method totals
    let cash = 0, upi = 0, check = 0;
    todayBills.forEach(bill => {
      if (bill.paymentMethod === 'cash') {
        cash += bill.paidAmount;
      } else if (bill.paymentMethod === 'upi') {
        upi += bill.paidAmount;
      } else if (bill.paymentMethod === 'check') {
        check += bill.paidAmount;
      }
    });

    setTodayStats({
      totalSales: todayBills.reduce((sum, bill) => sum + bill.totalAmount, 0),
      cashAmount: cash,
      upiAmount: upi,
      checkAmount: check
    });
  };

  const profitSummary = useMemo(() => {
    const today = new Date(selectedDate);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const inRange = (dStr: string) => {
      const d = new Date(dStr);
      if (profitPeriod === 'daily') return d.toDateString() === today.toDateString();
      if (profitPeriod === 'weekly') return d >= startOfWeek && d <= today;
      return d >= startOfMonth && d <= today;
    };

    const billsInRange = bills.filter(b => inRange(b.date));
    const salesKg = billsInRange.reduce((sum, b) => sum + b.items.reduce((s: number, i: any) => s + (parseFloat(i.weight || '0') || 0), 0), 0);
    const salesAmt = billsInRange.reduce((sum, b) => sum + b.totalAmount, 0);

    const purchasesInRange = purchases.filter(p => inRange(p.purchase_date));
    const purchaseKg = purchasesInRange.reduce((s, p) => s + (parseFloat(p.quantity_kg) || 0), 0);
    const purchaseAmt = purchasesInRange.reduce((s, p) => s + ((parseFloat(p.quantity_kg) || 0) * (parseFloat(p.price_per_kg) || 0)), 0);

    const salariesInRange = salaries.filter(s => inRange(s.salary_date));
    const salaryAmt = salariesInRange.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

    const profit = salesAmt - purchaseAmt - salaryAmt;
    const remainingStock = purchaseKg - salesKg;
    return { salesKg, salesAmt, purchaseKg, purchaseAmt, salaryAmt, profit, remainingStock };
  }, [bills, purchases, salaries, profitPeriod, selectedDate]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Sales Dashboard</h2>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Today's Stats Cards - UPDATED to include remaining quantity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Sales</p>
              <p className="text-2xl font-bold">₹{todayStats.totalSales.toFixed(2)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Cash</p>
              <p className="text-2xl font-bold">₹{todayStats.cashAmount.toFixed(2)}</p>
            </div>
            <Wallet className="h-8 w-8 text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">UPI</p>
              <p className="text-2xl font-bold">₹{todayStats.upiAmount.toFixed(2)}</p>
            </div>
            <Smartphone className="h-8 w-8 text-purple-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Check/DD</p>
              <p className="text-2xl font-bold">₹{todayStats.checkAmount.toFixed(2)}</p>
            </div>
            <CreditCard className="h-8 w-8 text-orange-200" />
          </div>
        </div>
        
        {/* NEW - Remaining Quantity Card */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Stock Remaining</p>
              <p className="text-2xl font-bold">{remainingQuantity.toFixed(2)} kg</p>
            </div>
            <Package className="h-8 w-8 text-red-200" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Sales Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Product-wise Sales</h3>
          {productSales.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productSales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value}`, 'Sales']} />
                <Legend />
                <Bar dataKey="sales" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No product sales data for selected date
            </div>
          )}
        </div>

        {/* Customer Sales Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Customer-wise Sales</h3>
          {customerSales.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={customerSales}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ₹${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {customerSales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₹${value}`, 'Sales']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No customer sales data for selected date
            </div>
          )}
        </div>
      </div>

      {/* Profit Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Profit</h3>
          <div className="flex gap-2">
            {(['daily','weekly','monthly'] as ProfitPeriod[]).map(p => (
              <button
                key={p}
                onClick={() => setProfitPeriod(p)}
                className={`px-3 py-1 rounded ${profitPeriod===p? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                {p[0].toUpperCase()+p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded border">
            <div className="text-sm text-blue-800">Sales (KG)</div>
            <div className="text-2xl font-bold text-blue-900">{profitSummary.salesKg.toFixed(2)}</div>
          </div>
          <div className="bg-green-50 p-4 rounded border">
            <div className="text-sm text-green-800">Purchase (KG)</div>
            <div className="text-2xl font-bold text-green-900">{profitSummary.purchaseKg.toFixed(2)}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded border">
            <div className="text-sm text-purple-800">Remaining Stock (KG)</div>
            <div className="text-2xl font-bold text-purple-900">{profitSummary.remainingStock.toFixed(2)}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-yellow-50 p-4 rounded border">
            <div className="text-sm text-yellow-800">Sales Amount</div>
            <div className="text-2xl font-bold text-yellow-900">₹{profitSummary.salesAmt.toFixed(2)}</div>
          </div>
          <div className="bg-red-50 p-4 rounded border">
            <div className="text-sm text-red-800">Purchase Amount</div>
            <div className="text-2xl font-bold text-red-900">₹{profitSummary.purchaseAmt.toFixed(2)}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded border">
            <div className="text-sm text-gray-800">Salary</div>
            <div className="text-2xl font-bold text-gray-900">₹{profitSummary.salaryAmt.toFixed(2)}</div>
          </div>
        </div>
        <div className="mt-4 bg-emerald-50 p-4 rounded border border-emerald-200">
          <div className="text-sm text-emerald-800">Profit</div>
          <div className="text-3xl font-bold text-emerald-900">₹{profitSummary.profit.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
