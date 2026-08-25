'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BarChart2, Users, ClipboardCheck, History, Brain, ShieldCheck,
  Smartphone, Wifi, TriangleAlert, ClipboardList, UserPlus, Loader2
} from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import UserBadge from '@/components/UserBadge'

interface SchoolSummary {
  totalStudents: number
  surveysThisMonth: number
  surveysTotal: number
  avgDigitalConfidence: number | null
  studentsWithNoDevice: number
  studentsWithNoHomeInternet: number
  quietSpaceCount: number
}

interface SurveyRow {
  device_ownership: string
  internet_access: string
  access_limitations: string[] | null
}

const DEVICE_LABELS: Record<string, string> = {
  none: 'No device',
  shared_family: 'Shared family device',
  personal_basic: 'Basic phone',
  personal_smartphone: 'Personal smartphone',
  personal_computer: 'Personal computer',
}

const INTERNET_LABELS: Record<string, string> = {
  none: 'No internet',
  mobile_data_limited: 'Mobile data (limited)',
  mobile_data_adequate: 'Mobile data (adequate)',
  home_broadband: 'Home broadband',
  school_only: 'School internet only',
}

const LIMITATION_LABELS: Record<string, string> = {
  cost: 'Data cost',
  power: 'Power outages',
  no_device: 'Shared device',
  slow_internet: 'Slow internet',
}

interface StudentRecord {
  id: string
  full_name: string
  email: string
  access_code: string
  grade_level: string | null
  is_active: boolean
  created_at: string
}

