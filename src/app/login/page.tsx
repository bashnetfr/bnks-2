'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, Users, ShieldCheck, Loader2 } from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { setStudentAuth, setStaffAuth } from '@/lib/auth'
import type { AppRole } from '@/components/AuthGuard'

const DEMO_PASSWORD = 'Test@2026'

interface LoginResponse {
  success: boolean
  error?: string
  data?: {
    accessToken: string
    refreshToken: string
    role: AppRole
    fullName: string
  }
}

export default function LoginPage() {
  const router = useRouter()

  const [role, setRole] = useState<AppRole>('teacher')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [schoolCode, setSchoolCode] = useState('')
  const [accessCode, setAccessCode] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function fillDemo(demoRole: AppRole) {
    setRole(demoRole)
    setEmail(demoRole === 'teacher' ? 'teacher.ktm@edufit-test.edu.np' : 'student.ktm@edufit-test.edu.np')
    setPassword(DEMO_PASSWORD)
    setSchoolCode('SCH-KTM-2026')
    setAccessCode(demoRole === 'teacher' ? 'TCH-KTM-001' : 'STU-KTM-001')
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

      // Establish the Supabase session in this browser, then route by role
      const supabase = createBrowserSupabaseClient()
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: json.data.accessToken,
        refresh_token: json.data.refreshToken,
      })
      if (sessionError) {
        setErrorMsg('Signed in, but failed to start your session. Please try again.')
        return
      }

      // Mirror the session for pages that read the local auth snapshot
      if (json.data.role === 'student') {
        setStudentAuth({ authMethod: 'school_email', studentEmail: email.trim(), schoolCode: schoolCode.trim() })
      } else {
        setStaffAuth({ role: 'teacher', staffEmail: email.trim(), schoolCode: schoolCode.trim() })
      }

      router.replace(json.data.role === 'teacher' ? '/teacher' : '/student')
    } catch {
      setErrorMsg('Could not reach the server. Check your internet connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main style={{ maxWidth: '520px', margin: '0 auto', padding: '56px 20px 80px' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div className="badge badge-primary" style={{ marginBottom: '12px', display: 'inline-flex' }}>
          <ShieldCheck size={12} aria-hidden="true" />
          School Member Access
        </div>
        <h1>Log In</h1>
        <p className="body-text" style={{ marginTop: '8px' }}>
          Sign in with your school email and password, school code, and your personal code.
        </p>
      </div>

      <div className="card" style={{ padding: '32px' }}>
        {/* Role tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => { setRole('teacher'); setErrorMsg(null) }}
            className="btn-secondary"
            style={{
              flex: 1, justifyContent: 'center',
              background: role === 'teacher' ? 'var(--primary-soft)' : undefined,
              color: role === 'teacher' ? 'var(--primary)' : undefined,
              borderColor: role === 'teacher' ? 'var(--primary)' : undefined,
            }}
          >
            <Users size={15} aria-hidden="true" /> Teacher
          </button>
          <button
            type="button"
            onClick={() => { setRole('student'); setErrorMsg(null) }}
            className="btn-secondary"
            style={{
              flex: 1, justifyContent: 'center',
              background: role === 'student' ? 'var(--primary-soft)' : undefined,
              color: role === 'student' ? 'var(--primary)' : undefined,
              borderColor: role === 'student' ? 'var(--primary)' : undefined,
            }}
          >
            <GraduationCap size={15} aria-hidden="true" /> Student
          </button>
        </div>

        {errorMsg && (
          <div className="badge badge-danger" style={{ width: '100%', padding: '10px 14px', marginBottom: '16px', borderRadius: '8px' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="login-email">School Email Address</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="your.name@school.edu.np"
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
                <Loader2 size={16} className="animate-spin" /> Verifying credentials…
              </>
            ) : (
              <>Log In as {role === 'teacher' ? 'Teacher' : 'Student'}</>
            )}
          </button>
        </form>

        <p className="meta-text" style={{ textAlign: 'center', marginTop: '12px' }}>
          All four details must match your school&apos;s records.
        </p>
      </div>

      {/* Test credentials (remove before production launch) */}
      <div className="card" style={{ padding: '16px 20px', marginTop: '20px', background: 'var(--surface-muted)', borderColor: 'var(--border)' }}>
        <div className="meta-text" style={{ fontSize: '11px', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
          Demo test IDs — one click fills the form
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => fillDemo('teacher')}>
            Fill Teacher (SCH-KTM-2026 / TCH-KTM-001)
          </button>
          <button type="button" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => fillDemo('student')}>
            Fill Student (SCH-KTM-2026 / STU-KTM-001)
          </button>
        </div>
        <p className="meta-text" style={{ fontSize: '11px', marginTop: '8px' }}>
          Full case matrix lives in TEST_ACCOUNTS.md. Password for all seeded accounts: {DEMO_PASSWORD}
        </p>
      </div>
    </main>
  )
}
