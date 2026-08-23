'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Mail, School } from 'lucide-react'
import {
  clearStaffAuth,
  clearStudentAuth,
  type StudentAuth,
  type StaffAuth,
} from '@/lib/auth'

interface UserProfileCardProps {
  auth: StudentAuth | StaffAuth
  kind: 'student' | 'staff'
  displayName: string
  stats?: { label: string; value: string | number }[]
}

export default function UserProfileCard({ auth, kind, displayName, stats }: UserProfileCardProps) {
  const router = useRouter()
  const roleLabel = kind === 'student' ? 'Student' : 'Teacher'
  const email = kind === 'student'
    ? (auth as StudentAuth).studentEmail
    : (auth as StaffAuth).staffEmail
  const initial = displayName.charAt(0).toUpperCase()

  function handleSignOut() {
    if (kind === 'student') clearStudentAuth()
    else clearStaffAuth()
    router.replace('/login')
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03), 0 4px 12px rgba(15, 23, 42, 0.025)',
        padding: '14px',
      }}
    >
      {/* Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          aria-hidden="true"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            flexShrink: 0,
            background: 'var(--primary-soft)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '15px',
          }}
        >
          {initial}
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: '13px',
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayName}
          </div>
          <div className="meta-text" style={{ fontSize: '11px' }}>{roleLabel}</div>
        </div>
      </div>

      {/* Contact / School metadata */}
      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {email && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <Mail size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} aria-hidden="true" />
            <span
              className="meta-text"
              style={{
                fontSize: '11px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {email}
            </span>
          </div>
        )}
        {auth.schoolCode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <School size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} aria-hidden="true" />
            <span
              className="meta-text"
              style={{
                fontSize: '11px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {auth.schoolCode}
            </span>
          </div>
        )}
      </div>

      {/* Activity summary (Personal.md §1) */}
      {stats && stats.length > 0 && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="flex justify-between" style={{ fontSize: '11px' }}>
              <span className="meta-text">{stat.label}</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stat.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Account actions */}
      <button
        type="button"
        className="btn-secondary w-full"
        style={{ marginTop: '12px', justifyContent: 'center', fontSize: '12px', padding: '7px 10px', gap: '6px' }}
        onClick={handleSignOut}
      >
        <LogOut size={13} aria-hidden="true" />
        Sign Out
      </button>

      <p className="meta-text" style={{ fontSize: '10px', textAlign: 'center', marginTop: '8px' }}>
        <Link href="/privacy" style={{ color: 'inherit' }}>Privacy</Link> · Session-only sign-in
      </p>
    </div>
  )
}
