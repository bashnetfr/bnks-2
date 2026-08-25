-- Ed-Vantage - Student record grade level
-- Teachers add student records with an optional class/grade, stored on
-- the school_members row alongside role and access code.

ALTER TABLE public.school_members
    ADD COLUMN IF NOT EXISTS grade_level TEXT;
