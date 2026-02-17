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
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, [businessId]);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('shops_logins')
                .select('qr_enabled, qr_image_path')
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
            let finalPath = imagePath;

            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${businessId}-qr.${fileExt}`;
                const filePath = `${fileName}`;

                // Upload to 'qr-codes' bucket
                const { error: uploadError } = await supabase.storage
                    .from('qr-codes')
                    .upload(filePath, file, { upsert: true });

                if (uploadError) {
                    throw uploadError;
                }

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('qr-codes')
                    .getPublicUrl(filePath);

                finalPath = publicUrl;
                setImagePath(finalPath);
            }

            // Update Database
            const { error: dbError } = await supabase
                .from('shops_logins')
                .update({
                    qr_enabled: enabled,
                    qr_image_path: finalPath
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
                        disabled={!imagePath && !file} // logical: can enable only if image exists or uploading one
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="qr-image">Upload QR Image</Label>
                    <Input
                        id="qr-image"
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/svg+xml"
                        onChange={handleFileChange}
                    />
                    <p className="text-sm text-gray-500">Supports PNG, JPG, JPEG, SVG</p>
                </div>

                {imagePath && (
                    <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Current Image Preview:</p>
                        <div className="border rounded p-2 flex justify-center bg-white">
                            <img
                                src={imagePath}
                                alt="QR Code Preview"
                                className="max-h-40 object-contain"
                            />
                        </div>
                    </div>
                )}

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
