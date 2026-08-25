// ================================================================
// GET /api/auth/school-district?code=SCH-KTM-2026
//
// Returns the district of a school for location-aware features
// (e.g. defaulting the events finder to the student's own district).
// School codes ship in the client-side auth snapshot, and district
// names are non-sensitive public data.
// ================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')?.trim().toUpperCase() ?? ''
  if (!code) {
    return NextResponse.json({ success: false, error: 'Missing school code' }, { status: 400 })
  }

  let supabase
  try {
    supabase = createServerSupabaseClient()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Server auth is not configured.' },
      { status: 500 }
    )
  }

  const { data, error } = await supabase
    .from('school_profiles')
    .select('district')
    .eq('school_code', code)
    .maybeSingle()

  if (error || !data?.district) {
    return NextResponse.json({ success: false, error: 'Unknown school code' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: { district: data.district } })
}
