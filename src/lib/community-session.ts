'use client'

// ================================================================
// Community Hub session resolution
//
// Two modes:
//  - "real":    Supabase session exists → identity from user_metadata
//               (conventions match AuthGuard/UserBadge: full_name, role,
//               plus community_admin flag for hub administration).
//  - "preview": no env / no session / offline → labeled sample mode so
//               the hub always demos. View-as override available in both.
// ================================================================

import { useCallback, useEffect, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import {
  loadCommunityData, getUserByEmail,
  type CommunityData, type CommunityUser,
} from './community'

export interface CommunityIdentity {
  id: string
  name: string
  email: string
  role: 'student' | 'teacher' | 'admin'
  isAdmin: boolean
}

export interface CommunitySession {
  loading: boolean
  mode: 'real' | 'preview'
  /** The signed-in identity in real mode; selected persona in preview. */
  user: CommunityUser | null
  /** Signed-in identity before any View-as override (real mode only). */
  signedInUser: CommunityUser | null
  overrideActive: boolean
  setOverrideUserId: (id: string | null) => void
  refresh: () => void
}

const OVERRIDE_KEY = 'edufit_community_view_as'
const DEFAULT_PREVIEW_USER_ID = 'u-thapa' // sample student persona

function identityFromSession(
  sessionUser: { email?: string; user_metadata?: Record<string, unknown> },
  data: CommunityData
): CommunityUser | null {
  const email = sessionUser.email ?? ''
  const meta = sessionUser.user_metadata ?? {}
  const role = meta.role === 'teacher' ? 'teacher' : meta.role === 'student' ? 'student' : null
  if (!role) return null

  const isAdmin = meta.community_admin === true
  const existing = getUserByEmail(data, email)
  if (existing) return existing

  const name = typeof meta.full_name === 'string' && meta.full_name ? meta.full_name : email
  const palette = ['#2563EB', '#16A34A', '#7C3AED', '#0891B2', '#D8322A']
  const color = palette[email.length % palette.length]
  return {
    id: `auth-${email}`,
    name,
    email,
    role: isAdmin ? 'admin' : role,
    verificationStatus:
      role === 'student' ? 'not_applicable' : isAdmin ? 'approved' : 'pending',
    subject: '',
    initialsColor: color,
  }
}

export function useCommunitySession(): CommunitySession {
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'real' | 'preview'>('preview')
  const [signedInUser, setSignedInUser] = useState<CommunityUser | null>(null)
  const [overrideId, setOverrideIdState] = useState<string | null>(null)
  const [dataTick, setDataTick] = useState(0)

  const refresh = useCallback(() => setDataTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false

    try {
      setOverrideIdState(localStorage.getItem(OVERRIDE_KEY))
    } catch { /* ignore */ }

    async function resolve() {
      try {
        // No env configured → preview mode without attempting a network call
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          throw new Error('Supabase not configured')
        }
        const supabase = createBrowserSupabaseClient()
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error

        if (!data.session) {
          throw new Error('No active session')
        }
        const communityData = loadCommunityData()
        const identity = identityFromSession(data.session.user, communityData)
        if (!identity || cancelled) throw new Error('Unrecognized member')

        if (!cancelled) {
          setSignedInUser(identity)
          setMode('real')
        }
      } catch {
        // Offline / unconfigured / anonymous → labeled preview mode
        if (!cancelled) {
          setMode('preview')
          setSignedInUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    resolve()
    return () => { cancelled = true }
  }, [dataTick])

  function setOverrideUserId(id: string | null) {
    try {
      if (id) localStorage.setItem(OVERRIDE_KEY, id)
      else localStorage.removeItem(OVERRIDE_KEY)
    } catch { /* ignore */ }
    setOverrideIdState(id)
  }

  let user: CommunityUser | null = signedInUser
  try {
    const data = loadCommunityData()
    if (overrideId && overrideId !== signedInUser?.id) {
      user = data.users.find((u) => u.id === overrideId) ?? signedInUser ?? null
    }
    // Preview mode must ALWAYS resolve a persona — default to the sample
    // student so first-time visitors land on a working feed.
    if (!user && mode === 'preview') {
      user =
        data.users.find((u) => u.id === DEFAULT_PREVIEW_USER_ID) ??
        data.users[0] ??
        null
    }
  } catch {
    // store unreadable → keep current identity; page shows its error state
  }

  return {
    loading,
    mode,
    user,
    signedInUser,
    overrideActive: Boolean(overrideId && overrideId !== signedInUser?.id),
    setOverrideUserId,
    refresh,
  }
}
