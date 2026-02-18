-- Add todays_price to products
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'todays_price') THEN 
        ALTER TABLE products ADD COLUMN todays_price DECIMAL(10,2) DEFAULT 0; 
    END IF; 
END $$;

-- Create bill_templates table
CREATE TABLE IF NOT EXISTS bill_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL,
    template_id TEXT NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, template_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_bill_templates_business_id ON bill_templates(business_id);

-- Add is_active constraint (optional, but good to handle logic app side for now)
-- Ideally only one active template per business, but we can handle via application logic "set all others inactive".
