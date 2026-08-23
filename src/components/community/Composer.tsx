'use client'

// ================================================================
// Community Hub — Composer (spec §17: verified teachers + admins only)
// Text + validated image upload (≤400KB, preview, removable) + video URL
// ================================================================

import { useState } from 'react'
import { ImagePlus, Link2, X } from 'lucide-react'
import type { CommunityData, CommunityPost, CommunityUser, MediaItem } from '@/lib/community'
import { canEditPost } from '@/lib/community'
import type { CommunityUpdateFn } from './ui'

export interface PendingMedia {
  key: string
  type: 'image' | 'video'
  url: string
  mimeType?: string
  sizeBytes?: number
}

const MAX_IMAGE_BYTES = 400 * 1024

function derivePostType(media: PendingMedia[]): CommunityPost['postType'] {
  if (media.length === 0) return 'text'
  const types = new Set(media.map((m) => m.type))
  if (types.has('image') && types.has('video')) return 'mixed'
  return types.has('video') ? 'video' : 'image'
}

export default function Composer({
  data,
  me,
  update,
  onToast,
  editing,
  onCloseEdit,
}: {
  data: CommunityData
  me: CommunityUser
  update: CommunityUpdateFn
  onToast: (msg: string) => void
  editing?: CommunityPost
  onCloseEdit?: () => void
}) {
  const [text, setText] = useState(editing?.content ?? '')
  const [media, setMedia] = useState<PendingMedia[]>(() => {
    if (!editing) return []
    return (data.media[editing.id] ?? []).map((m) => ({
      key: m.id,
      type: m.type,
      url: m.url,
      mimeType: m.mimeType,
      sizeBytes: m.sizeBytes,
    }))
  })
  const [videoUrl, setVideoUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  const canPublish = text.trim().length > 0 || media.length > 0

  function handleImageFile(file: File) {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image too large — maximum 400 KB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setMedia((m) => [
        ...m,
        {
          key: `pm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: 'image',
          url: String(reader.result),
          mimeType: file.type,
          sizeBytes: file.size,
        },
      ])
    }
    reader.onerror = () => setError('Upload failed. Please try again.')
    reader.readAsDataURL(file)
  }

  function attachVideo() {
    const trimmed = videoUrl.trim()
    if (!/^https:\/\/.+/.test(trimmed)) {
      setError('Video must be a secure https:// link (mp4/webm).')
      return
    }
    setError(null)
    setMedia((m) => [
      ...m,
      { key: `pv-${Date.now()}`, type: 'video', url: trimmed, mimeType: 'video/mp4' },
    ])
    setVideoUrl('')
  }

  function publish() {
    if (!canPublish) return
    const nowIso = new Date().toISOString()
    const postType = derivePostType(media)

    if (editing && canEditPost(me, editing)) {
      update((draft) => {
        const idx = draft.posts.findIndex((p) => p.id === editing.id)
        if (idx === -1) return
        // Spec §18 — existing media is only removed when the user removed it
        const existing = draft.media[editing.id] ?? []
        const keptUrls = new Set(media.map((m) => m.url))
        const kept = existing.filter((m) => keptUrls.has(m.url))
        const added: MediaItem[] = media
          .filter((m) => !existing.some((e) => e.url === m.url))
          .map((m, i) => ({
            id: `media-${Date.now()}-${i}`,
            postId: editing.id,
            type: m.type,
            url: m.url,
            mimeType: m.mimeType,
            sizeBytes: m.sizeBytes,
            createdAt: nowIso,
          }))
        draft.media[editing.id] = [...kept, ...added]
        draft.posts[idx] = {
          ...draft.posts[idx],
          content: text.trim(),
          postType: draft.media[editing.id].length === 0 ? 'text' : postType,
          updatedAt: nowIso,
          edited: true,
        }
      })
      onToast('Post updated')
      onCloseEdit?.()
      return
    }

    update((draft) => {
      const id = `post-${Date.now()}`
      draft.posts.unshift({
        id,
        authorId: me.id,
        content: text.trim(),
        postType,
        status: 'published',
        pinned: false,
        createdAt: nowIso,
        publishedAt: nowIso,
        likeCount: 0,
        saveCount: 0,
        viewCount: 0,
        edited: false,
      })
      if (media.length > 0) {
        draft.media[id] = media.map((m, i) => ({
          id: `media-${Date.now()}-${i}`,
          postId: id,
          type: m.type,
          url: m.url,
          mimeType: m.mimeType,
          sizeBytes: m.sizeBytes,
          createdAt: nowIso,
        }))
      }
    })
    setText('')
    setMedia([])
    onToast('Published to the community')
  }

  return (
    <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
      <textarea
        rows={3}
        placeholder={`Share an announcement, lesson material or update, ${me.name.split(' ')[0]}…`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={1200}
        aria-label="Post content"
      />

      {media.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
          {media.map((m) => (
            <div
              key={m.key}
              style={{
                position: 'relative',
                width: '110px',
                height: '74px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid var(--border)',
              }}
            >
              {m.type === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.url}
                  alt="Attachment preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    background: 'var(--surface-muted)',
                    fontSize: '11px',
                    padding: '4px',
                    textAlign: 'center',
                  }}
                >
                  Video attached
                </div>
              )}
              <button
                type="button"
                aria-label="Remove attachment"
                onClick={() => setMedia((arr) => arr.filter((x) => x.key !== m.key))}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  background: 'rgba(15,23,42,0.75)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <X size={11} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="body-text" role="alert" style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '8px' }}>
          {error}
        </p>
      )}

      <div
        className="flex items-center justify-between"
        style={{ marginTop: '14px', flexWrap: 'wrap', gap: '10px' }}
      >
        <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
          <label className="btn-secondary" style={{ padding: '7px 12px', fontSize: '12px', cursor: 'pointer' }}>
            <ImagePlus size={14} aria-hidden="true" /> Image
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files?.[0]) handleImageFile(e.target.files[0])
                e.target.value = ''
              }}
            />
          </label>
          <div className="flex items-center gap-1">
            <input
              type="url"
              placeholder="https:// video link"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              style={{ padding: '7px 10px', fontSize: '12px', width: '170px' }}
              aria-label="Video URL"
            />
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '7px 10px', fontSize: '12px' }}
              onClick={attachVideo}
            >
              <Link2 size={13} aria-hidden="true" /> Attach
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onCloseEdit && (
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '13px' }}
              onClick={onCloseEdit}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            className="btn-primary"
            style={{ padding: '8px 18px', fontSize: '13px', opacity: canPublish ? 1 : 0.55 }}
            disabled={!canPublish}
            onClick={publish}
          >
            {editing ? 'Save changes' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  )
}
