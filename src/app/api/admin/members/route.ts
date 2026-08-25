// ================================================================
// GET /api/admin/members — full schools + members listing.
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

  const [{ data: members, error: membersError }, { data: schools, error: schoolsError }] =
    await Promise.all([
      supabase
        .from('school_members')
        .select('id, email, member_role, full_name, access_code, is_active, grade_level, school_id, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('school_profiles').select('id, name, district, location, school_code').order('name'),
    ])

  if (membersError || schoolsError) {
    return NextResponse.json(
      { success: false, error: membersError?.message ?? schoolsError?.message ?? 'Query failed.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data: {
      members: members ?? [],
      schools: schools ?? [],
    },
  })
}
