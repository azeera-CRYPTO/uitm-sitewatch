ALTER TABLE public.profiles ADD COLUMN user_type text, ADD COLUMN department text NOT NULL DEFAULT '', ADD COLUMN company_name text NOT NULL DEFAULT '', ADD COLUMN phone text NOT NULL DEFAULT '', ADD COLUMN main_scope_id uuid REFERENCES public.contractor_scopes(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profile_user_type CHECK (user_type IS NULL OR user_type IN ('staff','contractor'));
ALTER TABLE public.profiles ADD CONSTRAINT profile_details CHECK (user_type IS NULL OR (length(btrim(staff_name)) > 0 AND ((user_type = 'staff' AND length(btrim(staff_id)) > 0 AND length(btrim(department)) > 0) OR (user_type = 'contractor' AND length(btrim(company_name)) > 0))));
COMMENT ON COLUMN public.profiles.user_type IS 'Descriptive reporter category only; authorization remains in user_roles. NULL indicates legacy profile awaiting completion.';
ALTER TABLE public.reports ADD COLUMN reporter_type text;
ALTER TABLE public.reports ADD CONSTRAINT report_reporter_type CHECK (reporter_type IS NULL OR reporter_type IN ('staff','contractor'));
CREATE OR REPLACE FUNCTION public.capture_reporter_identity() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE p public.profiles;
BEGIN
 IF auth.uid() IS NOT NULL THEN
 SELECT * INTO p FROM public.profiles WHERE id = auth.uid();
 IF p.user_type IS NULL THEN RAISE EXCEPTION 'Sila lengkapkan maklumat pengguna sebelum menghantar laporan.'; END IF;
 NEW.reporter_type := p.user_type;
 NEW.staff_name := p.staff_name;
 NEW.staff_id := CASE WHEN p.user_type = 'staff' THEN p.staff_id ELSE p.company_name END;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER capture_reporter_identity BEFORE INSERT ON public.reports FOR EACH ROW EXECUTE FUNCTION public.capture_reporter_identity();
CREATE OR REPLACE FUNCTION public.preserve_reporter_type() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') AND NEW.reporter_type IS DISTINCT FROM OLD.reporter_type THEN RAISE EXCEPTION 'Jenis pelapor asal tidak boleh diubah.'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER preserve_reporter_type BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.preserve_reporter_type();