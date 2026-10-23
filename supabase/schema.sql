-- ====================================================================
-- WorkAble: Production-Grade Supabase Database Schema & RLS Policies
-- ====================================================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- ====================================================================
-- 2. CREATE ALL TABLES FIRST (Resolves all forward-dependency errors)
-- ====================================================================

-- 2.1 PROFILES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null unique,
  role text not null check (role in ('seeker', 'employer', 'admin')),
  company text,
  suspended boolean default false,
  phone text default '',
  summary text default '',
  skills text[] default array[]::text[],
  education text default '',
  experience text default '',
  locations text[] default array[]::text[],
  arrangements text[] default array[]::text[],
  access_prefs text[] default array[]::text[],
  resume_name text default '',
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2.2 COMPANIES
create table if not exists public.companies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  industry text default '',
  website text default '',
  logo_url text default '',
  description text default '',
  identity_verified boolean default false,
  verification_status text default 'Unverified' check (verification_status in ('Unverified', 'Submitted', 'Identity Verified', 'Suspended')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2.3 COMPANY MEMBERS
create table if not exists public.company_members (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'recruiter' check (role in ('owner', 'admin', 'recruiter', 'viewer')),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique(company_id, user_id)
);

-- 2.4 ACCESSIBILITY EVIDENCE
create table if not exists public.accessibility_evidence (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  facility_type text not null,
  label text not null,
  description text not null,
  evidence_type text default 'Self-Reported' check (evidence_type in ('Self-Reported', 'Policy Document', 'Access Audit Certificate', 'Architectural Photo', 'Employee Attestation')),
  document_url text default '',
  verification_status text default 'Self-Reported' check (verification_status in ('Self-Reported', 'Pending Review', 'Evidence Verified', 'Under Investigation', 'Flagged')),
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  reviewer_notes text default '',
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2.5 JOBS
create table if not exists public.jobs (
  id uuid default gen_random_uuid() primary key,
  employer_id uuid references public.profiles(id) on delete cascade not null,
  company_id uuid references public.companies(id) on delete cascade,
  title text not null,
  "desc" text not null,
  location text not null,
  type text not null,
  arrangement text not null,
  salary_min integer default 0,
  salary_max integer default 0,
  skills text[] default array[]::text[],
  tags text[] default array[]::text[],
  resp text[] default array[]::text[],
  qual text default '',
  active boolean default true,
  status text default 'Published' check (status in ('Published', 'Draft', 'Closed', 'Archived', 'Suspended_Fraud_Hold')),
  posted_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2.6 RESUMES (Private CV Metadata)
create table if not exists public.resumes (
  id uuid default gen_random_uuid() primary key,
  seeker_id uuid references public.profiles(id) on delete cascade not null,
  file_name text not null,
  storage_path text not null,
  file_size text default '',
  mime_type text default 'application/pdf',
  is_primary boolean default false,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2.7 APPLICATIONS
create table if not exists public.applications (
  id uuid default gen_random_uuid() primary key,
  seeker_id uuid references public.profiles(id) on delete cascade not null,
  job_id uuid references public.jobs(id) on delete cascade not null,
  resume_id uuid references public.resumes(id) on delete set null,
  cover text default '',
  resume text default '',
  status text default 'Applied' check (status in ('Applied', 'Under Review', 'Interview', 'Hired', 'Rejected', 'Withdrawn')),
  applied_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  unique(seeker_id, job_id)
);

-- 2.8 SAVED JOBS
create table if not exists public.saved_jobs (
  seeker_id uuid references public.profiles(id) on delete cascade not null,
  job_id uuid references public.jobs(id) on delete cascade not null,
  saved_at timestamptz default timezone('utc'::text, now()) not null,
  primary key (seeker_id, job_id)
);

-- 2.9 ACCESSIBILITY REPORTS
create sequence if not exists report_case_seq start 1001;

create table if not exists public.accessibility_reports (
  id uuid default gen_random_uuid() primary key,
  case_number text unique not null,
  reporter_id uuid references public.profiles(id) on delete set null,
  is_anonymous boolean default false,
  job_id uuid references public.jobs(id) on delete set null,
  company_id uuid references public.companies(id) on delete cascade,
  employer_id uuid references public.profiles(id) on delete set null,
  claim_type text not null,
  disputed_accommodation text not null,
  incident_date date,
  description text not null,
  evidence_url text default '',
  case_status text default 'Submitted' check (case_status in ('Submitted', 'Under Review', 'Employer Response Requested', 'Resolved', 'Unsubstantiated')),
  employer_response text default '',
  employer_responded_at timestamptz,
  admin_notes text default '',
  resolution_action text default 'none' check (resolution_action in ('none', 'warning_issued', 'badge_revoked', 'listing_suspended', 'account_suspended')),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2.10 AUDIT LOGS
create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action_type text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2.11 TAGS TAXONOMY
create table if not exists public.tags (
  id text primary key,
  label text not null unique,
  icon text default 'check'
);

-- ====================================================================
-- 3. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ====================================================================

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.accessibility_evidence enable row level security;
alter table public.jobs enable row level security;
alter table public.resumes enable row level security;
alter table public.applications enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.accessibility_reports enable row level security;
alter table public.audit_logs enable row level security;
alter table public.tags enable row level security;

-- ====================================================================
-- 4. CREATE RLS POLICIES (All tables exist, safe to cross-reference)
-- ====================================================================

-- PROFILES
drop policy if exists "Profiles are publicly viewable" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Never trust role values supplied in sign-up metadata. Public registration can
-- create only seekers or employers; admin accounts must be provisioned by an
-- existing trusted administrator / database operator.
create or replace function public.prevent_profile_role_escalation()
returns trigger as $$
begin
  -- Trusted SQL/service operations may provision or change roles. Browser-authenticated
  -- clients cannot promote themselves, including through user_metadata or profile upserts.
  if current_user in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;
  if tg_op = 'INSERT' and new.role = 'admin' then
    raise exception 'Administrator accounts cannot be self-created.';
  end if;
  if tg_op = 'UPDATE' and new.role is distinct from old.role then
    raise exception 'Profile roles cannot be changed through the client. Contact an administrator.';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists prevent_profile_role_escalation_insert on public.profiles;
create trigger prevent_profile_role_escalation_insert
  before insert on public.profiles
  for each row execute procedure public.prevent_profile_role_escalation();

drop trigger if exists prevent_profile_role_escalation_update on public.profiles;
create trigger prevent_profile_role_escalation_update
  before update of role on public.profiles
  for each row execute procedure public.prevent_profile_role_escalation();

-- COMPANIES
drop policy if exists "Anyone can view active companies" on public.companies;
create policy "Anyone can view active companies"
  on public.companies for select
  using (verification_status != 'Suspended');

drop policy if exists "Authenticated users can create companies" on public.companies;
create policy "Authenticated users can create companies"
  on public.companies for insert
  to authenticated
  with check (auth.uid() = created_by);

drop policy if exists "Company members can update company profile" on public.companies;
create policy "Company members can update company profile"
  on public.companies for update
  to authenticated
  using (
    auth.uid() = created_by or
    exists (
      select 1 from public.company_members cm
      where cm.company_id = companies.id
      and cm.user_id = auth.uid()
      and cm.role in ('owner', 'admin')
    )
  );

-- COMPANY MEMBERS
drop policy if exists "Company members can view their team" on public.company_members;
create policy "Company members can view their team"
  on public.company_members for select
  to authenticated
  using (
    user_id = auth.uid() or
    exists (
      select 1 from public.company_members cm
      where cm.company_id = company_members.company_id
      and cm.user_id = auth.uid()
    )
  );

-- ACCESSIBILITY EVIDENCE
drop policy if exists "Anyone can view evidence declarations" on public.accessibility_evidence;
create policy "Anyone can view evidence declarations"
  on public.accessibility_evidence for select
  using (true);

drop policy if exists "Employers can submit and update their evidence" on public.accessibility_evidence;
create policy "Employers can submit and update their evidence"
  on public.accessibility_evidence for all
  to authenticated
  using (
    exists (
      select 1 from public.company_members cm
      where cm.company_id = accessibility_evidence.company_id
      and cm.user_id = auth.uid()
    ) or exists (
      select 1 from public.companies c
      where c.id = accessibility_evidence.company_id
      and c.created_by = auth.uid()
    )
  );

-- JOBS
drop policy if exists "Anyone can read published non-suspended jobs" on public.jobs;
create policy "Anyone can read published non-suspended jobs"
  on public.jobs for select
  using (active = true and status = 'Published');

drop policy if exists "Employers can manage their jobs" on public.jobs;
create policy "Employers can manage their jobs"
  on public.jobs for all
  to authenticated
  using (
    auth.uid() = employer_id or
    exists (
      select 1 from public.company_members cm
      where cm.company_id = jobs.company_id
      and cm.user_id = auth.uid()
    )
  );

-- RESUMES
drop policy if exists "Seekers manage their own resumes" on public.resumes;
create policy "Seekers manage their own resumes"
  on public.resumes for all
  to authenticated
  using (auth.uid() = seeker_id)
  with check (auth.uid() = seeker_id);

-- APPLICATIONS
drop policy if exists "Seekers can view their applications" on public.applications;
create policy "Seekers can view their applications"
  on public.applications for select
  to authenticated
  using (auth.uid() = seeker_id);

drop policy if exists "Seekers can submit applications" on public.applications;
create policy "Seekers can submit applications"
  on public.applications for insert
  to authenticated
  with check (auth.uid() = seeker_id);

drop policy if exists "Seekers can withdraw their own applications" on public.applications;
create policy "Seekers can withdraw their own applications"
  on public.applications for update
  to authenticated
  using (auth.uid() = seeker_id)
  with check (status = 'Withdrawn');

drop policy if exists "Employers can view applications for their jobs" on public.applications;
create policy "Employers can view applications for their jobs"
  on public.applications for select
  to authenticated
  using (
    exists (
      select 1 from public.jobs j
      where j.id = applications.job_id
      and (
        j.employer_id = auth.uid() or
        exists (
          select 1 from public.company_members cm
          where cm.company_id = j.company_id and cm.user_id = auth.uid()
        )
      )
    )
  );

drop policy if exists "Employers can update application statuses for their jobs" on public.applications;
create policy "Employers can update application statuses for their jobs"
  on public.applications for update
  to authenticated
  using (
    exists (
      select 1 from public.jobs j
      where j.id = applications.job_id
      and (
        j.employer_id = auth.uid() or
        exists (
          select 1 from public.company_members cm
          where cm.company_id = j.company_id and cm.user_id = auth.uid()
        )
      )
    )
  );

-- SAVED JOBS
drop policy if exists "Seekers manage their saved jobs" on public.saved_jobs;
create policy "Seekers manage their saved jobs"
  on public.saved_jobs for all
  to authenticated
  using (auth.uid() = seeker_id)
  with check (auth.uid() = seeker_id);

-- ACCESSIBILITY REPORTS
drop policy if exists "Reporters can view their filed reports" on public.accessibility_reports;
create policy "Reporters can view their filed reports"
  on public.accessibility_reports for select
  to authenticated
  using (auth.uid() = reporter_id);

drop policy if exists "Seekers can file accessibility dispute reports" on public.accessibility_reports;
create policy "Seekers can file accessibility dispute reports"
  on public.accessibility_reports for insert
  to authenticated
  with check (auth.uid() = reporter_id or reporter_id is null);

drop policy if exists "Employers can view dispute when response is requested" on public.accessibility_reports;
create policy "Employers can view dispute when response is requested"
  on public.accessibility_reports for select
  to authenticated
  using (
    case_status in ('Employer Response Requested', 'Resolved', 'Unsubstantiated') and
    (
      auth.uid() = employer_id or
      exists (
        select 1 from public.company_members cm
        where cm.company_id = accessibility_reports.company_id and cm.user_id = auth.uid()
      )
    )
  );

drop policy if exists "Employers can submit rebuttal response" on public.accessibility_reports;
create policy "Employers can submit rebuttal response"
  on public.accessibility_reports for update
  to authenticated
  using (
    case_status = 'Employer Response Requested' and
    (
      auth.uid() = employer_id or
      exists (
        select 1 from public.company_members cm
        where cm.company_id = accessibility_reports.company_id and cm.user_id = auth.uid()
      )
    )
  );

drop policy if exists "Admins have full access to reports" on public.accessibility_reports;
create policy "Admins have full access to reports"
  on public.accessibility_reports for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- AUDIT LOGS
drop policy if exists "Admins can view audit logs" on public.audit_logs;
create policy "Admins can view audit logs"
  on public.audit_logs for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- TAGS
drop policy if exists "Public read tags" on public.tags;
create policy "Public read tags"
  on public.tags for select
  using (true);

-- Insert initial standard taxonomy tags
insert into public.tags (id, label) values
  ('wheel', 'Wheelchair-accessible workplace'),
  ('remote', 'Remote or hybrid work'),
  ('sign', 'Sign-language interpreter'),
  ('at', 'Assistive technology support'),
  ('flex', 'Flexible working hours'),
  ('int', 'Accessible interview arrangements'),
  ('quiet', 'Sensory / Quiet workspace available'),
  ('guide_dog', 'Service animals welcomed')
on conflict (id) do nothing;

-- ====================================================================
-- 5. PRIVATE STORAGE BUCKETS & POLICIES
-- ====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('resumes', 'resumes', false, 10485760, array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('evidence', 'evidence', false, 15728640, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- CV files are private. A seeker can manage only objects under their own UUID folder.
drop policy if exists "Seekers upload own CV files" on storage.objects;
create policy "Seekers upload own CV files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Seekers update own CV files" on storage.objects;
create policy "Seekers update own CV files" on storage.objects
  for update to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Seekers delete own CV files" on storage.objects;
create policy "Seekers delete own CV files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Owners and hiring employers can read CV files" on storage.objects;
create policy "Owners and hiring employers can read CV files" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'resumes' and (
      (storage.foldername(name))[1] = auth.uid()::text or
      exists (
        select 1 from public.resumes r
        join public.applications a on a.seeker_id = r.seeker_id
          and (a.resume_id = r.id or a.resume = r.file_name)
        join public.jobs j on j.id = a.job_id
        where r.storage_path = storage.objects.name
          and (j.employer_id = auth.uid() or exists (
            select 1 from public.company_members cm
            where cm.company_id = j.company_id and cm.user_id = auth.uid()
          ))
      )
    )
  );

-- Evidence files are private; company members may manage their company's evidence.
drop policy if exists "Company members manage evidence files" on storage.objects;
create policy "Company members manage evidence files" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'evidence' and exists (
      select 1 from public.company_members cm
      where cm.company_id::text = (storage.foldername(name))[1] and cm.user_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'evidence' and exists (
      select 1 from public.company_members cm
      where cm.company_id::text = (storage.foldername(name))[1] and cm.user_id = auth.uid()
    )
  );

-- ====================================================================
-- 6. TRIGGERS & FUNCTIONS
-- ====================================================================
-- ====================================================================

-- Auto-generate readable Case ID (e.g., CASE-2026-1042)
create or replace function public.generate_case_number()
returns trigger as $$
begin
  if new.case_number is null or new.case_number = '' then
    new.case_number := 'CASE-' || to_char(now(), 'YYYY') || '-' || nextval('report_case_seq');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_generate_case_number on public.accessibility_reports;
create trigger trigger_generate_case_number
  before insert on public.accessibility_reports
  for each row execute procedure public.generate_case_number();

-- Auto-create profile on Supabase Auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role, company)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    case when new.raw_user_meta_data->>'role' = 'employer' then 'employer' else 'seeker' end,
    nullif(new.raw_user_meta_data->>'company', '')
  )
  on conflict (id) do update set
    name = excluded.name,
    company = excluded.company,
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto audit logging trigger for critical actions
create or replace function public.log_report_status_change()
returns trigger as $$
begin
  if old.case_status is distinct from new.case_status then
    insert into public.audit_logs (actor_id, action_type, entity_type, entity_id, metadata)
    values (
      auth.uid(),
      'report_status_changed',
      'accessibility_report',
      new.id::text,
      json_build_object(
        'case_number', new.case_number,
        'old_status', old.case_status,
        'new_status', new.case_status,
        'resolution_action', new.resolution_action
      )::jsonb
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_log_report_status on public.accessibility_reports;
create trigger trigger_log_report_status
  after update on public.accessibility_reports
  for each row execute procedure public.log_report_status_change();
