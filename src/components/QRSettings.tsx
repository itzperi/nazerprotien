import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface QRSettingsProps {
    businessId: string;
}

export const QRSettings = ({ businessId }: QRSettingsProps) => {
    const [enabled, setEnabled] = useState(false);
    const [imagePath, setImagePath] = useState<string | null>(null);
    const [upiId, setUpiId] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, [businessId]);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('shops_logins')
                .select('qr_enabled, qr_image_path, upi_id')
                .eq('business_id', businessId)
                .single();

            if (error) {
                console.error('Error fetching QR settings:', error);
                // If row doesn't exist (maybe new shop), we might need to handle it.
                // But for now, assume logged in shop exists.
                return;
            }

            if (data) {
                const qrData = data as any;
                setEnabled(qrData.qr_enabled || false);
                setImagePath(qrData.qr_image_path);
                setUpiId(qrData.upi_id || '');
            }
        } catch (err) {
            console.error('Unexpected error fetching settings:', err);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Update Database
            const { error: dbError } = await supabase
                .from('shops_logins')
                .update({
                    qr_enabled: enabled,
                    qr_image_path: null,
                    upi_id: upiId
                } as any)
                .eq('business_id', businessId);

            if (dbError) throw dbError;

            toast.success('QR Settings saved successfully');
        } catch (error: any) {
            console.error('Error saving settings:', error);
            toast.error(`Failed to save settings: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="max-w-md mx-auto mt-8">
            <CardHeader>
                <CardTitle>QR Code Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <Label htmlFor="qr-toggle">Enable QR Code on Bills</Label>
                    <Switch
                        id="qr-toggle"
                        checked={enabled}
                        onCheckedChange={setEnabled}
                        disabled={!upiId}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="upi-id">UPI ID (Virtual Payment Address)</Label>
                    <Input
                        id="upi-id"
                        type="text"
                        placeholder="e.g., yourname@okbank"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                    />
                    <p className="text-sm text-gray-500">Entering a UPI ID automatically generates a dynamic QR code with the exact bill amount.</p>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full"
                >
                    {loading ? 'Saving...' : 'Save Settings'}
                </Button>
            </CardContent>
        </Card>
    );
};
