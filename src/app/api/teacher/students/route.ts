// ================================================================
// /api/teacher/students — student roster management for the
// signed-in teacher's OWN school (school scoping resolved server-side
// from the caller's session token, never trusted from the body).
//   GET  — list that school's student records
//   POST — create a student record + login account
// ================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { resolveTeacher } from '@/lib/server-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const teacher = await resolveTeacher(request)
  if (!teacher) {
    return NextResponse.json(
      { success: false, error: 'Teacher authentication required.' },
      { status: 401 }
    )
  }

  let supabase
  try {
    supabase = createServerSupabaseClient()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Server is not configured for privileged operations.' },
      { status: 500 }
    )
  }

  const { data, error } = await supabase
    .from('school_members')
    .select('id, full_name, email, access_code, grade_level, is_active, created_at')
    .eq('school_id', teacher.schoolId)
    .eq('member_role', 'student')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data: {
      schoolCode: teacher.schoolCode,
      students: data ?? [],
    },
  })
}

interface CreateStudentBody {
  fullName?: unknown
  email?: unknown
  grade?: unknown
  tempPassword?: unknown
}

const GRADE_LEVELS = new Set(['primary', 'lower_secondary', 'secondary', 'higher_secondary'])

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** STU-<CITY>-<NNN> derived from the school's own code (SCH-<CITY>-<YEAR>) */
function citySegment(schoolCode: string): string {
  const parts = schoolCode.split('-')
  return (parts[1] ?? schoolCode).toUpperCase()
}

async function nextAccessCode(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  schoolId: string,
  schoolCode: string
): Promise<string> {
  const segment = citySegment(schoolCode)
  const prefix = `STU-${segment}-`

  const { data } = await supabase
    .from('school_members')
    .select('access_code')
    .eq('school_id', schoolId)
    .like('access_code', `${prefix}%`)

  let max = 0
  for (const row of data ?? []) {
    const num = Number((row.access_code ?? '').slice(prefix.length))
    if (!Number.isNaN(num) && num > max) max = num
  }
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}

export async function POST(request: NextRequest) {
  const teacher = await resolveTeacher(request)
  if (!teacher) {
    return NextResponse.json(
      { success: false, error: 'Teacher authentication required.' },
      { status: 401 }
    )
  }

  let body: CreateStudentBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 })
  }

  const fullName = asText(body.fullName)
  const email = asText(body.email).toLowerCase()
  const grade = asText(body.grade)
  const tempPassword = typeof body.tempPassword === 'string' ? body.tempPassword : ''

  if (!fullName || !email || !tempPassword) {
    return NextResponse.json(
      { success: false, error: 'Full name, email, and temporary password are required.' },
      { status: 400 }
    )
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ success: false, error: 'That email address looks invalid.' }, { status: 400 })
  }
  if (tempPassword.length < 8) {
    return NextResponse.json(
      { success: false, error: 'Temporary password must be at least 8 characters.' },
      { status: 400 }
    )
  }
  if (grade && !GRADE_LEVELS.has(grade)) {
    return NextResponse.json({ success: false, error: 'Unknown grade level.' }, { status: 400 })
  }

  let supabase
  try {
    supabase = createServerSupabaseClient()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Server is not configured for privileged operations.' },
      { status: 500 }
    )
  }

  // Duplicate guard within school_members
  const { data: existing } = await supabase
    .from('school_members')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  if (existing) {
    return NextResponse.json(
      { success: false, error: 'A member with that email already exists.' },
      { status: 409 }
    )
  }

  // Create the underlying auth account (handles identities for us)
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { role: 'student', full_name: fullName },
  })

  if (createError || !created.user) {
    const message =
      createError?.message.includes('already registered') ?? false
        ? 'A member with that email already exists.'
        : `Failed to create the student login: ${createError?.message ?? 'unknown error'}`
    return NextResponse.json({ success: false, error: message }, { status: createError?.message.includes('already registered') ? 409 : 500 })
  }

  const accessCode = await nextAccessCode(supabase, teacher.schoolId, teacher.schoolCode)

  const { data: member, error: insertError } = await supabase
    .from('school_members')
    .insert({
      user_id: created.user.id,
      email,
      member_role: 'student',
      full_name: fullName,
      school_id: teacher.schoolId,
      access_code: accessCode,
      is_active: true,
      grade_level: grade || null,
    })
    .select('id, full_name, email, access_code, grade_level, created_at')
    .single()

  if (insertError) {
    // Roll back the orphaned auth account so the email stays reusable
    await supabase.auth.admin.deleteUser(created.user.id)
    return NextResponse.json(
      { success: false, error: `Created the login but failed to register the record: ${insertError.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data: {
      student: member,
      schoolCode: teacher.schoolCode,
      tempPassword,
      note: 'Share these credentials with the student. They log in via /login with their email + password + school code + personal code.',
    },
  })
}
