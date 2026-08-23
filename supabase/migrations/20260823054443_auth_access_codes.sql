-- EduFit Nepal - Gated login: school codes + per-member access codes
-- Login rule: a teacher/student can only sign in with an email + password that
-- exists in auth.users AND the matching school code + personal access code.

-- pgcrypto is used by seed files to bcrypt-hash preloaded passwords
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ================================================================
-- School access code (e.g. SCH-KTM-2026)
-- ================================================================
ALTER TABLE public.school_profiles
    ADD COLUMN IF NOT EXISTS school_code TEXT;

-- One code per school (partial unique index keeps NULLs allowed)
CREATE UNIQUE INDEX IF NOT EXISTS idx_school_profiles_school_code
    ON public.school_profiles(school_code)
    WHERE school_code IS NOT NULL;

-- ================================================================
-- School members: preloaded teachers/students and their personal codes
-- access_code = teacher code (TCH-...) or student code (STU-...)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.school_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE CHECK (email = lower(email)),
    member_role TEXT NOT NULL CHECK (member_role IN ('teacher', 'student')),
    full_name TEXT NOT NULL,
    school_id UUID NOT NULL REFERENCES public.school_profiles(id) ON DELETE CASCADE,
    access_code TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    -- A given personal code maps to exactly one member per role within a school
    UNIQUE (school_id, member_role, access_code)
);

ALTER TABLE public.school_members ENABLE ROW LEVEL SECURITY;

-- Members may read only their own row (school code validation happens
-- server-side via the service-role key, never from the browser)
CREATE POLICY "Members can view their own membership"
ON public.school_members FOR SELECT
USING (auth.uid() = user_id);

CREATE TRIGGER update_school_members_updated_at
    BEFORE UPDATE ON public.school_members
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_school_members_user_id ON public.school_members(user_id);
CREATE INDEX IF NOT EXISTS idx_school_members_email ON public.school_members(email);
CREATE INDEX IF NOT EXISTS idx_school_members_school_id ON public.school_members(school_id);

COMMENT ON COLUMN public.school_profiles.school_code IS 'School-wide access code used at login, e.g. SCH-KTM-2026';
COMMENT ON COLUMN public.school_members.access_code IS 'Personal login code: TCH-* for teachers, STU-* for students';
