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
  
  customerName?: string;
  customerPhone?: string;

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

export const generateESCPOSReceipt = (data: BillData, options: { isPlainText?: boolean, templateConfig?: any } = {}): string => {
  const { isPlainText, templateConfig } = options;
  const e = templateConfig?.elements || {};

  let buffer = '';

  const initCmd = isPlainText ? '' : INIT;
  const alignLeftCmd = isPlainText ? '' : ALIGN_LEFT;
  const alignCenterCmd = isPlainText ? '' : ALIGN_CENTER;
  const alignRightCmd = isPlainText ? '' : ALIGN_RIGHT;
  const boldOnCmd = isPlainText ? '' : BOLD_ON;
  const boldOffCmd = isPlainText ? '' : BOLD_OFF;
  const cutCmd = isPlainText ? '' : CUT;

  // Helper to append text with newline
  const line = (text: string = '') => {
    buffer += text + LF;
  };

  // Helper to center text
  const center = (text: string) => {
    if (isPlainText) {
      const padLen = Math.max(0, Math.floor((WIDTH - text.length) / 2));
      buffer += ' '.repeat(padLen) + text.toUpperCase() + LF;
    } else {
      buffer += alignCenterCmd + text.toUpperCase() + LF;
    }
  };

  // Helper for left align text
  const left = (text: string) => {
    if (isPlainText) {
      buffer += text + LF;
    } else {
      buffer += alignLeftCmd + text + LF;
    }
  };

  // Initialization
  buffer += initCmd;

  // HEADER SECTION
  if (e.shopName?.visible !== false && data.shopName) center(data.shopName);
  if (e.address1?.visible !== false && data.shopAddressLine1) center(data.shopAddressLine1);

  const addrLine2 = [data.shopAddressLine2, data.shopCity].filter(Boolean).join(', ');
  if (e.address2?.visible !== false && addrLine2) center(addrLine2);

  if (e.phone?.visible !== false && data.shopPhone1) center('PH: ' + data.shopPhone1);

  if (data.branchName) {
    center(data.branchName);
    if (data.branchAddress) center(data.branchAddress);
    if (data.shopPhone2) center('PH: ' + data.shopPhone2);
  } else {
    // If no branch, maybe print phone2 here? The prompt says "If branch exists: BRANCH_NAME... SHOP_PHONE_2"
    // Let's stick to the prompt strictly.
    if (data.shopPhone2) center('PH: ' + data.shopPhone2);
  }

  line(); // Blank line

  // BILL TYPE
  if (e.billType?.visible !== false) {
    center(e.billType?.customText || 'CREDIT BILL');
    line();
  }

  // BILL INFO SECTION (Left Aligned)
  buffer += alignLeftCmd;

  const pad = (str: string, len: number) => str.padEnd(len);
  const padLeft = (str: string, len: number) => str.padStart(len);

  if (data.customerName) {
    line(`Customer: ${data.customerName}`);
  }
  if (data.customerPhone) {
    line(`Phone   : ${data.customerPhone}`);
  }

  if (e.billNoDate?.visible !== false) {
    // Row 1
    let row1 = `Bill No : ${pad(data.billNumber, 15)} Date : ${data.billDate}`;
    line(row1);
  }

  if (e.cashierTime?.visible !== false) {
    // Row 2: Cashier : {cashier_name}       Time : HH:MM AM/PM
    let row2 = `Cashier : ${pad(data.cashierName, 15)} Time : ${data.billTime}`;
    line(row2);
  }

  line(); // Separator implied? Usually standard. But prompt implies specific format.

  // Define column widths
  const col1 = 18; // Description
  const col2 = 8;  // Qty
  const col3 = 10;  // Rate
  const col4 = 12; // Amount

  if (e.headers?.visible !== false) {
    const header =
      pad("Description", col1) +
      padLeft("Qty", col2) +
      padLeft("Rate", col3) +
      padLeft("Amount", col4);

    line(header);
    line('-'.repeat(48));
  } else {
    line('-'.repeat(48));
  }

  if (e.items?.visible !== false) {
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
  }

  line('-'.repeat(48));

  const printTotalRow = (label: string, value: string, bold: boolean = false) => {
    let text = pad(label, 15) + " : " + padLeft(value, 10);
    if (bold && !isPlainText) {
      buffer += boldOnCmd + text + boldOffCmd + LF;
    } else {
      line(text);
    }
  };

  if (e.grossAmt?.visible !== false) printTotalRow("Gross Amount", formatCurrency(data.grossAmount));
  if (e.coinage?.visible !== false) printTotalRow("Coinage", formatCurrency(data.coinage));
  if (e.netAmt?.visible !== false) {
    printTotalRow("Net Amount", formatCurrency(data.netAmount), true);
  }

  line();

  if (e.balances?.visible !== false) {
    line(`No.Of.Items     ${data.totalItemsCount}`);
    line(`Total Qty       ${formatQty(data.totalQuantity)}`);
    line();

    printTotalRow("Opening Balance", formatCurrency(data.openingBalance));
    printTotalRow("Bill Amount", formatCurrency(data.billAmount));
    printTotalRow("Paid Amount", formatCurrency(data.paidAmount));
    printTotalRow("Closing Balance", formatCurrency(data.closingBalance));

    line();
  }

  // FOOTER
  if (e.footer1?.visible !== false) center(data.footerMessage1 || 'Thank You!! Visit Again!!');
  if (e.footer2?.visible !== false) center(data.footerMessage2 || 'FRESH!! FRESH!!');

  line();
  line();

  return buffer;
};
