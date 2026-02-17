-- Comprehensive calculation helper for payment modal and reports

CREATE OR REPLACE FUNCTION public.calculate_total_bill(p_bill_id bigint)
RETURNS TABLE (
  bill_id bigint,
  customer_name text,
  items_total numeric,
  cleaning_charge numeric,
  delivery_charge numeric,
  total_amount numeric,
  payment_amount numeric,
  new_balance numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id AS bill_id,
    b.customer_name,
    -- Prefer stored totals when available, fallback to JSON items sum
    COALESCE(
      (CASE WHEN b.total_bill_amount IS NOT NULL THEN 
        (b.total_bill_amount - COALESCE(b.cleaning_charge,0) - COALESCE(b.delivery_charge,0))
      END),
      (
        SELECT COALESCE(SUM((it->>'amount')::numeric), 0)
        FROM jsonb_array_elements(b.items) AS it
      ),
      0
    ) AS items_total,
    COALESCE(b.cleaning_charge, 0) AS cleaning_charge,
    COALESCE(b.delivery_charge, 0) AS delivery_charge,
    -- total_amount = items_total + cleaning + delivery (previous balance may be handled separately)
    (
      COALESCE(
        (CASE WHEN b.total_bill_amount IS NOT NULL THEN b.total_bill_amount END),
        (COALESCE(
          (CASE WHEN b.total_bill_amount IS NOT NULL THEN 
            (b.total_bill_amount - COALESCE(b.cleaning_charge,0) - COALESCE(b.delivery_charge,0))
          END),
          (
            SELECT COALESCE(SUM((it->>'amount')::numeric), 0)
            FROM jsonb_array_elements(b.items) AS it
          ),
          0
        ) + COALESCE(b.cleaning_charge,0) + COALESCE(b.delivery_charge,0))
      )
    ) AS total_amount,
    COALESCE(b.paid_amount, 0) AS payment_amount,
    -- Clamp new balance: max(total_amount - payment, 0)
    GREATEST(
      (
        COALESCE(
          (CASE WHEN b.total_bill_amount IS NOT NULL THEN b.total_bill_amount END),
          (COALESCE(
            (CASE WHEN b.total_bill_amount IS NOT NULL THEN 
              (b.total_bill_amount - COALESCE(b.cleaning_charge,0) - COALESCE(b.delivery_charge,0))
            END),
            (
              SELECT COALESCE(SUM((it->>'amount')::numeric), 0)
              FROM jsonb_array_elements(b.items) AS it
            ),
            0
          ) + COALESCE(b.cleaning_charge,0) + COALESCE(b.delivery_charge,0))
        )
        - COALESCE(b.paid_amount,0)
      ),
      0
    ) AS new_balance
  FROM public.bills b
  WHERE b.id = p_bill_id;
END;
$$ LANGUAGE plpgsql;

-- Convenience view for listing summaries without calling the function per-row
CREATE OR REPLACE VIEW public.bill_payment_summary AS
SELECT
  b.id AS bill_id,
  b.customer_name,
  COALESCE(
    (CASE WHEN b.total_bill_amount IS NOT NULL THEN 
      (b.total_bill_amount - COALESCE(b.cleaning_charge,0) - COALESCE(b.delivery_charge,0))
    END),
    (
      SELECT COALESCE(SUM((it->>'amount')::numeric), 0)
      FROM jsonb_array_elements(b.items) AS it
    ),
    0
  ) AS items_total,
  COALESCE(b.cleaning_charge, 0) AS cleaning_charge,
  COALESCE(b.delivery_charge, 0) AS delivery_charge,
  (
    COALESCE(
      (CASE WHEN b.total_bill_amount IS NOT NULL THEN b.total_bill_amount END),
      (COALESCE(
        (CASE WHEN b.total_bill_amount IS NOT NULL THEN 
          (b.total_bill_amount - COALESCE(b.cleaning_charge,0) - COALESCE(b.delivery_charge,0))
        END),
        (
          SELECT COALESCE(SUM((it->>'amount')::numeric), 0)
          FROM jsonb_array_elements(b.items) AS it
        ),
        0
      ) + COALESCE(b.cleaning_charge,0) + COALESCE(b.delivery_charge,0))
    )
  ) AS total_amount,
  COALESCE(b.paid_amount, 0) AS payment_amount,
  GREATEST(
    (
      COALESCE(
        (CASE WHEN b.total_bill_amount IS NOT NULL THEN b.total_bill_amount END),
        (COALESCE(
          (CASE WHEN b.total_bill_amount IS NOT NULL THEN 
            (b.total_bill_amount - COALESCE(b.cleaning_charge,0) - COALESCE(b.delivery_charge,0))
          END),
          (
            SELECT COALESCE(SUM((it->>'amount')::numeric), 0)
            FROM jsonb_array_elements(b.items) AS it
          ),
          0
        ) + COALESCE(b.cleaning_charge,0) + COALESCE(b.delivery_charge,0))
      )
      - COALESCE(b.paid_amount,0)
    ),
    0
  ) AS new_balance
FROM public.bills b;


