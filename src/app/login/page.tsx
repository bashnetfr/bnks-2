'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, GraduationCap, Lock, Sparkles, Loader2, UserRound } from 'lucide-react'
import {
  getStaffAuth,
  getStudentAuth,
  setStaffAuth,
  setStudentAuth,
} from '@/lib/auth'
import { createBrowserSupabaseClient } from '@/lib/supabase'

type PortalRole = 'student' | 'teacher'

interface LoginResponse {
  success: boolean
  error?: string
  data?: {
    accessToken: string
    refreshToken: string
    expiresAt: number | null
    role: PortalRole
    fullName: string
    userId: string
    schoolDistrict: string | null
  }
}

// Seeded demo accounts (see TEST_ACCOUNTS.md / supabase/seed_test_accounts.sql)
const DEMO_PASSWORD = 'Test@2026'
const TEST_ACCOUNTS: Array<{
  label: string
  role: PortalRole
  email: string
  schoolCode: string
  accessCode: string
  note?: string
}> = [
  { label: 'Teacher (Kathmandu)', role: 'teacher', email: 'teacher.ktm@edufit-test.edu.np', schoolCode: 'SCH-KTM-2026', accessCode: 'TCH-KTM-001' },
  { label: 'Student (Kathmandu)', role: 'student', email: 'student.ktm@edufit-test.edu.np', schoolCode: 'SCH-KTM-2026', accessCode: 'STU-KTM-001' },
  { label: 'Teacher (Lalitpur)', role: 'teacher', email: 'teacher.lal@edufit-test.edu.np', schoolCode: 'SCH-LAL-2026', accessCode: 'TCH-LAL-001' },
  { label: 'Student (Lalitpur)', role: 'student', email: 'student.lal@edufit-test.edu.np', schoolCode: 'SCH-LAL-2026', accessCode: 'STU-LAL-001' },
  { label: 'Disabled account', role: 'teacher', email: 'teacher.disabled@edufit-test.edu.np', schoolCode: 'SCH-KTM-2026', accessCode: 'TCH-KTM-002', note: 'rejected on purpose' },
]

