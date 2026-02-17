-- Add GST number field to customers table for Vasan login
ALTER TABLE public.customers ADD COLUMN gst_number TEXT;