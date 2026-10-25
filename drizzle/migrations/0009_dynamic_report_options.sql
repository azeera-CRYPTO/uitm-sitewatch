CREATE TABLE public.report_options (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 kind text NOT NULL CHECK (kind IN ('category','status')),
 name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
 active boolean NOT NULL DEFAULT true,
 status_group text NOT NULL DEFAULT 'progress' CHECK (status_group IN ('progress','done','urgent')),
 previous_names text[] NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(kind,name)
);
GRANT SELECT, INSERT, UPDATE ON public.report_options TO authenticated;
GRANT ALL ON public.report_options TO service_role;
ALTER TABLE public.report_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated options read" ON public.report_options FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin options insert" ON public.report_options FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin options update" ON public.report_options FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.report_options (kind,name) SELECT 'category',category FROM public.reports GROUP BY category ON CONFLICT DO NOTHING;
INSERT INTO public.report_options (kind,name,status_group) SELECT 'status',status,CASE WHEN status='Selesai' THEN 'done' WHEN status='Memerlukan Tindakan Lanjut' THEN 'urgent' ELSE 'progress' END FROM public.reports GROUP BY status ON CONFLICT DO NOTHING;
CREATE FUNCTION public.remember_report_option_name() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF NEW.kind IS DISTINCT FROM OLD.kind THEN RAISE EXCEPTION 'Option kind cannot change'; END IF;
 IF NEW.name IS DISTINCT FROM OLD.name THEN NEW.previous_names := array_append(OLD.previous_names, OLD.name); ELSE NEW.previous_names := OLD.previous_names; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER remember_report_option_name BEFORE UPDATE ON public.report_options FOR EACH ROW EXECUTE FUNCTION public.remember_report_option_name();
CREATE FUNCTION public.validate_report_options() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF TG_OP='INSERT' THEN
  IF NOT EXISTS(SELECT 1 FROM public.report_options WHERE kind='category' AND active AND name=NEW.category) THEN RAISE EXCEPTION 'Kategori tidak tersedia'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.report_options WHERE kind='status' AND active AND name=NEW.status) THEN RAISE EXCEPTION 'Status tidak tersedia'; END IF;
 ELSE
  IF NEW.category IS DISTINCT FROM OLD.category AND NOT EXISTS(SELECT 1 FROM public.report_options WHERE kind='category' AND active AND name=NEW.category) THEN RAISE EXCEPTION 'Kategori tidak tersedia'; END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT EXISTS(SELECT 1 FROM public.report_options WHERE kind='status' AND active AND name=NEW.status) THEN RAISE EXCEPTION 'Status tidak tersedia'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_report_options BEFORE INSERT OR UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.validate_report_options();