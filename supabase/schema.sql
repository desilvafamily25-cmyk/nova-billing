-- Table: public.billings
create table if not exists public.billings (
  id uuid primary key default gen_random_uuid(),
  user_name text not null default 'Dr Premila Hewage',
  bill_date date not null,
  clinic text not null check (clinic in ('Hemac','MM Balwyn','FNMC','NovaBody')),
  gross_billing numeric(12,2) not null check (gross_billing >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Updated-at trigger
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;$$;

drop trigger if exists trg_billings_updated_at on public.billings;
create trigger trg_billings_updated_at
before update on public.billings
for each row execute procedure set_updated_at();

-- Enable Row Level Security
alter table public.billings enable row level security;

-- Demo-open policies (replace with auth policies for production)
create policy if not exists "read_all" on public.billings for select using (true);
create policy if not exists "insert_all" on public.billings for insert with check (true);
create policy if not exists "update_all" on public.billings for update using (true) with check (true);
create policy if not exists "delete_all" on public.billings for delete using (true);
