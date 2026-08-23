-- EduFit Nepal - Initial Schema
-- This migration sets up the core tables for the EduFit Nepal platform

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- Profiles (extends auth.users)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    updated_at TIMESTAMP WITH TIME ZONE,
    role TEXT CHECK (role IN ('admin', 'school_admin', 'ngo_staff', 'municipality_official')) DEFAULT 'ngo_staff',
    full_name TEXT,
    avatar_url TEXT,
    website TEXT
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ================================================================
-- School Profiles
-- ================================================================
CREATE TABLE IF NOT EXISTS public.school_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    district TEXT NOT NULL,
    school_type TEXT CHECK (school_type IN ('public', 'private', 'community', 'religious', 'international')) NOT NULL,
    student_count INTEGER NOT NULL CHECK (student_count >= 0),
    grade_levels TEXT[] NOT NULL, -- Array of grade levels: primary, lower_secondary, secondary, higher_secondary
    teacher_count INTEGER NOT NULL CHECK (teacher_count >= 0),
    technology_usage TEXT CHECK (technology_usage IN ('none', 'minimal', 'moderate', 'substantial', 'advanced')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on school_profiles
ALTER TABLE public.school_profiles ENABLE ROW LEVEL SECURITY;

-- School profiles policies
CREATE POLICY "School profiles are viewable by everyone"
ON public.school_profiles FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert school profiles"
ON public.school_profiles FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update school profiles based on their role"
ON public.school_profiles FOR UPDATE
USING (
    auth.role() = 'authenticated' AND
    (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'school_admin', 'ngo_staff', 'municipality_official')
        )
    )
);

-- ================================================================
-- Student Surveys
-- ================================================================
CREATE TABLE IF NOT EXISTS public.student_surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.school_profiles(id) ON DELETE CASCADE NOT NULL,
    auth_method TEXT CHECK (auth_method IN ('school_email', 'school_code')) NOT NULL,
    device_ownership TEXT CHECK (device_ownership IN ('none', 'shared_family', 'personal_basic', 'personal_smartphone', 'personal_computer')) NOT NULL,
    internet_access TEXT CHECK (internet_access IN ('none', 'mobile_data_limited', 'mobile_data_adequate', 'home_broadband', 'school_only')) NOT NULL,
    average_daily_screen_time_minutes INTEGER NOT NULL CHECK (average_daily_screen_time_minutes >= 0),
    learning_preference TEXT CHECK (learning_preference IN ('text', 'video', 'interactive', 'audio', 'mixed')) NOT NULL,
    digital_confidence INTEGER NOT NULL CHECK (digital_confidence >= 1 AND digital_confidence <= 5),
    has_quiet_study_space BOOLEAN NOT NULL,
    access_limitations TEXT[] NOT NULL DEFAULT '{}',
    completed_on_shared_device BOOLEAN NOT NULL DEFAULT false,
    submitted_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on student_surveys
ALTER TABLE public.student_surveys ENABLE ROW LEVEL SECURITY;

-- Student surveys policies
CREATE POLICY "Student surveys are viewable by authenticated users"
ON public.student_surveys FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert student surveys"
ON public.student_surveys FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update student surveys"
ON public.student_surveys FOR UPDATE
USING (auth.role() = 'authenticated');

-- ================================================================
-- Infrastructure Assessments
-- ================================================================
CREATE TABLE IF NOT EXISTS public.infrastructure_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.school_profiles(id) ON DELETE CASCADE NOT NULL,
    internet_connectivity INTEGER NOT NULL CHECK (internet_connectivity >= 0 AND internet_connectivity <= 4),
    device_availability INTEGER NOT NULL CHECK (device_availability >= 0 AND device_availability <= 4),
    power_reliability INTEGER NOT NULL CHECK (power_reliability >= 0 AND power_reliability <= 4),
    bandwidth_adequacy INTEGER NOT NULL CHECK (bandwidth_adequacy >= 0 AND bandwidth_adequacy <= 4),
    technical_support INTEGER NOT NULL CHECK (technical_support >= 0 AND technical_support <= 4),
    additional_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on infrastructure_assessments
