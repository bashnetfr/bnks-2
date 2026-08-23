'use client'

// ================================================================
// Community Hub — PostCard (spec §16 author display, §13/§14 actions,
// §19 deletion, §20 reporting, §25 view counting)
// ================================================================

import { useState } from 'react'
import {
  Bookmark, Eye, Flag, Heart, Pencil, Pin, Trash2, X,
} from 'lucide-react'
import type { ReportReason } from '@/lib/community'
import { REPORT_REASONS } from '@/lib/community'
import {
  getUserById, hasLiked, hasSaved, recordView, toggleLike, toggleSave,
  canEditPost, canDeleteOwnPost, canModeratePosts, canReport,
  type CommunityData, type CommunityPost, type CommunityUser,
} from '@/lib/community'
import { Avatar, IconAction, authorBadge, relativeTime, type CommunityUpdateFn } from './ui'
import Composer from './Composer'

export default function PostCard({
  post,
  data,
  me,
  update,
  onToast,
}: {
  post: CommunityPost
  data: CommunityData
  me: CommunityUser
  update: CommunityUpdateFn
  onToast: (msg: string) => void
}) {
  const author = getUserById(data, post.authorId)
  const media = data.media[post.id] ?? []
  const [expanded, setExpanded] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [editing, setEditing] = useState(false)
  if (!author) return null

  const badge = authorBadge(author)
  const liked = hasLiked(data, me.id, post.id)
  const saved = hasSaved(data, me.id, post.id)

  function openPost() {
    setExpanded(true)
    update((draft) => {
      recordView(draft, me.id, post.id)
    })
  }

  function handleDelete() {
    if (!window.confirm('Delete this post permanently?')) return
    update((draft) => {
      draft.posts = draft.posts.filter((p) => p.id !== post.id)
      delete draft.media[post.id]
    })
    onToast('Post deleted')
  }

  function handleAdminRemove() {
    if (!window.confirm('Remove this post from the community?')) return
    update((draft) => {
      const idx = draft.posts.findIndex((p) => p.id === post.id)
      if (idx >= 0) draft.posts[idx] = { ...draft.posts[idx], status: 'removed' }
      draft.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorId: me.id,
        action: 'post_removed',
        targetType: 'post',
        targetId: post.id,
        metadata: `Removed "${post.content.slice(0, 40)}…" by administrator decision`,
        createdAt: new Date().toISOString(),
      })
    })
    onToast('Post removed and logged')
  }

  return (
    <article className="card" style={{ padding: '20px', marginBottom: '14px' }}>
      {post.pinned && (
        <div className="badge badge-primary" style={{ marginBottom: '10px' }}>
          <Pin size={11} aria-hidden="true" /> Pinned announcement
        </div>
      )}

      <div className="flex items-start gap-3">
        <Avatar user={author} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
              {author.name}
            </span>
            {badge && <span className={badge.className} style={{ fontSize: '10.5px' }}>{badge.label}</span>}
            {author.subject && (
              <span className="meta-text" style={{ fontSize: '11.5px' }}>· {author.subject}</span>
            )}
          </div>
          <div className="meta-text" style={{ fontSize: '11.5px' }}>
            {relativeTime(post.createdAt)}
            {post.edited ? ' · edited' : ''}
          </div>
        </div>

        {!editing && (canEditPost(me, post) || canDeleteOwnPost(me, post)) && (
          <div className="flex items-center gap-1">
            {canEditPost(me, post) && (
              <IconAction label="Edit post" onClick={() => setEditing(true)}>
                <Pencil size={15} aria-hidden="true" />
              </IconAction>
            )}
            {canDeleteOwnPost(me, post) && (
              <IconAction label="Delete post" onClick={handleDelete}>
                <Trash2 size={15} aria-hidden="true" />
              </IconAction>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <div style={{ marginTop: '14px' }}>
          <Composer
            data={data}
            me={me}
            update={update}
            onToast={onToast}
            editing={post}
            onCloseEdit={() => setEditing(false)}
          />
        </div>
      ) : (
        <>
          <p
            className="body-text"
            style={{ marginTop: '12px', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}
          >
            {post.content}
          </p>

          {media.length > 0 && (
            <div style={{ marginTop: '14px', display: 'grid', gap: '10px' }}>
              {media.map((m) =>
                m.type === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={m.id}
                    src={m.url}
                    alt="Post attachment"
                    loading="lazy"
                    style={{
                      width: '100%',
                      maxHeight: expanded ? 'none' : '320px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                    }}
                  />
                ) : (
                  <video
                    key={m.id}
                    controls
                    preload="metadata"
                    src={m.url}
                    style={{
                      width: '100%',
                      maxHeight: '420px',
                      borderRadius: 'var(--radius-sm)',
                      background: '#000',
                    }}
                  />
                )
              )}
            </div>
          )}

          {!expanded && (
            <button
              type="button"
              onClick={openPost}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                marginTop: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                textDecoration: 'underline',
                color: 'var(--text-muted)',
                fontSize: '12px',
              }}
            >
              <Eye size={12} aria-hidden="true" /> View post
            </button>
          )}
          {expanded && (
            <p className="meta-text" style={{ marginTop: '10px', fontSize: '11.5px' }}>
              Published {new Date(post.publishedAt).toLocaleString()}
              {post.updatedAt ? ` · edited ${relativeTime(post.updatedAt)}` : ''}
            </p>
          )}

          <div
            className="flex items-center justify-between"
            style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}
          >
            <div className="flex items-center" style={{ gap: '18px' }}>
              <button
                type="button"
                onClick={() => update((draft) => toggleLike(draft, me.id, post.id))}
                aria-pressed={liked}
                aria-label={liked ? 'Unlike post' : 'Like post'}
                className="flex items-center gap-2"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: liked ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: liked ? 700 : 500,
                  fontSize: '13px',
                }}
              >
                <Heart size={16} fill={liked ? 'var(--primary)' : 'none'} aria-hidden="true" />
                {post.likeCount}
              </button>
              <button
                type="button"
                onClick={() => update((draft) => toggleSave(draft, me.id, post.id))}
                aria-pressed={saved}
                aria-label={saved ? 'Unsave post' : 'Save post'}
                className="flex items-center gap-2"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: saved ? 'var(--info)' : 'var(--text-muted)',
                  fontWeight: saved ? 700 : 500,
                  fontSize: '13px',
                }}
              >
                <Bookmark size={16} fill={saved ? 'var(--info)' : 'none'} aria-hidden="true" />
                {post.saveCount}
              </button>
              <span
                className="meta-text flex items-center gap-1"
                style={{ fontSize: '12px' }}
                title={`${post.viewCount} views`}
              >
                <Eye size={14} aria-hidden="true" /> {post.viewCount}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {canReport(me) && (
                <IconAction label="Report post" onClick={() => setShowReport(true)}>
                  <Flag size={15} aria-hidden="true" />
                </IconAction>
              )}
              {canModeratePosts(me) && post.authorId !== me.id && (
                <button
                  type="button"
                  onClick={handleAdminRemove}
                  className="badge badge-danger"
                  style={{ cursor: 'pointer', border: 'none', fontSize: '11px' }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {showReport && (
        <ReportModal
          reporterName={me.name}
          onClose={() => setShowReport(false)}
          onSubmit={(reason, details) => {
            update((draft) => {
              draft.reports.unshift({
                id: `rep-${Date.now()}`,
                reporterId: me.id,
                targetType: 'post',
                targetId: post.id,
                reason,
                details: details.trim() || undefined,
                status: 'open',
                createdAt: new Date().toISOString(),
              })
            })
            setShowReport(false)
            onToast('Report submitted — moderators will review it')
          }}
        />
      )}
    </article>
  )
}

function ReportModal({
  reporterName,
  onClose,
  onSubmit,
}: {
  reporterName: string
  onClose: () => void
  onSubmit: (reason: ReportReason, details: string) => void
}) {
  const [reason, setReason] = useState<ReportReason>(REPORT_REASONS[0])
  const [details, setDetails] = useState('')

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-title"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 400,
        background: 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="card"
        role="presentation"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '430px', width: '100%', padding: '26px', position: 'relative' }}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
          }}
        >
          <X size={16} aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2" style={{ marginBottom: '6px' }}>
          <Flag size={17} style={{ color: 'var(--warning)' }} aria-hidden="true" />
          <h2 id="report-title" style={{ fontSize: '16px' }}>Report this post</h2>
        </div>
        <p className="meta-text" style={{ marginBottom: '16px', fontSize: '12px' }}>
          Submitted as {reporterName}. Moderators review every report.
        </p>

        <fieldset style={{ border: 'none', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
          <legend className="sr-only">Reason</legend>
          {REPORT_REASONS.map((r) => (
            <label
              key={r}
              className="flex items-center gap-2"
              style={{ cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}
            >
              <input
                type="radio"
                name="report-reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
                style={{ accentColor: 'var(--primary)' }}
              />
              {r}
            </label>
          ))}
        </fieldset>

        <textarea
          rows={2}
          placeholder="Optional details for the moderators…"
          value={details}
          maxLength={300}
          onChange={(e) => setDetails(e.target.value)}
          aria-label="Additional details"
        />

        <div className="flex justify-end gap-2" style={{ marginTop: '14px' }}>
          <button type="button" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '13px' }}
            onClick={() => onSubmit(reason, details)}
          >
            Submit report
          </button>
        </div>
      </div>
    </div>
  )
}
