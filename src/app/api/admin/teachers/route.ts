// ================================================================
// POST /api/admin/teachers — create a teacher account for any school.
// Requires the ADMIN_SECRET_KEY header (x-admin-key).
// ================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { requireAdminKey } from '@/lib/server-auth'

export const dynamic = 'force-dynamic'

interface CreateTeacherBody {
  fullName?: unknown
  email?: unknown
  tempPassword?: unknown
  schoolId?: unknown
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function citySegment(schoolCode: string): string {
  const parts = schoolCode.split('-')
  return (parts[1] ?? schoolCode).toUpperCase()
}

async function nextTeacherCode(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  schoolId: string,
  schoolCode: string
): Promise<string> {
  const prefix = `TCH-${citySegment(schoolCode)}-`
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
  const denied = requireAdminKey(request)
  if (denied) return denied

  let body: CreateTeacherBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 })
  }

  const fullName = asText(body.fullName)
  const email = asText(body.email).toLowerCase()
  const tempPassword = typeof body.tempPassword === 'string' ? body.tempPassword : ''
  const schoolId = asText(body.schoolId)

  if (!fullName || !email || !tempPassword || !schoolId) {
    return NextResponse.json(
      { success: false, error: 'School, full name, email, and temporary password are required.' },
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

  let supabase
  try {
    supabase = createServerSupabaseClient()
  } catch {
    return NextResponse.json({ success: false, error: 'Server not configured.' }, { status: 500 })
  }

  // School must exist
  const { data: school, error: schoolError } = await supabase
    .from('school_profiles')
    .select('id, name, school_code')
    .eq('id', schoolId)
    .maybeSingle()

  if (schoolError || !school) {
    return NextResponse.json({ success: false, error: 'Unknown school.' }, { status: 404 })
  }

  // Duplicate guard
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

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { role: 'teacher', full_name: fullName },
  })

  if (createError || !created.user) {
    const alreadyRegistered = createError?.message.includes('already registered') ?? false
    return NextResponse.json(
      {
        success: false,
        error: alreadyRegistered
          ? 'A member with that email already exists.'
          : `Failed to create the teacher login: ${createError?.message ?? 'unknown error'}`,
      },
      { status: alreadyRegistered ? 409 : 500 }
    )
  }

  const accessCode = await nextTeacherCode(supabase, school.id, school.school_code)

  const { data: member, error: insertError } = await supabase
    .from('school_members')
    .insert({
      user_id: created.user.id,
      email,
      member_role: 'teacher',
      full_name: fullName,
      school_id: school.id,
      access_code: accessCode,
      is_active: true,
    })
    .select('id, full_name, email, access_code, member_role, is_active')
    .single()

  if (insertError) {
    await supabase.auth.admin.deleteUser(created.user.id)
    return NextResponse.json(
      { success: false, error: `Created the login but failed to register the record: ${insertError.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data: {
      teacher: member,
      schoolName: school.name,
      schoolCode: school.school_code,
      tempPassword,
    },
  })
}
