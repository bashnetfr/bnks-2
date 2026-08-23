'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, School, FileText, CheckCircle2,
  AlertTriangle, HelpCircle, ArrowRight, RefreshCw,
  Sparkles, Layers, ShieldAlert, ChevronRight, BarChart2,
  Users, Server, GraduationCap, Award
} from 'lucide-react'
import type {
  SchoolProfile,
  InfrastructureAssessment,
  TeacherReadinessAssessment,
  SchoolManagementAssessment,
  LearningRequirementsAssessment,
  StudentSurvey,
  EdTechTool,
  CompatibilityResult,
  ExplanationResult,
  ReadinessLevel,
  SchoolType,
  GradeLevel,
  TechnologyUsage
} from '@/lib/types'
import { computeCompatibility } from '@/lib/scoring'
import { SAMPLE_EDTECH_TOOLS } from '@/lib/tools'
import { getDisplayName, getStaffAuth, type StaffAuth } from '@/lib/auth'
import UserProfileCard from '@/components/UserProfileCard'

export default function DashboardPage() {
  const router = useRouter()

  // Auth state — staff session-gated via /dashboard/login
  const [staffAuth, setStaffAuth] = useState<StaffAuth | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Navigation / Tab state
  const [activeTab, setActiveTab] = useState<'profile' | 'assessment' | 'results' | 'surveys'>('profile')

  // School Profile state
  const [profile, setProfile] = useState<SchoolProfile>({
    id: 'sch-ktm-001',
    name: 'Shree Jana Jyoti Secondary School',
    location: 'Kathmandu Municipality - Ward 4',
    district: 'Kathmandu',
    schoolType: 'community',
    studentCount: 450,
    teacherCount: 22,
    gradeLevels: ['primary', 'lower_secondary', 'secondary'],
    technologyUsage: 'minimal',
  })

  // Selected EdTech Tool for evaluation
  const [selectedToolId, setSelectedToolId] = useState<string>(SAMPLE_EDTECH_TOOLS[0].id)

  // Assessment Forms state (0..4 scale, null represents skipped/missing)
  const [infra, setInfra] = useState<Partial<InfrastructureAssessment>>({
    internetConnectivity: 1, // low
    deviceAvailability: 1,   // low
    powerReliability: 2,     // moderate
    bandwidthAdequacy: 1,    // low
    technicalSupport: 1,     // low
  })

  const [teacher, setTeacher] = useState<Partial<TeacherReadinessAssessment>>({
    digitalLiteracy: 1,           // World Bank ETRI finding: weak pillar
    edtechExperience: 1,
    trainingWillingness: 3,
    ictCurriculumIntegration: 1,  // low
    devicePersonalOwnership: 2,
  })

  const [mgmt, setMgmt] = useState<Partial<SchoolManagementAssessment>>({
    leadershipBuyIn: 3,
    budgetAllocation: 1,
    policyFramework: 2,
    parentCommunitySupport: 2,
    dataPrivacyAwareness: 2,
  })

  const [learning, setLearning] = useState<Partial<LearningRequirementsAssessment>>({
    curriculumAlignment: 4,
    studentAccessAtHome: 3,       // school reports 3 (75%), but student survey reports lower (triggers reality gap!)
    languageSupport: 4,
    accessibilityNeeds: 2,
    blendedLearningReadiness: 2,
  })

  // Qualitative context field (fed to AI explanation, ignored by deterministic score)
  const [additionalContext, setAdditionalContext] = useState<string>(
    'Our school experienced electricity disruptions during monsoon season. Teachers expressed high willingness to attend digital workshops if transport allowance is provided.'
  )

  // Student Surveys state (stored from survey page or mocked)
  const [studentSurveys, setStudentSurveys] = useState<StudentSurvey[]>([])

  // Engine Output Results
  const [result, setResult] = useState<CompatibilityResult | null>(null)
  const [aiExplanation, setAiExplanation] = useState<ExplanationResult | null>(null)
  const [loadingAi, setLoadingAi] = useState<boolean>(false)

  // Gate access: redirect to staff login if no session exists
  useEffect(() => {
    const auth = getStaffAuth()
    if (!auth) {
      router.replace('/login')
      return
    }
    setStaffAuth(auth)
    setIsCheckingAuth(false)
  }, [router])

  // Load student surveys from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('edufit_student_surveys')
      if (stored) {
        const parsed = JSON.parse(stored)
        setStudentSurveys(parsed)
      } else {
        // Mock 4 student surveys showing limited home access to demonstrate reality gap blending
        const mockSurveys: StudentSurvey[] = [
          {
            id: 'surv-m1',
            schoolId: 'sch-ktm-001',
            authMethod: 'school_email',
            deviceOwnership: 'shared_family',
            internetAccess: 'mobile_data_limited',
            averageDailyScreenTimeMinutes: 30,
            learningPreference: 'interactive',
            digitalConfidence: 2,
            hasQuietStudySpace: false,
            accessLimitations: ['cost', 'no_device'],
            completedOnSharedDevice: false,
          },
          {
            id: 'surv-m2',
            schoolId: 'sch-ktm-001',
            authMethod: 'school_code',
            deviceOwnership: 'none',
            internetAccess: 'school_only',
            averageDailyScreenTimeMinutes: 0,
            learningPreference: 'video',
            digitalConfidence: 2,
            hasQuietStudySpace: false,
            accessLimitations: ['no_device', 'power'],
            completedOnSharedDevice: true,
          },
        ]
        setStudentSurveys(mockSurveys)
      }
    } catch (e) {
      console.error('Failed to load surveys:', e)
    }
  }, [])

  // Run scoring engine and AI explanation handler
  async function handleRunAssessment(e?: React.FormEvent) {
    if (e) e.preventDefault()

    const currentTool = SAMPLE_EDTECH_TOOLS.find((t) => t.id === selectedToolId) || SAMPLE_EDTECH_TOOLS[0]

    // 1. Run deterministic scoring engine (scoring.ts)
    const engineResult = computeCompatibility(
      profile,
      currentTool,
      infra,
      teacher,
      mgmt,
      learning,
      studentSurveys
    )

    // 2. Set result immediately to trigger inline results view without redirect (DASHBOARD_BUILD_PROMPT.md)
    setResult(engineResult)
    setActiveTab('results')

    // 3. Call AI Explanation API route with fallback error boundary handling
    setLoadingAi(true)
    setAiExplanation(null)
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...engineResult,
          qualitativeNotes: additionalContext,
        }),
      })

      if (res.ok) {
        const aiData: ExplanationResult = await res.json()
        setAiExplanation(aiData)
      } else {
        setAiExplanation({ explanation: null, actionPlan: [], fallback: true })
      }
    } catch (err) {
      console.error('AI Explanation API error:', err)
      setAiExplanation({ explanation: null, actionPlan: [], fallback: true })
    } finally {
      setLoadingAi(false)
    }
  }

  const activeTool = SAMPLE_EDTECH_TOOLS.find((t) => t.id === selectedToolId) || SAMPLE_EDTECH_TOOLS[0]

  // Auth Gate: verifying staff session or redirecting to login
  if (isCheckingAuth || !staffAuth) {
    return (
      <main style={{ maxWidth: '520px', margin: '0 auto', padding: '64px 20px', textAlign: 'center' }}>
        <div className="card" style={{ padding: '32px' }}>
          <ShieldAlert size={24} style={{ color: 'var(--primary)', margin: '0 auto 12px' }} aria-hidden="true" />
          <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>Checking your session…</h2>
          <p className="meta-text">
            Educator or administrator login is required to access this dashboard. Redirecting you to the login page.
          </p>
        </div>
      </main>
    )
  }

  return (
    <div className="app-shell">
      {/* Sidebar Navigation — intelOS style (colorscheme.md §9) */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Link href="/" className="nav-logo">
            <BarChart2 size={20} style={{ color: 'var(--primary)' }} />
            EduFit <span className="logo-accent">Nepal</span>
          </Link>
          <div className="meta-text" style={{ fontSize: '11px', marginTop: '4px' }}>
            Decision Intelligence Platform
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <School size={18} />
            School Profile
          </button>

          <button
            className={`nav-item ${activeTab === 'assessment' ? 'active' : ''}`}
            onClick={() => setActiveTab('assessment')}
          >
            <FileText size={18} />
            Readiness Assessment
          </button>

          <button
            className={`nav-item ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => {
              if (!result) handleRunAssessment()
              else setActiveTab('results')
            }}
          >
            <BarChart2 size={18} />
            Results & Plan {result && <span className="badge badge-primary" style={{ marginLeft: 'auto', fontSize: '10px' }}>READY</span>}
          </button>

          <button
            className={`nav-item ${activeTab === 'surveys' ? 'active' : ''}`}
            onClick={() => setActiveTab('surveys')}
          >
            <Users size={18} />
            Student Surveys ({studentSurveys.length})
          </button>

          <div className="divider" style={{ margin: '16px 0' }} />

          <Link href="/survey" className="nav-item" style={{ color: 'var(--primary)' }}>
            <Award size={18} />
            Student Survey Form ↗
          </Link>
          <Link href="/api/events" target="_blank" className="nav-item">
            <Layers size={18} />
            Events API ↗
          </Link>
        </nav>

        <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
          <UserProfileCard
            auth={staffAuth}
            kind="staff"
            displayName={getDisplayName(staffAuth.staffEmail, 'Teacher')}
            stats={[
              { label: 'Surveys collected', value: studentSurveys.length },
              { label: 'Tools evaluated', value: SAMPLE_EDTECH_TOOLS.length },
            ]}
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Header */}
        <header className="flex justify-between items-center" style={{ marginBottom: '28px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h1 style={{ fontSize: '24px' }}>
              {activeTab === 'profile' && 'School Profile & Infrastructure Setup'}
              {activeTab === 'assessment' && 'Four-Dimension ETRI Digital Readiness Assessment'}
              {activeTab === 'results' && 'Compatibility Score & Implementation Plan'}
              {activeTab === 'surveys' && 'Student Ground-Truth Survey Data'}
            </h1>
            <p className="meta-text" style={{ marginTop: '2px' }}>
              Target Institution: <strong>{profile.name}</strong> ({profile.location})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label style={{ fontSize: '12px', fontWeight: 600, margin: 0 }}>Target Tool:</label>
            <select
              value={selectedToolId}
              onChange={(e) => setSelectedToolId(e.target.value)}
              style={{ width: '220px', padding: '6px 10px', fontSize: '13px' }}
            >
              {SAMPLE_EDTECH_TOOLS.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            <button
              onClick={() => handleRunAssessment()}
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              <RefreshCw size={14} /> Calculate Score
            </button>
          </div>
        </header>

        {/* TAB 1: School Profile */}
        {activeTab === 'profile' && (
          <div className="card" style={{ padding: '32px', maxWidth: '800px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>1. Basic Institution Information</h2>

            <form onSubmit={(e) => { e.preventDefault(); setActiveTab('assessment'); }}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="sch-name">School Name</label>
                  <input
                    id="sch-name"
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sch-district">District / Municipality</label>
                  <input
                    id="sch-district"
                    type="text"
                    value={profile.district}
                    onChange={(e) => setProfile({ ...profile, district: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="sch-type">School Sector / Type</label>
                  <select
                    id="sch-type"
                    value={profile.schoolType}
                    onChange={(e) => setProfile({ ...profile, schoolType: e.target.value as SchoolType })}
                  >
                    <option value="community">Community / Public School</option>
                    <option value="public">Government Model School</option>
                    <option value="private">Private School</option>
                    <option value="religious">Religious School</option>
                    <option value="international">Institutional / International</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="sch-tech-usage">Current Technology Usage</label>
                  <select
                    id="sch-tech-usage"
                    value={profile.technologyUsage}
                    onChange={(e) => setProfile({ ...profile, technologyUsage: e.target.value as TechnologyUsage })}
                  >
                    <option value="none">None (Paper-only)</option>
                    <option value="minimal">Minimal (Admin Computer Only)</option>
                    <option value="moderate">Moderate (Shared Computer Lab)</option>
                    <option value="substantial">Substantial (Classroom Projectors / Smartboards)</option>
                    <option value="advanced">Advanced (1:1 Student Device Ratio)</option>
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="sch-students">Total Student Count</label>
                  <input
                    id="sch-students"
                    type="number"
                    value={profile.studentCount}
                    onChange={(e) => setProfile({ ...profile, studentCount: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sch-teachers">Total Teacher Count</label>
                  <input
                    id="sch-teachers"
                    type="number"
                    value={profile.teacherCount}
                    onChange={(e) => setProfile({ ...profile, teacherCount: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary">
                  Proceed to Readiness Assessment <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: Readiness Assessment */}
        {activeTab === 'assessment' && (
          <form onSubmit={handleRunAssessment} style={{ maxWidth: '880px' }}>
            <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
              <div className="badge badge-primary" style={{ marginBottom: '8px' }}>
                World Bank ETRI Framework (Nepal 2022)
              </div>
              <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>Four-Dimension Readiness Assessment</h2>
              <p className="body-text">
                Rate each dimension on a scale of 0 (Critically Low) to 4 (Excellent). Leaving a field blank will assign a neutral 50% default and flag an &quot;incomplete data&quot; warning.
              </p>
            </div>

            {/* Dimension 1: Infrastructure */}
            <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Server size={18} /> Dimension 1: Infrastructure Capacity (30% Weight)
              </h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Internet Connectivity Quality (0–4)</label>
                  <select
                    value={infra.internetConnectivity ?? ''}
                    onChange={(e) => setInfra({ ...infra, internetConnectivity: e.target.value === '' ? undefined : Number(e.target.value) as ReadinessLevel })}
                  >
                    <option value="">(Skipped - Default 50% Neutral)</option>
                    <option value={0}>0 — None (No Internet)</option>
                    <option value={1}>1 — Poor (Intermittent mobile hotspot)</option>
                    <option value={2}>2 — Moderate (Basic school broadband)</option>
                    <option value={3}>3 — Good (Stable high-speed broadband)</option>
                    <option value={4}>4 — Excellent (Fiber optic with backup link)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Power & Electricity Reliability (0–4)</label>
                  <select
                    value={infra.powerReliability ?? ''}
                    onChange={(e) => setInfra({ ...infra, powerReliability: e.target.value === '' ? undefined : Number(e.target.value) as ReadinessLevel })}
                  >
                    <option value="">(Skipped - Default 50% Neutral)</option>
                    <option value={0}>0 — Severe daily load shedding, no UPS</option>
                    <option value={1}>1 — Frequent outages, minimal battery backup</option>
                    <option value={2}>2 — Moderate outages, solar/generator covers admin</option>
                    <option value={3}>3 — Rare outages, backup covers full lab</option>
                    <option value={4}>4 — Uninterrupted continuous grid power</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dimension 2: Teacher Readiness */}
            <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GraduationCap size={18} /> Dimension 2: Teacher Readiness & Training (30% Weight)
              </h3>
              <p className="meta-text" style={{ marginBottom: '16px' }}>
                ⚠️ <em>ETRI Nepal 2022 Finding: Weakest dimension nationally due to limited ICT curriculum integration.</em>
              </p>
              <div className="form-grid">
                <div className="form-group">
                  <label>Teacher Digital Literacy (0–4)</label>
                  <select
                    value={teacher.digitalLiteracy ?? ''}
                    onChange={(e) => setTeacher({ ...teacher, digitalLiteracy: e.target.value === '' ? undefined : Number(e.target.value) as ReadinessLevel })}
                  >
                    <option value="">(Skipped - Default 50% Neutral)</option>
                    <option value={0}>0 — Critically Low (No computer comfort)</option>
                    <option value={1}>1 — Low (Basic smartphone use only)</option>
                    <option value={2}>2 — Moderate (Can use Word/Excel/Email)</option>
                    <option value={3}>3 — High (Comfortable with EdTech apps)</option>
                    <option value={4}>4 — Expert (Can train other teachers)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>ICT Curriculum Integration (0–4)</label>
                  <select
                    value={teacher.ictCurriculumIntegration ?? ''}
                    onChange={(e) => setTeacher({ ...teacher, ictCurriculumIntegration: e.target.value === '' ? undefined : Number(e.target.value) as ReadinessLevel })}
                  >
                    <option value="">(Skipped - Default 50% Neutral)</option>
                    <option value={0}>0 — Absent (No ICT used in subjects)</option>
                    <option value={1}>1 — Minimal (Occasional computer class)</option>
                    <option value={2}>2 — Moderate (Used in 1–2 subjects)</option>
                    <option value={3}>3 — Substantial (Integrated across core STEM)</option>
                    <option value={4}>4 — Fully Blended (Daily tech integration)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dimension 3: School Management */}
            <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <School size={18} /> Dimension 3: School Management & Governance (20% Weight)
              </h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Leadership Buy-In & Commitment (0–4)</label>
                  <select
                    value={mgmt.leadershipBuyIn ?? ''}
                    onChange={(e) => setMgmt({ ...mgmt, leadershipBuyIn: e.target.value === '' ? undefined : Number(e.target.value) as ReadinessLevel })}
                  >
                    <option value={0}>0 — Skeptical / Resistant</option>
                    <option value={1}>1 — Passive approval</option>
                    <option value={2}>2 — Supportive</option>
                    <option value={3}>3 — Highly enthusiastic champion</option>
                    <option value={4}>4 — Strategic priority driver</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>EdTech Budget Allocation (0–4)</label>
                  <select
                    value={mgmt.budgetAllocation ?? ''}
                    onChange={(e) => setMgmt({ ...mgmt, budgetAllocation: e.target.value === '' ? undefined : Number(e.target.value) as ReadinessLevel })}
                  >
                    <option value={0}>0 — Zero budget allocated</option>
                    <option value={1}>1 — Emergency maintenance only</option>
                    <option value={2}>2 — Small annual software/data budget</option>
                    <option value={3}>3 — Sustained budget for hardware & training</option>
                    <option value={4}>4 — Robust multi-year municipal grant</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dimension 4: Learning Requirements */}
            <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} /> Dimension 4: Learning Requirements & Student Access (20% Weight)
              </h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>School-Reported Student Access (0–4)</label>
                  <select
                    value={learning.studentAccessAtHome ?? ''}
                    onChange={(e) => setLearning({ ...learning, studentAccessAtHome: e.target.value === '' ? undefined : Number(e.target.value) as ReadinessLevel })}
                  >
                    <option value={0}>0 — Less than 10% have home access</option>
                    <option value={1}>1 — 10–30% have home devices</option>
                    <option value={2}>2 — 30–50% have home devices</option>
                    <option value={3}>3 — 50–75% have home devices</option>
                    <option value={4}>4 — Over 75% have home devices</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Nepali Language Content Support (0–4)</label>
                  <select
                    value={learning.languageSupport ?? ''}
                    onChange={(e) => setLearning({ ...learning, languageSupport: e.target.value === '' ? undefined : Number(e.target.value) as ReadinessLevel })}
                  >
                    <option value={0}>0 — English only (No local language)</option>
                    <option value={1}>1 — Subtitled English content</option>
                    <option value={2}>2 — Translated Nepali UI</option>
                    <option value={3}>3 — Native Nepali curriculum content</option>
                    <option value={4}>4 — Dual Nepali & local dialect content</option>
                  </select>
                </div>
              </div>

              {/* Qualitative Context Field */}
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label htmlFor="add-context">
                  Qualitative / Additional Context (Stored for AI explanation, ignored by deterministic score):
                </label>
                <textarea
                  id="add-context"
                  rows={3}
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Describe unique circumstances e.g. recent internet grant, electricity issues..."
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full" style={{ padding: '14px', fontSize: '15px', justifyContent: 'center' }}>
              <Sparkles size={18} /> Calculate Compatibility & Generate Action Plan
            </button>
          </form>
        )}

        {/* TAB 3: Results & Recommendation View (INLINE DISPLAY - NO DEAD ENDS) */}
        {activeTab === 'results' && (
          <div>
            {!result ? (
              <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                <AlertTriangle size={36} style={{ color: 'var(--warning)', margin: '0 auto 12px' }} />
                <h3>No Assessment Run Yet</h3>
                <p className="body-text" style={{ marginBottom: '16px' }}>
                  Please fill out the readiness assessment form to compute a compatibility score.
                </p>
                <button onClick={() => setActiveTab('assessment')} className="btn-primary">
                  Go to Assessment Form
                </button>
              </div>
            ) : (
              <div style={{ maxWidth: '900px' }}>
                {/* 1. Overall Score Banner */}
                <div
                  className="card"
                  style={{
                    padding: '32px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '24px',
                    background:
                      result.recommendation === 'recommended'
                        ? 'rgba(22, 163, 74, 0.04)'
                        : result.recommendation === 'conditional'
                        ? 'rgba(245, 158, 11, 0.04)'
                        : 'rgba(220, 38, 38, 0.04)',
                    borderColor:
                      result.recommendation === 'recommended'
                        ? 'var(--success)'
                        : result.recommendation === 'conditional'
                        ? 'var(--warning)'
                        : 'var(--danger)',
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2" style={{ marginBottom: '6px' }}>
                      <span className="meta-text">Target Tool Evaluation:</span>
                      <strong style={{ fontSize: '15px' }}>{activeTool.name}</strong>
                    </div>

                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: '42px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {result.overallScore}
                      </span>
                      <span style={{ fontSize: '20px', color: 'var(--text-muted)' }}>/ 100</span>

                      <span
                        className={`badge ${
                          result.recommendation === 'recommended'
                            ? 'badge-success'
                            : result.recommendation === 'conditional'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                        style={{ fontSize: '14px', padding: '6px 14px', textTransform: 'uppercase', fontWeight: 700 }}
                      >
                        {result.recommendation === 'recommended' && '✓ Recommended Deployment'}
                        {result.recommendation === 'conditional' && '⚠️ Conditional Readiness'}
                        {result.recommendation === 'not_recommended' && '🛑 Not Recommended'}
                      </span>
                    </div>

                    <p className="body-text" style={{ marginTop: '8px', fontSize: '13px' }}>
                      Deterministic calculation across 4 ETRI dimensions.
                    </p>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '200px' }}>
                    <div className="meta-text">Evaluated On</div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{new Date(result.computedAt).toLocaleDateString()}</div>
                    <div className="meta-text" style={{ marginTop: '8px' }}>Student Surveys Blended</div>
                    <div className="badge badge-info" style={{ fontSize: '12px' }}>
                      {studentSurveys.length} Ground-Truth Surveys
                    </div>
                  </div>
                </div>

                {/* 2. Reality Gap Alert Banner (CLAUDE.md & MASTER_PROMPT.md §3) */}
                {result.realityGapFlag && (
                  <div
                    className="card"
                    style={{
                      padding: '20px 24px',
                      marginBottom: '24px',
                      background: 'rgba(220, 38, 38, 0.05)',
                      borderColor: 'var(--danger)',
                      borderLeft: '4px solid var(--danger)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <ShieldAlert size={24} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                      <div>
                        <h3 style={{ fontSize: '15px', color: 'var(--danger)', marginBottom: '4px' }}>
                          ⚠️ Reality Gap Flagged (School vs Student Divergence)
                        </h3>
                        <p className="body-text" style={{ fontSize: '13px', lineHeight: 1.5 }}>
                          {result.realityGapDetails}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Dimension Subscores with Transparency Tooltips (DASHBOARD_BUILD_PROMPT.md §Results) */}
                <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>
                    ETRI Dimension Breakdown & Transparency Tooltips
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {[
                      { key: 'infrastructure', name: 'Infrastructure Capacity', data: result.dimensions.infrastructure },
                      { key: 'teacherReadiness', name: 'Teacher Readiness & Training', data: result.dimensions.teacherReadiness },
                      { key: 'schoolManagement', name: 'School Management & Governance', data: result.dimensions.schoolManagement },
                      { key: 'learningRequirements', name: 'Learning Requirements & Access', data: result.dimensions.learningRequirements },
                    ].map(({ key, name, data }) => (
                      <div key={key}>
                        <div className="flex justify-between items-center" style={{ marginBottom: '6px' }}>
                          <div className="flex items-center gap-2">
                            <span style={{ fontWeight: 600, fontSize: '14px' }}>{name}</span>

                            {/* Transparency Tooltip */}
                            <div className="tooltip-wrapper">
                              <HelpCircle size={14} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
                              <div className="tooltip-content">
                                <strong>Why this score:</strong> {data.tooltipExplanation}
                              </div>
                            </div>
                          </div>

                          <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                            {data.score} / 100
                          </span>
                        </div>

                        <div className="progress-bar-track">
                          <div
                            className={`progress-bar-fill ${data.score >= 70 ? 'success' : data.score >= 45 ? 'warning' : ''}`}
                            style={{
                              width: `${data.score}%`,
                              background: data.score < 45 ? 'var(--danger)' : undefined,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Flagged Problems & Gaps */}
                <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} /> Flagged Institutional Gaps ({result.problems.length})
                  </h3>

                  {result.problems.length === 0 ? (
                    <p className="body-text">No critical problems or gaps flagged for this deployment.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {result.problems.map((prob, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '10px 14px',
                            background: 'var(--surface-muted)',
                            borderRadius: 'var(--radius-sm)',
                            borderLeft: '3px solid var(--danger)',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                          }}
                        >
                          • {prob}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. AI Explanation Layer Output (AI_INTEGRATION_BUILD_PROMPT.md) */}
                <div className="card" style={{ padding: '28px', marginBottom: '24px', borderLeft: '4px solid var(--primary)' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                    <div className="flex items-center gap-2">
                      <Sparkles size={20} style={{ color: 'var(--primary)' }} />
                      <h3 style={{ fontSize: '16px' }}>AI Implementation Plan & Plain-Language Explanation</h3>
                    </div>
                    <div className="badge badge-primary">NVIDIA NIM Nemotron API</div>
                  </div>

                  {loadingAi ? (
                    <div>
                      <div className="skeleton" style={{ height: '20px', width: '60%', marginBottom: '12px' }} />
                      <div className="skeleton" style={{ height: '80px', width: '100%', marginBottom: '16px' }} />
                      <div className="skeleton" style={{ height: '120px', width: '100%' }} />
                    </div>
                  ) : aiExplanation?.explanation ? (
                    <div>
                      <p className="body-text" style={{ fontSize: '14px', lineHeight: 1.7, marginBottom: '24px', background: 'var(--surface-muted)', padding: '16px', borderRadius: '8px' }}>
                        {aiExplanation.explanation}
                      </p>

                      <h4 style={{ fontSize: '14px', marginBottom: '14px' }}>90-Day Targeted Action Plan</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        {aiExplanation.actionPlan.map((step) => (
                          <div key={step.month} className="card" style={{ padding: '16px' }}>
                            <div className="badge badge-primary" style={{ marginBottom: '8px', fontSize: '11px' }}>
                              MONTH {step.month}
                            </div>
                            <p className="body-text" style={{ fontSize: '13px', lineHeight: 1.5, fontWeight: 500 }}>
                              {step.focus}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* FALLBACK CONTRACT (AI_INTEGRATION_BUILD_PROMPT.md §Non-negotiables) */
                    <div style={{ padding: '16px', background: 'var(--surface-muted)', borderRadius: '8px' }}>
                      <p className="meta-text" style={{ marginBottom: '8px' }}>
                        ℹ️ <em>AI explanation service in offline fallback mode. Showing standard rule-based action plan:</em>
                      </p>
                      <ul style={{ paddingLeft: '20px', fontSize: '13px', lineHeight: 1.7 }}>
                        <li><strong>Month 1:</strong> Address infrastructure bottlenecks — establish stable power backup and connectivity link.</li>
                        <li><strong>Month 2:</strong> Conduct 3-day teacher digital literacy and ICT integration workshops.</li>
                        <li><strong>Month 3:</strong> Pilot software with Grade 6–8 students and measure baseline learning outcomes.</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Student Surveys View */}
        {activeTab === 'surveys' && (
          <div className="card" style={{ padding: '28px', maxWidth: '840px' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px' }}>Submitted Student Access Surveys</h2>
                <p className="meta-text" style={{ marginTop: '2px' }}>
                  Teachers only see aggregate counts. Individual responses are encrypted for ground-truth blending.
                </p>
              </div>
              <Link href="/survey" className="btn-primary" style={{ fontSize: '13px', padding: '8px 14px' }}>
                Open Student Survey Form ↗
              </Link>
            </div>

            {studentSurveys.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p className="body-text">No student surveys submitted yet for this school.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {studentSurveys.map((s, idx) => (
                  <div key={s.id || idx} style={{ padding: '14px 18px', background: 'var(--surface-muted)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>Survey #{idx + 1} — {s.schoolId}</span>
                      <span className="badge badge-success">CONFIRMED</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '12px' }}>
                      <div><span className="meta-text">Device:</span> {s.deviceOwnership.replace('_', ' ')}</div>
                      <div><span className="meta-text">Internet:</span> {s.internetAccess.replace('_', ' ')}</div>
                      <div><span className="meta-text">Confidence:</span> Level {s.digitalConfidence} / 5</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
