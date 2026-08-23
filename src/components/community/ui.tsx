'use client'

// ================================================================
// Community Hub — shared UI primitives + display helpers
// ================================================================

import type { CommunityUser } from '@/lib/community'
import type { CommunityData } from '@/lib/community'
import { Megaphone } from 'lucide-react'
import type { ReactNode } from 'react'

/** Mutation helper type — mutators edit a deep-cloned draft, then persist. */
export type CommunityUpdateFn = (fn: (draft: CommunityData) => void) => void

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

export function authorBadge(user: CommunityUser): { label: string; className: string } | null {
  if (user.role === 'admin') return { label: '✓ Admin', className: 'badge badge-primary' }
  if (user.role === 'teacher') {
    return user.verificationStatus === 'approved'
      ? { label: '✓ Verified Teacher', className: 'badge badge-success' }
      : { label: '⏳ Verification pending', className: 'badge badge-warning' }
  }
  return null
}

export function Avatar({ user, size = 38 }: { user: CommunityUser; size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: user.initialsColor,
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.36,
        fontWeight: 700,
        flexShrink: 0,
        letterSpacing: '0.02em',
      }}
    >
      {initials(user.name)}
    </span>
  )
}

export function IconAction({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '6px',
        borderRadius: '6px',
        display: 'inline-flex',
        alignItems: 'center',
        color: 'var(--text-muted)',
      }}
    >
      {children}
    </button>
  )
}

export function EmptyState({
  title,
  body,
  compact,
}: {
  title: string
  body?: string
  compact?: boolean
}) {
  return (
    <div className="card" style={{ padding: compact ? '20px' : '44px 24px', textAlign: 'center' }}>
      {!compact && (
        <Megaphone
          size={26}
          style={{ color: 'var(--text-muted)', margin: '0 auto 10px', display: 'block' }}
          aria-hidden="true"
        />
      )}
      <p style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)' }}>{title}</p>
      {body && <p className="meta-text" style={{ fontSize: '12.5px', marginTop: '4px' }}>{body}</p>}
    </div>
  )
}
