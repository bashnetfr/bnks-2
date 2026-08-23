'use client'

// ================================================================
// Unified auth gate — single source of truth: lib/auth.ts session
// storage (the same keys the /login page writes). Supabase remains
// wired for DATA (surveys, saved events), not for gating.
// ================================================================

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { getStaffAuth, getStudentAuth } from '@/lib/auth'

export type AppRole = 'teacher' | 'student'

/** Kept for compatibility — role now resolves from session storage. */
export function roleFromUser(_user: unknown): AppRole | null {
  if (getStaffAuth()) return 'teacher'
  if (getStudentAuth()) return 'student'
  return null
}

/** Client-side gate: renders children only for a signed-in member whose
 *  role matches allowedRole. Everyone else ends up at /login. */
export default function AuthGuard({ allowedRole, children }: { allowedRole?: AppRole; children: ReactNode }) {
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'granted'>('checking')

  useEffect(() => {
    let cancelled = false

    const auth =
      allowedRole === 'teacher'
        ? getStaffAuth()
        : allowedRole === 'student'
          ? getStudentAuth()
          : getStaffAuth() ?? getStudentAuth()

    if (!auth) {
      if (!cancelled) router.replace('/login')
      return
    }

    // Wrong-role session: send to login so the portal picker sorts it out.
    const hasTeacher = Boolean(getStaffAuth())
    const hasStudent = Boolean(getStudentAuth())
    const roleMatches =
      allowedRole === 'teacher' ? hasTeacher : allowedRole === 'student' ? hasStudent : true

    if (!roleMatches) {
      if (!cancelled) router.replace('/login')
      return
    }

    if (!cancelled) setStatus('granted')
    return () => {
      cancelled = true
    }
  }, [allowedRole, router])

  if (status === 'checking') {
    return (
      <main style={{ maxWidth: '520px', margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
        <div className="card" style={{ padding: '32px' }}>
          <ShieldCheck size={28} style={{ color: 'var(--primary)', margin: '0 auto 12px' }} aria-hidden="true" />
          <h2 style={{ fontSize: '16px', marginBottom: '6px' }}>Verifying your access…</h2>
          <p className="meta-text">Checking your school credentials.</p>
          <div className="skeleton" style={{ height: '12px', marginTop: '20px' }} />
          <div className="skeleton" style={{ height: '12px', marginTop: '8px' }} />
        </div>
      </main>
    )
  }

  return <>{children}</>
}
