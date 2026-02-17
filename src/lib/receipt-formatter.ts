export interface BillItem {
  name: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface BillData {
  shopName: string;
  shopAddressLine1: string;
  shopAddressLine2: string; // Combined with City usually
  shopCity: string;
  shopPhone1: string;
  shopPhone2?: string;
  branchName?: string;
  branchAddress?: string;

  billNumber: string;
  billDate: string; // DD/MM/YYYY
  billTime: string; // HH:MM AM/PM
  cashierName: string;

  items: BillItem[];

  grossAmount: number;
  coinage: number; // Rounding adjustment
  netAmount: number; // Final total

  totalItemsCount: number;
  totalQuantity: number;
  
  openingBalance: number;
  billAmount: number;
  paidAmount: number;
  closingBalance: number;

  footerMessage1?: string;
  footerMessage2?: string;
}

// Helper to format currency (though raw text requested, usually implies 2 decimal places)
const formatCurrency = (amount: number) => amount.toFixed(2);
const formatQty = (qty: number) => qty.toFixed(3);

// ESC/POS Commands
const ESC = '\x1B';
const GS = '\x1D';
const INIT = ESC + '@';
const ALIGN_LEFT = ESC + 'a' + '\x00';
const ALIGN_CENTER = ESC + 'a' + '\x01';
const ALIGN_RIGHT = ESC + 'a' + '\x02';
const BOLD_ON = ESC + 'E' + '\x01';
const BOLD_OFF = ESC + 'E' + '\x00';
const CUT = GS + 'V' + '\x41' + '\x00'; // Full cut
const LF = '\n';

// Constants for layout
const WIDTH = 48; // Assumed 48 chars for 80mm printer (Font A)

export const generateESCPOSReceipt = (data: BillData): string => {
  let buffer = '';

  // Helper to append text with newline
  const line = (text: string = '') => {
    buffer += text + LF;
  };

  // Helper to center text
  const center = (text: string) => {
    // If text is longer than width, just print it (or wrap could be implemented)
    // Simple centering by padding
    /* 
       Actually, ESC/POS has ALIGN_CENTER command. 
       The requirement says "Use ESC/POS commands for center alignment".
       So we emit the command, then the text.
    */
    buffer += ALIGN_CENTER + text.toUpperCase() + LF;
  };

  // Helper for left align text
  const left = (text: string) => {
    buffer += ALIGN_LEFT + text + LF;
  };

  // Initialization
  buffer += INIT;

  // HEADER SECTION
  if (data.shopName) center(data.shopName);
  if (data.shopAddressLine1) center(data.shopAddressLine1);
  
  const addrLine2 = [data.shopAddressLine2, data.shopCity].filter(Boolean).join(', ');
  if (addrLine2) center(addrLine2);
  
  if (data.shopPhone1) center('PH: ' + data.shopPhone1); // Prefix?

  if (data.branchName) {
    center(data.branchName);
    if (data.branchAddress) center(data.branchAddress);
    if (data.shopPhone2) center('PH: ' + data.shopPhone2);
  } else {
    // If no branch, maybe print phone2 here? The prompt says "If branch exists: BRANCH_NAME... SHOP_PHONE_2"
    // Let's stick to the prompt strictly.
  }

  line(); // Blank line
  center('CREDIT BILL');
  line();

  // BILL INFO SECTION (Left Aligned)
  buffer += ALIGN_LEFT;
  
  // Format: Bill No : {bill_number}        Date : DD/MM/YYYY
  // Fixed width spacing. Let's assume 48 columns.
  // "Bill No : " is 10 chars. 
  // "Date : " is 7 chars. 
  // We need to space them out.
  
  const pad = (str: string, len: number) => str.padEnd(len);
  const padLeft = (str: string, len: number) => str.padStart(len);

  // Row 1
  let row1 = `Bill No : ${pad(data.billNumber, 15)} Date : ${data.billDate}`;
  line(row1);

  // Row 2: Cashier : {cashier_name}       Time : HH:MM AM/PM
  let row2 = `Cashier : ${pad(data.cashierName, 15)} Time : ${data.billTime}`;
  line(row2);

  line(); // Separator implied? Usually standard. But prompt implies specific format.
  
  // ITEMS TABLE
  // Format: Description        Qty     Rate     Amount (Header)
  // ------------------------------------------------
  // ITEM NAME          0.000   0.00     0.00
  // ------------------------------------------------
  
  // Define column widths
  // Description: 20
  // Qty: 8
  // Rate: 9
  // Amount: 11
  // Total: 48
  
  const col1 = 18; // Description
  const col2 = 8;  // Qty
  const col3 = 10;  // Rate
  const col4 = 12; // Amount

  const header = 
    pad("Description", col1) + 
    padLeft("Qty", col2) + 
    padLeft("Rate", col3) + 
    padLeft("Amount", col4);
    
  line(header);
  line('-'.repeat(48));

  data.items.forEach(item => {
    // Truncate description if too long
    let desc = item.name.toUpperCase().substring(0, col1);
    
    let row = 
      pad(desc, col1) + 
      padLeft(formatQty(item.quantity), col2) + 
      padLeft(formatCurrency(item.rate), col3) + 
      padLeft(formatCurrency(item.amount), col4);
    
    line(row);
  });

  line('-'.repeat(48));

  // TOTALS SECTION
  // Format:
  // Gross Amount : 000.00
  // Coinage      : 000.00
  // Net Amount   : 000.00 (Bold)
  
  // Align values vertically. 
  // Label width: 15
  // Separator: " : " (3)
  // Value width: 10 (Right aligned)
  
  const printTotalRow = (label: string, value: string, bold: boolean = false) => {
    let text = pad(label, 15) + " : " + padLeft(value, 10);
    if (bold) {
      buffer += BOLD_ON + text + BOLD_OFF + LF;
    } else {
      line(text);
    }
  };

  printTotalRow("Gross Amount", formatCurrency(data.grossAmount));
  printTotalRow("Coinage", formatCurrency(data.coinage));
  printTotalRow("Net Amount", formatCurrency(data.netAmount), true);

  line();

  // ACCOUNT SUMMARY
  /*
    No.Of.Items     0
    Total Qty       0.00

    Opening Balance : 0.00
    Bill Amount     : 0.00
    Paid Amount     : 0.00
    Closing Balance : 0.00
  */
  
  // Two columns for first part? Or just list?
  // Format suggests: "No.Of.Items" (space) value
  
  line(`No.Of.Items     ${data.totalItemsCount}`);
  line(`Total Qty       ${formatQty(data.totalQuantity)}`);
  line();
  
  printTotalRow("Opening Balance", formatCurrency(data.openingBalance));
  printTotalRow("Bill Amount", formatCurrency(data.billAmount));
  printTotalRow("Paid Amount", formatCurrency(data.paidAmount));
  printTotalRow("Closing Balance", formatCurrency(data.closingBalance));

  line();

  // FOOTER
  center(data.footerMessage1 || 'Thank You!! Visit Again!!');
  center(data.footerMessage2 || 'FRESH!! FRESH!!');
  
  line();
  line();
  
  return buffer;
};
