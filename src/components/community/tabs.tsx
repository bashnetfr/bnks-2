'use client'

// ================================================================
// Community Hub — Feed / Saved / Notifications tabs
// ================================================================

import { useMemo } from 'react'
import { Bell, ShieldAlert } from 'lucide-react'
import {
  canCreatePost, getFeedPosts, getNotificationsFor, getSavedPosts,
  type CommunityData, type CommunityPost, type CommunityUser,
} from '@/lib/community'
import { EmptyState, relativeTime, type CommunityUpdateFn } from './ui'
import Composer from './Composer'
import PostCard from './PostCard'

export function FeedTab({
  data,
  me,
  visibleCount,
  onVisibleMore,
  update,
  onToast,
}: {
  data: CommunityData
  me: CommunityUser
  visibleCount: number
  onVisibleMore: () => void
  update: CommunityUpdateFn
  onToast: (msg: string) => void
}) {
  const publisher = canCreatePost(me)
  const posts = useMemo(
    () => getFeedPosts(data, { includeHiddenForAdmin: me.role === 'admin' }),
    [data, me.role]
  )
  const shown = posts.slice(0, visibleCount)

  return (
    <section aria-label="Community feed">
      {publisher ? (
        <Composer data={data} me={me} update={update} onToast={onToast} />
      ) : me.role === 'teacher' ? (
        <div
          className="card"
          style={{ padding: '16px 20px', marginBottom: '20px', borderLeft: '4px solid var(--warning)' }}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert size={17} style={{ color: 'var(--warning)', flexShrink: 0 }} aria-hidden="true" />
            <p className="body-text" style={{ fontSize: '13px' }}>
              Publishing unlocks once an administrator verifies your teacher account.
            </p>
          </div>
        </div>
      ) : null}

      {shown.length === 0 ? (
        <EmptyState
          title="No community posts yet."
          body="Check back later for updates from your teachers."
        />
      ) : (
        <>
          {shown.map((post) => (
            <PostCard key={post.id} post={post} data={data} me={me} update={update} onToast={onToast} />
          ))}
          {posts.length > shown.length && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button type="button" className="btn-secondary" onClick={onVisibleMore}>
                Load more ({posts.length - shown.length} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export function SavedTab({
  data,
  me,
  update,
  onToast,
}: {
  data: CommunityData
  me: CommunityUser
  update: CommunityUpdateFn
  onToast: (msg: string) => void
}) {
  const saved: CommunityPost[] = getSavedPosts(data, me.id)
  if (saved.length === 0) {
    return (
      <EmptyState
        title="You haven't saved any posts yet."
        body="Save useful posts to find them later."
      />
    )
  }
  return (
    <section aria-label="Saved posts">
      {saved.map((post) => (
        <PostCard key={post.id} post={post} data={data} me={me} update={update} onToast={onToast} />
      ))}
    </section>
  )
}

export function NotificationsTab({
  data,
  me,
  update,
}: {
  data: CommunityData
  me: CommunityUser
  update: CommunityUpdateFn
}) {
  const items = getNotificationsFor(data, me.id)
  return (
    <section aria-label="Notifications">
      <div className="flex justify-between items-center" style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: '15px' }} className="flex items-center gap-2">
          <Bell size={15} aria-hidden="true" /> Notifications
        </h2>
        {items.some((n) => !n.isRead) && (
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '5px 12px', fontSize: '12px' }}
            onClick={() =>
              update((draft) => {
                draft.notifications = draft.notifications.map((n) =>
                  n.userId === me.id ? { ...n, isRead: true } : n
                )
              })
            }
          >
            Mark all read
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState title="No notifications yet." body="Updates from your school will appear here." />
      ) : (
        items.map((n) => (
          <div
            key={n.id}
            className="card"
            style={{
              padding: '16px 18px',
              marginBottom: '10px',
              borderLeft: n.isRead ? undefined : '4px solid var(--primary)',
              opacity: n.isRead ? 0.75 : 1,
            }}
          >
            <div className="flex items-center gap-2" style={{ marginBottom: '4px' }}>
              {!n.isRead && (
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                />
              )}
              <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                {n.title}
              </span>
            </div>
            <p className="body-text" style={{ fontSize: '13px' }}>{n.body}</p>
            <p className="meta-text" style={{ fontSize: '11.5px', marginTop: '6px' }}>
              {relativeTime(n.createdAt)}
            </p>
          </div>
        ))
      )}
    </section>
  )
}
