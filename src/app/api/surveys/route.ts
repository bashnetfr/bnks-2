import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import type { StudentSurvey } from '@/lib/types'

// ================================================================
// /api/surveys — persistent storage for student survey submissions
//
// GET  — list all confirmed surveys (dashboard consumption)
// POST — confirm-write a single survey submission
//
// Uses the server Supabase client (service role) because the demo
// auth flow is session-based, not Supabase Auth — anon-key inserts
// would be rejected by RLS. Never import this from client code.
// ================================================================

interface SurveyJoinRow {
  id: string
  school_id: string
  school?: { access_code: string | null } | null
  auth_method: StudentSurvey['authMethod']
  device_ownership: StudentSurvey['deviceOwnership']
  internet_access: StudentSurvey['internetAccess']
  average_daily_screen_time_minutes: number
  learning_preference: StudentSurvey['learningPreference']
  digital_confidence: number
  has_quiet_study_space: boolean
  access_limitations: string[] | null
  completed_on_shared_device: boolean
  submitted_at: string | null
  confirmed_at: string | null
}

function mapRowToSurvey(row: SurveyJoinRow): StudentSurvey {
  return {
    id: row.id,
    schoolId: row.school?.access_code ?? row.school_id,
    authMethod: row.auth_method,
    deviceOwnership: row.device_ownership,
    internetAccess: row.internet_access,
    averageDailyScreenTimeMinutes: row.average_daily_screen_time_minutes,
    learningPreference: row.learning_preference,
    digitalConfidence: row.digital_confidence as StudentSurvey['digitalConfidence'],
    hasQuietStudySpace: row.has_quiet_study_space,
    accessLimitations: row.access_limitations ?? [],
    completedOnSharedDevice: row.completed_on_shared_device,
    submittedAt: row.submitted_at ?? undefined,
    confirmedAt: row.confirmed_at ?? undefined,
  }
}

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('student_surveys')
      .select('*, school:school_profiles(access_code)')
      .order('created_at', { ascending: false })

    if (error) throw error

    const surveys = (data as SurveyJoinRow[]).map(mapRowToSurvey)
    return NextResponse.json({ success: true, data: surveys, count: surveys.length })
  } catch (err) {
    console.error('[api/surveys] GET failed:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to load student surveys' },
      { status: 500 }
    )
  }
}

const DEVICE_OWNERSHIP = ['none', 'shared_family', 'personal_basic', 'personal_smartphone', 'personal_computer']
const INTERNET_ACCESS = ['none', 'mobile_data_limited', 'mobile_data_adequate', 'home_broadband', 'school_only']
const LEARNING_PREFERENCE = ['text', 'video', 'interactive', 'audio', 'mixed']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Basic shape validation before touching the database
    if (
      !body ||
      !DEVICE_OWNERSHIP.includes(body.deviceOwnership) ||
      !INTERNET_ACCESS.includes(body.internetAccess) ||
      !LEARNING_PREFERENCE.includes(body.learningPreference) ||
      typeof body.digitalConfidence !== 'number' ||
      body.digitalConfidence < 1 ||
      body.digitalConfidence > 5 ||
      typeof body.averageDailyScreenTimeMinutes !== 'number' ||
      typeof body.hasQuietStudySpace !== 'boolean' ||
      typeof body.completedOnSharedDevice !== 'boolean'
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid survey payload' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Resolve the school profile for this access code (upsert keeps this
    // idempotent for repeat codes without seeding the DB by hand).
    const accessCode = String(body.schoolId ?? '').trim() || 'SCH-KTM-DEFAULT'
    const { data: school, error: schoolError } = await supabase
      .from('school_profiles')
      .upsert(
        {
          access_code: accessCode,
          name: `School (${accessCode})`,
          location: 'Unspecified',
          district: 'Unspecified',
          school_type: 'community',
          student_count: 0,
          grade_levels: ['primary'],
          teacher_count: 0,
          technology_usage: 'minimal',
        },
        { onConflict: 'access_code' }
      )
      .select('id')
      .single()

    if (schoolError || !school) throw schoolError ?? new Error('School resolution failed')

    const now = new Date().toISOString()
    const { data: saved, error: insertError } = await supabase
      .from('student_surveys')
      .insert({
        school_id: school.id,
        auth_method: body.authMethod === 'school_email' ? 'school_email' : 'school_code',
        device_ownership: body.deviceOwnership,
        internet_access: body.internetAccess,
        average_daily_screen_time_minutes: Math.max(0, Number(body.averageDailyScreenTimeMinutes)),
        learning_preference: body.learningPreference,
        digital_confidence: body.digitalConfidence,
        has_quiet_study_space: body.hasQuietStudySpace,
        access_limitations: Array.isArray(body.accessLimitations) ? body.accessLimitations : [],
        completed_on_shared_device: body.completedOnSharedDevice,
        submitted_at: typeof body.submittedAt === 'string' ? body.submittedAt : now,
        confirmed_at: now,
      })
      .select('id, confirmed_at')
      .single()

    if (insertError || !saved) throw insertError ?? new Error('Survey insert failed')

    // Only report success after the write is actually confirmed
    return NextResponse.json({
      success: true,
      data: { id: saved.id, confirmedAt: saved.confirmed_at },
    })
  } catch (err) {
    console.error('[api/surveys] POST failed:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to confirm your submission. Please check your connection and try again.' },
      { status: 500 }
    )
  }
}
