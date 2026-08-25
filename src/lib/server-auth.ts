// ================================================================
// Ed-Vantage — Server-side identity resolution for privileged routes
//
// Privileged actions (teacher roster management) are authorized by the
// caller's REAL Supabase session — not by client-side sessionStorage.
// The route passes the request; we resolve the signed-in user and
// their school_members row server-side via the service-role key.
// ================================================================

import { createServerSupabaseClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export interface TeacherIdentity {
  userId: string
  fullName: string
  email: string
  schoolId: string
  schoolCode: string
  schoolDistrict: string | null
}

function extractBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization') ?? ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : null
}

/** Length-safe equality that does not leak length differences on early exit */
function keysMatch(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}

/**
 * Guard for boss-level admin routes: requires the exact ADMIN_SECRET_KEY
 * in the x-admin-key header. Returns an error response when rejected.
 */
export function requireAdminKey(request: Request): NextResponse | null {
  const expected = process.env.ADMIN_SECRET_KEY
  if (!expected) {
    return NextResponse.json(
      { success: false, error: 'Admin access is not configured on this server.' },
      { status: 503 }
    )
  }
  const provided = request.headers.get('x-admin-key') ?? ''
  if (!keysMatch(provided.trim(), expected)) {
    return NextResponse.json({ success: false, error: 'Invalid admin key.' }, { status: 401 })
  }
  return null
}

/**
 * Resolve the signed-in ACTIVE TEACHER and their school from the
 * request's session token. Returns null for anyone else (students,
 * anonymous callers, inactive/disabled members).
 */
export async function resolveTeacher(request: Request): Promise<TeacherIdentity | null> {
  let supabase
  try {
    supabase = createServerSupabaseClient()
  } catch {
    return null
  }

  const token = extractBearerToken(request)
  if (!token) return null

  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  if (userError || !userData.user) return null

  const { data: member, error: memberError } = await supabase
    .from('school_members')
    .select('user_id, member_role, full_name, is_active, school:school_profiles(id, school_code, district)')
    .eq('user_id', userData.user.id)
    .eq('email', userData.user.email ?? '')
    .maybeSingle()

  if (memberError || !member) return null

  const isActive = member.is_active === true
  const isTeacher = member.member_role === 'teacher'
  const school = Array.isArray(member.school) ? member.school[0] : member.school
  if (!isActive || !isTeacher || !school) return null

  return {
    userId: member.user_id,
    fullName: member.full_name,
    email: userData.user.email ?? '',
    schoolId: school.id,
    schoolCode: school.school_code,
    schoolDistrict: school.district ?? null,
  }
}
