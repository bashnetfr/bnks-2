'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, GraduationCap, Lock, Sparkles } from 'lucide-react'
import {
  getStaffAuth,
  getStudentAuth,
  setStaffAuth,
  setStudentAuth,
} from '@/lib/auth'

type PortalRole = 'student' | 'teacher'

export default function LoginPage() {
  const router = useRouter()

  const [role, setRole] = useState<PortalRole>('student')
  const [authMethod, setAuthMethod] = useState<'school_email' | 'school_code'>('school_email')
  const [email, setEmail] = useState('')
  const [schoolCode, setSchoolCode] = useState('SCH-KTM-2026')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Already signed in this session? Route straight to the right portal.
  useEffect(() => {
    if (getStudentAuth()) router.replace('/survey')
    else if (getStaffAuth()) router.replace('/dashboard')
  }, [router])

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (authMethod === 'school_email' && !email.trim()) {
      setErrorMsg('Please enter your school-issued email address.')
      return
    }
    if (authMethod === 'school_code' && !schoolCode.trim()) {
      setErrorMsg('Please enter your school access code.')
      return
    }

    setErrorMsg(null)
    if (role === 'student') {
      setStudentAuth({
        authMethod,
        studentEmail: authMethod === 'school_email' ? email.trim() : undefined,
        schoolCode: authMethod === 'school_code' ? schoolCode.trim() : '',
      })
      router.replace('/survey')
    } else {
      setStaffAuth({
        role,
        staffEmail: authMethod === 'school_email' ? email.trim() : undefined,
        schoolCode: authMethod === 'school_code' ? schoolCode.trim() : '',
      })
      router.replace('/dashboard')
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
          One login for students and teachers — choose how you&apos;re signing in below.
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
          {/* Auth Method Selector — available to both students and staff */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <button
              type="button"
              className={`btn-secondary ${authMethod === 'school_email' ? 'active' : ''}`}
              style={{
                flex: 1,
                justifyContent: 'center',
                background: authMethod === 'school_email' ? 'var(--primary-soft)' : undefined,
                color: authMethod === 'school_email' ? 'var(--primary)' : undefined,
                borderColor: authMethod === 'school_email' ? 'var(--primary)' : undefined,
              }}
              onClick={() => setAuthMethod('school_email')}
            >
              {role === 'student' ? 'School Email' : 'Staff Email'}
            </button>
            <button
              type="button"
              className={`btn-secondary ${authMethod === 'school_code' ? 'active' : ''}`}
              style={{
                flex: 1,
                justifyContent: 'center',
                background: authMethod === 'school_code' ? 'var(--primary-soft)' : undefined,
                color: authMethod === 'school_code' ? 'var(--primary)' : undefined,
                borderColor: authMethod === 'school_code' ? 'var(--primary)' : undefined,
              }}
              onClick={() => setAuthMethod('school_code')}
            >
              School Code
            </button>
          </div>

          {authMethod === 'school_email' ? (
            <div className="form-group">
              <label htmlFor="login-email">{role === 'student' ? 'Student Email Address' : 'Staff Email Address'}</label>
              <input
                id="login-email"
                type="email"
                placeholder={role === 'student' ? 'student.name@school.edu.np' : 'teacher.name@school.edu.np'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="login-school-code">School Access Code</label>
              <input
                id="login-school-code"
                type="text"
                placeholder="e.g. SCH-KTM-2026"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" className="btn-primary w-full" style={{ justifyContent: 'center', marginTop: '12px' }}>
            {role === 'student' ? 'Continue to Student Portal' : 'Enter Assessment Dashboard'}
          </button>
        </form>

        <p className="meta-text" style={{ textAlign: 'center', marginTop: '16px' }}>
          Students get the confidential survey portal. Staff get the readiness assessment dashboard.
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
