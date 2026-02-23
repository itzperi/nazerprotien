import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Save, Layout, Type, Image as ImageIcon, Settings, Printer, Ruler, ZoomIn, ZoomOut, RotateCcw, Check, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { useBusinessInfo } from '../hooks/useBusinessInfo';

interface BillCustomizationProps {
    businessId: string;
}

// --- Types ---

type PaperWidth = '58mm' | '80mm' | '104mm' | 'custom';

interface PrinterConfig {
    paperWidth: PaperWidth;
    customWidthMm?: number;
    paperHeight: 'auto' | 'fixed';
    fixedHeightMm?: number;
    dpi: 203 | 300 | 600;
    marginLeft: number;
    marginRight: number;
    marginTop: number;
    marginBottom: number;
    fontSizeScaling: 'auto' | 'custom';
    customFontSizePt?: number;
}

interface TemplateElement {
    id: string;
    label: string;
    visible: boolean;
    bold: boolean;
    fontSize: number; // pt
    align: 'left' | 'center' | 'right';
    prefix?: string;
    suffix?: string;
    underline?: boolean;
    customText?: string; // For custom lines
}

interface CustomTextLine extends TemplateElement {
    position: 'above_header' | 'below_header' | 'above_items' | 'below_items' | 'above_totals' | 'below_totals' | 'above_footer' | 'below_footer';
}

interface BillTemplateConfig {
    templateId: string; // 't1', 't2', ... 't15'
    printer: PrinterConfig;
    elements: Record<string, TemplateElement>;
    customLines: CustomTextLine[];
    dividerStyle: 'solid' | 'dashed' | 'dotted' | 'stars' | 'double' | 'wave';
}

// --- Constants & Defaults ---

const TEMPLATES = Array.from({ length: 15 }, (_, i) => ({
    id: `t${i + 1}`,
    name: [
        "Classic Thermal", "Modern Bold", "Minimal Clean", "Double Border", "Star Divider",
        "Uppercase Heavy", "Left Aligned Pro", "Wide Spacing", "Compact Mini", "Shadow Header",
        "Bracket Style", "Dotted Matrix", "Elegant Script", "Bold Summary", "Custom Blank"
    ][i],
    description: [
        "Courier font, dashed dividers, center header", "Large shop name, thick dividers, bold totals", "Thin fonts, dotted separators, compact",
        "Box border around bill, double-line dividers", "*** dividers, star-decorated footer", "ALL CAPS, bold item rows",
        "All left-aligned, label:colon:value layout", "Generous line spacing, large fonts", "Tight spacing, small font (58mm ideal)",
        "Shop name underlined, double-line emphasis", "Uses [ ] around section headers", "Dot-matrix style, monospace",
        "Styled shop name font, decorative footer", "Totals section extra large, bold net amount", "Clean starter, user builds from scratch"
    ][i],
    optimizedFor: [80, 80, 58, 80, 80, 80, 80, 80, 58, 80, 80, 80, 80, 80, 'Any'][i]
}));

const DEFAULT_PRINTER_CONFIG: PrinterConfig = {
    paperWidth: '80mm',
    paperHeight: 'auto',
    dpi: 203,
    marginLeft: 2,
    marginRight: 2,
    marginTop: 3,
    marginBottom: 3,
    fontSizeScaling: 'auto'
};

