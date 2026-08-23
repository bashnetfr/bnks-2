export type AuthMethod = 'school_email' | 'school_code'

export interface StudentAuth {
  authMethod: AuthMethod
  studentEmail?: string
  schoolCode: string
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
