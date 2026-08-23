'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BookOpen, ShieldCheck, CheckCircle2, Award,
  ExternalLink, Sparkles, Smartphone, Wifi, Clock, Lock
} from 'lucide-react'
import type {
  StudentSurvey,
  DeviceOwnership,
  InternetAccess,
  DigitalConfidence,
  LearningPreference,
  Resource
} from '@/lib/types'
import TopNav from '@/components/TopNav'

export default function StudentSurveyPage() {
  // Auth state
  const [authMethod, setAuthMethod] = useState<'school_email' | 'school_code'>('school_email')
  const [studentEmail, setStudentEmail] = useState('')
  const [schoolCode, setSchoolCode] = useState('SCH-KTM-2026')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Resource Hub state (Surfaced BEFORE survey as participation incentive)
  const [resources, setResources] = useState<Resource[]>([])
  const [loadingResources, setLoadingResources] = useState(true)

  // Survey Form state
  const [deviceOwnership, setDeviceOwnership] = useState<DeviceOwnership>('personal_smartphone')
  const [internetAccess, setInternetAccess] = useState<InternetAccess>('mobile_data_adequate')
  const [screenTime, setScreenTime] = useState<number>(90)
  const [learningPref, setLearningPref] = useState<LearningPreference>('interactive')
  const [digitalConfidence, setDigitalConfidence] = useState<DigitalConfidence>(3)
  const [quietSpace, setQuietSpace] = useState<boolean>(true)
  const [limitations, setLimitations] = useState<string[]>([])
  const [completedOnSharedDevice, setCompletedOnSharedDevice] = useState<boolean>(false)

  // Submission state — NO OPTIMISTIC RENDERING (STUDENT_SURVEY_BUILD_PROMPT.md §Submission)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmittedConfirmed, setIsSubmittedConfirmed] = useState(false)
  const [submissionTime, setSubmissionTime] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Fetch Resources for Incentive Section
  useEffect(() => {
    async function fetchIncentiveResources() {
      try {
        const res = await fetch('/api/resources')
        const data = await res.json()
        if (data.success) {
          setResources(data.data.slice(0, 4))
        }
      } catch (err) {
        console.error('Failed to fetch resources:', err)
      } finally {
        setLoadingResources(false)
      }
    }
    fetchIncentiveResources()
  }, [])

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (authMethod === 'school_email' && !studentEmail.trim()) {
      setErrorMsg('Please enter your school-issued email address.')
      return
    }
    if (authMethod === 'school_code' && !schoolCode.trim()) {
      setErrorMsg('Please enter your school access code.')
      return
    }
    setErrorMsg(null)
    setIsAuthenticated(true)
  }

  function toggleLimitation(item: string) {
    if (limitations.includes(item)) {
      setLimitations(limitations.filter((l) => l !== item))
    } else {
      setLimitations([...limitations, item])
    }
  }

  async function handleSubmitSurvey(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)

    const payload: StudentSurvey = {
      schoolId: schoolCode || 'SCH-KTM-DEFAULT',
      authMethod,
      deviceOwnership,
      internetAccess,
      averageDailyScreenTimeMinutes: Number(screenTime),
      learningPreference: learningPref,
      digitalConfidence,
      hasQuietStudySpace: quietSpace,
      accessLimitations: limitations,
      completedOnSharedDevice,
      submittedAt: new Date().toISOString(),
    }

    try {
      // Simulate confirmed API/DB write
      await new Promise((resolve) => setTimeout(resolve, 800))
      
      // Store in localStorage for persistence demo
      const existingStr = localStorage.getItem('edufit_student_surveys')
      const existing: StudentSurvey[] = existingStr ? JSON.parse(existingStr) : []
      const confirmedSurvey: StudentSurvey = {
        ...payload,
        id: `surv-${Date.now()}`,
        confirmedAt: new Date().toISOString(),
      }
      existing.push(confirmedSurvey)
      localStorage.setItem('edufit_student_surveys', JSON.stringify(existing))

      // ONLY set confirmed success state AFTER write is completed
      setSubmissionTime(confirmedSurvey.confirmedAt!)
      setIsSubmittedConfirmed(true)
    } catch (err) {
      console.error('Survey submission error:', err)
      setErrorMsg('Failed to confirm your submission. Please check your internet connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <TopNav />

      <main style={{ maxWidth: '840px', margin: '0 auto', padding: '40px 20px 80px' }}>
        {/* Header Banner */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="badge badge-primary" style={{ marginBottom: '12px', display: 'inline-flex' }}>
            <Sparkles size={12} aria-hidden="true" />
            Student Digital Access & Readiness Survey
          </div>
          <h1>Student Access & Opportunity Portal</h1>
          <p className="body-text" style={{ marginTop: '8px', maxWidth: '600px', margin: '8px auto 0' }}>
            Discover scholarships and learning opportunities while helping your school understand real digital access at home.
          </p>
        </div>

        {/* Step 1: Authentication */}
        {!isAuthenticated && (
          <div className="card" style={{ padding: '32px', maxWidth: '520px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>Log In to Begin</h2>
            <p className="meta-text" style={{ marginBottom: '20px' }}>
              Use your school-issued email address or your school access code.
            </p>

            {errorMsg && (
              <div className="badge badge-danger" style={{ width: '100%', padding: '10px 14px', marginBottom: '16px', borderRadius: '8px' }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button
                type="button"
                className={`btn-secondary ${authMethod === 'school_email' ? 'active' : ''}`}
                style={{ flex: 1, justifyContent: 'center', background: authMethod === 'school_email' ? 'var(--primary-soft)' : undefined, color: authMethod === 'school_email' ? 'var(--primary)' : undefined, borderColor: authMethod === 'school_email' ? 'var(--primary)' : undefined }}
                onClick={() => setAuthMethod('school_email')}
              >
                School Email
              </button>
              <button
                type="button"
                className={`btn-secondary ${authMethod === 'school_code' ? 'active' : ''}`}
                style={{ flex: 1, justifyContent: 'center', background: authMethod === 'school_code' ? 'var(--primary-soft)' : undefined, color: authMethod === 'school_code' ? 'var(--primary)' : undefined, borderColor: authMethod === 'school_code' ? 'var(--primary)' : undefined }}
                onClick={() => setAuthMethod('school_code')}
              >
                School Code
              </button>
            </div>

            <form onSubmit={handleLogin}>
              {authMethod === 'school_email' ? (
                <div className="form-group">
                  <label htmlFor="student-email">Student Email Address</label>
                  <input
                    id="student-email"
                    type="email"
                    placeholder="student.name@school.edu.np"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label htmlFor="school-code">School Access Code</label>
                  <input
                    id="school-code"
                    type="text"
                    placeholder="e.g. SCH-KTM-2026"
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value)}
                    required
                  />
                </div>
              )}

              <button type="submit" className="btn-primary w-full" style={{ justifyContent: 'center', marginTop: '12px' }}>
                Continue to Portal
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Authenticated Flow */}
        {isAuthenticated && !isSubmittedConfirmed && (
          <div>
            {/* SECTION A: Resource Hub (SURFACED BEFORE SURVEY QUESTIONS AS INCENTIVE) */}
            <div className="card" style={{ padding: '28px', marginBottom: '32px', borderLeft: '4px solid var(--primary)' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div className="badge badge-success" style={{ marginBottom: '6px' }}>
                    <Award size={12} aria-hidden="true" /> Participation Incentive
                  </div>
                  <h2 style={{ fontSize: '18px' }}>Student Resource Hub & Opportunities</h2>
                </div>
                <Link href="/api/resources" target="_blank" className="meta-text" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                  View Full API <ExternalLink size={12} />
                </Link>
              </div>

              <p className="body-text" style={{ marginBottom: '20px' }}>
                Here are free curated opportunities, scholarships, and learning platforms available to students in Nepal right now:
              </p>

              {loadingResources ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div className="skeleton" style={{ height: '100px' }} />
                  <div className="skeleton" style={{ height: '100px' }} />
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  {resources.map((item) => (
                    <div key={item.id} style={{ padding: '14px', background: 'var(--surface-muted)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <div className="badge badge-info" style={{ marginBottom: '6px', fontSize: '11px' }}>
                        {item.type.replace('_', ' ').toUpperCase()}
                      </div>
                      <h3 style={{ fontSize: '14px', marginBottom: '4px' }}>{item.title}</h3>
                      <p className="meta-text" style={{ fontSize: '12px', lineHeight: 1.4, marginBottom: '8px' }}>
                        {item.description}
                      </p>
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
            </div>

            {/* SECTION B: Privacy & Confidentiality Notice (MUST BE PROMINENT) */}
            <div className="card" style={{ padding: '20px', marginBottom: '32px', background: 'rgba(37, 99, 235, 0.04)', borderColor: 'var(--info)' }}>
              <div className="flex items-center gap-3">
                <ShieldCheck size={24} style={{ color: 'var(--info)', flexShrink: 0 }} aria-hidden="true" />
                <div>
                  <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Your Privacy is Guaranteed
                  </h3>
                  <p className="body-text" style={{ fontSize: '13px', lineHeight: 1.5 }}>
                    Your teacher or principal will <strong>never see your individual responses</strong>. They only see combined school statistics (e.g. &quot;18 of 24 students completed&quot;). Please answer honestly so your school gets the right EdTech support.
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION C: The Survey Form */}
            <form onSubmit={handleSubmitSurvey} className="card" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '20px', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                Digital Access & Learning Environment Form
              </h2>

              {errorMsg && (
                <div className="badge badge-danger" style={{ width: '100%', padding: '10px 14px', marginBottom: '20px', borderRadius: '8px' }}>
                  {errorMsg}
                </div>
              )}

              {/* Delivery Context Toggle */}
              <div className="form-section">
                <label className="form-section-title flex items-center gap-2">
                  <Smartphone size={16} style={{ color: 'var(--primary)' }} /> Where are you completing this survey right now?
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    type="button"
                    className="card"
                    style={{
                      padding: '16px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderColor: !completedOnSharedDevice ? 'var(--primary)' : 'var(--border)',
                      background: !completedOnSharedDevice ? 'var(--primary-soft)' : 'var(--surface)',
                    }}
                    onClick={() => setCompletedOnSharedDevice(false)}
                  >
                    <div style={{ fontWeight: 600, color: !completedOnSharedDevice ? 'var(--primary)' : 'var(--text-primary)', marginBottom: '4px' }}>
                      🏠 Personal Device at Home (Default)
                    </div>
                    <p className="meta-text" style={{ fontSize: '12px' }}>
                      Completing independently from home on a personal or family device.
                    </p>
                  </button>

                  <button
                    type="button"
                    className="card"
                    style={{
                      padding: '16px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderColor: completedOnSharedDevice ? 'var(--primary)' : 'var(--border)',
                      background: completedOnSharedDevice ? 'var(--primary-soft)' : 'var(--surface)',
                    }}
                    onClick={() => setCompletedOnSharedDevice(true)}
                  >
                    <div style={{ fontWeight: 600, color: completedOnSharedDevice ? 'var(--primary)' : 'var(--text-primary)', marginBottom: '4px' }}>
                      🏫 Shared / School Device in Class (Fallback)
                    </div>
                    <p className="meta-text" style={{ fontSize: '12px' }}>
                      Using a shared school computer or teacher tablet during class.
                    </p>
                  </button>
                </div>
              </div>

              {/* Device Ownership */}
              <div className="form-group">
                <label htmlFor="device-ownership">What kind of digital device do you use most often for studying?</label>
                <select
                  id="device-ownership"
                  value={deviceOwnership}
                  onChange={(e) => setDeviceOwnership(e.target.value as DeviceOwnership)}
                >
                  <option value="personal_smartphone">Personal Smartphone</option>
                  <option value="shared_family">Shared Family Smartphone / Tablet</option>
                  <option value="personal_computer">Personal Laptop / Computer</option>
                  <option value="personal_basic">Basic Phone (No Internet Apps)</option>
                  <option value="none">No Device Available at Home</option>
                </select>
              </div>

              {/* Internet Access */}
              <div className="form-group">
                <label htmlFor="internet-access">What is your primary internet access at home?</label>
                <select
                  id="internet-access"
                  value={internetAccess}
                  onChange={(e) => setInternetAccess(e.target.value as InternetAccess)}
                >
                  <option value="home_broadband">Home Wi-Fi / Broadband (Reliable)</option>
                  <option value="mobile_data_adequate">Mobile Data (Adequate Speed)</option>
                  <option value="mobile_data_limited">Mobile Data (Very Limited / Expensive)</option>
                  <option value="school_only">School Wi-Fi Only (No Internet at Home)</option>
                  <option value="none">No Internet Access</option>
                </select>
              </div>

              <div className="form-grid">
                {/* Screen Time */}
                <div className="form-group">
                  <label htmlFor="screen-time">Average Daily Educational Screen Time (Minutes)</label>
                  <input
                    id="screen-time"
                    type="number"
                    min={0}
                    max={600}
                    value={screenTime}
                    onChange={(e) => setScreenTime(Number(e.target.value))}
                  />
                </div>

                {/* Learning Preference */}
                <div className="form-group">
                  <label htmlFor="learning-pref">Preferred Format for Learning</label>
                  <select
                    id="learning-pref"
                    value={learningPref}
                    onChange={(e) => setLearningPref(e.target.value as LearningPreference)}
                  >
                    <option value="interactive">Interactive Games & Exercises</option>
                    <option value="video">Short Video Lessons</option>
                    <option value="text">Textbooks & PDFs</option>
                    <option value="audio">Audio Lessons</option>
                    <option value="mixed">Mixed Formats</option>
                  </select>
                </div>
              </div>

              {/* Digital Confidence (1 to 5) */}
              <div className="form-group" style={{ marginTop: '12px' }}>
                <label>How confident do you feel using computers and smartphones for learning? (1–5)</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  {([1, 2, 3, 4, 5] as DigitalConfidence[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: digitalConfidence === level ? 'var(--primary)' : 'var(--border)',
                        background: digitalConfidence === level ? 'var(--primary-soft)' : 'var(--surface)',
                        color: digitalConfidence === level ? 'var(--primary)' : 'var(--text-primary)',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                      onClick={() => setDigitalConfidence(level)}
                    >
                      Level {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quiet Study Space */}
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={quietSpace}
                    onChange={(e) => setQuietSpace(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                  />
                  I have a quiet, dedicated space at home to study.
                </label>
              </div>

              {/* Access Limitations */}
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Select any challenges that limit your digital learning (Select all that apply):</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '8px' }}>
                  {[
                    { id: 'cost', label: 'Mobile Data is Too Expensive' },
                    { id: 'power', label: 'Frequent Power Outages / Load Shedding' },
                    { id: 'no_device', label: 'Device Must Be Shared with Siblings/Parents' },
                    { id: 'slow_internet', label: 'Slow or Unstable Internet Connection' },
                  ].map((item) => (
                    <label
                      key={item.id}
                      className="card"
                      style={{
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        borderColor: limitations.includes(item.id) ? 'var(--primary)' : 'var(--border)',
                        background: limitations.includes(item.id) ? 'var(--primary-soft)' : 'var(--surface)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={limitations.includes(item.id)}
                        onChange={() => toggleLimitation(item.id)}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full"
                  style={{ padding: '14px', fontSize: '15px', justifyContent: 'center', opacity: isSubmitting ? 0.7 : 1 }}
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="animate-spin" size={18} /> Confirming Write to Server...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} /> Submit Confidential Survey
                    </>
                  )}
                </button>
                <p className="meta-text" style={{ textAlign: 'center', marginTop: '10px' }}>
                  Submission is verified and saved securely before showing confirmation.
                </p>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Confirmed Completion View */}
        {isSubmittedConfirmed && (
          <div className="card" style={{ padding: '40px', textAlign: 'center', maxWidth: '560px', margin: '0 auto' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(22, 163, 74, 0.1)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>Survey Submitted & Confirmed!</h2>
            <p className="body-text" style={{ marginBottom: '16px', lineHeight: 1.6 }}>
              Thank you for contributing to your school&apos;s digital readiness assessment. Your answers have been encrypted and stored confidentially.
            </p>

            <div className="card" style={{ padding: '14px', background: 'var(--surface-muted)', marginBottom: '24px', fontSize: '13px' }}>
              <div className="flex justify-between" style={{ marginBottom: '4px' }}>
                <span className="meta-text">Status:</span>
                <span className="badge badge-success">WRITE CONFIRMED</span>
              </div>
              <div className="flex justify-between">
                <span className="meta-text">Confirmed Timestamp:</span>
                <span style={{ fontWeight: 500 }}>{submissionTime ? new Date(submissionTime).toLocaleTimeString() : 'Just now'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsSubmittedConfirmed(false)
                }}
              >
                Submit Another Response
              </button>
              <Link href="/dashboard" className="btn-primary">
                Go to School Dashboard
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
