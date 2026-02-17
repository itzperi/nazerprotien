-- Allow application to read/write suppliers and related tables (RLS policies)
DO $$ BEGIN
  -- Suppliers
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'suppliers' AND policyname = 'Allow all on suppliers'
  ) THEN
    CREATE POLICY "Allow all on suppliers" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Purchases
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'purchases' AND policyname = 'Allow all on purchases'
  ) THEN
    CREATE POLICY "Allow all on purchases" ON public.purchases FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Load entries
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'load_entries' AND policyname = 'Allow all on load_entries'
  ) THEN
    CREATE POLICY "Allow all on load_entries" ON public.load_entries FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Salaries
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'salaries' AND policyname = 'Allow all on salaries'
  ) THEN
    CREATE POLICY "Allow all on salaries" ON public.salaries FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;


