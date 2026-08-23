'use client'

// ================================================================
// Community Hub — admin panel (spec §48)
// Overview stats · verification queue · reports moderation · audit log
// ================================================================

import { useState } from 'react'
import {
  getOpenReports, getUserById,
  type CommunityData, type CommunityUser,
} from '@/lib/community'
import { EmptyState, relativeTime, type CommunityUpdateFn } from './ui'

export default function AdminPanel({
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
  const [tabKey, setTabKey] = useState<'reports' | 'verification' | 'audit'>('reports')
  const openReports = getOpenReports(data)
  const requests = data.verificationRequests
  const totalLikes = data.posts.reduce((s, p) => s + p.likeCount, 0)
  const totalSaves = data.posts.reduce((s, p) => s + p.saveCount, 0)
  const totalViews = data.posts.reduce((s, p) => s + p.viewCount, 0)
  const verifiedTeachers = data.users.filter(
    (u) => u.role === 'teacher' && u.verificationStatus === 'approved'
  ).length

  function decideVerification(reqId: string, decision: 'approved' | 'rejected' | 'revoked') {
    update((draft) => {
      const req = draft.verificationRequests.find((r) => r.id === reqId)
      if (!req) return
      req.status = decision
      req.reviewedBy = me.id
      req.reviewedAt = new Date().toISOString()
      const teacher = draft.users.find(
        (u) => u.email.toLowerCase() === req.userEmail.toLowerCase()
      )
      if (teacher) {
        teacher.verificationStatus =
          decision === 'approved' ? 'approved' : decision === 'revoked' ? 'revoked' : 'rejected'
      }
      draft.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorId: me.id,
        action: decision === 'approved' ? 'teacher_verified' : 'teacher_verification_revoked',
        targetType: 'user',
        targetId: teacher?.id ?? req.userEmail,
        metadata: `${req.userName}: ${decision}`,
        createdAt: new Date().toISOString(),
      })
      draft.notifications.push({
        id: `ntf-${Date.now()}`,
        userId: teacher?.id ?? '',
        type: 'verification',
        title: decision === 'approved' ? 'You are verified!' : `Verification ${decision}`,
        body:
          decision === 'approved'
            ? 'An administrator approved your publishing access. You can now post to the Community Hub.'
            : `Your teacher verification request was ${decision}. Contact the administration office for details.`,
        referenceType: 'verification',
        referenceId: req.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    })
    onToast(`Verification ${decision}`)
  }

  function resolveReport(reportId: string, action: 'dismiss' | 'remove') {
    update((draft) => {
      const report = draft.reports.find((r) => r.id === reportId)
      if (!report) return
      report.status = action === 'dismiss' ? 'dismissed' : 'resolved'
      report.reviewedBy = me.id
      report.reviewedAt = new Date().toISOString()
      if (action === 'remove') {
        const idx = draft.posts.findIndex((p) => p.id === report.targetId)
        if (idx >= 0) draft.posts[idx] = { ...draft.posts[idx], status: 'removed' }
        draft.auditLogs.unshift({
          id: `aud-${Date.now()}-r`,
          actorId: me.id,
          action: 'post_removed',
          targetType: 'post',
          targetId: report.targetId,
          metadata: `Removed following report ${report.id}`,
          createdAt: new Date().toISOString(),
        })
      }
      draft.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorId: me.id,
        action: action === 'dismiss' ? 'report_dismissed' : 'report_resolved',
        targetType: 'report',
        targetId: reportId,
        metadata: `Report handled: ${action}`,
        createdAt: new Date().toISOString(),
      })
    })
    onToast(action === 'dismiss' ? 'Report dismissed' : 'Content removed and logged')
  }

  return (
    <section aria-label="Community administration">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '22px' }}>
        {[
          { label: 'Posts', value: data.posts.filter((p) => p.status !== 'removed').length },
          { label: 'Likes', value: totalLikes },
          { label: 'Saves', value: totalSaves },
          { label: 'Views', value: totalViews },
          { label: 'Verified teachers', value: verifiedTeachers },
          { label: 'Open reports', value: openReports.length },
        ].map((stat) => (
          <div key={stat.label} className="card" style={{ padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</div>
            <div className="meta-text" style={{ fontSize: '11px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2" style={{ marginBottom: '14px' }}>
        {(
          [
            ['reports', `Reports (${openReports.length})`],
            ['verification', `Verification (${requests.filter((r) => r.status === 'pending').length})`],
            ['audit', 'Audit log'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTabKey(key)}
            className={`btn-secondary ${tabKey === key ? 'active' : ''}`}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              background: tabKey === key ? 'var(--primary-soft)' : undefined,
              color: tabKey === key ? 'var(--primary)' : undefined,
              borderColor: tabKey === key ? 'var(--primary)' : undefined,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tabKey === 'reports' && (
        <>
          {openReports.length === 0 ? (
            <EmptyState compact title="No open reports." />
          ) : (
            openReports.map((report) => {
              const reportedPost = data.posts.find((p) => p.id === report.targetId)
              const reporter = getUserById(data, report.reporterId)
              return (
                <div
                  key={report.id}
                  className="card"
                  style={{ padding: '16px 18px', marginBottom: '10px', borderLeft: '4px solid var(--warning)' }}
                >
                  <div className="flex items-center gap-2" style={{ marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span className="badge badge-warning" style={{ fontSize: '11px' }}>{report.reason}</span>
                    <span className="meta-text" style={{ fontSize: '11.5px' }}>
                      by {reporter?.name ?? 'member'} · {relativeTime(report.createdAt)}
                    </span>
                  </div>
                  {reportedPost ? (
                    <p className="body-text" style={{ fontSize: '12.5px', fontStyle: 'italic' }}>
                      "{reportedPost.content.slice(0, 140)}
                      {reportedPost.content.length > 140 ? '…' : ''}"
                    </p>
                  ) : (
                    <p className="meta-text" style={{ fontSize: '12px' }}>Reported content no longer exists.</p>
                  )}
                  {report.details && (
                    <p className="meta-text" style={{ fontSize: '11.5px', marginTop: '4px' }}>
                      Reporter note: {report.details}
                    </p>
                  )}
                  <div className="flex items-center gap-2" style={{ marginTop: '12px' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => resolveReport(report.id, 'dismiss')}
                    >
                      Dismiss
                    </button>
                    {reportedPost && (
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => resolveReport(report.id, 'remove')}
                      >
                        Remove post
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </>
      )}

      {tabKey === 'verification' && (
        <>
          {requests.length === 0 ? (
            <EmptyState compact title="No verification requests." />
          ) : (
            requests.map((req) => (
              <div key={req.id} className="card" style={{ padding: '16px 18px', marginBottom: '10px' }}>
                <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                      {req.userName} <span className="meta-text">· {req.subject}</span>
                    </div>
                    <div className="meta-text" style={{ fontSize: '11.5px' }}>
                      {req.userEmail} · requested {relativeTime(req.requestedAt)}
                    </div>
                    {req.reason && (
                      <p className="body-text" style={{ fontSize: '12.5px', marginTop: '6px' }}>{req.reason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {req.status === 'pending' ? (
                      <>
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => decideVerification(req.id, 'approved')}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => decideVerification(req.id, 'rejected')}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <>
                        <span
                          className={`badge ${req.status === 'approved' ? 'badge-success' : 'badge-danger'}`}
                          style={{ fontSize: '11px' }}
                        >
                          {req.status}
                        </span>
                        {req.status === 'approved' && (
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => decideVerification(req.id, 'revoked')}
                          >
                            Revoke
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {tabKey === 'audit' && (
        <div className="card" style={{ padding: '6px 18px' }}>
          {data.auditLogs.slice(0, 12).map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between"
              style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', gap: '10px' }}
            >
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {entry.action.replace(/_/g, ' ')}
              </span>
              <span
                className="meta-text"
                style={{
                  fontSize: '11.5px',
                  textAlign: 'right',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {entry.metadata ?? entry.targetId}
              </span>
              <span className="meta-text" style={{ fontSize: '11px', flexShrink: 0 }}>
                {relativeTime(entry.createdAt)}
              </span>
            </div>
          ))}
          {data.auditLogs.length === 0 && (
            <p className="meta-text" style={{ padding: '12px 0', fontSize: '12px' }}>
              No administrative actions recorded yet.
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        className="btn-secondary"
        style={{ marginTop: '16px', fontSize: '12px' }}
        onClick={() => {
          if (window.confirm('Reset all community demo data to its seeded state?')) {
            resetAndReload()
          }
        }}
      >
        Reset demo data
      </button>
    </section>
  )
}

function resetAndReload() {
  import('@/lib/community').then(({ resetCommunityData }) => {
    resetCommunityData()
    window.location.reload()
  })
}
