'use client'

import { useCallback, useEffect, useState } from 'react'
import { KeyRound, Loader2, ShieldAlert, LogOut, UserPlus } from 'lucide-react'

// ================================================================
// Boss-level control page — reachable only by knowing this URL AND
// holding ADMIN_SECRET_KEY. All data access goes through /api/admin/*
// which independently enforces the key server-side.
// ================================================================

const KEY_STORAGE = 'edufit_admin_key'

interface OverviewStats {
  schools: number
  teachers: number
  students: number
  activeMembers: number
  totalSurveys: number
  liveScrapedEvents: number
}

interface SchoolRow {
  id: string
  name: string
  district: string
  location: string
  school_code: string | null
}

interface MemberRow {
  id: string
  email: string
  member_role: string
  full_name: string
  access_code: string
  is_active: boolean
  grade_level: string | null
  school_id: string
}

export default function HqControlPage() {
  const [adminKey, setAdminKey] = useState('')
  const [keyEntered, setKeyEntered] = useState(false)
  const [keyError, setKeyError] = useState<string | null>(null)

  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [schools, setSchools] = useState<SchoolRow[]>([])
  const [members, setMembers] = useState<MemberRow[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)

  // Create-teacher form
  const [formSchoolId, setFormSchoolId] = useState('')
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [createNote, setCreateNote] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    const saved = window.sessionStorage.getItem(KEY_STORAGE)
    if (saved) {
      setAdminKey(saved)
      setKeyEntered(true)
    }
  }, [])

  const loadAll = useCallback(async (key: string) => {
    setLoadingData(true)
    setDataError(null)
    try {
      const headers = { 'x-admin-key': key }
      const [overviewRes, membersRes] = await Promise.all([
        fetch('/api/admin/overview', { headers }),
        fetch('/api/admin/members', { headers }),
      ])

      if (!overviewRes.ok || !membersRes.ok) {
        if (overviewRes.status === 401 || membersRes.status === 401) {
          window.sessionStorage.removeItem(KEY_STORAGE)
          setKeyEntered(false)
          setKeyError('That key was rejected.')
          return
        }
        setDataError('One or more admin queries failed.')
        return
      }

      const overviewJson = await overviewRes.json()
      const membersJson = await membersRes.json()
      setStats(overviewJson.data.stats as OverviewStats)
      setSchools((overviewJson.data.schools ?? []) as SchoolRow[])
      setMembers((membersJson.data.members ?? []) as MemberRow[])
      if (!formSchoolId && overviewJson.data.schools?.length) {
        setFormSchoolId(overviewJson.data.schools[0].id)
      }
    } catch {
      setDataError('Could not reach admin APIs.')
    } finally {
      setLoadingData(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (keyEntered && adminKey) loadAll(adminKey)
  }, [keyEntered, adminKey, loadAll])

  function handleKeySubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!adminKey.trim()) return
    window.sessionStorage.setItem(KEY_STORAGE, adminKey.trim())
    setKeyEntered(true)
  }

  function handleLock() {
    window.sessionStorage.removeItem(KEY_STORAGE)
    setAdminKey('')
    setKeyEntered(false)
    setStats(null)
    setSchools([])
    setMembers([])
    setCreateNote(null)
  }

  async function handleCreateTeacher(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    setCreateNote(null)
    try {
      const res = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ schoolId: formSchoolId, fullName: formName, email: formEmail, tempPassword: formPassword }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setCreateError(json.error ?? 'Failed to create the teacher account.')
        return
      }
      setCreateNote(
        `Teacher created for ${json.data.schoolName}. Login: ${json.data.teacher.email} · ` +
          `School code ${json.data.schoolCode} · Personal code ${json.data.teacher.access_code} · Temp password ${json.data.tempPassword}`
      )
      setFormName(''); setFormEmail(''); setFormPassword('')
      await loadAll(adminKey)
    } catch {
      setCreateError('Could not reach the server.')
    } finally {
      setCreating(false)
    }
  }

  if (!keyEntered) {
    return (
      <main style={{ maxWidth: '460px', margin: '0 auto', padding: '96px 20px' }}>
        <div className="card" style={{ padding: '32px' }}>
          <div
            style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'var(--primary-soft)', color: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}
          >
            <KeyRound size={20} aria-hidden="true" />
          </div>
          <h1 style={{ fontSize: '20px', textAlign: 'center' }}>HQ Control</h1>
          <p className="meta-text" style={{ textAlign: 'center', marginBottom: '20px' }}>
            Restricted access. Enter the admin key to continue.
          </p>
          {keyError && (
            <div className="badge badge-danger" style={{ width: '100%', padding: '8px 12px', marginBottom: '12px', borderRadius: '8px', display: 'flex', gap: '6px' }}>
              <ShieldAlert size={14} aria-hidden="true" /> {keyError}
            </div>
          )}
          <form onSubmit={handleKeySubmit}>
            <div className="form-group">
              <label htmlFor="admin-key">Admin key</label>
              <input
                id="admin-key"
                type="password"
                autoComplete="off"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full" style={{ justifyContent: 'center' }}>
              Unlock
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '48px 20px 80px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>HQ Control</h1>
          <p className="body-text">Full-platform administration</p>
        </div>
        <button type="button" className="btn-secondary" onClick={handleLock} style={{ gap: '6px' }}>
          <LogOut size={14} aria-hidden="true" /> Lock
        </button>
      </div>

      {dataError && (
        <div className="badge badge-danger" style={{ width: '100%', padding: '10px 14px', marginBottom: '16px', borderRadius: '8px' }}>
          {dataError}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Schools', value: stats?.schools },
          { label: 'Teachers', value: stats?.teachers },
          { label: 'Students', value: stats?.students },
          { label: 'Active members', value: stats?.activeMembers },
          { label: 'Surveys total', value: stats?.totalSurveys },
          { label: 'Live events cached', value: stats?.liveScrapedEvents },
        ].map((card) => (
          <div className="card" key={card.label} style={{ padding: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>{loadingData ? '…' : card.value ?? '—'}</div>
            <div className="meta-text">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Create teacher */}
      <section className="card" style={{ padding: '24px', marginBottom: '24px', borderLeft: '4px solid var(--primary)' }}>
        <h2 style={{ fontSize: '16px', marginBottom: '4px' }}>Create teacher account</h2>
        <p className="meta-text" style={{ marginBottom: '14px' }}>
          Generates the auth login and personal code (TCH-*), scoped to the chosen school.
        </p>
        {createError && (
          <div className="badge badge-danger" style={{ width: '100%', padding: '8px 12px', marginBottom: '10px', borderRadius: '8px' }}>{createError}</div>
        )}
        {createNote && (
          <div className="badge badge-success" style={{ display: 'block', width: '100%', padding: '10px 12px', marginBottom: '10px', borderRadius: '8px', whiteSpace: 'normal', textAlign: 'left' }}>
            {createNote}
          </div>
        )}
        <form onSubmit={handleCreateTeacher}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="t-school">School</label>
              <select id="t-school" value={formSchoolId} onChange={(e) => setFormSchoolId(e.target.value)} required>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name} ({school.school_code ?? 'no code'})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="t-name">Full name</label>
              <input id="t-name" type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Sita Sharma" required />
            </div>
            <div className="form-group">
              <label htmlFor="t-email">Email</label>
              <input id="t-email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="teacher@school.edu.np" required />
            </div>
            <div className="form-group">
              <label htmlFor="t-pass">Temporary password</label>
              <input id="t-pass" type="text" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="Min 8 characters" minLength={8} required />
            </div>
          </div>
          <button type="submit" disabled={creating || schools.length === 0} className="btn-primary" style={{ justifyContent: 'center', opacity: creating ? 0.7 : 1 }}>
            {creating ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <UserPlus size={15} aria-hidden="true" />}
            Create teacher
          </button>
        </form>
      </section>

      {/* Schools */}
      <section className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', marginBottom: '12px' }}>Schools ({schools.length})</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '6px 8px 6px 0' }}>Name</th>
              <th style={{ padding: '6px 8px' }}>District</th>
              <th style={{ padding: '6px 0 6px 8px' }}>Code</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((school) => (
              <tr key={school.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '7px 8px 7px 0' }}>{school.name}</td>
                <td style={{ padding: '7px 8px' }} className="meta-text">{school.district}</td>
                <td style={{ padding: '7px 0 7px 8px', fontFamily: 'monospace' }}>{school.school_code ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Members */}
      <section className="card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '16px', marginBottom: '12px' }}>All members ({members.length})</h2>
        <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '6px 8px 6px 0' }}>Name</th>
                <th style={{ padding: '6px 8px' }}>Role</th>
                <th style={{ padding: '6px 8px' }}>Code</th>
                <th style={{ padding: '6px 8px' }}>Status</th>
                <th style={{ padding: '6px 0 6px 8px' }}>School</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const school = schools.find((sc) => sc.id === member.school_id)
                return (
                  <tr key={member.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '7px 8px 7px 0' }}>
                      {member.full_name}
                      <span className="meta-text" style={{ display: 'block', fontSize: '11px' }}>{member.email}</span>
                    </td>
                    <td style={{ padding: '7px 8px' }} className="meta-text">{member.member_role}</td>
                    <td style={{ padding: '7px 8px', fontFamily: 'monospace' }}>{member.access_code}</td>
                    <td style={{ padding: '7px 8px' }}>
                      {member.is_active ? (
                        <span className="badge badge-success">active</span>
                      ) : (
                        <span className="badge badge-danger">disabled</span>
                      )}
                    </td>
                    <td style={{ padding: '7px 0 7px 8px' }} className="meta-text">{school?.name ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