ALTER TABLE public.infrastructure_assessments ENABLE ROW LEVEL SECURITY;

-- Infrastructure assessments policies
CREATE POLICY "Infrastructure assessments are viewable by authenticated users"
ON public.infrastructure_assessments FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert infrastructure assessments"
ON public.infrastructure_assessments FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update infrastructure assessments"
ON public.infrastructure_assessments FOR UPDATE
USING (auth.role() = 'authenticated');

-- ================================================================
-- Teacher Readiness Assessments
-- ================================================================
CREATE TABLE IF NOT EXISTS public.teacher_readiness_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.school_profiles(id) ON DELETE CASCADE NOT NULL,
    digital_literacy INTEGER NOT NULL CHECK (digital_literacy >= 0 AND digital_literacy <= 4),
    edtech_experience INTEGER NOT NULL CHECK (edtech_experience >= 0 AND edtech_experience <= 4),
    training_willingness INTEGER NOT NULL CHECK (training_willingness >= 0 AND training_willingness <= 4),
    ict_curriculum_integration INTEGER NOT NULL CHECK (ict_curriculum_integration >= 0 AND ict_curriculum_integration <= 4),
    device_personal_ownership INTEGER NOT NULL CHECK (device_personal_ownership >= 0 AND device_personal_ownership <= 4),
    additional_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on teacher_readiness_assessments
ALTER TABLE public.teacher_readiness_assessments ENABLE ROW LEVEL SECURITY;

-- Teacher readiness assessments policies
CREATE POLICY "Teacher readiness assessments are viewable by authenticated users"
ON public.teacher_readiness_assessments FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert teacher readiness assessments"
ON public.teacher_readiness_assessments FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update teacher readiness assessments"
ON public.teacher_readiness_assessments FOR UPDATE
USING (auth.role() = 'authenticated');

-- ================================================================
-- School Management Assessments
-- ================================================================
CREATE TABLE IF NOT EXISTS public.school_management_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.school_profiles(id) ON DELETE CASCADE NOT NULL,
    leadership_buy_in INTEGER NOT NULL CHECK (leadership_buy_in >= 0 AND leadership_buy_in <= 4),
    budget_allocation INTEGER NOT NULL CHECK (budget_allocation >= 0 AND budget_allocation <= 4),
    policy_framework INTEGER NOT NULL CHECK (policy_framework >= 0 AND policy_framework <= 4),
    parent_community_support INTEGER NOT NULL CHECK (parent_community_support >= 0 AND parent_community_support <= 4),
    data_privacy_awareness INTEGER NOT NULL CHECK (data_privacy_awareness >= 0 AND data_privacy_awareness <= 4),
    additional_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on school_management_assessments
ALTER TABLE public.school_management_assessments ENABLE ROW LEVEL SECURITY;

-- School management assessments policies
CREATE POLICY "School management assessments are viewable by authenticated users"
ON public.school_management_assessments FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert school management assessments"
ON public.school_management_assessments FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update school management assessments"
ON public.school_management_assessments FOR UPDATE
USING (auth.role() = 'authenticated');

-- ================================================================
-- Learning Requirements Assessments
-- ================================================================
CREATE TABLE IF NOT EXISTS public.learning_requirements_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.school_profiles(id) ON DELETE CASCADE NOT NULL,
    curriculum_alignment INTEGER NOT NULL CHECK (curriculum_alignment >= 0 AND curriculum_alignment <= 4),
    student_access_at_home INTEGER NOT NULL CHECK (student_access_at_home >= 0 AND student_access_at_home <= 4),
    language_support INTEGER NOT NULL CHECK (language_support >= 0 AND language_support <= 4),
    accessibility_needs INTEGER NOT NULL CHECK (accessibility_needs >= 0 AND accessibility_needs <= 4),
    blended_learning_readiness INTEGER NOT NULL CHECK (blended_learning_readiness >= 0 AND blended_learning_readiness <= 4),
    additional_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on learning_requirements_assessments
