-- EduFit Nepal - Student Event Saves & Matching Profiles
-- Persists the events finder state that previously lived in localStorage.
-- Identity is an owner_key derived from the session login (staff/student
-- email, or code:<school_code> for code-only logins).

CREATE TABLE IF NOT EXISTS public.student_saved_events (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    owner_key TEXT NOT NULL,
    event_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (owner_key, event_id)
);

CREATE TABLE IF NOT EXISTS public.student_event_profiles (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    owner_key TEXT NOT NULL UNIQUE,
    education_level TEXT NOT NULL DEFAULT 'bachelors',
    interests TEXT[] NOT NULL DEFAULT '{}',
    location TEXT NOT NULL DEFAULT '',
    prefer_free BOOLEAN NOT NULL DEFAULT false,
    prefer_online BOOLEAN NOT NULL DEFAULT false,
    prefer_team BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: deny-all for anon/authenticated clients — these tables are only
-- accessed through /api/events/* routes using the service-role key.
ALTER TABLE public.student_saved_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_event_profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_student_saved_events_owner ON public.student_saved_events(owner_key);
CREATE INDEX IF NOT EXISTS idx_student_event_profiles_owner ON public.student_event_profiles(owner_key);

-- Reuse the shared updated_at trigger function from init.sql
DROP TRIGGER IF EXISTS update_student_event_profiles_updated_at ON public.student_event_profiles;
CREATE TRIGGER update_student_event_profiles_updated_at BEFORE UPDATE ON public.student_event_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
