'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BarChart2, GraduationCap, BookOpen, CheckCircle2, Smartphone, Wifi,
  Clock, Brain, MonitorSmartphone, CalendarClock, Award, ExternalLink,
  ShieldCheck, Home
} from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import UserBadge from '@/components/UserBadge'
import type {
  StudentSurvey, DeviceOwnership, InternetAccess, LearningPreference, Resource
} from '@/lib/types'

const DEVICE_LABELS: Record<DeviceOwnership, string> = {
  none: 'No device available',
  shared_family: 'Shared family device',
  personal_basic: 'Basic phone',
  personal_smartphone: 'Personal smartphone',
  personal_computer: 'Personal computer',
}

const INTERNET_LABELS: Record<InternetAccess, string> = {
  none: 'No internet access',
  mobile_data_limited: 'Mobile data (limited)',
  mobile_data_adequate: 'Mobile data (adequate)',
  home_broadband: 'Home broadband',
  school_only: 'School internet only',
}

const LEARNING_LABELS: Record<LearningPreference, string> = {
  text: 'Textbooks & PDFs',
  video: 'Video lessons',
  interactive: 'Interactive exercises',
  audio: 'Audio lessons',
  mixed: 'Mixed formats',
}

const LIMITATION_LABELS: Record<string, string> = {
  cost: 'Mobile data is too expensive',
  power: 'Frequent power outages',
  no_device: 'Device must be shared',
  slow_internet: 'Slow or unstable internet',
}

function monthStart(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
}

