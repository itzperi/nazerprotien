export interface PrinterDevice {
  id: string;
  name: string;
  type: 'bluetooth' | 'network' | 'system';
  connected: boolean;
}

class PrinterService {
  private connectedDevice: any = null;
  private characteristic: any = null;

  public isConnected(): boolean {
    return !!this.characteristic;
  }

  /**
   * Detect available Bluetooth Thermal Printers using Web Bluetooth API
   */
  async scanBluetoothPrinters(): Promise<PrinterDevice[]> {
    const navigatorAny = navigator as any;
    if (!navigatorAny.bluetooth) {
      console.error('Web Bluetooth is not supported in this browser.');
      return [];
    }

    try {
      const device = await navigatorAny.bluetooth.requestDevice({
        filters: [
          { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Common thermal printer service
          { namePrefix: 'TP' },
          { namePrefix: 'MPT' },
          { namePrefix: 'Printer' }
        ],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });

      return [{
        id: device.id,
        name: device.name || 'Unknown Printer',
        type: 'bluetooth',
        connected: false
      }];
    } catch (error) {
      console.log('User cancelled or connection failed:', error);
      return [];
    }
  }

  /**
   * Connect to a specific Bluetooth device
   */
  async connect(deviceId: string): Promise<boolean> {
    try {
      // requestDevice must be triggered by user gesture, so this usually happens in scan.
      // For this simplified service, we assume the device was just picked.
      if (!this.connectedDevice) return false;

      const server = await this.connectedDevice.gatt?.connect();
      const service = await server?.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const characteristics = await service?.getCharacteristics();

      // Look for write characteristic
      this.characteristic = characteristics?.find(c => c.properties.write || c.properties.writeWithoutResponse) || null;

      return !!this.characteristic;
    } catch (error) {
      console.error('Failed to connect to printer:', error);
      return false;
    }
  }

  /**
   * Print raw text to the connected thermal printer
   */
  async printRaw(content: string): Promise<void> {
    if (!this.characteristic) {
      // Fallback to system print if no bluetooth printer is connected
      this.printViaSystem(content);
      return;
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(content + '\n\n\n'); // Add some padding for manual tearing
    await this.characteristic.writeValue(data);
  }

  /**
   * Standard system print fallback with bold formatting and QR code support
   */
  async printViaSystem(content: string, title: string = 'Bill', qrCodeDataUrl?: string, amount?: number): Promise<void> {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please disable popup blocker to print.');
      return;
    }

    // Process content to apply bold formatting to key fields
    const processedContent = content
      .split('\n')
      .map((line, index) => {
        // Shop name (usually first line)
        if (index === 0 && line.trim().length > 0) {
          return `<b>${line}</b>`;
        }
        // GST number
        if (line.includes('GST:')) {
          return line.replace(/(GST:.+)/g, '<b>$1</b>');
        }
        // Bill number
        if (line.includes('Bill No:')) {
          return line.replace(/(Bill No:.+)/g, '<b>$1</b>');
        }
        // Customer name
        if (line.startsWith('Customer:')) {
          return line.replace(/(Customer:.+)/g, '<b>$1</b>');
        }
        // Total amounts and balance
        if (line.includes('Total Bill Amount:') || line.includes('Total Amount:') || line.includes('New Balance:') || line.includes('Balance Amount:') || line.includes('Payment Amount:')) {
          return `<b>${line}</b>`;
        }
        return line;
      })
      .join('\n');

    // Create QR code section if provided
    const qrCodeSection = qrCodeDataUrl ? `
      <div style="text-align: center; margin-top: 20px; border-top: 1px dashed #ccc; padding-top: 15px;">
        <img id="qr-img" src="${qrCodeDataUrl}" alt="QR Code" style="width: 150px; height: 150px;" />
        <p style="margin-top: 8px; font-size: 14px; font-weight: bold;">Scan to Pay</p>
        ${amount !== undefined ? `<p style="margin-top: 4px; font-size: 18px; font-weight: bold; background-color: #f0f0f0; padding: 4px; display: inline-block; border-radius: 4px;">Amount: ₹${amount.toFixed(2)}</p>` : ''}
      </div>
    ` : '';

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
            body { 
              font-family: 'Roboto', sans-serif; 
              font-weight: 400;
              padding: 20px; 
              line-height: 1.4;
              margin: 0;
            }
            pre { 
              white-space: pre-wrap; 
              font-size: 14px;
              margin: 0;
              font-family: 'Roboto', sans-serif;
              font-weight: 400;
            }
            b {
              font-weight: 700;
            }
            @media print {
              body { padding: 10px; }
              pre { font-size: 12px; }
              b { font-weight: 700; }
            }
          </style>
        </head>
        <body>
          <pre>${processedContent}</pre>
          ${qrCodeSection}
          <script>
            window.onload = function() {
              var doPrint = function() {
                setTimeout(function() {
                  window.print();
                  // Close after printing on mobile for better UX
                  if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
                     // Mobile browsers handle window closure differently after print
                  }
                }, 100);
              };

              var qrImg = document.getElementById('qr-img');
              if (qrImg && !qrImg.complete) {
                qrImg.onload = doPrint;
                qrImg.onerror = doPrint;
                // Fallback timeout in case image takes too long to load
                setTimeout(doPrint, 3000); 
              } else {
                doPrint();
              }
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
}

export const printerService = new PrinterService();
