CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  staff_name text NOT NULL DEFAULT '',
  staff_id text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "admin read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  insert into public.profiles(id, email, staff_name, staff_id)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'staff_name',''), coalesce(new.raw_user_meta_data->>'staff_id',''))
  on conflict (id) do nothing;
  return new;
end $$;
CREATE TRIGGER on_auth_user_created_profile AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

INSERT INTO public.profiles(id, email, staff_name, staff_id, created_at)
SELECT id, email, coalesce(raw_user_meta_data->>'staff_name',''), coalesce(raw_user_meta_data->>'staff_id',''), created_at FROM auth.users
ON CONFLICT (id) DO NOTHING;