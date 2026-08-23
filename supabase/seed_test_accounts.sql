-- ================================================================
-- EduFit Nepal — Test accounts for gated login
-- ----------------------------------------------------------------
-- Shared password for ALL accounts below:  Test@2026
-- Login requires ALL of: email + password + school code + personal code
-- (TCH-* = teacher code, STU-* = student code)
--
-- | Case                          | Email                              | School Code   | Personal Code |
-- |-------------------------------|------------------------------------|---------------|---------------|
-- | Teacher login (valid)         | teacher.ktm@edufit-test.edu.np     | SCH-KTM-2026  | TCH-KTM-001   |
-- | Student login (valid)         | student.ktm@edufit-test.edu.np     | SCH-KTM-2026  | STU-KTM-001   |
-- | Second school teacher (valid) | teacher.lal@edufit-test.edu.np     | SCH-LAL-2026  | TCH-LAL-001   |
-- | Second school student (valid) | student.lal@edufit-test.edu.np     | SCH-LAL-2026  | STU-LAL-001   |
-- | Disabled account (rejected)   | teacher.disabled@edufit-test.edu.np| SCH-KTM-2026  | TCH-KTM-002   |
-- | Wrong password                | any account                        | correct       | correct       |
-- | Wrong school code             | any KTM account                    | SCH-LAL-2026  | correct       |
-- | Wrong personal code           | any account                        | correct       | TCH-LAL-001   |
-- | Role mismatch                 | student creds under "Teacher" tab  | correct       | correct       |
--
-- Safe to re-run (idempotent via fixed UUIDs + ON CONFLICT).
-- ================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ----------------------------------------------------------------
-- Schools
-- ----------------------------------------------------------------
INSERT INTO public.school_profiles
    (id, name, location, district, school_type, student_count, grade_levels, teacher_count, technology_usage, school_code)
VALUES
    ('11111111-1111-4111-8111-111111111111', 'Shree Jana Jyoti Secondary School',
     'Kathmandu Municipality - Ward 4', 'Kathmandu', 'community', 450,
     ARRAY['primary','lower_secondary','secondary'], 22, 'minimal', 'SCH-KTM-2026'),
    ('22222222-2222-4222-8222-222222222222', 'Laliguras Community School',
     'Lalitpur Metropolitan - Ward 7', 'Lalitpur', 'community', 320,
     ARRAY['primary','lower_secondary','secondary'], 16, 'minimal', 'SCH-LAL-2026')
ON CONFLICT (id) DO UPDATE
    SET school_code = EXCLUDED.school_code,
        name = EXCLUDED.name;

-- ----------------------------------------------------------------
-- auth.users (passwords preloaded; email confirmed so sign-in works)
-- ----------------------------------------------------------------
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change, email_change_token_new
) VALUES
    ('00000000-0000-0000-0000-000000000000', 'aaaa1111-0000-4000-8000-000000000001',
     'authenticated', 'authenticated', 'teacher.ktm@edufit-test.edu.np',
     extensions.crypt('Test@2026', extensions.gen_salt('bf')),
     NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}',
     '{"role":"teacher","full_name":"Sita Sharma"}', '', '', '', ''),

    ('00000000-0000-0000-0000-000000000000', 'bbbb2222-0000-4000-8000-000000000002',
     'authenticated', 'authenticated', 'student.ktm@edufit-test.edu.np',
     extensions.crypt('Test@2026', extensions.gen_salt('bf')),
     NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}',
     '{"role":"student","full_name":"Aarav Tamang"}', '', '', '', ''),

    ('00000000-0000-0000-0000-000000000000', 'cccc3333-0000-4000-8000-000000000003',
     'authenticated', 'authenticated', 'teacher.lal@edufit-test.edu.np',
     extensions.crypt('Test@2026', extensions.gen_salt('bf')),
     NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}',
     '{"role":"teacher","full_name":"Rajesh Gurung"}', '', '', '', ''),

    ('00000000-0000-0000-0000-000000000000', 'dddd4444-0000-4000-8000-000000000004',
     'authenticated', 'authenticated', 'student.lal@edufit-test.edu.np',
     extensions.crypt('Test@2026', extensions.gen_salt('bf')),
     NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}',
     '{"role":"student","full_name":"Pooja Maharjan"}', '', '', '', ''),

    ('00000000-0000-0000-0000-000000000000', 'eeee5555-0000-4000-8000-000000000005',
     'authenticated', 'authenticated', 'teacher.disabled@edufit-test.edu.np',
     extensions.crypt('Test@2026', extensions.gen_salt('bf')),
     NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}',
     '{"role":"teacher","full_name":"Bikash Thapa (Disabled)"}', '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------