export default function LoginPage() {
  const router = useRouter()

  const [role, setRole] = useState<PortalRole>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [schoolCode, setSchoolCode] = useState('SCH-KTM-2026')
  const [accessCode, setAccessCode] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Already signed in this session? Route straight to the right portal.
  useEffect(() => {
    if (getStaffAuth()) router.replace('/teacher')
    else if (getStudentAuth()) router.replace('/student')
  }, [router])

  function fillDemo(account: (typeof TEST_ACCOUNTS)[number]) {
    setRole(account.role)
    setEmail(account.email)
    setPassword(DEMO_PASSWORD)
    setSchoolCode(account.schoolCode)
    setAccessCode(account.accessCode)
    setErrorMsg(null)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, schoolCode, accessCode, role }),
      })
      const json: LoginResponse = await res.json()

      if (!res.ok || !json.success || !json.data) {
        setErrorMsg(json.error ?? 'Invalid credentials. Check your email, password, school code, and personal code.')
        return
      }

      // Establish the real Supabase session so DB-backed pages work
      const supabase = createBrowserSupabaseClient()
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: json.data.accessToken,
        refresh_token: json.data.refreshToken,
      })
      if (sessionError) {
        setErrorMsg('Credentials verified, but starting your session failed. Please try again.')
        return
      }

      // Mirror the session for AuthGuard/pages that read local auth snapshots
      if (json.data.role === 'student') {
        setStudentAuth({
          authMethod: 'school_email',
          studentEmail: email.trim(),
          schoolCode: schoolCode.trim(),
          schoolDistrict: json.data.schoolDistrict ?? undefined,
        })
        router.replace('/student')
      } else {
        setStaffAuth({
          role: 'teacher',
          staffEmail: email.trim(),
          schoolCode: schoolCode.trim(),
          schoolDistrict: json.data.schoolDistrict ?? undefined,
        })
        router.replace('/teacher')
      }
    } catch {
      setErrorMsg('Could not reach the server. Check your internet connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main style={{ maxWidth: '520px', margin: '0 auto', padding: '64px 20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div className="badge badge-primary" style={{ marginBottom: '12px', display: 'inline-flex' }}>
          <Sparkles size={12} aria-hidden="true" />
          Ed-Vantage Portal
        </div>
        <h1>Log In</h1>
        <p className="body-text" style={{ marginTop: '8px' }}>
          Sign in with your school email and password, your school code, and your personal code.
        </p>
      </div>

      {/* Login Card */}
      <div className="card" style={{ padding: '32px' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'var(--primary-soft)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Lock size={20} aria-hidden="true" />
        </div>

        <h2 style={{ fontSize: '18px', marginBottom: '8px', textAlign: 'center' }}>Who are you?</h2>
        <p className="meta-text" style={{ marginBottom: '20px', textAlign: 'center' }}>
          Your role determines which portal you enter.
        </p>

        {errorMsg && (
          <div className="badge badge-danger" style={{ width: '100%', padding: '10px 14px', marginBottom: '16px', borderRadius: '8px' }}>
            {errorMsg}
          </div>
        )}

        {/* Role Selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {([
            { id: 'student', label: 'Student', icon: BookOpen },
            { id: 'teacher', label: 'Teacher', icon: GraduationCap },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`btn-secondary ${role === id ? 'active' : ''}`}
              style={{
                flex: 1,
                justifyContent: 'center',
                gap: '6px',
                background: role === id ? 'var(--primary-soft)' : undefined,
                color: role === id ? 'var(--primary)' : undefined,
                borderColor: role === id ? 'var(--primary)' : undefined,
              }}
              onClick={() => setRole(id)}
            >
              <Icon size={14} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="login-email">{role === 'student' ? 'Student Email Address' : 'Staff Email Address'}</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder={role === 'student' ? 'student.name@school.edu.np' : 'teacher.name@school.edu.np'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="login-school-code">School Code</label>
              <input
                id="login-school-code"
                type="text"
                autoComplete="off"
                placeholder="e.g. SCH-KTM-2026"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-access-code">{role === 'teacher' ? 'Teacher Code' : 'Student Code'}</label>
              <input
                id="login-access-code"
                type="text"
                autoComplete="off"
                placeholder={role === 'teacher' ? 'e.g. TCH-KTM-001' : 'e.g. STU-KTM-001'}
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full"
            style={{ justifyContent: 'center', marginTop: '12px', opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Verifying credentials…
              </>
            ) : (
              <>
                Log In as {role === 'teacher' ? 'Teacher' : 'Student'}
              </>
            )}
          </button>
        </form>

        <p className="meta-text" style={{ textAlign: 'center', marginTop: '16px' }}>
          All four details must match your school&apos;s records.
        </p>
      </div>

      {/* Test accounts quick-fill */}
      <div className="card" style={{ padding: '16px 20px', marginTop: '20px', background: 'var(--surface-muted)', borderColor: 'var(--border)' }}>
        <div className="meta-text" style={{ fontSize: '11px', marginBottom: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
          <UserRound size={12} style={{ verticalAlign: '-2px', marginRight: '4px' }} aria-hidden="true" />
          Demo test IDs — one click fills the form
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {TEST_ACCOUNTS.map((account) => (
            <button
              key={account.email + account.accessCode}
              type="button"
              className="btn-secondary"
              title={account.note ?? `${account.email} · ${account.schoolCode} · ${account.accessCode}`}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                opacity: account.note ? 0.65 : 1,
              }}
              onClick={() => fillDemo(account)}
            >
              {account.label}
              {account.note ? ' *' : ''}
            </button>
          ))}
        </div>
        <p className="meta-text" style={{ fontSize: '11px', marginTop: '10px' }}>
          Full case matrix lives in TEST_ACCOUNTS.md. Password for all seeded accounts: <strong>{DEMO_PASSWORD}</strong>.
          The disabled-account entry (*) is rejected by design.
        </p>
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <Link href="/" className="meta-text" style={{ textDecoration: 'none' }}>
          ← Back to homepage
        </Link>
      </div>
    </main>
  )
}
