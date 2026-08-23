'use client'

// ================================================================
// Community Hub — private 1-on-1 direct messages
// Students can only message verified staff (child-safety, spec §44).
// ================================================================

import { useEffect, useState } from 'react'
import { ChevronLeft, MessageCircle, Send, UserPlus } from 'lucide-react'
import {
  getConversationsFor, getDmDirectory, getMessagesFor,
  type CommunityData, type CommunityUser,
} from '@/lib/community'
import { Avatar, authorBadge, relativeTime, type CommunityUpdateFn } from './ui'

export default function MessagesTab({
  data,
  me,
  update,
}: {
  data: CommunityData
  me: CommunityUser
  update: CommunityUpdateFn
}) {
  const conversations = getConversationsFor(data, me.id)
  const [activeId, setActiveId] = useState<string | null>(
    () => conversations[0]?.conversation.id ?? null
  )
  const [draft, setDraft] = useState('')
  const [showDirectory, setShowDirectory] = useState(false)

  const active = conversations.find((c) => c.conversation.id === activeId)
  const thread = activeId ? getMessagesFor(data, activeId) : []
  const directory = getDmDirectory(data, me)

  useEffect(() => {
    if (!activeId) return
    const needsRead = data.messages.some(
      (m) => m.conversationId === activeId && m.senderId !== me.id && !m.readBy.includes(me.id)
    )
    if (needsRead) {
      update((d) => {
        d.messages = d.messages.map((m) =>
          m.conversationId === activeId && m.senderId !== me.id && !m.readBy.includes(me.id)
            ? { ...m, readBy: [...m.readBy, me.id] }
            : m
        )
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId])

  function startConversation(partnerId: string) {
    const existing = data.conversations.find(
      (c) =>
        c.participantIds.length === 2 &&
        c.participantIds.includes(me.id) &&
        c.participantIds.includes(partnerId)
    )
    if (existing) {
      setActiveId(existing.id)
    } else {
      const id = `con-${Date.now()}`
      update((d) => {
        d.conversations.push({
          id,
          participantIds: [me.id, partnerId],
          lastMessageAt: new Date().toISOString(),
        })
      })
      setActiveId(id)
    }
    setShowDirectory(false)
  }

  function send() {
    const body = draft.trim()
    if (!body || !activeId) return
    update((d) => {
      d.messages.push({
        id: `msg-${Date.now()}`,
        conversationId: activeId,
        senderId: me.id,
        body,
        createdAt: new Date().toISOString(),
        readBy: [me.id],
      })
      const conv = d.conversations.find((c) => c.id === activeId)
      if (conv) conv.lastMessageAt = new Date().toISOString()
    })
    setDraft('')
  }

  return (
    <section aria-label="Direct messages">
      <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', gap: '14px', minHeight: '430px' }}>
        <div style={{ borderRight: '1px solid var(--border)', paddingRight: '10px' }}>
          <button
            type="button"
            className="btn-secondary w-full"
            style={{ justifyContent: 'center', padding: '7px', fontSize: '12px', marginBottom: '12px' }}
            onClick={() => setShowDirectory(!showDirectory)}
          >
            <UserPlus size={14} aria-hidden="true" /> New message
          </button>

          {showDirectory && (
            <div className="card" style={{ padding: '8px', marginBottom: '12px' }}>
              <p className="meta-text" style={{ fontSize: '11px', padding: '4px 6px' }}>
                {me.role === 'student'
                  ? 'You can message verified teachers and admins:'
                  : 'Choose a member:'}
              </p>
              {directory.length === 0 && (
                <p className="meta-text" style={{ fontSize: '11px', padding: '4px 6px' }}>
                  No one available.
                </p>
              )}
              {directory.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => startConversation(u.id)}
                  className="nav-item"
                  style={{ padding: '6px 8px', fontSize: '12px' }}
                >
                  <Avatar user={u} size={22} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {conversations.length === 0 && !showDirectory && (
            <p className="meta-text" style={{ fontSize: '12px' }}>No conversations yet.</p>
          )}

          {conversations.map(({ conversation, partner, lastMessage, unreadCount }) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => setActiveId(conversation.id)}
              aria-current={conversation.id === activeId}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '2px',
                width: '100%',
                background: conversation.id === activeId ? 'var(--primary-soft)' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                marginBottom: '4px',
                padding: '9px 10px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span className="flex items-center gap-2" style={{ width: '100%' }}>
                <Avatar user={partner} size={22} />
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: '12.5px',
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {partner.name}
                </span>
                {unreadCount > 0 && (
                  <span className="badge badge-danger" style={{ fontSize: '10px', marginLeft: 'auto', padding: '1px 6px' }}>
                    {unreadCount}
                  </span>
                )}
              </span>
              {lastMessage && (
                <span
                  className="meta-text"
                  style={{ fontSize: '11px', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {lastMessage.senderId === me.id ? 'You: ' : ''}
                  {lastMessage.body.slice(0, 34)}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!active ? (
            <div style={{ margin: 'auto', textAlign: 'center', padding: '24px' }}>
              <MessageCircle size={26} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} aria-hidden="true" />
              <p className="body-text" style={{ fontSize: '13px' }}>Select or start a private conversation.</p>
              <p className="meta-text" style={{ fontSize: '11.5px', marginTop: '6px' }}>
                Students can message verified staff. Everything stays between the two of you.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <button
                  type="button"
                  aria-label="Back to conversations"
                  onClick={() => setActiveId(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-muted)' }}
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                </button>
                <Avatar user={active.partner} size={28} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                    {active.partner.name}
                  </div>
                  <div className="meta-text" style={{ fontSize: '11px' }}>
                    {authorBadge(active.partner)?.label ?? 'Student'}
                  </div>
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  maxHeight: '340px',
                }}
              >
                {thread.length === 0 && (
                  <p className="meta-text" style={{ margin: 'auto', fontSize: '12px' }}>
                    No messages yet — say hello!
                  </p>
                )}
                {thread.map((msg) => {
                  const mine = msg.senderId === me.id
                  return (
                    <div key={msg.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
                      <div
                        style={{
                          background: mine ? 'var(--primary)' : 'var(--surface-muted)',
                          color: mine ? '#fff' : 'var(--text-primary)',
                          padding: '9px 13px',
                          borderRadius: '14px',
                          borderBottomRightRadius: mine ? '4px' : '14px',
                          borderBottomLeftRadius: mine ? '14px' : '4px',
                          fontSize: '13px',
                          lineHeight: 1.55,
                        }}
                      >
                        {msg.body}
                      </div>
                      <p
                        className="meta-text"
                        style={{ fontSize: '10.5px', marginTop: '3px', textAlign: mine ? 'right' : 'left' }}
                      >
                        {relativeTime(msg.createdAt)}
                      </p>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center gap-2" style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
                <input
                  type="text"
                  placeholder="Write a private message…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') send()
                  }}
                  aria-label="Message text"
                />
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: '9px 14px' }}
                  onClick={send}
                  disabled={!draft.trim()}
                  aria-label="Send message"
                >
                  <Send size={15} aria-hidden="true" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
