-- =============================================================================
-- Кейс жауаптары: оқушының жазба жауабы мұғалімге көрінеді
-- =============================================================================
-- Run after 0010. Dashboard → SQL Editor → paste → Run.
--
-- Кейстің төрт қадамының ішінде өлшенетіні екеу: рөлдік ойынның ұпайы және
-- екінші қадамдағы жазба жауап. Ұпай `game_results`-қа түседі, ал жазба жауап
-- ешқайда түспей, оқушының браузерінде қалып қоятын — яғни кейстің ең құнды,
-- жалғыз сапалық деректі мұғалімге мүлдем көрінбейтін.
--
-- Бір оқушыға бір кейстен бір ғана жол болады: кейс — бір реттік тапсырма
-- емес, қайта оралуға болатын жұмыс, сондықтан жаңа жауап ескісін алмастырады
-- (`unique (user_id, case_id)`).
--
-- Иелік ережесі 0008-дегімен бірдей: жұмыс оқушынікі, пікір мұғалімдікі.
-- =============================================================================

create table if not exists public.case_responses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  -- Кейс идентификаторы — `water-drop` сияқты тұрақты слаг.
  case_id      text not null,
  answer       text not null,

  -- Рөлдік ойынның нәтижесі. Ойын өткізіп жіберілсе екеуі де null болады:
  -- өлшенбеген нәрсені нөл деп жазу оқушыны жазалаған болар еді.
  play_correct integer,
  play_total   integer,
  skipped      boolean not null default false,

  submitted_at timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- Мұғалім жағы
  teacher_feedback text,
  reviewed_by  uuid references public.profiles (id) on delete set null,
  reviewed_at  timestamptz,

  constraint case_responses_play check (
    (play_correct is null and play_total is null)
    or (play_total > 0 and play_correct between 0 and play_total)
  ),
  constraint case_responses_answer check (length(btrim(answer)) > 0),
  unique (user_id, case_id)
);

create index if not exists case_responses_user_idx
  on public.case_responses (user_id, updated_at desc);
create index if not exists case_responses_case_idx
  on public.case_responses (case_id, updated_at desc);

-- -----------------------------------------------------------------------------
-- Жұмыс оқушынікі, пікір мұғалімдікі.
--
-- RLS жолды өзгертуге бола ма дегенді шешеді, ал бұл — қай бағанның шынымен
-- өзгергенін. Онсыз оқушы өз жолына өзі «жарайсың» деп пікір жаза алар еді.
-- -----------------------------------------------------------------------------
create or replace function public.protect_case_response_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.id := old.id;
  new.user_id := old.user_id;
  new.case_id := old.case_id;
  new.submitted_at := old.submitted_at;

  if auth.uid() = old.user_id then
    -- Оқушы жауабын қайта жаза алады. Пікір оның қолы жететін жер емес.
    new.teacher_feedback := old.teacher_feedback;
    new.reviewed_by := old.reviewed_by;
    new.reviewed_at := old.reviewed_at;
    new.updated_at := now();

  elsif public.is_my_student(old.user_id) then
    -- Мұғалім пікір жаза алады. Жауап оның қолы жететін жер емес.
    new.answer := old.answer;
    new.play_correct := old.play_correct;
    new.play_total := old.play_total;
    new.skipped := old.skipped;
    new.updated_at := old.updated_at;
    if new.teacher_feedback is distinct from old.teacher_feedback then
      new.reviewed_by := auth.uid();
      new.reviewed_at := now();
    end if;

  else
    raise exception 'not allowed to modify this case response';
  end if;

  return new;
end;
$$;

drop trigger if exists case_responses_protect on public.case_responses;
create trigger case_responses_protect
  before update on public.case_responses
  for each row execute function public.protect_case_response_columns();

-- -----------------------------------------------------------------------------
-- Row level security
-- -----------------------------------------------------------------------------
alter table public.case_responses enable row level security;

drop policy if exists case_responses_select on public.case_responses;
create policy case_responses_select on public.case_responses
  for select using (user_id = auth.uid() or public.is_my_student(user_id));

drop policy if exists case_responses_insert on public.case_responses;
create policy case_responses_insert on public.case_responses
  for insert with check (user_id = auth.uid());

-- Екі жақ та жаңарта алады; қай баған қозғалатынын жоғарыдағы триггер шешеді.
drop policy if exists case_responses_update on public.case_responses;
create policy case_responses_update on public.case_responses
  for update using (user_id = auth.uid() or public.is_my_student(user_id))
  with check (user_id = auth.uid() or public.is_my_student(user_id));
