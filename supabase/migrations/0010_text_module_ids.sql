-- =============================================================================
-- Сабақ идентификаторларын мәтіндік форматқа көшіру
-- =============================================================================
-- Run after 0009. Application lesson ids are stable slugs such as
-- `bridge-strength`, while the original learning-record tables accepted only
-- integers. Converting existing numeric values through text preserves all rows
-- and allows both the legacy module numbers and the current lesson slugs.
-- =============================================================================

alter table public.quiz_attempts
  alter column module_id type text using module_id::text;

alter table public.game_results
  alter column module_id type text using module_id::text;

alter table public.assignment_submissions
  alter column module_id type text using module_id::text;

alter table public.competency_assessments
  alter column module_id type text using module_id::text;
