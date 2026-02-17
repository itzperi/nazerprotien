
-- Add bill_number column to bills table
ALTER TABLE public.bills ADD COLUMN bill_number VARCHAR(6);

-- Create a function to generate 6-digit bill numbers
CREATE OR REPLACE FUNCTION generate_bill_number()
RETURNS VARCHAR(6) AS $$
DECLARE
    new_bill_number VARCHAR(6);
    counter INTEGER := 0;
BEGIN
    LOOP
        -- Generate a 6-character alphanumeric code
        new_bill_number := UPPER(
            CHR(65 + (random() * 25)::int) ||  -- First letter A-Z
            CHR(65 + (random() * 25)::int) ||  -- Second letter A-Z
            CHR(65 + (random() * 25)::int) ||  -- Third letter A-Z
            LPAD((random() * 999)::int::text, 3, '0')  -- Last 3 digits 000-999
        );
        
        -- Check if this bill number already exists
        IF NOT EXISTS (SELECT 1 FROM public.bills WHERE bill_number = new_bill_number) THEN
            RETURN new_bill_number;
        END IF;
        
        counter := counter + 1;
        -- Prevent infinite loop
        IF counter > 1000 THEN
            RAISE EXCEPTION 'Unable to generate unique bill number after 1000 attempts';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Update existing bills to have bill numbers
UPDATE public.bills 
SET bill_number = generate_bill_number() 
WHERE bill_number IS NULL;

-- Make bill_number NOT NULL after updating existing records
ALTER TABLE public.bills ALTER COLUMN bill_number SET NOT NULL;

-- Add unique constraint to bill_number
ALTER TABLE public.bills ADD CONSTRAINT unique_bill_number UNIQUE (bill_number);

-- Create trigger to automatically generate bill numbers for new bills
CREATE OR REPLACE FUNCTION set_bill_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.bill_number IS NULL THEN
        NEW.bill_number := generate_bill_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_bill_number
    BEFORE INSERT ON public.bills
    FOR EACH ROW
    EXECUTE FUNCTION set_bill_number();
