-- Update Vasan Chicken Perambur business info with correct phone and GST
-- This script updates the business_info table for vasan_chicken_perambur

-- Update the business info for vasan_chicken_perambur
UPDATE business_info 
SET 
  phone = '+91 99623 43299',
  gst_number = '33BBMPP2764G1ZH',
  updated_at = NOW()
WHERE business_id = 'vasan_chicken_perambur';

-- If no record exists, insert it
INSERT INTO business_info (business_id, business_name, address, gst_number, phone, email)
VALUES (
  'vasan_chicken_perambur',
  'Vasan Chicken Perambur',
  '61, Vadivelu Mudali St, Chinnaiyan Colony, Perambur, Chennai, Tamil Nadu 600011',
  '33BBMPP2764G1ZH',
  '+91 99623 43299',
  'vasanchicken@gmail.com'
)
ON CONFLICT (business_id) DO UPDATE SET
  phone = EXCLUDED.phone,
  gst_number = EXCLUDED.gst_number,
  updated_at = NOW();

-- Verify the update
SELECT * FROM business_info WHERE business_id = 'vasan_chicken_perambur';

-- Show success message
DO $$
BEGIN
  RAISE NOTICE 'Vasan Chicken Perambur business info updated successfully!';
  RAISE NOTICE 'Phone: +91 99623 43299';
  RAISE NOTICE 'GST: 33BBMPP2764G1ZH';
END $$;
