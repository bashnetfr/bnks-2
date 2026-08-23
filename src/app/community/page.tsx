'use client'

// ================================================================
// Ed-Vantage — Community Hub (spec §7, §46–48)
// Teacher-led, administrator-moderated internal social feed.
// Students: view · like · save · report. Staff publish. No comments.
// ================================================================

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, Bell, Bookmark, Megaphone, MessageCircle,
  ShieldCheck, Users,
} from 'lucide-react'
import {
  loadCommunityData, canModeratePosts,
  type CommunityData, type CommunityUser,
} from '@/lib/community'
import { useCommunitySession } from '@/lib/community-session'
import { FeedTab, SavedTab, NotificationsTab } from '@/components/community/tabs'
import MessagesTab from '@/components/community/MessagesTab'
import AdminPanel from '@/components/community/AdminPanel'
import { getConversationsFor, getNotificationsFor } from '@/lib/community'
import { CheckCircle2 } from 'lucide-react'

type TabId = 'feed' | 'saved' | 'messages' | 'notifications' | 'admin'

const FEED_PAGE_SIZE = 6

export default function CommunityPage() {
  const session = useCommunitySession()
  const [data, setData] = useState<CommunityData | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [tab, setTab] = useState<TabId>('feed')
  const [visibleCount, setVisibleCount] = useState(FEED_PAGE_SIZE)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setData(loadCommunityData())
      } catch (e) {
        console.error(e)
        setLoadError(true)
      }
    }, 450)
    return () => clearTimeout(timer)
  }, [])

  const me = session.user

  function update(mutator: (draft: CommunityData) => void) {
    setData((prev) => {
      if (!prev || !me) return prev
      const draft: CommunityData = JSON.parse(JSON.stringify(prev))
      mutator(draft)
      try {
        localStorage.setItem('edufit_community_v1', JSON.stringify(draft))
      } catch (e) {
        console.error('Failed to persist community data:', e)
      }
      return draft
    })
  }

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 2600)
  }

  if (session.loading || (!data && !loadError)) {
    return (
      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 16px' }}>
        <div className="skeleton" style={{ height: '40px', marginBottom: '24px' }} />
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton" style={{ height: '140px', marginBottom: '16px' }} />
        ))}
      </main>
    )
  }

  if (loadError || !data) {
    return (
      <main style={{ maxWidth: '520px', margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
        <div className="card" style={{ padding: '36px' }}>
          <AlertTriangle size={28} style={{ color: 'var(--warning)', margin: '0 auto 12px' }} aria-hidden="true" />
          <h2 style={{ fontSize: '16px', marginBottom: '8px' }}>
            We couldn&apos;t load the community feed.
          </h2>
          <button type="button" className="btn-secondary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </main>
    )
  }

  if (!me) {
    return (
      <main style={{ maxWidth: '520px', margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
        <div className="card" style={{ padding: '36px' }}>
          <ShieldCheck size={28} style={{ color: 'var(--info)', margin: '0 auto 12px' }} aria-hidden="true" />
          <h2 style={{ fontSize: '16px', marginBottom: '8px' }}>Sign in to join the community</h2>
          <p className="body-text" style={{ marginBottom: '18px' }}>
            The Community Hub is available to signed-in students and staff.
          </p>
          <Link href="/login" className="btn-primary">
            Go to Login
          </Link>
        </div>
      </main>
    )
  }

  const unreadNotifications = getNotificationsFor(data, me.id).filter((n) => !n.isRead).length
  const unreadDMs = getConversationsFor(data, me.id).reduce((sum, c) => sum + c.unreadCount, 0)

  const tabs: Array<{ id: TabId; label: string; icon: React.ElementType; badge?: number }> = [
    { id: 'feed', label: 'Feed', icon: Megaphone },
    { id: 'saved', label: 'Saved', icon: Bookmark },
    { id: 'messages', label: 'Messages', icon: MessageCircle, badge: unreadDMs },
    { id: 'notifications', label: 'Alerts', icon: Bell, badge: unreadNotifications },
  ]
  if (canModeratePosts(me)) tabs.push({ id: 'admin', label: 'Admin', icon: ShieldCheck })

  return (
    <main style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 16px 80px' }}>
      <header style={{ marginBottom: '20px' }}>
        <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div className="flex items-center gap-2">
            <Users size={22} style={{ color: 'var(--primary)' }} aria-hidden="true" />
            <h1>Community Hub</h1>
          </div>

          {/* View-as override — available in real and preview mode */}
          <label className="meta-text flex items-center gap-2" style={{ fontSize: '12px' }}>
            View as:
            <select
              value={me.id}
              onChange={(e) =>
                session.setOverrideUserId(
                  e.target.value === session.signedInUser?.id ? null : e.target.value
                )
              }
              style={{ width: 'auto', fontSize: '12px', padding: '5px 8px' }}
              aria-label="Demo identity override"
            >
              {!data.users.some((u) => u.id === me.id) && (
                <option value={me.id}>
                  {me.name}
                  {session.mode === 'real' ? ' (signed in)' : ' (current)'}
                </option>
              )}
              {data.users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.role}
                  {u.id === session.signedInUser?.id ? ' (signed in)' : ''}
                </option>
              ))}
            </select>
          </label>
        </div>

        {session.mode === 'preview' && (
          <div
            className="flex items-center gap-2"
            role="status"
            style={{
              marginTop: '12px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(245, 158, 11, 0.09)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              fontSize: '12.5px',
              color: 'var(--text-secondary)',
            }}
          >
            <AlertTriangle size={14} style={{ color: 'var(--warning)', flexShrink: 0 }} aria-hidden="true" />
            Preview mode — sample school community data. Sign in with your school credentials to use your real account.
          </div>
        )}
        {session.overrideActive && (
          <div className="badge badge-info" style={{ marginTop: '10px' }}>
            Demo override active — acting as {me.name}
          </div>
        )}
      </header>

      <nav
        role="tablist"
        aria-label="Community sections"
        style={{
          display: 'flex',
          gap: '4px',
          borderBottom: '1px solid var(--border)',
          marginBottom: '20px',
          overflowX: 'auto',
        }}
      >
        {tabs.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            type="button"
            onClick={() => setTab(id)}
            className="nav-item"
            style={{
              width: 'auto',
              borderRadius: '8px 8px 0 0',
              borderBottom: tab === id ? '2px solid var(--primary)' : '2px solid transparent',
              color: tab === id ? 'var(--primary)' : undefined,
              fontWeight: tab === id ? 600 : 500,
              whiteSpace: 'nowrap',
            }}
          >
            <Icon size={16} aria-hidden="true" />
            {label}
            {Boolean(badge) && (
              <span className="badge badge-danger" style={{ fontSize: '10px', padding: '1px 6px' }}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {tab === 'feed' && (
        <FeedTab
          data={data}
          me={me}
          visibleCount={visibleCount}
          onVisibleMore={() => setVisibleCount((c) => c + FEED_PAGE_SIZE)}
          update={update}
          onToast={showToast}
        />
      )}
      {tab === 'saved' && <SavedTab data={data} me={me} update={update} onToast={showToast} />}
      {tab === 'messages' && <MessagesTab data={data} me={me} update={update} />}
      {tab === 'notifications' && <NotificationsTab data={data} me={me} update={update} />}
      {tab === 'admin' && canModeratePosts(me) && (
        <AdminPanel data={data} me={me} update={update} onToast={showToast} />
      )}

      {toast && (
        <div
          role="status"
          className="card"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 20px',
            zIndex: 400,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(15,23,42,0.18)',
          }}
        >
          <CheckCircle2 size={16} style={{ color: 'var(--success)' }} aria-hidden="true" />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>{toast}</span>
        </div>
      )}

      <footer
        className="meta-text"
        style={{ textAlign: 'center', marginTop: '48px', fontSize: '12px' }}
      >
        Moderated school community · Only verified staff can publish · Report anything that looks wrong
      </footer>
    </main>
  )
}