ALTER TABLE public.learning_requirements_assessments ENABLE ROW LEVEL SECURITY;

-- Learning requirements assessments policies
CREATE POLICY "Learning requirements assessments are viewable by authenticated users"
ON public.learning_requirements_assessments FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert learning requirements assessments"
ON public.learning_requirements_assessments FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update learning requirements assessments"
ON public.learning_requirements_assessments FOR UPDATE
USING (auth.role() = 'authenticated');

-- ================================================================
-- EdTech Tools
-- ================================================================
CREATE TABLE IF NOT EXISTS public.edtech_tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    bandwidth_requirement TEXT CHECK (bandwidth_requirement IN ('offline', 'low', 'medium', 'high')) NOT NULL,
    cost_model TEXT CHECK (cost_model IN ('free', 'freemium', 'subscription', 'one_time', 'government_licensed')) NOT NULL,
    cost_usd_per_student_year DECIMAL(10,2),
    deployment_mode TEXT CHECK (deployment_mode IN ('web', 'app', 'both', 'offline_capable')) NOT NULL,
    supports_low_bandwidth BOOLEAN NOT NULL,
    nepali_language_support BOOLEAN NOT NULL,
    minimum_device_spec TEXT CHECK (minimum_device_spec IN ('basic', 'mid', 'high')) NOT NULL,
    teacher_training_days_required INTEGER NOT NULL CHECK (teacher_training_days_required >= 0),
    online_support_available BOOLEAN NOT NULL,
    infrastructure_requirement INTEGER NOT NULL CHECK (infrastructure_requirement >= 0 AND infrastructure_requirement <= 4),
    teacher_readiness_requirement INTEGER NOT NULL CHECK (teacher_readiness_requirement >= 0 AND teacher_readiness_requirement <= 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on edtech_tools
ALTER TABLE public.edtech_tools ENABLE ROW LEVEL SECURITY;

-- EdTech tools policies
CREATE POLICY "EdTech tools are viewable by everyone"
ON public.edtech_tools FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert EdTech tools"
ON public.edtech_tools FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update EdTech tools based on their role"
ON public.edtech_tools FOR UPDATE
USING (
    auth.role() = 'authenticated' AND
    (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'ngo_staff')
        )
    )
);

-- ================================================================
-- Compatibility Results
-- ================================================================
CREATE TABLE IF NOT EXISTS public.compatibility_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_id UUID REFERENCES public.edtech_tools(id) ON DELETE CASCADE NOT NULL,
    school_id UUID REFERENCES public.school_profiles(id) ON DELETE CASCADE NOT NULL,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    recommendation TEXT CHECK (recommendation IN ('recommended', 'conditional', 'not_recommended')) NOT NULL,
    problems TEXT[] NOT NULL DEFAULT '{}',
    reality_gap_flag BOOLEAN NOT NULL DEFAULT false,
    reality_gap_details TEXT,
    incomplete_data_flag BOOLEAN NOT NULL DEFAULT false,
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Dimension scores as JSONB for flexibility
    infrastructure_score INTEGER NOT NULL CHECK (infrastructure_score >= 0 AND infrastructure_score <= 100),
    infrastructure_weight DECIMAL(3,2) NOT NULL CHECK (infrastructure_weight >= 0 AND infrastructure_weight <= 1),
    infrastructure_problems TEXT[] NOT NULL DEFAULT '{}',
    infrastructure_tooltip_explanation TEXT,
    teacher_readiness_score INTEGER NOT NULL CHECK (teacher_readiness_score >= 0 AND teacher_readiness_score <= 100),
    teacher_readiness_weight DECIMAL(3,2) NOT NULL CHECK (teacher_readiness_weight >= 0 AND teacher_readiness_weight <= 1),
    teacher_readiness_problems TEXT[] NOT NULL DEFAULT '{}',
    teacher_readiness_tooltip_explanation TEXT,
    school_management_score INTEGER NOT NULL CHECK (school_management_score >= 0 AND school_management_score <= 100),
    school_management_weight DECIMAL(3,2) NOT NULL CHECK (school_management_weight >= 0 AND school_management_weight <= 1),
    school_management_problems TEXT[] NOT NULL DEFAULT '{}',
    school_management_tooltip_explanation TEXT,
    learning_requirements_score INTEGER NOT NULL CHECK (learning_requirements_score >= 0 AND learning_requirements_score <= 100),
    learning_requirements_weight DECIMAL(3,2) NOT NULL CHECK (learning_requirements_weight >= 0 AND learning_requirements_weight <= 1),
    learning_requirements_problems TEXT[] NOT NULL DEFAULT '{}',
    learning_requirements_tooltip_explanation TEXT
);

