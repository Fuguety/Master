create table if not exists public.app_admins
(
    user_id uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;

revoke all on table public.app_admins from anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
    select exists
    (
        select 1
        from public.app_admins
        where user_id = auth.uid()
    );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create table if not exists public.shared_datasets
(
    id text primary key,
    data jsonb not null,
    updated_at timestamptz not null default now(),
    updated_by uuid references auth.users(id) on delete set null
);

alter table public.shared_datasets enable row level security;

revoke all on table public.shared_datasets from anon, authenticated;
grant select (id, data, updated_at) on table public.shared_datasets to anon, authenticated;
grant update (data) on table public.shared_datasets to authenticated;

drop policy if exists "shared dataset is publicly readable" on public.shared_datasets;
create policy "shared dataset is publicly readable"
on public.shared_datasets
for select
to anon, authenticated
using (true);

drop policy if exists "administrators can update shared dataset" on public.shared_datasets;
create policy "administrators can update shared dataset"
on public.shared_datasets
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.set_shared_dataset_audit_fields()
returns trigger
language plpgsql
security invoker
set search_path = public, auth
as $$
begin
    new.updated_at = now();
    new.updated_by = auth.uid();
    return new;
end;
$$;

drop trigger if exists set_shared_dataset_audit_fields on public.shared_datasets;
create trigger set_shared_dataset_audit_fields
before update on public.shared_datasets
for each row
execute function public.set_shared_dataset_audit_fields();

insert into public.shared_datasets (id, data)
values
(
    'atlas',
    '{"version":2,"exportedAt":"2026-09-30T00:00:00.000Z","universities":[{"id":"university-mit-cambridge","type":"university","name":"Massachusetts Institute of Technology","coordinates":{"longitude":-71.0921,"latitude":42.3601},"city":"Cambridge","country":"United States","countryCode":"USA","countryTier":"tier-1","locationScore":4.7,"qualityOfLife":4.4,"affordability":2.2,"jobOpportunities":5,"jobPlacementSupport":true,"regionalCompanies":5,"globalReputation":5,"localReputation":5,"globalRanking":1,"localRanking":1,"commuteQuality":4,"notes":[{"id":"note-mit-example","text":"Example research record. Verify costs and rankings against current primary sources.","createdAt":"2026-08-01T12:00:00.000Z","updatedAt":"2026-08-01T12:00:00.000Z"}],"sources":[{"id":"source-mit-home","title":"Official university website","url":"https://www.mit.edu/","accessedAt":"2026-08-01T12:00:00.000Z"}],"finalRating":4.6,"createdAt":"2026-08-01T12:00:00.000Z","updatedAt":"2026-08-01T12:00:00.000Z"},{"id":"university-usp-sao-paulo","type":"university","name":"University of São Paulo","coordinates":{"longitude":-46.7309,"latitude":-23.5614},"city":"São Paulo","country":"Brazil","countryCode":"BRA","countryTier":"tier-2","locationScore":4.4,"qualityOfLife":4.1,"affordability":4.2,"jobOpportunities":4.4,"jobPlacementSupport":true,"regionalCompanies":4.7,"globalReputation":4.5,"localReputation":5,"globalRanking":85,"localRanking":1,"commuteQuality":3.2,"notes":[],"sources":[{"id":"source-usp-home","title":"Official university website","url":"https://www.usp.br/","accessedAt":"2026-08-01T12:00:00.000Z"}],"finalRating":4.4,"createdAt":"2026-08-01T12:00:00.000Z","updatedAt":"2026-08-01T12:00:00.000Z"}],"companies":[{"id":"company-northstar-berlin","type":"company","name":"Northstar Analytics","coordinates":{"longitude":13.405,"latitude":52.52},"city":"Berlin","country":"Germany","countryCode":"DEU","countryTier":"tier-1","payment":4.4,"careerGrowth":4.6,"locationScore":4.5,"workModel":"hybrid","internshipAvailability":true,"industry":"Technology","companyArea":"Data analytics","notes":[{"id":"note-northstar-example","text":"Fictional example company for demonstrating the data model.","createdAt":"2026-08-01T12:00:00.000Z","updatedAt":"2026-08-01T12:00:00.000Z"}],"sources":[],"finalRating":4.7,"createdAt":"2026-08-01T12:00:00.000Z","updatedAt":"2026-08-01T12:00:00.000Z"},{"id":"company-verde-sao-paulo","type":"company","name":"Verde Mobility Labs","coordinates":{"longitude":-46.6333,"latitude":-23.5505},"city":"São Paulo","country":"Brazil","countryCode":"BRA","countryTier":"tier-2","payment":4,"careerGrowth":4.5,"locationScore":4.2,"workModel":"on-site","internshipAvailability":false,"industry":"Transportation","companyArea":"Electric mobility","notes":[{"id":"note-verde-example","text":"Fictional example company for demonstrating filters and scoring.","createdAt":"2026-08-01T12:00:00.000Z","updatedAt":"2026-08-01T12:00:00.000Z"}],"sources":[],"finalRating":3.9,"createdAt":"2026-08-01T12:00:00.000Z","updatedAt":"2026-08-01T12:00:00.000Z"}],"notes":[{"id":"note-example-porto","type":"note","name":"Explore Porto opportunities","content":"Review universities and technology employers near the city centre.","color":"#f4c95d","country":"Portugal","countryCode":"PRT","city":"Porto","coordinates":{"longitude":-8.6291,"latitude":41.1579},"sources":[],"locked":false,"createdAt":"2026-01-15T12:00:00.000Z","updatedAt":"2026-01-15T12:00:00.000Z"}],"countryOverlays":[{"id":"overlay-brazil","countryCode":"BRA","countryName":"Brazil","color":"#16a34a","opacity":0.32,"isVisible":true,"notes":"Example country highlight.","updatedAt":"2026-08-01T12:00:00.000Z"},{"id":"overlay-germany","countryCode":"DEU","countryName":"Germany","color":"#2563eb","opacity":0.28,"isVisible":true,"notes":"Example country highlight.","updatedAt":"2026-08-01T12:00:00.000Z"}]}'::jsonb
)
on conflict (id) do nothing;
