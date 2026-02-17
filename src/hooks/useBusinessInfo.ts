import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BusinessInfo {
  id: number;
  business_id: string;
  business_name: string;
  address: string;
  gst_number?: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export const useBusinessInfo = (businessId: string) => {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load business information
  useEffect(() => {
    const loadBusinessInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`[BUSINESS INFO] Loading business info for business_id: ${businessId}`);

        const { data, error: fetchError } = await supabase
          .from('business_info')
          .select('*')
          .eq('business_id', businessId)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            // No business info found, this is expected for new businesses
            console.log(`[BUSINESS INFO] No business information found for business_id: ${businessId}`);
            setBusinessInfo(null);
          } else if (fetchError.code === 'PGRST205') {
            // Table doesn't exist
            console.error('[BUSINESS INFO] Business info table does not exist. Please run database setup.');
            setError('Business info table not found. Please follow the database setup instructions.');
            setBusinessInfo(null);
          } else {
            console.error('[BUSINESS INFO] Error loading business info:', fetchError);
            setError(fetchError.message);
            setBusinessInfo(null);
          }
        } else {
          console.log(`[BUSINESS INFO] Loaded business info: ${data?.business_name}`);
          setBusinessInfo(data);
        }
      } catch (err) {
        console.error('Error loading business information:', err);
        setError(err instanceof Error ? err.message : 'Failed to load business information');
        setBusinessInfo(null);
      } finally {
        setLoading(false);
      }
    };

    if (businessId) {
      loadBusinessInfo();
    }
  }, [businessId]);

  // Save business information
  const saveBusinessInfo = async (info: Omit<BusinessInfo, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);

      const { data, error: saveError } = await supabase
        .from('business_info')
        .upsert({
          business_id: info.business_id,
          business_name: info.business_name,
          address: info.address,
          gst_number: info.gst_number,
          phone: info.phone,
          email: info.email,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (saveError) {
        throw saveError;
      }

      setBusinessInfo(data);
      return data;
    } catch (err) {
      console.error('Error saving business information:', err);
      setError(err instanceof Error ? err.message : 'Failed to save business information');
      throw err;
    }
  };

  // Update business information
  const updateBusinessInfo = async (updates: Partial<Omit<BusinessInfo, 'id' | 'business_id' | 'created_at' | 'updated_at'>>) => {
    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from('business_info')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('business_id', businessId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setBusinessInfo(data);
      return data;
    } catch (err) {
      console.error('Error updating business information:', err);
      setError(err instanceof Error ? err.message : 'Failed to update business information');
      throw err;
    }
  };

  // Check if business information exists
  const hasBusinessInfo = businessInfo !== null;

  return {
    businessInfo,
    loading,
    error,
    saveBusinessInfo,
    updateBusinessInfo,
    hasBusinessInfo
  };
};
