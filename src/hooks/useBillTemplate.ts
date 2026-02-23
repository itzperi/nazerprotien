import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useBillTemplate = (businessId: string) => {
    const [templateConfig, setTemplateConfig] = useState<any>(null);

    useEffect(() => {
        const fetchTemplate = async () => {
            if (!businessId) return;
            try {
                const { data, error } = await supabase
                    .from('bill_templates')
                    .select('settings')
                    .eq('business_id', businessId)
                    .eq('is_active', true)
                    .single();

                if (data && !error) {
                    setTemplateConfig(data.settings);
                }
            } catch (err) {
                console.error('Failed to fetch bill template', err);
            }
        };
        fetchTemplate();
    }, [businessId]);

    return templateConfig;
};
