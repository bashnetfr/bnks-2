import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

// ================================================================
// /api/events/profile — per-student event matching profile
//
// GET  ?owner=<ownerKey>                    -> profile (or null if none saved)
// POST { ownerKey, profile: {...} }         -> upsert profile
// ================================================================

const EDUCATION_LEVELS = ['school', 'see', 'plus_two', 'bachelors', 'masters', 'recent_graduate']

export async function GET(request: NextRequest) {
  try {
    const owner = new URL(request.url).searchParams.get('owner')
    if (!owner) {
      return NextResponse.json({ success: false, error: 'Missing owner' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('student_event_profiles')
      .select('*')
      .eq('owner_key', owner)
      .maybeSingle()

    if (error) throw error

    // Null when the visitor has never personalized — client keeps defaults
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[api/events/profile] GET failed:', err)
    return NextResponse.json({ success: false, error: 'Failed to load event profile' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const p = body?.profile
    if (!body?.ownerKey || !p || !EDUCATION_LEVELS.includes(p.educationLevel)) {
      return NextResponse.json({ success: false, error: 'Invalid profile payload' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('student_event_profiles')
      .upsert(
        {
          owner_key: body.ownerKey,
          education_level: p.educationLevel,
          interests: Array.isArray(p.interests) ? p.interests : [],
          location: typeof p.location === 'string' ? p.location : '',
          prefer_free: Boolean(p.preferFree),
          prefer_online: Boolean(p.preferOnline),
          prefer_team: Boolean(p.preferTeam),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'owner_key' }
      )
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[api/events/profile] POST failed:', err)
    return NextResponse.json({ success: false, error: 'Failed to save event profile' }, { status: 500 })
  }
}