const DEFAULT_ELEMENTS: Record<string, TemplateElement> = {
    shopName: { id: 'shopName', label: 'Shop Name', visible: true, bold: true, fontSize: 16, align: 'center' },
    address1: { id: 'address1', label: 'Address Line 1', visible: true, bold: false, fontSize: 10, align: 'center' },
    address2: { id: 'address2', label: 'Address Line 2', visible: true, bold: false, fontSize: 10, align: 'center' },
    phone: { id: 'phone', label: 'Phone Number', visible: true, bold: false, fontSize: 10, align: 'center' },
    subShopName: { id: 'subShopName', label: 'Sub Shop Name', visible: false, bold: true, fontSize: 12, align: 'center' },
    billType: { id: 'billType', label: 'Bill Type Label', visible: true, bold: true, fontSize: 12, align: 'center', customText: 'CREDIT BILL' },
    billNoDate: { id: 'billNoDate', label: 'Bill No & Date', visible: true, bold: false, fontSize: 10, align: 'left' },
    cashierTime: { id: 'cashierTime', label: 'Cashier & Time', visible: true, bold: false, fontSize: 10, align: 'left' },
    headers: { id: 'headers', label: 'Column Headers', visible: true, bold: true, fontSize: 10, align: 'left' },
    items: { id: 'items', label: 'Item Rows', visible: true, bold: false, fontSize: 10, align: 'left' },
    grossAmt: { id: 'grossAmt', label: 'Gross Amount', visible: true, bold: false, fontSize: 10, align: 'right' },
    coinage: { id: 'coinage', label: 'Coinage', visible: true, bold: false, fontSize: 10, align: 'right' },
    netAmt: { id: 'netAmt', label: 'Net Amount', visible: true, bold: true, fontSize: 14, align: 'right' },
    balances: { id: 'balances', label: 'Balances', visible: true, bold: false, fontSize: 10, align: 'right' },
    footer1: { id: 'footer1', label: 'Footer Line 1', visible: true, bold: false, fontSize: 10, align: 'center', customText: 'Thank You!! Visit Again!!' },
    footer2: { id: 'footer2', label: 'Footer Line 2', visible: true, bold: false, fontSize: 10, align: 'center', customText: 'FRESH!! FRESH ON' },
};

// --- Mock Data for Preview ---
const MOCK_DATA = {
    shopName: "NAZEER PROTEINS",
    address1: "214 DHARGA ROAD (SUBWAY UPSTAIRS)",
    address2: "PALLAVARAM CHENNAI-43",
    phone: "9884343887",
    subShopName: "ANNAI CHICKEN CENTRE",
    subAddress: "DHARGA ROAD",
    subPhone: "9176919024",
    billNo: "22927",
    date: "14/02/2026",
    cashier: "CASHIER1",
    time: "02:47 PM",
    items: [
        { name: "CHICKEN LIVE", qty: "8.550", rate: "113.00", amt: "966.15" }
    ],
    gross: "966.15",
    coinage: "-0.15",
    net: "966.00",
    opening: "13521.00",
    billAmt: "966.00",
    paid: "5400.00",
    closing: "9087.00"
};

