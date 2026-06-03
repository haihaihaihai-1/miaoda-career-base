-- ============================================================================
-- HireFlow brand · candidates / assessments 数据模型
-- 适用：Supabase / Postgres 15+
-- 部署：
--   psql $SUPABASE_DB_URL -f supabase/migrations/0001_hireflow.sql
-- 或：
--   supabase db push  (本地启动后)
--
-- ⚠️ RLS 必须开启 —— 候选人 PII 数据严格按 assessor_id 隔离
-- ============================================================================

-- ----------------------------------------------------------------------------
-- enum：面试阶段
-- ----------------------------------------------------------------------------
do $$ begin
    create type interview_stage as enum ('initial','technical','final','offer','rejected');
exception
    when duplicate_object then null;
end $$;

-- ----------------------------------------------------------------------------
-- enum：招聘推荐
-- ----------------------------------------------------------------------------
do $$ begin
    create type assessment_recommendation as enum ('strong_hire','hire','on_hold','no_hire');
exception
    when duplicate_object then null;
end $$;

-- ----------------------------------------------------------------------------
-- table: candidates
-- ----------------------------------------------------------------------------
create table if not exists public.candidates (
    id                  uuid primary key default gen_random_uuid(),
    assessor_id         uuid not null,                              -- 拥有候选人的 HR / 面试官
    name                text not null,
    email               text,
    phone               text,
    target_position     text not null,
    experience_years    int  not null default 0,
    interview_stage     interview_stage not null default 'initial',
    competency_scores   jsonb,                                       -- {professional, learning, communication, resilience, leadership}
    overall_match_rate  numeric(5,2),                                -- 0-100
    notes               text,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

create index if not exists idx_candidates_assessor       on public.candidates(assessor_id);
create index if not exists idx_candidates_target         on public.candidates(target_position);
create index if not exists idx_candidates_stage          on public.candidates(interview_stage);
create index if not exists idx_candidates_created_at     on public.candidates(created_at desc);

-- 自动维护 updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at := now();
    return new;
end $$;

drop trigger if exists trg_candidates_updated_at on public.candidates;
create trigger trg_candidates_updated_at
    before update on public.candidates
    for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- table: assessments
-- ----------------------------------------------------------------------------
create table if not exists public.assessments (
    id                    uuid primary key default gen_random_uuid(),
    candidate_id          uuid not null references public.candidates(id) on delete cascade,
    assessor_id           uuid not null,
    job_position_id       uuid,                                          -- 关联 dual_tower 岗位（可空）
    stage                 interview_stage not null default 'initial',
    answers               jsonb not null default '[]'::jsonb,            -- AssessmentAnswer[]
    ai_dialogue_summary   text,
    pdf_report_url        text,
    scores                jsonb,                                          -- CompetencyScores
    match_rate            numeric(5,2),
    recommendation        assessment_recommendation,
    created_at            timestamptz not null default now()
);

create index if not exists idx_assessments_candidate     on public.assessments(candidate_id);
create index if not exists idx_assessments_assessor      on public.assessments(assessor_id);
create index if not exists idx_assessments_stage         on public.assessments(stage);
create index if not exists idx_assessments_recommendation on public.assessments(recommendation);

-- ----------------------------------------------------------------------------
-- RLS 策略
-- ----------------------------------------------------------------------------
alter table public.candidates  enable row level security;
alter table public.assessments enable row level security;

-- candidates: assessor 仅能读写自己的候选人
drop policy if exists "candidates_owner_select" on public.candidates;
create policy "candidates_owner_select" on public.candidates
    for select using (assessor_id = auth.uid());

drop policy if exists "candidates_owner_insert" on public.candidates;
create policy "candidates_owner_insert" on public.candidates
    for insert with check (assessor_id = auth.uid());

drop policy if exists "candidates_owner_update" on public.candidates;
create policy "candidates_owner_update" on public.candidates
    for update using (assessor_id = auth.uid());

drop policy if exists "candidates_owner_delete" on public.candidates;
create policy "candidates_owner_delete" on public.candidates
    for delete using (assessor_id = auth.uid());

-- assessments: 同上
drop policy if exists "assessments_owner_select" on public.assessments;
create policy "assessments_owner_select" on public.assessments
    for select using (assessor_id = auth.uid());

drop policy if exists "assessments_owner_insert" on public.assessments;
create policy "assessments_owner_insert" on public.assessments
    for insert with check (assessor_id = auth.uid());

drop policy if exists "assessments_owner_update" on public.assessments;
create policy "assessments_owner_update" on public.assessments
    for update using (assessor_id = auth.uid());

drop policy if exists "assessments_owner_delete" on public.assessments;
create policy "assessments_owner_delete" on public.assessments
    for delete using (assessor_id = auth.uid());

-- ----------------------------------------------------------------------------
-- View: candidate_summary —— 列表页常用聚合
-- ----------------------------------------------------------------------------
create or replace view public.candidate_summary as
select
    c.id,
    c.name,
    c.target_position,
    c.experience_years,
    c.interview_stage,
    c.overall_match_rate,
    c.created_at,
    (
        select count(*) from public.assessments a where a.candidate_id = c.id
    ) as assessment_count,
    (
        select recommendation
        from public.assessments a
        where a.candidate_id = c.id
        order by a.created_at desc
        limit 1
    ) as latest_recommendation
from public.candidates c;

-- ----------------------------------------------------------------------------
-- 注释
-- ----------------------------------------------------------------------------
comment on table public.candidates is 'HireFlow 候选人主表（PII）。RLS 按 assessor_id 隔离。';
comment on table public.assessments is 'HireFlow 评估记录。一个 candidate 可有多次 assessments 对应不同 stage。';
comment on column public.candidates.competency_scores is 'JSON: {professional,learning,communication,resilience,leadership} 0-100';
comment on column public.assessments.answers is 'JSON 数组：AssessmentAnswer[]';
