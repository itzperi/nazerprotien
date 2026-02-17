import React, { useState, useEffect } from 'react';
import { Printer, Bluetooth, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { printerService, PrinterDevice } from '@/lib/printer-service';
import { toast } from 'sonner';

interface PrinterSelectorProps {
    onPrinterSelected?: (device: PrinterDevice) => void;
}

const PrinterSelector: React.FC<PrinterSelectorProps> = ({ onPrinterSelected }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [printers, setPrinters] = useState<PrinterDevice[]>([]);
    const [activePrinter, setActivePrinter] = useState<PrinterDevice | null>(null);

    const handleScan = async () => {
        setIsScanning(true);
        try {
            const foundPrinters = await printerService.scanBluetoothPrinters();
            setPrinters(foundPrinters);
            if (foundPrinters.length === 0) {
                toast.info("No Bluetooth printers found. Using system printing as fallback.");
            }
        } catch (error) {
            toast.error("Bluetooth scan failed. Ensure Bluetooth is enabled.");
        } finally {
            setIsScanning(false);
        }
    };

    const handleSelect = async (printer: PrinterDevice) => {
        if (printer.type === 'bluetooth') {
            const success = await printerService.connect(printer.id);
            if (success) {
                setActivePrinter({ ...printer, connected: true });
                toast.success(`Connected to ${printer.name}`);
                if (onPrinterSelected) onPrinterSelected(printer);
            } else {
                toast.error(`Failed to connect to ${printer.name}`);
            }
        } else {
            setActivePrinter(printer);
            if (onPrinterSelected) onPrinterSelected(printer);
        }
    };

    return (
        <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Printer className="h-5 w-5 text-slate-600" />
                    <h3 className="font-semibold text-slate-900">Printer Connectivity</h3>
                </div>
                <Badge variant={activePrinter ? "default" : "secondary"}>
                    {activePrinter ? 'Ready' : 'Not Connected'}
                </Badge>
            </div>

            <div className="flex flex-col gap-2">
                {printers.length > 0 ? (
                    printers.map((printer) => (
                        <Button
                            key={printer.id}
                            variant={activePrinter?.id === printer.id ? "default" : "outline"}
                            className="justify-between"
                            onClick={() => handleSelect(printer)}
                        >
                            <div className="flex items-center gap-2">
                                <Bluetooth className="h-4 w-4" />
                                <span>{printer.name}</span>
                            </div>
                            {activePrinter?.id === printer.id && <CheckCircle2 className="h-4 w-4" />}
                        </Button>
                    ))
                ) : (
                    <p className="text-xs text-slate-500 italic">No printers detected yet.</p>
                )}
            </div>

            <Button
                onClick={handleScan}
                disabled={isScanning}
                variant="secondary"
                className="w-full gap-2"
            >
                <RefreshCw className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
                {isScanning ? 'Scanning...' : 'Scan for Printers'}
            </Button>

            <p className="text-[10px] text-slate-400 text-center">
                * Works with standard Bluetooth Thermal POS Printers
            </p>
        </div>
    );
};

export default PrinterSelector;
