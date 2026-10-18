create type public.app_role as enum ('admin','user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id=_user_id and role=_role)
$$;

create or replace function public.assign_default_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if lower(new.email) = 'fasiliti.uitmck@gmail.com' then
    insert into public.user_roles(user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users
for each row execute function public.assign_default_admin();

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  captured_at timestamptz not null,
  latitude double precision not null,
  longitude double precision not null,
  gps_accuracy double precision,
  staff_name text not null,
  staff_id text not null,
  category text not null,
  status text not null,
  zone text not null,
  building text not null,
  notes text,
  photo_path text not null,
  admin_notes text,
  updated_at timestamptz not null default now()
);
grant insert on public.reports to anon, authenticated;
grant select, update, delete on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
create policy "anyone submit" on public.reports for insert to anon, authenticated with check (true);
create policy "admin read" on public.reports for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin update" on public.reports for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin delete" on public.reports for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create policy "anyone upload report photos" on storage.objects for insert to anon, authenticated with check (bucket_id = 'report-photos');
create policy "admin read report photos" on storage.objects for select to authenticated using (bucket_id = 'report-photos' and public.has_role(auth.uid(),'admin'));