const BillCustomization: React.FC<BillCustomizationProps> = ({ businessId }) => {
    const [activeSection, setActiveSection] = useState<'gallery' | 'customize'>('gallery');
    const [config, setConfig] = useState<BillTemplateConfig>({
        templateId: 't1',
        printer: DEFAULT_PRINTER_CONFIG,
        elements: JSON.parse(JSON.stringify(DEFAULT_ELEMENTS)),
        customLines: [],
        dividerStyle: 'dashed'
    });
    const [loading, setLoading] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    // Business Info hook
    const { businessInfo } = useBusinessInfo(businessId);

    // Load initial settings
    useEffect(() => {
        const loadSettings = async () => {
            setLoading(true);
            try {
                const { data, error } = await (supabase as any)
                    .from('bill_templates')
                    .select('*')
                    .eq('business_id', businessId)
                    .eq('is_active', true)
                    .single();

                if (data && data.settings) {
                    // Merge with defaults to ensure new fields exists
                    // Note: We map DB 'settings' column to local 'config' state
                    const dbConfig = data.settings;
                    setConfig(prev => ({
                        ...prev,
                        ...dbConfig,
                        printer: { ...prev.printer, ...dbConfig.printer },
                        elements: { ...prev.elements, ...dbConfig.elements }
                    }));
                }
            } catch (err) {
                console.error("Error loading templates", err);
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, [businessId]);

    const handleSave = async () => {
        setLoading(true);
        try {
            // First check if a record exists
            const { data: existing } = await (supabase as any)
                .from('bill_templates')
                .select('id')
                .eq('business_id', businessId)
                .eq('is_active', true)
                .single();

            const payload = {
                business_id: businessId,
                template_id: config.templateId,
                settings: config, // Save entire config object to settings column
                is_active: true,
                updated_at: new Date().toISOString()
            };

            if (existing) {
                await (supabase as any).from('bill_templates').update(payload).eq('id', existing.id);
            } else {
                await (supabase as any).from('bill_templates').insert(payload);
            }
            toast.success("Template Saved Successfully!");
            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 3000);
        } catch (err) {
            console.error("Save failed", err);
            toast.error("Failed to save template");
        } finally {
            setLoading(false);
        }
    };

    const getPaperWidthPx = () => {
        const mm = config.printer.paperWidth === '58mm' ? 58 :
            config.printer.paperWidth === '80mm' ? 80 :
                config.printer.paperWidth === '104mm' ? 104 :
                    config.printer.customWidthMm || 80;
        // Approx 3.78 px per mm at 96 DPI
        return mm * 3.78 * zoom;
    };

    // --- Helpers for Render ---
    const getDivider = (charCount: number) => {
        const char = config.dividerStyle === 'solid' ? '─' :
            config.dividerStyle === 'dashed' ? '-' :
                config.dividerStyle === 'dotted' ? '·' :
                    config.dividerStyle === 'stars' ? '*' :
                        config.dividerStyle === 'double' ? '=' : '~';
        return char.repeat(charCount);
    };

    // --- Template Render Logics ---
    const renderPreview = () => {
        const width = getPaperWidthPx();
        // Calculate approx chars per line based on width and font size (Rough estimation)
        // 80mm ~ 42 chars at 10pt courier
        const baseWidthMm = config.printer.paperWidth === '58mm' ? 58 :
            config.printer.paperWidth === '80mm' ? 80 :
                config.printer.paperWidth === '104mm' ? 104 : 80;

        const fontSizePt = config.printer.fontSizeScaling === 'custom' ? (config.printer.customFontSizePt || 10) :
            baseWidthMm <= 58 ? 9 :
                baseWidthMm <= 80 ? 10 : 12;

        const charCapacity = Math.floor((baseWidthMm - config.printer.marginLeft - config.printer.marginRight) / (fontSizePt * 0.25)); // rough constant
        const divider = getDivider(Math.max(20, charCapacity));

        const commonStyles: React.CSSProperties = {
            fontFamily: "'Courier New', Courier, monospace",
            width: `${width}px`,
            paddingLeft: `${config.printer.marginLeft * 3.78 * zoom}px`,
            paddingRight: `${config.printer.marginRight * 3.78 * zoom}px`,
            paddingTop: `${config.printer.marginTop * 3.78 * zoom}px`,
            paddingBottom: `${config.printer.marginBottom * 3.78 * zoom}px`,
            backgroundColor: 'white',
            color: 'black',
            fontSize: `${fontSizePt * zoom}pt`,
            lineHeight: '1.2',
            whiteSpace: 'pre-wrap',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            minHeight: '400px',
            margin: '0 auto',
            transition: 'all 0.3s ease',
            overflow: 'hidden'
        };

        // Specific template style overrides
        const getTemplateStyle = () => {
            // Basic implementation of different templates via inline styles or class logic
            // For now, we use a class-based approach mapping or just modification of commonStyles
            const tid = config.templateId;
            if (tid === 't2') return { ...commonStyles, border: `2px solid black`, padding: '10px' };
            if (tid === 't4') return { ...commonStyles, border: '1px solid black', outline: '3px double black', outlineOffset: '-5px' };
            if (tid === 't6') return { ...commonStyles, textTransform: 'uppercase' as const };
            if (tid === 't12') return { ...commonStyles, fontFamily: '"Courier New", monospace', letterSpacing: '1px' };
            return commonStyles;
        };

        const E = config.elements;

        const renderLine = (key: string, text: React.ReactNode, extraStyle: React.CSSProperties = {}) => {
            const el = config.elements[key];
            if (!el || !el.visible) return null;
            return (
                <div style={{
                    textAlign: el.align,
                    fontWeight: el.bold ? 'bold' : 'normal',
                    fontSize: `${(el.fontSize || fontSizePt) * zoom}pt`,
                    ...extraStyle
                }}>
                    {el.prefix} {text} {el.suffix}
                </div>
            );
        };

        const renderDivider = () => <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textAlign: 'center' }}>{divider}</div>;

        return (
            <div style={getTemplateStyle()}>
                {/* Header Section */}
                {renderLine('shopName', businessInfo?.business_name || MOCK_DATA.shopName, config.templateId === 't10' ? { textDecoration: 'underline', textUnderlineOffset: '3px' } : {})}
                {renderLine('address1', businessInfo?.address || MOCK_DATA.address1)}
                {renderLine('address2', businessInfo?.gst_number ? `GST: ${businessInfo.gst_number}` : MOCK_DATA.address2)}
                {renderLine('phone', businessInfo?.phone || MOCK_DATA.phone)}

                {renderDivider()}

                {renderLine('subShopName', MOCK_DATA.subShopName)}
                {renderLine('billType', config.elements.billType?.customText || 'CREDIT BILL')}

                {renderDivider()}

                {/* Meta Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: `${(E.billNoDate?.fontSize || 10) * zoom}pt` }}>
                    <span>Bill No: <b>{MOCK_DATA.billNo}</b></span>
                    <span>{MOCK_DATA.date}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: `${(E.cashierTime?.fontSize || 10) * zoom}pt` }}>
                    <span>Cashier: {MOCK_DATA.cashier}</span>
                    <span>{MOCK_DATA.time}</span>
                </div>

                {renderDivider()}

                {/* Items Header */}
                {E.headers.visible && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: `${(E.headers.fontSize || 10) * zoom}pt` }}>
                        <span style={{ flex: 2 }}>Desc</span>
                        <span style={{ flex: 1, textAlign: 'right' }}>Qty</span>
                        <span style={{ flex: 1, textAlign: 'right' }}>Rate</span>
                        <span style={{ flex: 1, textAlign: 'right' }}>Amt</span>
                    </div>
                )}
                {renderDivider()}

                {/* Items */}
                {E.items.visible && MOCK_DATA.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: `${(E.items.fontSize || 10) * zoom}pt`, marginBottom: '2px' }}>
                        <span style={{ flex: 2 }}>{item.name}</span>
                        <span style={{ flex: 1, textAlign: 'right' }}>{item.qty}</span>
                        <span style={{ flex: 1, textAlign: 'right' }}>{item.rate}</span>
                        <span style={{ flex: 1, textAlign: 'right' }}>{item.amt}</span>
                    </div>
                ))}

                {renderDivider()}

                {/* Totals */}
                {renderLine('grossAmt', `Gross: ${MOCK_DATA.gross}`)}
                {renderLine('coinage', `Coinage: ${MOCK_DATA.coinage}`)}

                {/* Net Amount - Highly styled usually */}
                {E.netAmt.visible && (
                    <div style={{
                        textAlign: E.netAmt.align,
                        fontWeight: E.netAmt.bold ? 'black' : 'normal',
                        fontSize: `${(E.netAmt.fontSize || 14) * zoom}pt`,
                        marginTop: '5px',
                        borderTop: config.templateId === 't14' ? '2px solid black' : 'none',
                        borderBottom: config.templateId === 't14' ? '2px solid black' : 'none',
                        padding: config.templateId === 't14' ? '5px 0' : '0'
                    }}>
                        NET AMOUNT: {MOCK_DATA.net}
                    </div>
                )}

                {renderDivider()}

                {/* Balances */}
                {E.balances.visible && (
                    <div style={{ fontSize: `${(E.balances.fontSize || 10) * zoom}pt` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Opening:</span><span>{MOCK_DATA.opening}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Bill Amt:</span><span>{MOCK_DATA.billAmt}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Paid:</span><span>{MOCK_DATA.paid}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>Closing:</span><span>{MOCK_DATA.closing}</span></div>
                    </div>
                )}

                {renderDivider()}

                {/* Footer */}
                {renderLine('footer1', config.elements.footer1?.customText || 'Thank You')}
                {renderLine('footer2', config.elements.footer2?.customText || 'Visit Again')}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] bg-gray-50 rounded-xl overflow-hidden shadow-lg border border-gray-200">
            {/* --- Toolbar --- */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveSection('gallery')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeSection === 'gallery' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            <Layout className="w-4 h-4 inline mr-2" />
                            Templates
                        </button>
                        <button
                            onClick={() => setActiveSection('customize')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeSection === 'customize' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            <Settings className="w-4 h-4 inline mr-2" />
                            Customize
                        </button>
                    </div>

                    <div className="h-6 w-px bg-gray-300 mx-2" />

                    {/* Paper Size Quick Select */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500"><Printer className="w-4 h-4 inline mr-1" /> Paper:</span>
                        {(['58mm', '80mm', '104mm'] as PaperWidth[]).map(size => (
                            <button
                                key={size}
                                onClick={() => setConfig(prev => ({ ...prev, printer: { ...prev.printer, paperWidth: size } }))}
                                className={`px-2 py-1 text-xs border rounded ${config.printer.paperWidth === size ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium disabled:opacity-50"
                    >
                        {loading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Settings
                    </button>
                </div>
            </div>

            {/* --- Main Content Area --- */}
            <div className="flex-1 overflow-hidden flex">

                {/* Left Panel: Gallery or Editor */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">

                    {activeSection === 'gallery' && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                                <Layout className="w-5 h-5 mr-2 text-blue-600" />
                                Select a Template
                                <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{TEMPLATES.length} Available</span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                                {TEMPLATES.map(t => (
                                    <div
                                        key={t.id}
                                        onClick={() => {
                                            setConfig(prev => ({ ...prev, templateId: t.id }));
                                            setActiveSection('customize');
                                        }}
                                        className={`group relative bg-white border rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 ${config.templateId === t.id ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-200'}`}
                                    >
                                        <div className="h-32 bg-gray-100 flex items-center justify-center p-4 border-b border-gray-100 group-hover:bg-blue-50 transition-colors">
                                            {/* Mini Text Preview Placeholder */}
                                            <div className="w-24 h-28 bg-white shadow-sm text-[4px] p-2 overflow-hidden text-gray-400 font-mono leading-tight">
                                                *************<br />
                                                {t.name}<br />
                                                *************<br />
                                                Item   10.00<br />
                                                Item   20.00<br />
                                                .............<br />
                                                Total  30.00
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-gray-800">{t.name}</h3>
                                                {typeof t.optimizedFor === 'number' && (
                                                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                                                        {t.optimizedFor}mm
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 line-clamp-2">{t.description}</p>
                                        </div>
                                        {config.templateId === t.id && (
                                            <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full shadow-md">
                                                <Check className="w-3 h-3" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSection === 'customize' && (
                        <div className="max-w-2xl mx-auto space-y-8 pb-20">
                            {/* --- Configuration Sections --- */}

                            {/* 1. Printer Specs */}
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center">
                                    <Printer className="w-4 h-4 mr-2" /> Printer Configuration
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Paper Width</label>
                                        <select
                                            value={config.printer.paperWidth}
                                            onChange={(e) => setConfig(prev => ({ ...prev, printer: { ...prev.printer, paperWidth: e.target.value as PaperWidth } }))}
                                            className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        >
                                            <option value="58mm">58mm (2 inch)</option>
                                            <option value="80mm">80mm (3 inch)</option>
                                            <option value="104mm">104mm (4 inch)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Left Margin (mm)</label>
                                        <input
                                            type="number"
                                            value={config.printer.marginLeft}
                                            onChange={(e) => setConfig(prev => ({ ...prev, printer: { ...prev.printer, marginLeft: parseInt(e.target.value) || 0 } }))}
                                            className="w-full text-sm border-gray-300 rounded-md shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Right Margin (mm)</label>
                                        <input
                                            type="number"
                                            value={config.printer.marginRight}
                                            onChange={(e) => setConfig(prev => ({ ...prev, printer: { ...prev.printer, marginRight: parseInt(e.target.value) || 0 } }))}
                                            className="w-full text-sm border-gray-300 rounded-md shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1 block">DPI Density</label>
                                        <select
                                            value={config.printer.dpi}
                                            onChange={(e) => setConfig(prev => ({ ...prev, printer: { ...prev.printer, dpi: parseInt(e.target.value) as 203 | 300 } }))}
                                            className="w-full text-sm border-gray-300 rounded-md shadow-sm"
                                        >
                                            <option value={203}>203 DPI (Standard)</option>
                                            <option value={300}>300 DPI (High Res)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Element Editor */}
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center">
                                    <Type className="w-4 h-4 mr-2" /> Element Styles
                                </h3>
                                <div className="space-y-3">
                                    {Object.entries(config.elements).map(([key, el]) => (
                                        <div key={key} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                                            <input
                                                type="checkbox"
                                                checked={el.visible}
                                                onChange={(e) => setConfig(prev => ({
                                                    ...prev,
                                                    elements: { ...prev.elements, [key]: { ...el, visible: e.target.checked } }
                                                }))}
                                                className="rounded text-blue-600 focus:ring-blue-500"
                                            />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className={`text-sm font-medium ${el.visible ? 'text-gray-900' : 'text-gray-400'}`}>{el.label}</span>
                                                    {el.visible && (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => setConfig(prev => ({ ...prev, elements: { ...prev.elements, [key]: { ...el, bold: !el.bold } } }))}
                                                                className={`p-1 rounded ${el.bold ? 'bg-black text-white' : 'text-gray-400 hover:bg-gray-200'}`}
                                                                title="Bold"
                                                            >
                                                                <span className="font-bold text-xs">B</span>
                                                            </button>
                                                            <select
                                                                value={el.align}
                                                                onChange={(e) => setConfig(prev => ({ ...prev, elements: { ...prev.elements, [key]: { ...el, align: e.target.value as any } } }))}
                                                                className="text-xs py-0 pl-1 pr-6 border-transparent bg-gray-100 rounded focus:ring-0 focus:border-gray-300"
                                                            >
                                                                <option value="left">Left</option>
                                                                <option value="center">Center</option>
                                                                <option value="right">Right</option>
                                                            </select>
                                                        </div>
                                                    )}
                                                </div>
                                                {/* If custom text is allowed for this element */}
                                                {'customText' in el && el.visible && (
                                                    <input
                                                        type="text"
                                                        value={el.customText}
                                                        onChange={(e) => setConfig(prev => ({ ...prev, elements: { ...prev.elements, [key]: { ...el, customText: e.target.value } } }))}
                                                        className="w-full text-xs border-gray-200 rounded px-2 py-1 focus:border-blue-400 focus:outline-none"
                                                        placeholder="Custom text..."
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 3. Global Styles */}
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
                                    Global Settings
                                </h3>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-2 block">Divider Style</label>
                                    <div className="flex gap-2">
                                        {['solid', 'dashed', 'dotted', 'stars', 'double'].map((style) => (
                                            <button
                                                key={style}
                                                onClick={() => setConfig(prev => ({ ...prev, dividerStyle: style as any }))}
                                                className={`px-3 py-1.5 rounded text-xs capitalize border ${config.dividerStyle === style ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-600'}`}
                                            >
                                                {style}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                {/* Right Panel: Live Preview */}
                <div className="w-[450px] bg-gray-100 border-l border-gray-200 flex flex-col shadow-inner relative">
                    <div className="p-3 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
                        <span className="text-xs font-bold text-gray-500 uppercase flex items-center">
                            <ImageIcon className="w-3 h-3 mr-1" /> Live Preview
                        </span>
                        <div className="flex items-center gap-1 bg-gray-100 rounded p-1">
                            <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="p-1 hover:bg-gray-200 rounded"><ZoomOut className="w-3 h-3 text-gray-600" /></button>
                            <span className="text-[10px] font-mono text-gray-600 w-8 text-center">{Math.round(zoom * 100)}%</span>
                            <button onClick={() => setZoom(Math.min(2, zoom + 0.1))} className="p-1 hover:bg-gray-200 rounded"><ZoomIn className="w-3 h-3 text-gray-600" /></button>
                        </div>
                    </div>

                    {/* Preview Canvas */}
                    <div className="flex-1 overflow-auto p-8 flex justify-center items-start bg-gray-200/50 relative">
                        {/* Ruler Effect */}
                        <div className="absolute top-0 left-0 right-0 h-6 bg-yellow-50 border-b border-yellow-200 flex text-[8px] text-gray-400 items-end justify-center select-none font-mono">
                            {config.printer.paperWidth} | Approx {getPaperWidthPx().toFixed(0)}px
                        </div>
                        <div className="mt-4">
                            {renderPreview()}
                        </div>
                    </div>

                    {/* Helper Badge */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/75 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm">
                        Showing {config.templateId} on {config.printer.paperWidth}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BillCustomization;
