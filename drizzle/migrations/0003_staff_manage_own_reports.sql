GRANT UPDATE, DELETE ON public.reports TO authenticated;
CREATE POLICY "staff update own reports" ON public.reports FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "staff delete own reports" ON public.reports FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE OR REPLACE FUNCTION public.protect_staff_report_fields() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.captured_at IS DISTINCT FROM OLD.captured_at OR NEW.created_at IS DISTINCT FROM OLD.created_at OR NEW.latitude IS DISTINCT FROM OLD.latitude OR NEW.longitude IS DISTINCT FROM OLD.longitude OR NEW.gps_accuracy IS DISTINCT FROM OLD.gps_accuracy OR NEW.photo_path IS DISTINCT FROM OLD.photo_path OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes OR NEW.staff_name IS DISTINCT FROM OLD.staff_name OR NEW.staff_id IS DISTINCT FROM OLD.staff_id OR NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Rekod asal dan catatan admin tidak boleh diubah oleh staf';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER protect_staff_report_fields BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.protect_staff_report_fields();
CREATE POLICY "staff read linked report photos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'report-photos' AND EXISTS (SELECT 1 FROM public.reports r WHERE r.photo_path = name AND r.user_id = auth.uid()));