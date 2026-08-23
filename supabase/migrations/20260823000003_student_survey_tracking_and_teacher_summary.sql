-- ================================================================
-- EduFit Nepal — Per-student survey tracking + teacher summary RPC
-- ----------------------------------------------------------------
-- 1) student_surveys.submitted_by: ties a submission to the signed-in
--    student so the monthly-survey gate can check "did THIS student
--    already submit this month?". Nullable: legacy/anon submissions.
-- 2) get_teacher_dashboard_summary(): aggregate-only counts for the
--    teacher dashboard (never exposes individual answers).
-- ================================================================

ALTER TABLE public.student_surveys
  ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_student_surveys_submitted_by
  ON public.student_surveys (submitted_by, submitted_at);

-- Students may read their own submissions (used by the monthly gate)
DROP POLICY IF EXISTS "Students can view own survey submissions" ON public.student_surveys;
CREATE POLICY "Students can view own survey submissions"
  ON public.student_surveys FOR SELECT
  TO authenticated
  USING (submitted_by = auth.uid());

-- Aggregate-only dashboard summary for teachers of the given school.
-- SECURITY DEFINER so counts can be computed without exposing rows.
CREATE OR REPLACE FUNCTION public.get_teacher_dashboard_summary(p_school_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_is_active_teacher boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.school_members m
    WHERE m.user_id = auth.uid()
      AND m.school_id = p_school_id
      AND m.member_role = 'teacher'
      AND m.is_active
  ) INTO v_is_active_teacher;

  IF NOT v_is_active_teacher THEN
    RETURN NULL;
  END IF;

  RETURN json_build_object(
    'totalStudents', (
      SELECT count(*)::int
      FROM public.school_members m2
      WHERE m2.school_id = p_school_id
        AND m2.member_role = 'student'
        AND m2.is_active
    ),
    'surveysThisMonth', (
      SELECT count(*)::int
      FROM public.student_surveys s
      WHERE s.school_id = p_school_id
        AND s.submitted_at >= date_trunc('month', now())
    ),
    'surveysTotal', (
      SELECT count(*)::int
      FROM public.student_surveys s
      WHERE s.school_id = p_school_id
    ),
    'avgDigitalConfidence', (
      SELECT round(avg(s.digital_confidence)::numeric, 1)::float8
      FROM public.student_surveys s
      WHERE s.school_id = p_school_id
    ),
    'studentsWithNoDevice', (
      SELECT count(*)::int
      FROM public.student_surveys s
      WHERE s.school_id = p_school_id
        AND s.device_ownership = 'none'
    ),
    'studentsWithNoHomeInternet', (
      SELECT count(*)::int
      FROM public.student_surveys s
      WHERE s.school_id = p_school_id
        AND s.internet_access IN ('none', 'school_only')
    ),
    'quietSpaceCount', (
      SELECT count(*)::int
      FROM public.student_surveys s
      WHERE s.school_id = p_school_id
        AND s.has_quiet_study_space
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_teacher_dashboard_summary(uuid) TO authenticated;
