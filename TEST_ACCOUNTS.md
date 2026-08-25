# Test Accounts — Gated Login

Every teacher/student login requires **all four** factors to match records preloaded in Supabase:

1. **Email** — exists in `auth.users` (password confirmed)
2. **Password** — matches the preloaded hash
3. **School Code** — matches the member's school (`school_profiles.school_code`)
4. **Personal Code** — teacher code (`TCH-*`) or student code (`STU-*`) from `school_members.access_code`

Any single mismatch → generic rejection: *"Invalid credentials. Check your email, password, school code, and personal code."*

**Shared password for every account below:** `Test@2026`

---

## Valid logins (should succeed)

| # | Role | Email | School Code | Personal Code | Lands on |
|---|------|-------|-------------|---------------|----------|
| 1 | Teacher | `teacher.ktm@edufit-test.edu.np` | `SCH-KTM-2026` | `TCH-KTM-001` | `/teacher` |
| 2 | Student | `student.ktm@edufit-test.edu.np` | `SCH-KTM-2026` | `STU-KTM-001` | `/student` |
| 3 | Teacher (2nd school) | `teacher.lal@edufit-test.edu.np` | `SCH-LAL-2026` | `TCH-LAL-001` | `/teacher` |
| 4 | Student (2nd school) | `student.lal@edufit-test.edu.np` | `SCH-LAL-2026` | `STU-LAL-001` | `/student` |

## Rejection cases (must all fail)

| # | Case | Use | Expected |
|---|------|-----|----------|
| 5 | Wrong password | Account #1 + any wrong password | Rejected |
| 6 | Wrong school code | Account #1 + school code `SCH-LAL-2026` | Rejected |
| 7 | Wrong personal code | Account #1 + `TCH-LAL-001` (other school's code) | Rejected |
| 8 | Swapped role codes | Account #2 (student) but Teacher tab + code `STU-KTM-001` | Rejected |
| 9 | Disabled account | `teacher.disabled@edufit-test.edu.np`, `SCH-KTM-2026`, `TCH-KTM-002` | Rejected (`is_active = false`) |
| 10 | Unknown email | Any email not seeded | Rejected |

## Page gating

| Route | Allowed |
|-------|---------|
| `/login` | Public |
| `/events` | Public (saving events requires login) |
| `/teacher`, `/dashboard` | Authenticated **teachers** only |
| `/student`, `/survey` | Authenticated **students** only |

A valid session with the wrong role is signed out and redirected to `/login`.

---

## Where things live

- Seed SQL (idempotent, safe to re-run): `supabase/seed_test_accounts.sql`
- Schema for codes: migration `20260823000002_auth_access_codes.sql`
  - `school_profiles.school_code` — school-wide code
  - `school_members` — one row per teacher/student: email, role, school, personal access code, `is_active`
- Login API: `src/app/api/auth/login/route.ts` (server-side; validates codes with the service-role key **before** checking the password)
- RLS: members can SELECT only their own `school_members` row; anonymous visitors can read none of it

## Notes

- Codes are compared case-insensitively at the API layer; store them uppercase.
- To disable an account later: `UPDATE school_members SET is_active = false WHERE email = '...';`
- The demo-credentials box on `/login` is a development convenience — remove before production launch.
- Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (server-only) for the login route to work.