-- Enable RLS on compatibility_results
ALTER TABLE public.compatibility_results ENABLE ROW LEVEL SECURITY;

-- Compatibility results policies
CREATE POLICY "Compatibility results are viewable by authenticated users"
ON public.compatibility_results FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert compatibility results"
ON public.compatibility_results FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- ================================================================
-- Resources (Resource Hub)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT CHECK (type IN ('scholarship', 'competition', 'learning_resource', 'digital_material')) NOT NULL,
    url TEXT NOT NULL,
    eligibility TEXT NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE,
    provider TEXT NOT NULL,
    is_free BOOLEAN NOT NULL,
    language TEXT CHECK (language IN ('nepali', 'english', 'both')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on resources
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Resources policies
CREATE POLICY "Resources are viewable by everyone"
ON public.resources FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert resources"
ON public.resources FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update resources based on their role"
ON public.resources FOR UPDATE
USING (
    auth.role() = 'authenticated' AND
    (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'ngo_staff')
        )
    )
);

-- ================================================================
-- Updated At Triggers
-- ================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for tables that need updated_at
DO $$
DECLARE
    tables TEXT[] := ARRAY['school_profiles', 'infrastructure_assessments', 'teacher_readiness_assessments', 'school_management_assessments', 'learning_requirements_assessments', 'edtech_tools', 'compatibility_results', 'resources'];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS update_%s_updated_at ON %s;',
            table_name, table_name
        );
        EXECUTE format(
            'CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();',
            table_name, table_name
        );
    END LOOP;
END $$;

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_school_profiles_location ON public.school_profiles(location);
CREATE INDEX IF NOT EXISTS idx_school_profiles_district ON public.school_profiles(district);
CREATE INDEX IF NOT EXISTS idx_school_profiles_school_type ON public.school_profiles(school_type);
CREATE INDEX IF NOT EXISTS idx_student_surveys_school_id ON public.student_surveys(school_id);
CREATE INDEX IF NOT EXISTS idx_student_surveys_submitted_at ON public.student_surveys(submitted_at);
CREATE INDEX IF NOT EXISTS idx_edtech_tools_category ON public.edtech_tools(category);
CREATE INDEX IF NOT EXISTS idx_edtech_tools_cost_model ON public.edtech_tools(cost_model);
CREATE INDEX IF NOT EXISTS idx_compatibility_results_tool_id ON public.compatibility_results(tool_id);
CREATE INDEX IF NOT EXISTS idx_compatibility_results_school_id ON public.compatibility_results(school_id);
CREATE INDEX IF NOT EXISTS idx_compatibility_results_overall_score ON public.compatibility_results(overall_score);
CREATE INDEX IF NOT EXISTS idx_resources_type ON public.resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_is_free ON public.resources(is_free);
CREATE INDEX IF NOT EXISTS idx_resources_language ON public.resources(language);

-- Comment on the schema
COMMENT ON SCHEMA public IS 'standard public schema';