CREATE OR REPLACE FUNCTION public.protect_report_assignment()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF TG_OP = 'INSERT' THEN
      IF auth.uid() IS NULL OR NEW.user_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'Anda hanya boleh menghantar laporan sendiri.';
      END IF;
    ELSE
      IF OLD.user_id IS DISTINCT FROM auth.uid() OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
        RAISE EXCEPTION 'Anda hanya boleh mengemas kini laporan sendiri.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE INSERT ON public.reports FROM anon;
DROP POLICY IF EXISTS "anyone submit" ON public.reports;
CREATE POLICY "authenticated submit own report" ON public.reports FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
COMMENT ON FUNCTION public.protect_report_assignment() IS 'Owners may enter scope/company on their own reports; other-user writes remain forbidden. Admin scope catalog management remains role-protected.';