export type AuthMethod = 'school_email' | 'school_code'

export interface StudentAuth {
  authMethod: AuthMethod
  studentEmail?: string
  schoolCode: string
  /** District of the student's school (from school_profiles at login) */
  schoolDistrict?: string
}

const STORAGE_KEY = 'edufit_student_auth'

export function getStudentAuth(): StudentAuth | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StudentAuth) : null
  } catch {
    return null
  }
}

export function setStudentAuth(auth: StudentAuth): void {
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
}

export function clearStudentAuth(): void {
  window.sessionStorage.removeItem(STORAGE_KEY)
}

export type StaffRole = 'teacher'

export interface StaffAuth {
  role: StaffRole
  staffEmail?: string
  schoolCode: string
  /** District of the teacher's school (from school_profiles at login) */
  schoolDistrict?: string
}

const STAFF_STORAGE_KEY = 'edufit_staff_auth'

export function getStaffAuth(): StaffAuth | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(STAFF_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StaffAuth) : null
  } catch {
    return null
  }
}

export function setStaffAuth(auth: StaffAuth): void {
  window.sessionStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(auth))
}

export function clearStaffAuth(): void {
  window.sessionStorage.removeItem(STAFF_STORAGE_KEY)
}

// Derive a human display name from an email local-part ("alex.bash@x.y" -> "Alex Bash").
export function getDisplayName(email: string | undefined, fallback: string): string {
  if (!email?.trim()) return fallback
  const local = email.split('@')[0]
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || fallback
}

// Stable identity key for per-user data (saved events, matching profile).
// Email when available; otherwise namespaced by school code for code-only logins.
export function getEventsOwnerKey(): string | null {
  const student = getStudentAuth()
  if (student) return student.studentEmail ?? `code:${student.schoolCode}`
  const staff = getStaffAuth()
  if (staff) return staff.staffEmail ?? `code:${staff.schoolCode}`
  return null
}

/** District of the signed-in user's school, when known */
export function getSchoolDistrict(): string | null {
  const student = getStudentAuth()
  if (student?.schoolDistrict) return student.schoolDistrict
  const staff = getStaffAuth()
  if (staff?.schoolDistrict) return staff.schoolDistrict
  return null
}
