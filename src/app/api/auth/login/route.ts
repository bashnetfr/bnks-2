import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

// Single generic failure message for every rejection — no account enumeration.
const GENERIC_ERROR =
  'Invalid credentials. Check your email, password, school code, and personal code.'

type LoginRole = 'teacher' | 'student'

interface LoginRequestBody {
  email?: unknown
  password?: unknown
  schoolCode?: unknown
  accessCode?: unknown
  role?: unknown
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: Request) {
  let body: LoginRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: GENERIC_ERROR }, { status: 400 })
  }

  const email = asText(body.email).toLowerCase()
  const password = typeof body.password === 'string' ? body.password : ''
  const schoolCode = asText(body.schoolCode).toUpperCase()
  const accessCode = asText(body.accessCode).toUpperCase()
  const roleInput = asText(body.role)
  const role: LoginRole | null =
    roleInput === 'teacher' || roleInput === 'student' ? roleInput : null

  if (!email || !password || !schoolCode || !accessCode || !role) {
    return NextResponse.json({ success: false, error: GENERIC_ERROR }, { status: 400 })
  }

  // Service-role client: the code lookup must never be exposed to the browser
  let supabase
  try {
    supabase = createServerSupabaseClient()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Server auth is not configured. Set SUPABASE_SERVICE_ROLE_KEY.' },
      { status: 500 }
    )
  }

  try {
    // Step 1 — verify this email is a preloaded member with matching codes
    const { data: member, error: memberError } = await supabase
      .from('school_members')
      .select('id, user_id, member_role, full_name, is_active, access_code, school:school_profiles(school_code)')
      .eq('email', email)
      .maybeSingle()

    if (memberError) {
      console.error('[auth/login] member lookup failed:', memberError.message)
      return NextResponse.json({ success: false, error: GENERIC_ERROR }, { status: 500 })
    }

    const schoolRow = Array.isArray(member?.school) ? member?.school[0] : member?.school
    const codesValid =
      !!member &&
      member.is_active === true &&
      member.member_role === role &&
      member.access_code === accessCode &&
      !!schoolRow &&
      (schoolRow as { school_code: string | null }).school_code === schoolCode

    if (!codesValid) {
      return NextResponse.json({ success: false, error: GENERIC_ERROR }, { status: 401 })
    }

    // Step 2 — only now verify the preloaded Supabase password
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError || !data.session) {
      return NextResponse.json({ success: false, error: GENERIC_ERROR }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      data: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at ?? null,
        role: member.member_role,
        fullName: member.full_name,
        userId: data.user.id,
      },
    })
  } catch (err) {
    console.error('[auth/login] unexpected error:', err)
    return NextResponse.json({ success: false, error: GENERIC_ERROR }, { status: 500 })
  }
}
