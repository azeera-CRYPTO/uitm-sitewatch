ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
CREATE INDEX IF NOT EXISTS reports_user_id_idx ON public.reports(user_id);
CREATE POLICY "staff read own" ON public.reports FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "staff read own photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'report-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "admin delete photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'report-photos' AND public.has_role(auth.uid(), 'admin'));