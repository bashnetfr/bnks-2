'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/supabase'

export type AppRole = 'teacher' | 'student'

export function roleFromUser(user: { user_metadata?: Record<string, unknown> } | null): AppRole | null {
  const role = user?.user_metadata?.role
  return role === 'teacher' || role === 'student' ? role : null
}

/** Client-side gate: renders children only for an authenticated member
 *  whose role matches allowedRole. Everyone else ends up at /login. */
export default function AuthGuard({ allowedRole, children }: { allowedRole?: AppRole; children: ReactNode }) {
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'granted'>('checking')

  useEffect(() => {
    let cancelled = false

    async function checkAccess() {
      const supabase = createBrowserSupabaseClient()
      const { data } = await supabase.auth.getSession()
      if (cancelled) return

      const session = data.session
      if (!session) {
        router.replace('/login')
        return
      }

      const role = roleFromUser(session.user)
      if (!role || (allowedRole && role !== allowedRole)) {
        await supabase.auth.signOut()
        if (!cancelled) router.replace('/login?reason=role')
        return
      }

      if (!cancelled) setStatus('granted')
    }

    checkAccess()
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
