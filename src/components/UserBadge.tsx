'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/supabase'

/** Shows the signed-in member's name + email with a sign-out button. */
export default function UserBadge({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
  const [info, setInfo] = useState<{ fullName: string; email: string; role: string } | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const supabase = createBrowserSupabaseClient()
      const { data } = await supabase.auth.getSession()
      if (cancelled || !data.session) return
      const meta = data.session.user.user_metadata as { full_name?: string; role?: string }
      setInfo({
        fullName: meta.full_name ?? data.session.user.email ?? 'Member',
        email: data.session.user.email ?? '',
        role: meta.role ?? '',
      })
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div>
      <div className="meta-text" style={{ fontSize: '12px' }}>Logged in as</div>
      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
        {info ? info.fullName : '…'}
      </div>
      {!compact && info && (
        <div className="meta-text" style={{ fontSize: '11px', marginTop: '2px', wordBreak: 'break-all' }}>
          {info.email}
        </div>
      )}
      <div className="flex items-center justify-between" style={{ marginTop: '6px', gap: '8px' }}>
        {info && (
          <span className="badge badge-info" style={{ fontSize: '10px', textTransform: 'capitalize' }}>
            {info.role}
          </span>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className="btn-secondary"
          style={{ padding: '4px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <LogOut size={12} aria-hidden="true" /> Sign out
        </button>
      </div>
    </div>
  )
}
