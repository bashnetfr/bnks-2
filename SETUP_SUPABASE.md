# Supabase Setup Guide for EduFit Nepal

This guide explains how to set up Supabase for the EduFit Nepal project.

## Prerequisites

1. [Supabase CLI](https://supabase.com/docs/guides/cli) installed
2. A Supabase account and project created
3. Node.js >= 18.x

## Step 1: Link Local Repository to Supabase Project

```bash
# Login to Supabase
supabase login

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Start Supabase locally (optional, for development)
supabase start
```

Replace `YOUR_PROJECT_REF` with your actual Supabase project reference (found in project settings).

## Step 2: Apply Database Schema

The schema is located in `supabase/migrations/20260823000001_init.sql` and includes:

- **Profiles table**: Extends `auth.users` with role, full_name, etc.
- **School profiles table**: Stores school information
- **Student surveys table**: Stores student survey responses
- **Assessment tables**: For the four dimensions (infrastructure, teacher readiness, school management, learning requirements)
- **EdTech tools table**: Stores educational technology tools
- **Compatibility results table**: Stores tool-school compatibility scoring results
- **Resources table**: For the resource hub (scholarships, competitions, etc.)
- **RLS policies**: Row Level Security for all tables
- **Updated at triggers**: Automatic timestamp updates
- **Indexes**: For query performance

To apply the migration:

```bash
# Push local migrations to remote Supabase
supabase db push

# Alternatively, reset and start fresh (WARNING: deletes all data)
supabase db reset
```

## Step 3: Generate TypeScript Types

Generate TypeScript definitions for your database schema:

```bash
supabase gen types typescript --local > src/lib/database.types.ts
```

Or for remote database:

```bash
supabase gen types typescript --project-ref YOUR_PROJECT_REF > src/lib/database.types.ts
```

## Step 4: Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NVIDIA_NIM_API_KEY=your-nvidia-nim-api-key
```

Get these values from your Supabase project Settings > API.

## Step 5: Enable Required Extensions

Some tables may require PostgreSQL extensions. Enable them in your Supabase dashboard:

1. Go to Database > Extensions
2. Enable: `uuid-ossp` (already referenced in schema)

## Table Descriptions

### Profiles
Extends Supabase Auth users with:
- `role`: admin, school_admin, ngo_staff, municipality_official
- `full_name`, `avatar_url`, `website`

### School Profiles
Stores school information matching the `SchoolProfile` interface:
- Basic info: name, location, district, type
- Demographics: student_count, teacher_count, grade_levels
- Technology: technology_usage level

### Student Surveys
Matches the `StudentSurvey` interface:
- Authentication method: school_email or school_code
- Device ownership, internet access, screen time
- Learning preferences, digital confidence
- Study space, access limitations
- Timestamps for submission and confirmation

### Assessment Tables
Four separate tables for each dimension:
- `infrastructure_assessments`: internet, devices, power, bandwidth, support
- `teacher_readiness_assessments`: digital literacy, edtech experience, training willingness, ICT integration, device ownership
- `school_management_assessments`: leadership buy-in, budget, policy, parent support, data privacy awareness
- `learning_requirements_assessments`: curriculum alignment, home access, language support, accessibility needs, blended learning readiness

### EdTech Tools
Matches the `EdTechTool` interface:
- Basic info: name, description, category
- Technical: bandwidth_requirement, deployment_mode, device specs
- Business: cost_model, pricing, support availability
- Requirements: infrastructure_requirement, teacher_readiness_requirement
- Features: nepali_language_support, supports_low_bandwidth

### Compatibility Results
Stores the output of the compatibility engine:
- Tool and school references
- Overall score and recommendation
- Dimension scores with weights and explanations
- Problems and flags (reality gap, incomplete data)

### Resources
For the resource hub:
- Scholarships, competitions, learning resources, digital materials
- Title, description, type, URL, eligibility, provider
- Cost (free/paid), language, deadline

## Row Level Security (RLS)

All tables have RLS enabled with policies:
- **Public read access**: Resources, EdTech tools, school profiles (viewable by everyone)
- **Authenticated read/write**: Most tables accessible to logged-in users
- **Role-based write**: Admins and NGOs can insert/update certain tables
- **User-specific**: Users can only update their own profiles

## Development Commands

```bash
# Start local Supabase studio (runs on localhost:54322)
supabase start

# Stop local Supabase
supabase stop

# Get status
supabase status

# Pull remote changes
supabase db pull

# Push local changes
supabase db push

# Generate types
supabase gen types typescript --local > src/lib/database.types.ts

# Studio UI (runs on localhost:3000 when started)
supabase studio
```

## Production Deployment

For production, use the Supabase dashboard or CLI:

```bash
# Push migrations to production
supabase db push --link YOUR_PROJECT_REF

# Or use GitHub Actions with Supabase CLI
```

## Troubleshooting

1. **Connection issues**: Verify `.env.local` has correct Supabase URL and keys
2. **Permission errors**: Check that service role key is set in `.env.local` for server operations
3. **Schema mismatch**: Run `supabase db push` after schema changes
4. **Type generation**: Remember to regenerate types after schema changes with `supabase gen types`

## Security Notes

- Never expose the `SUPABASE_SERVICE_ROLE_KEY` to the client
- Use `createBrowserSupabaseClient()` for client-side operations (anon key only)
- Use `createServerSupabaseClient()` for server-side operations (service role key)
- Row Level Security protects data access based on user roles

## References

- Supabase Docs: https://supabase.com/docs
- Supabase CLI Reference: https://supabase.com/docs/guides/cli
- Row Level Security: https://supabase.com/docs/guides/auth/row-level-security
- Auth Helpers: https://supabase.com/docs/guides/auth/auth-helpers/nextjs