export default function StudentDashboardPage() {
  const router = useRouter()

  type Phase = 'loading' | 'needs-survey' | 'ready'
  const [phase, setPhase] = useState<Phase>('loading')
  const [memberName, setMemberName] = useState('')
  const [latestSurvey, setLatestSurvey] = useState<StudentSurvey | null>(null)
  const [resources, setResources] = useState<Resource[]>([])
  const [loadingResources, setLoadingResources] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const supabase = createBrowserSupabaseClient()
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData.session
      if (!session) {
        router.replace('/login')
        return
      }
      const uid = session.user.id

      const { data: member } = await supabase
        .from('school_members')
        .select('full_name, school_id')
        .eq('user_id', uid)
        .maybeSingle()

      if (cancelled) return
      setMemberName(member?.full_name ?? 'Student')

      const start = monthStart()
      const { data: surveys } = await supabase
        .from('student_surveys')
        .select('*')
        .eq('submitted_by', uid)
        .gte('submitted_at', start.toISOString())
        .order('submitted_at', { ascending: false })
        .limit(1)

      if (cancelled) return

      if (!surveys || surveys.length === 0) {
        setPhase('needs-survey')
        router.replace('/survey')
        return
      }

      const row = surveys[0]
      setLatestSurvey({
        id: row.id,
        schoolId: row.school_id,
        authMethod: row.auth_method,
        deviceOwnership: row.device_ownership,
        internetAccess: row.internet_access,
        averageDailyScreenTimeMinutes: row.average_daily_screen_time_minutes,
        learningPreference: row.learning_preference,
        digitalConfidence: row.digital_confidence,
        hasQuietStudySpace: row.has_quiet_study_space,
        accessLimitations: row.access_limitations ?? [],
        completedOnSharedDevice: row.completed_on_shared_device,
        submittedAt: row.submitted_at,
        confirmedAt: row.confirmed_at,
      })
      setPhase('ready')
    }

    load()
    return () => { cancelled = true }
  }, [router])

  useEffect(() => {
    let cancelled = false
    async function fetchResources() {
      try {
        const res = await fetch('/api/resources')
        const data = await res.json()
        if (!cancelled && data.success) setResources(data.data.slice(0, 4))
      } catch (err) {
        console.error('Failed to fetch resources:', err)
      } finally {
        if (!cancelled) setLoadingResources(false)
      }
    }
    fetchResources()
    return () => { cancelled = true }
  }, [])

  if (phase !== 'ready') {
    return (
      <main style={{ maxWidth: '520px', margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
        <div className="card" style={{ padding: '32px' }}>
          <GraduationCap size={28} style={{ color: 'var(--primary)', margin: '0 auto 12px' }} aria-hidden="true" />
          <h2 style={{ fontSize: '16px', marginBottom: '6px' }}>
            {phase === 'needs-survey' ? 'Taking you to this month’s survey…' : 'Loading your dashboard…'}
          </h2>
          <p className="meta-text">Checking your monthly survey status.</p>
          <div className="skeleton" style={{ height: '12px', marginTop: '20px' }} />
          <div className="skeleton" style={{ height: '12px', marginTop: '8px' }} />
        </div>
      </main>
    )
  }

  const survey = latestSurvey!
  const nextOpen = (() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth() + 1, 1).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  })()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <BarChart2 size={20} style={{ color: 'var(--primary)' }} aria-hidden="true" />
          <span>EduFit Nepal</span>
        </div>
        <nav className="sidebar-nav" aria-label="Student dashboard navigation">
          <a href="#" className="nav-item active"><GraduationCap size={16} aria-hidden="true" /> My Dashboard</a>
          <Link href="/survey" className="nav-item"><BookOpen size={16} aria-hidden="true" /> Monthly Survey</Link>
          <a href="#resources" className="nav-item"><Award size={16} aria-hidden="true" /> Resource Hub</a>
        </nav>
        <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid var(--border)' }}>
          <UserBadge compact />
        </div>
      </aside>

      <main className="main-content">
        <div className="flex items-center justify-between" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1>Welcome back, {memberName.split(' ')[0]}</h1>
            <p className="body-text" style={{ marginTop: '4px' }}>
              Here is your digital learning profile for this month.
            </p>
          </div>
          <span className="badge badge-success">
            <CheckCircle2 size={12} aria-hidden="true" />
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} survey completed
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <Brain size={18} style={{ color: 'var(--primary)', marginBottom: '8px' }} aria-hidden="true" />
            <div style={{ fontSize: '26px', fontWeight: 700 }}>{survey.digitalConfidence}/5</div>
            <div className="meta-text">Digital confidence</div>
          </div>
          <div className="card" style={{ padding: '20px' }}>
            <Clock size={18} style={{ color: 'var(--info)', marginBottom: '8px' }} aria-hidden="true" />
            <div style={{ fontSize: '26px', fontWeight: 700 }}>{survey.averageDailyScreenTimeMinutes}<span style={{ fontSize: '14px', fontWeight: 500 }}> min</span></div>
            <div className="meta-text">Daily learning screen time</div>
          </div>
          <div className="card" style={{ padding: '20px' }}>
            <MonitorSmartphone size={18} style={{ color: 'var(--warning)', marginBottom: '8px' }} aria-hidden="true" />
            <div style={{ fontSize: '15px', fontWeight: 600, minHeight: '32px', display: 'flex', alignItems: 'center' }}>
              {DEVICE_LABELS[survey.deviceOwnership]}
            </div>
            <div className="meta-text">Main study device</div>
          </div>
          <div className="card" style={{ padding: '20px' }}>
            <Wifi size={18} style={{ color: 'var(--success)', marginBottom: '8px' }} aria-hidden="true" />
            <div style={{ fontSize: '15px', fontWeight: 600, minHeight: '32px', display: 'flex', alignItems: 'center' }}>
              {INTERNET_LABELS[survey.internetAccess]}
            </div>
            <div className="meta-text">Internet at home</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }} className="student-two-col">
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>Your Latest Responses</h2>

            <div className="flex justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span className="meta-text">Preferred learning format</span>
              <span style={{ fontWeight: 500, fontSize: '13px' }}>{LEARNING_LABELS[survey.learningPreference]}</span>
            </div>
            <div className="flex justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span className="meta-text">Quiet study space at home</span>
              <span className={`badge ${survey.hasQuietStudySpace ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '11px' }}>
                {survey.hasQuietStudySpace ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span className="meta-text">Completed on a shared device</span>
              <span style={{ fontWeight: 500, fontSize: '13px' }}>{survey.completedOnSharedDevice ? 'Yes' : 'No'}</span>
            </div>
            <div style={{ padding: '10px 0' }}>
              <span className="meta-text">Challenges you reported</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                {survey.accessLimitations.length === 0 ? (
                  <span className="badge badge-success" style={{ fontSize: '11px' }}>None reported</span>
                ) : (
                  survey.accessLimitations.map((lim) => (
                    <span key={lim} className="badge badge-warning" style={{ fontSize: '11px' }}>
                      {LIMITATION_LABELS[lim] ?? lim}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '16px', marginBottom: '12px' }}>What Happens Next</h2>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}>
              <ShieldCheck size={20} style={{ color: 'var(--info)', flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
              <p className="body-text" style={{ fontSize: '13px', lineHeight: 1.55 }}>
                Your answers are confidential. Teachers and principals only ever see combined school statistics — never your individual responses.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}>
              <CalendarClock size={20} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
              <p className="body-text" style={{ fontSize: '13px', lineHeight: 1.55 }}>
                The next monthly survey opens on <strong>{nextOpen}</strong>. Completing it each month keeps your school&apos;s readiness picture accurate.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Home size={20} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
              <p className="body-text" style={{ fontSize: '13px', lineHeight: 1.55 }}>
                Your input helps match your school with EdTech tools that actually work with your device and internet situation.
              </p>
            </div>
          </div>
        </div>

        <section id="resources">
          <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>Resource Hub & Opportunities</h2>
          <p className="meta-text" style={{ marginBottom: '16px' }}>Free scholarships, competitions and learning platforms for students in Nepal.</p>

          {loadingResources ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div className="skeleton" style={{ height: '100px' }} />
              <div className="skeleton" style={{ height: '100px' }} />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {resources.map((item) => (
                <div key={item.id} className="card" style={{ padding: '16px' }}>
                  <div className="badge badge-info" style={{ marginBottom: '6px', fontSize: '10px' }}>
                    {item.type.replace('_', ' ').toUpperCase()}
                  </div>
                  <h3 style={{ fontSize: '14px', marginBottom: '4px' }}>{item.title}</h3>
                  <p className="meta-text" style={{ fontSize: '12px', lineHeight: 1.45, marginBottom: '10px' }}>{item.description}</p>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    Access Resource <ExternalLink size={12} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