-- auth.identities (required for email/password sign-in)
-- ----------------------------------------------------------------
INSERT INTO auth.identities (user_id, provider, provider_id, identity_data, last_sign_in_at, created_at, updated_at)
VALUES
    ('aaaa1111-0000-4000-8000-000000000001', 'email', 'aaaa1111-0000-4000-8000-000000000001',
     jsonb_build_object('sub','aaaa1111-0000-4000-8000-000000000001','email','teacher.ktm@edufit-test.edu.np','email_verified',true),
     NOW(), NOW(), NOW()),
    ('bbbb2222-0000-4000-8000-000000000002', 'email', 'bbbb2222-0000-4000-8000-000000000002',
     jsonb_build_object('sub','bbbb2222-0000-4000-8000-000000000002','email','student.ktm@edufit-test.edu.np','email_verified',true),
     NOW(), NOW(), NOW()),
    ('cccc3333-0000-4000-8000-000000000003', 'email', 'cccc3333-0000-4000-8000-000000000003',
     jsonb_build_object('sub','cccc3333-0000-4000-8000-000000000003','email','teacher.lal@edufit-test.edu.np','email_verified',true),
     NOW(), NOW(), NOW()),
    ('dddd4444-0000-4000-8000-000000000004', 'email', 'dddd4444-0000-4000-8000-000000000004',
     jsonb_build_object('sub','dddd4444-0000-4000-8000-000000000004','email','student.lal@edufit-test.edu.np','email_verified',true),
     NOW(), NOW(), NOW()),
    ('eeee5555-0000-4000-8000-000000000005', 'email', 'eeee5555-0000-4000-8000-000000000005',
     jsonb_build_object('sub','eeee5555-0000-4000-8000-000000000005','email','teacher.disabled@edufit-test.edu.np','email_verified',true),
     NOW(), NOW(), NOW())
ON CONFLICT (provider, provider_id) DO NOTHING;

-- ----------------------------------------------------------------
-- school_members (school code + personal access codes)
-- ----------------------------------------------------------------
INSERT INTO public.school_members (user_id, email, member_role, full_name, school_id, access_code, is_active)
VALUES
    ('aaaa1111-0000-4000-8000-000000000001', 'teacher.ktm@edufit-test.edu.np',
     'teacher', 'Sita Sharma', '11111111-1111-4111-8111-111111111111', 'TCH-KTM-001', true),
    ('bbbb2222-0000-4000-8000-000000000002', 'student.ktm@edufit-test.edu.np',
     'student', 'Aarav Tamang', '11111111-1111-4111-8111-111111111111', 'STU-KTM-001', true),
    ('cccc3333-0000-4000-8000-000000000003', 'teacher.lal@edufit-test.edu.np',
     'teacher', 'Rajesh Gurung', '22222222-2222-4222-8222-222222222222', 'TCH-LAL-001', true),
    ('dddd4444-0000-4000-8000-000000000004', 'student.lal@edufit-test.edu.np',
     'student', 'Pooja Maharjan', '22222222-2222-4222-8222-222222222222', 'STU-LAL-001', true),
    ('eeee5555-0000-4000-8000-000000000005', 'teacher.disabled@edufit-test.edu.np',
     'teacher', 'Bikash Thapa', '11111111-1111-4111-8111-111111111111', 'TCH-KTM-002', false)
ON CONFLICT (email) DO NOTHING;