const GRADE_OPTIONS = [
  { value: '', label: 'Not specified' },
  { value: 'primary', label: 'Primary' },
  { value: 'lower_secondary', label: 'Lower secondary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'higher_secondary', label: 'Higher secondary' },
]

function DistributionBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div style={{ marginBottom: '12px' }}>
      <div className="flex justify-between" style={{ marginBottom: '4px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{label}</span>
        <span className="meta-text">{count} ({pct}%)</span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function TeacherDashboardPage() {
  const [schoolName, setSchoolName] = useState('')
  const [summary, setSummary] = useState<SchoolSummary | null>(null)
  const [deviceDist, setDeviceDist] = useState<Array<{ label: string; count: number }>>([])
  const [internetDist, setInternetDist] = useState<Array<{ label: string; count: number }>>([])
  const [challengeDist, setChallengeDist] = useState<Array<{ label: string; count: number }>>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Student records (roster management)
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [schoolCode, setSchoolCode] = useState('')
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newGrade, setNewGrade] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isAddingStudent, setIsAddingStudent] = useState(false)
  const [studentError, setStudentError] = useState<string | null>(null)
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; accessCode: string; tempPassword: string } | null>(null)

  async function getAccessToken(): Promise<string | null> {
    const supabase = createBrowserSupabaseClient()
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  }

  async function loadRoster() {
    const token = await getAccessToken()
    if (!token) return
    try {
      const res = await fetch('/api/teacher/students', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setStudents(json.data.students as StudentRecord[])
        setSchoolCode((json.data.schoolCode as string) ?? '')
      }
    } catch (e) {
      console.warn('[teacher] roster load failed:', e)
    }
  }

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault()
    setIsAddingStudent(true)
    setStudentError(null)
    setCreatedCredentials(null)
    try {
      const token = await getAccessToken()
      if (!token) {
        setStudentError('Your session has expired. Please sign in again.')
        return
      }
      const res = await fetch('/api/teacher/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fullName: newName, email: newEmail, grade: newGrade, tempPassword: newPassword }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setStudentError(json.error ?? 'Could not add the student record.')
        return
      }
      setCreatedCredentials({
        email: json.data.student.email,
        accessCode: json.data.student.access_code,
        tempPassword: json.data.tempPassword,
      })
      setNewName(''); setNewEmail(''); setNewGrade(''); setNewPassword('')
      await loadRoster()
    } catch {
      setStudentError('Could not reach the server. Check your connection and try again.')
    } finally {
      setIsAddingStudent(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      const supabase = createBrowserSupabaseClient()
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData.session
      if (!session) return

      const { data: member } = await supabase
        .from('school_members')
        .select('full_name, school_id')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (!member) {
        if (!cancelled) {
          setErrorMsg('Could not load your school membership.')
          setLoading(false)
        }
        return
      }

      const [{ data: school }, { data: rpcData, error: rpcError }, { data: rows, error: rowsError }] =
        await Promise.all([
          supabase.from('school_profiles').select('name').eq('id', member.school_id).maybeSingle(),
          supabase.rpc('get_teacher_dashboard_summary', { p_school_id: member.school_id }),
          supabase.from('student_surveys').select('*').eq('school_id', member.school_id),
        ])

      if (cancelled) return

      setSchoolName(school?.name ?? 'Your School')

      if (rpcError || !rpcData) {
        console.error('[teacher] summary RPC failed:', rpcError?.message)
        setErrorMsg('Could not load your school summary. Please refresh and try again.')
        setLoading(false)
        return
      }
      setSummary(rpcData as SchoolSummary)

      const surveyRows = (rowsError ? [] : (rows ?? [])) as SurveyRow[]
      tally(surveyRows.map((r) => r.device_ownership), DEVICE_LABELS, setDeviceDist)
      tally(surveyRows.map((r) => r.internet_access), INTERNET_LABELS, setInternetDist)

      const challengeCounts = new Map<string, number>()
      for (const row of surveyRows) {
        for (const lim of row.access_limitations ?? []) {
          challengeCounts.set(lim, (challengeCounts.get(lim) ?? 0) + 1)
        }
      }
      setChallengeDist(
        [...challengeCounts.entries()]
          .map(([key, count]) => ({ label: LIMITATION_LABELS[key] ?? key, count }))
          .sort((a, b) => b.count - a.count)
      )

      setLoading(false)
    }

    function tally(values: string[], labels: Record<string, string>, setter: (d: Array<{ label: string; count: number }>) => void) {
      const counts = new Map<string, number>()
      for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
      setter(
        [...counts.entries()]
          .map(([key, count]) => ({ label: labels[key] ?? key, count }))
          .sort((a, b) => b.count - a.count)
      )
    }

    load()
    loadRoster()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <main style={{ maxWidth: '520px', margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
        <div className="card" style={{ padding: '32px' }}>
          <ClipboardCheck size={28} style={{ color: 'var(--primary)', margin: '0 auto 12px' }} aria-hidden="true" />
          <h2 style={{ fontSize: '16px', marginBottom: '6px' }}>Loading your class overview…</h2>
          <p className="meta-text">Aggregating this month&apos;s survey results.</p>
          <div className="skeleton" style={{ height: '12px', marginTop: '20px' }} />
          <div className="skeleton" style={{ height: '12px', marginTop: '8px' }} />
        </div>
      </main>
    )
  }

  const s = summary!
  const completionPct = s.totalStudents > 0 ? Math.min(Math.round((s.surveysThisMonth / s.totalStudents) * 100), 100) : 0

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <BarChart2 size={20} style={{ color: 'var(--primary)' }} aria-hidden="true" />
          <span>Ed-<span className="logo-accent">Vantage</span></span>
        </div>
        <nav className="sidebar-nav" aria-label="Teacher dashboard navigation">
          <a href="#" className="nav-item active"><ClipboardCheck size={16} aria-hidden="true" /> Dashboard</a>
          <Link href="/dashboard" className="nav-item"><ClipboardList size={16} aria-hidden="true" /> Readiness Assessment</Link>
          <a href="#student-records" className="nav-item"><UserPlus size={16} aria-hidden="true" /> Student Records</a>
          <a href="#survey-insights" className="nav-item"><Users size={16} aria-hidden="true" /> Survey Insights</a>
        </nav>
        <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid var(--border)' }}>
          <UserBadge compact />
        </div>
      </aside>

      <main className="main-content">
        <div className="flex items-center justify-between" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1>Teacher Dashboard</h1>
            <p className="body-text" style={{ marginTop: '4px' }}>{schoolName}</p>
          </div>
          <span className="badge badge-primary">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} survey window
          </span>
        </div>

        {errorMsg && (
          <div className="badge badge-danger" style={{ width: '100%', padding: '10px 14px', marginBottom: '20px', borderRadius: '8px' }}>
            {errorMsg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <Users size={18} style={{ color: 'var(--info)', marginBottom: '8px' }} aria-hidden="true" />
            <div style={{ fontSize: '26px', fontWeight: 700 }}>{s.totalStudents}</div>
            <div className="meta-text">Students on the portal</div>
          </div>
          <div className="card" style={{ padding: '20px' }}>
            <ClipboardCheck size={18} style={{ color: 'var(--success)', marginBottom: '8px' }} aria-hidden="true" />
            <div style={{ fontSize: '26px', fontWeight: 700 }}>{s.surveysThisMonth}<span style={{ fontSize: '14px', fontWeight: 500 }}> / {s.totalStudents}</span></div>
            <div className="meta-text">Surveys completed this month</div>
          </div>
          <div className="card" style={{ padding: '20px' }}>
            <History size={18} style={{ color: 'var(--warning)', marginBottom: '8px' }} aria-hidden="true" />
            <div style={{ fontSize: '26px', fontWeight: 700 }}>{s.surveysTotal}</div>
            <div className="meta-text">All-time submissions</div>
          </div>
          <div className="card" style={{ padding: '20px' }}>
            <Brain size={18} style={{ color: 'var(--primary)', marginBottom: '8px' }} aria-hidden="true" />
            <div style={{ fontSize: '26px', fontWeight: 700 }}>{s.avgDigitalConfidence != null ? `${s.avgDigitalConfidence}/5` : '—'}</div>
            <div className="meta-text">Avg. digital confidence</div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
            <h2 style={{ fontSize: '15px' }}>Monthly completion</h2>
            <span className="badge badge-success" style={{ fontSize: '11px' }}>{completionPct}% of portal students</span>
          </div>
          <div className="progress-bar-track" style={{ height: '10px' }}>
            <div className="progress-bar-fill" style={{ width: `${completionPct}%` }} />
          </div>
          <p className="meta-text" style={{ marginTop: '8px', fontSize: '12px' }}>
            Students who have not completed this month&apos;s survey are asked to fill it in before they can open their student dashboard.
          </p>
        </div>

        {/* Student records — add students to THIS school only */}
        <section id="student-records">
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Student Records</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>Add a student</h3>
              {studentError && (
                <div className="badge badge-danger" style={{ width: '100%', padding: '8px 12px', marginBottom: '12px', borderRadius: '8px' }}>
                  {studentError}
                </div>
              )}
              {createdCredentials && (
                <div className="badge badge-success" style={{ display: 'block', width: '100%', padding: '10px 12px', marginBottom: '12px', borderRadius: '8px', whiteSpace: 'normal', textAlign: 'left' }}>
                  Student added. Login: <strong>{createdCredentials.email}</strong> · School code <strong>{schoolCode}</strong> ·
                  Personal code <strong>{createdCredentials.accessCode}</strong> · Temp password <strong>{createdCredentials.tempPassword}</strong>
                  <span className="meta-text" style={{ display: 'block', marginTop: '4px', fontSize: '11px' }}>
                    Share these now — the password is not stored in plain text.
                  </span>
                </div>
              )}
              <form onSubmit={handleAddStudent}>
                <div className="form-group">
                  <label htmlFor="stu-name">Full name</label>
                  <input id="stu-name" type="text" placeholder="e.g. Aarav Tamang" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="stu-email">School email</label>
                  <input id="stu-email" type="email" placeholder="student@school.edu.np" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="stu-grade">Grade</label>
                    <select id="stu-grade" value={newGrade} onChange={(e) => setNewGrade(e.target.value)}>
                      {GRADE_OPTIONS.map((g) => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="stu-pass">Temporary password</label>
                    <input id="stu-pass" type="text" placeholder="Min 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
                  </div>
                </div>
                <button type="submit" disabled={isAddingStudent} className="btn-primary w-full" style={{ justifyContent: 'center', opacity: isAddingStudent ? 0.7 : 1 }}>
                  {isAddingStudent ? (
                    <><Loader2 size={15} className="animate-spin" aria-hidden="true" /> Creating record…</>
                  ) : (
                    <><UserPlus size={15} aria-hidden="true" /> Add student to my school</>
                  )}
                </button>
              </form>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>Roster ({students.length})</h3>
              {students.length === 0 ? (
                <p className="meta-text">No student records yet for your school.</p>
              ) : (
                <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '6px 8px 6px 0' }}>Name</th>
                        <th style={{ padding: '6px 8px' }}>Code</th>
                        <th style={{ padding: '6px 0 6px 8px' }}>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '7px 8px 7px 0' }}>
                            {student.full_name}
                            <span className="meta-text" style={{ display: 'block', fontSize: '11px' }}>{student.email}</span>
                          </td>
                          <td style={{ padding: '7px 8px', fontFamily: 'monospace' }}>{student.access_code}</td>
                          <td style={{ padding: '7px 0 7px 8px' }} className="meta-text">
                            {GRADE_OPTIONS.find((g) => g.value === (student.grade_level ?? ''))?.label ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="survey-insights">
          <div className="card" style={{ padding: '14px 20px', marginBottom: '20px', background: 'rgba(37, 99, 235, 0.04)', borderColor: 'var(--info)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={20} style={{ color: 'var(--info)', flexShrink: 0 }} aria-hidden="true" />
            <p style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
              You are viewing <strong>aggregate statistics only</strong>. Individual student responses always remain confidential.
            </p>
          </div>

          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Survey Insights</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="card" style={{ padding: '24px' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: '14px' }}>
                <Smartphone size={16} style={{ color: 'var(--primary)' }} aria-hidden="true" />
                <h3 style={{ fontSize: '15px' }}>Device access at home</h3>
              </div>
              {deviceDist.length === 0 ? (
                <p className="meta-text">No submissions yet.</p>
              ) : (
                deviceDist.map((d) => (
                  <DistributionBar key={d.label} label={d.label} count={d.count} total={s.surveysTotal} />
                ))
              )}
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: '14px' }}>
                <Wifi size={16} style={{ color: 'var(--info)' }} aria-hidden="true" />
                <h3 style={{ fontSize: '15px' }}>Internet access at home</h3>
              </div>
              {internetDist.length === 0 ? (
                <p className="meta-text">No submissions yet.</p>
              ) : (
                internetDist.map((d) => (
                  <DistributionBar key={d.label} label={d.label} count={d.count} total={s.surveysTotal} />
                ))
              )}
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: '14px' }}>
                <TriangleAlert size={16} style={{ color: 'var(--warning)' }} aria-hidden="true" />
                <h3 style={{ fontSize: '15px' }}>Reported challenges</h3>
              </div>
              {challengeDist.length === 0 ? (
                <p className="meta-text">No challenges reported yet.</p>
              ) : (
                challengeDist.map((d) => (
                  <DistributionBar key={d.label} label={d.label} count={d.count} total={s.surveysTotal} />
                ))
              )}
              <div className="divider" style={{ margin: '14px 0' }} />
              <div className="flex justify-between" style={{ fontSize: '13px' }}>
                <span className="meta-text">Students with no quiet study space</span>
                <span style={{ fontWeight: 600 }}>{Math.max(s.surveysTotal - s.quietSpaceCount, 0)}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '15px', marginBottom: '2px' }}>Next step: school readiness assessment</h3>
            <p className="meta-text">Combine these insights with infrastructure and management scores.</p>
          </div>
          <Link href="/dashboard" className="btn-primary" style={{ textDecoration: 'none' }}>
            Run Assessment
          </Link>
        </div>
      </main>
    </div>
  )
}
