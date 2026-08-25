// ================================================================
// GET /api/admin/overview — boss-level stats across ALL schools.
// Requires the ADMIN_SECRET_KEY header (x-admin-key).
// ================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { requireAdminKey } from '@/lib/server-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const denied = requireAdminKey(request)
  if (denied) return denied

  let supabase
  try {
    supabase = createServerSupabaseClient()
  } catch {
    return NextResponse.json({ success: false, error: 'Server not configured.' }, { status: 500 })
  }

  const [schools, members, surveys, eventsCache] = await Promise.all([
    supabase.from('school_profiles').select('id, name, district, school_code, location').order('name'),
    supabase.from('school_members').select('id, member_role, is_active'),
    supabase.from('student_surveys').select('id', { count: 'exact', head: true }),
    supabase.from('scraped_events_cache').select('event_count, fetched_at'),
  ])

  const memberRows = members.data ?? []
  const liveEvents = (eventsCache.data ?? []).reduce((sum, row) => sum + (row.event_count ?? 0), 0)

  return NextResponse.json({
    success: true,
    data: {
      stats: {
        schools: schools.data?.length ?? 0,
        teachers: memberRows.filter((m) => m.member_role === 'teacher').length,
        students: memberRows.filter((m) => m.member_role === 'student').length,
        activeMembers: memberRows.filter((m) => m.is_active).length,
        totalSurveys: surveys.count ?? 0,
        liveScrapedEvents: liveEvents,
      },
      schools: schools.data ?? [],
      errors: {
        members: members.error?.message ?? null,
        surveys: surveys.error?.message ?? null,
        eventsCache: eventsCache.error?.message ?? null,
      },
    },
  })
}
