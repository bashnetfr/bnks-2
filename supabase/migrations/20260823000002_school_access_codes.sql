-- EduFit Nepal - School Access Codes
-- Adds a unique access code to school_profiles so student surveys can
-- resolve their school from the code-based auth flow (school_id is a
-- UUID foreign key, but students authenticate with codes like SCH-KTM-2026).

ALTER TABLE public.school_profiles ADD COLUMN IF NOT EXISTS access_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_school_profiles_access_code
    ON public.school_profiles(access_code);
