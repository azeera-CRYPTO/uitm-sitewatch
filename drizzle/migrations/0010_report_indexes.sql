CREATE INDEX IF NOT EXISTS reports_captured_at_idx ON public.reports (captured_at DESC);
CREATE INDEX IF NOT EXISTS reports_user_captured_idx ON public.reports (user_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports (status);
CREATE INDEX IF NOT EXISTS reports_zone_idx ON public.reports (zone);
CREATE INDEX IF NOT EXISTS reports_category_idx ON public.reports (category);
CREATE INDEX IF NOT EXISTS reports_reporter_type_idx ON public.reports (reporter_type);
CREATE INDEX IF NOT EXISTS reports_scope_idx ON public.reports (contractor_scope_id);
CREATE INDEX IF NOT EXISTS reports_photo_path_idx ON public.reports (photo_path) WHERE photo_path IS NOT NULL;