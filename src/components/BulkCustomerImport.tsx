import React, { useState } from 'react';
import { Upload, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';

interface Customer {
  name: string;
  phone: string;
  balance: number;
}

interface ImportResult {
  successful: Customer[];
  skipped: { customer: Customer; reason: string }[];
  errors: { customer: Customer; error: string }[];
}

interface BulkCustomerImportProps {
  existingCustomers: Customer[];
  onBulkImport: (customers: Customer[]) => Promise<void>;
  businessId: string;
}

const BulkCustomerImport: React.FC<BulkCustomerImportProps> = ({
  existingCustomers,
  onBulkImport,
  businessId
}) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [parsedCustomers, setParsedCustomers] = useState<Customer[]>([]);

  // Santhosh Chicken customer data from the report
  const santhoshCustomerData = `1. Aalaya
Phone: 91762 02011
Current Balance: ₹17449.50

2. A k Babu
Phone: 94444 09068
Current Balance: ₹18658.80

3. Akbar Basha
Phone: 8973842463
Current Balance: ₹2692.00

4. Akthar
Phone: 93441 57553
Current Balance: ₹102780.75

5. Alfah chicken kifayath
Phone: 99529 40220
Current Balance: ₹16497.95

6. Alfah chicken salman
Phone: 96005 59642
Current Balance: ₹18438.60

7. Arun catering 
Phone: 95513 90448
Current Balance: ₹14286.00

8. Ashu Mutton 
Phone: 9551913427
Current Balance: ₹5313.00

9. Babu Bai
Phone: 8428426880
Current Balance: ₹12716.70

10. Bhaskaran P S
Phone: 9444135199
Current Balance: ₹1300.00

11. Bismillah 
Phone: 98418 01215
Current Balance: ₹4781.30

12. cash
Phone: 7200226930
Current Balance: ₹0.00

13. Fathima Fast Food 
Phone: 9025894584
Current Balance: ₹6969.95

14. Haseen Basha
Phone: 73582 23347
Current Balance: ₹3784.95

15. Hussain catering 
Phone: 9600060849
Current Balance: ₹852.00

16. Iqbal
Phone: 95660 19923
Current Balance: ₹267220.75

17. Jagadish 
Phone: 122
Current Balance: ₹74085.20

18. Kanagaraj chicken 
Phone: 8438359480
Current Balance: ₹1584.00

19. Kani
Phone: 1234
Current Balance: ₹10711.70

20. Karthik 
Phone: 99402 26054
Current Balance: ₹4470.00

21. Kumar 
Phone: 9042761802
Current Balance: ₹8820.00

22. Madasamy 
Phone: 123
Current Balance: ₹14988.90

23. Madras chicken 
Phone: 98416 86614
Current Balance: ₹5475.25

24. Malik 
Phone: 9884940496
Current Balance: ₹5.20

25. Mani Indane Gas 
Phone: 9791110090
Current Balance: ₹6007.00

26. Masthan 
Phone: 99625 47873
Current Balance: ₹24420.95

27. Mohd lliyas
Phone: 82483 04955
Current Balance: ₹760057.50

28. Nirmala Shishu bhavan 
Phone: 8015006702
Current Balance: ₹1200.00

29. Queen fast food 
Phone: 88384 89836
Current Balance: ₹2215.40

30. Rabbani
Phone: 96298 70093
Current Balance: ₹6891.40

31. Rahim
Phone: 99627 86222
Current Balance: ₹21045.40

32. Ramesh
Phone: 98403 04610
Current Balance: ₹16661.90

33. Razack
Phone: 90807 25323
Current Balance: ₹5135.00

34. R J Bismi
Phone: 0123
Current Balance: ₹8861.60

35. Ruban briyani 
Phone: 9884124794
Current Balance: ₹3550.00

36. Salman 
Phone: 90802 66337
Current Balance: ₹3187.50

37. Sana briyani 
Phone: 98418 27273
Current Balance: ₹52820.70

38. Sangeeta Catering 
Phone: 79049 01697
Current Balance: ₹0.00

39. Santhosh VOC
Phone: 9566155289
Current Balance: ₹61990.30

40. Siva-Sudhakar
Phone: 9941925345
Current Balance: ₹222.10

41. Sridhar catering 
Phone: 6381798127
Current Balance: ₹5264.00

42. Srinivasan
Phone: 93811 02861
Current Balance: ₹19694.00

43. Sudhakar V J
Phone: 9080921690
Current Balance: ₹3994.00

44. Vasim
Phone: 102
Current Balance: ₹709.00

45. Venkatesh 
Phone: 98416 84484
Current Balance: ₹52240.70

46. Venkatesh catering 
Phone: 12345
Current Balance: ₹2385.00

47. Viji PTC
Phone: 7708811467
Current Balance: ₹120.00

48. Yousuf 
Phone: 9444417243
Current Balance: ₹-0.20`;

  const parseCustomerData = () => {
    const lines = santhoshCustomerData.split('\n');
    const customers: Customer[] = [];
    
    let currentCustomer: Partial<Customer> = {};
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) continue;
      
      // Customer name line (starts with number)
      if (/^\d+\./.test(trimmedLine)) {
        // Save previous customer if complete
        if (currentCustomer.name && currentCustomer.phone && currentCustomer.balance !== undefined) {
          customers.push(currentCustomer as Customer);
        }
        
        // Start new customer
        const name = trimmedLine.replace(/^\d+\.\s*/, '').trim();
        currentCustomer = { name };
      }
      
      // Phone line
      if (trimmedLine.startsWith('Phone:')) {
        const phone = trimmedLine.replace('Phone:', '').trim().replace(/\s+/g, '');
        // Validate phone number (should be meaningful, not test numbers like 123, 102, etc.)
        if (phone && phone.length >= 10 && !['123', '122', '1234', '12345', '0123', '102'].includes(phone)) {
          currentCustomer.phone = phone;
        }
      }
      
      // Balance line
      if (trimmedLine.startsWith('Current Balance:')) {
        const balanceStr = trimmedLine.replace('Current Balance:', '').replace('₹', '').replace(/,/g, '').trim();
        const balance = parseFloat(balanceStr);
        if (!isNaN(balance)) {
          currentCustomer.balance = balance;
        }
      }
    }
    
    // Add last customer
    if (currentCustomer.name && currentCustomer.phone && currentCustomer.balance !== undefined) {
      customers.push(currentCustomer as Customer);
    }
    
    // Filter out customers without valid phone numbers
    const validCustomers = customers.filter(c => 
      c.phone && c.phone.length >= 10 && !['123', '122', '1234', '12345', '0123', '102'].includes(c.phone)
    );
    
    setParsedCustomers(validCustomers);
    setShowPreview(true);
  };

  const validateAndImportCustomers = async () => {
    setIsImporting(true);
    
    const result: ImportResult = {
      successful: [],
      skipped: [],
      errors: []
    };
    
    const customersToImport: Customer[] = [];
    
    for (const customer of parsedCustomers) {
      // Check for duplicates by name
      const existingByName = existingCustomers.find(c => 
        c.name.toLowerCase() === customer.name.toLowerCase()
      );
      
      // Check for duplicates by phone
      const existingByPhone = existingCustomers.find(c => 
        c.phone === customer.phone
      );
      
      if (existingByName) {
        result.skipped.push({
          customer,
          reason: `Customer with name "${customer.name}" already exists`
        });
        continue;
      }
      
      if (existingByPhone) {
        result.skipped.push({
          customer,
          reason: `Customer with phone "${customer.phone}" already exists`
        });
        continue;
      }
      
      // Validate data
      if (!customer.name.trim()) {
        result.errors.push({
          customer,
          error: 'Customer name is required'
        });
        continue;
      }
      
      if (!customer.phone.trim()) {
        result.errors.push({
          customer,
          error: 'Phone number is required'
        });
        continue;
      }
      
      customersToImport.push(customer);
    }
    
    // Import customers in batches
    const batchSize = 10;
    for (let i = 0; i < customersToImport.length; i += batchSize) {
      const batch = customersToImport.slice(i, i + batchSize);
      
      for (const customer of batch) {
        try {
          await onBulkImport([customer]);
          result.successful.push(customer);
        } catch (error) {
          result.errors.push({
            customer,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      // Small delay between batches
      if (i + batchSize < customersToImport.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    setImportResult(result);
    setIsImporting(false);
  };

  const downloadSummaryReport = () => {
    if (!importResult) return;
    
    const report = `SANTHOSH CHICKEN - BULK IMPORT SUMMARY
Generated on: ${new Date().toLocaleString()}
Business ID: ${businessId}

IMPORT STATISTICS:
==================
Total Customers Processed: ${parsedCustomers.length}
Successfully Imported: ${importResult.successful.length}
Skipped (Duplicates): ${importResult.skipped.length}
Errors: ${importResult.errors.length}

SUCCESSFULLY IMPORTED:
=====================
${importResult.successful.map((c, i) => `${i + 1}. ${c.name} - ${c.phone} - ₹${c.balance.toFixed(2)}`).join('\n')}

SKIPPED CUSTOMERS:
==================
${importResult.skipped.map((item, i) => `${i + 1}. ${item.customer.name} - ${item.reason}`).join('\n')}

ERRORS:
=======
${importResult.errors.map((item, i) => `${i + 1}. ${item.customer.name} - ${item.error}`).join('\n')}
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `santhosh-chicken-import-summary-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4 text-blue-800">Bulk Customer Import - Santhosh Chicken Data</h3>
        <p className="text-gray-700 mb-4">
          Import comprehensive customer data from the Santhosh Chicken report (56 customers total).
          The system will automatically validate and prevent duplicates.
        </p>
        
        {!showPreview && !importResult && (
          <button
            onClick={parseCustomerData}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Upload className="inline mr-2 h-5 w-5" />
            Parse Customer Data
          </button>
        )}
      </div>

      {showPreview && !importResult && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-4">Data Preview ({parsedCustomers.length} customers found)</h4>
          
          <div className="max-h-64 overflow-y-auto mb-4">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">Name</th>
                  <th className="border border-gray-300 p-2 text-left">Phone</th>
                  <th className="border border-gray-300 p-2 text-left">Balance</th>
                </tr>
              </thead>
              <tbody>
                {parsedCustomers.slice(0, 10).map((customer, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2">{customer.name}</td>
                    <td className="border border-gray-300 p-2">{customer.phone}</td>
                    <td className="border border-gray-300 p-2">₹{customer.balance.toFixed(2)}</td>
                  </tr>
                ))}
                {parsedCustomers.length > 10 && (
                  <tr>
                    <td colSpan={3} className="border border-gray-300 p-2 text-center text-gray-500">
                      ... and {parsedCustomers.length - 10} more customers
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={validateAndImportCustomers}
              disabled={isImporting}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isImporting ? (
                <>
                  <div className="inline mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Importing...
                </>
              ) : (
                <>
                  <CheckCircle className="inline mr-2 h-5 w-5" />
                  Import Customers
                </>
              )}
            </button>
            
            <button
              onClick={() => {
                setShowPreview(false);
                setParsedCustomers([]);
              }}
              disabled={isImporting}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {importResult && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-4">Import Results</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                <div>
                  <div className="font-semibold text-green-800">Successfully Imported</div>
                  <div className="text-2xl font-bold text-green-600">{importResult.successful.length}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-6 w-6 text-yellow-600 mr-2" />
                <div>
                  <div className="font-semibold text-yellow-800">Skipped (Duplicates)</div>
                  <div className="text-2xl font-bold text-yellow-600">{importResult.skipped.length}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <XCircle className="h-6 w-6 text-red-600 mr-2" />
                <div>
                  <div className="font-semibold text-red-800">Errors</div>
                  <div className="text-2xl font-bold text-red-600">{importResult.errors.length}</div>
                </div>
              </div>
            </div>
          </div>
          
          {importResult.skipped.length > 0 && (
            <div className="mb-4">
              <h5 className="font-semibold text-yellow-800 mb-2">Skipped Customers:</h5>
              <div className="max-h-32 overflow-y-auto">
                {importResult.skipped.map((item, index) => (
                  <div key={index} className="text-sm text-yellow-700 mb-1">
                    • {item.customer.name} - {item.reason}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {importResult.errors.length > 0 && (
            <div className="mb-4">
              <h5 className="font-semibold text-red-800 mb-2">Import Errors:</h5>
              <div className="max-h-32 overflow-y-auto">
                {importResult.errors.map((item, index) => (
                  <div key={index} className="text-sm text-red-700 mb-1">
                    • {item.customer.name} - {item.error}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-4">
            <button
              onClick={downloadSummaryReport}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Download className="inline mr-2 h-5 w-5" />
              Download Summary Report
            </button>
            
            <button
              onClick={() => {
                setImportResult(null);
                setShowPreview(false);
                setParsedCustomers([]);
              }}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
            >
              Start New Import
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkCustomerImport;