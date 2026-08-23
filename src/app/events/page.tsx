'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Search, MapPin, CalendarDays, Users, Trophy, Ticket,
  ShieldCheck, AlertTriangle, Bookmark, BookmarkCheck, Sparkles,
  ChevronDown, GraduationCap, Globe, Clock, CheckCircle2, XCircle,
  Lock, LogIn, X
} from 'lucide-react'
import type { EducationLevel, Event, StudentEventProfile } from '@/lib/types'
import { getEventsOwnerKey } from '@/lib/auth'
import {
  EVENTS, computeMatch, getEffectiveStatus, isActiveForDiscovery,
  isRegistrationOpen, getOrganizationById
} from '@/lib/events'

// --- Display helpers ---

const TYPE_LABELS: Record<string, string> = {
  competition: 'Competition',
  hackathon: 'Hackathon',
  workshop: 'Workshop',
  bootcamp: 'Bootcamp',
  seminar: 'Seminar',
  conference: 'Conference',
  career_event: 'Career event',
  volunteering: 'Volunteering',
  networking: 'Networking',
  other: 'Event',
}

const EDU_LABELS: Record<EducationLevel, string> = {
  school: 'School (up to Grade 10)',
  see: 'SEE appeared / passed',
  plus_two: '+2 (Higher Secondary)',
  bachelors: "Bachelor's",
  masters: "Master's",
  recent_graduate: 'Recent graduate',
}

const INTEREST_OPTIONS = [
  'AI/ML', 'Programming', 'Coding', 'Robotics', 'Entrepreneurship', 'Debate',
  'Public speaking', 'Quiz', 'Science', 'Writing', 'Art/Design', 'Sports',
  'Volunteering', 'Career', 'Networking', 'Model United Nations',
]

const CATEGORY_CHIPS: { id: string; label: string; types: string[]; categories?: string[] }[] = [
  { id: 'all', label: 'All', types: [] },
  { id: 'hackathon', label: 'Hackathons', types: ['hackathon'] },
  { id: 'competition', label: 'Competitions', types: ['competition'] },
  { id: 'workshop', label: 'Workshops & Bootcamps', types: ['workshop', 'bootcamp'] },
  { id: 'volunteering', label: 'Volunteering', types: ['volunteering'] },
  { id: 'career', label: 'Career', types: ['career_event', 'networking'] },
  { id: 'seminar', label: 'Seminars & Conferences', types: ['seminar', 'conference'] },
  { id: 'sports', label: 'Sports', types: ['competition'], categories: ['Sports'] },
  { id: 'other', label: 'Other', types: ['other'] },
]

const VERIFICATION_BADGES: Record<string, { label: string; className: string }> = {
  verified_organizer: { label: '✓ Verified organizer', className: 'badge badge-success' },
  verified_event: { label: '✓ Event verified', className: 'badge badge-success' },
  cross_checked: { label: 'Cross-checked', className: 'badge badge-info' },
  unverified: { label: '⚠ Unverified', className: 'badge badge-warning' },
  expired: { label: 'Expired', className: 'badge' },
}

function formatFee(fee: number | null): string {
  if (fee === null) return 'Fee unclear'
  if (fee === 0) return 'Free'
  return `NPR ${fee.toLocaleString('en-US')}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

function deadlineCountdown(deadline: string): string {
  const days = Math.ceil(
    (new Date(deadline).getTime() - new Date().getTime()) / 86400000
  )
  if (days < 0) return 'Closed'
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `${days} days left`
}

function matchesChip(event: Event, chipId: string): boolean {
  const chip = CATEGORY_CHIPS.find((c) => c.id === chipId)
  if (!chip || chip.types.length === 0) return true
  const typeOk = chip.types.includes(event.eventType)
  const catOk = chip.categories ? chip.categories.some((c) => event.category.toLowerCase().includes(c.toLowerCase())) : false
  return typeOk || catOk
}

const DEFAULT_PROFILE: StudentEventProfile = {
  educationLevel: 'bachelors',
  interests: [],
  location: '',
  preferFree: false,
  preferOnline: false,
  preferTeam: false,
}

export default function EventsPage() {
  // Auth state (set by the platform login page — this finder stays public)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Saved events (localStorage)
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [savedOnly, setSavedOnly] = useState(false)

  // Student profile for matching (persisted)
  const [profile, setProfile] = useState<StudentEventProfile>(DEFAULT_PROFILE)

  // Search & filters
  const [query, setQuery] = useState('')
  const [activeChip, setActiveChip] = useState('all')
  const [district, setDistrict] = useState('')
  const [format, setFormat] = useState('')
  const [freeOnly, setFreeOnly] = useState(false)
  const [teamOnly, setTeamOnly] = useState(false)
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  // Profile panel visibility
  const [showProfilePanel, setShowProfilePanel] = useState(false)

  useEffect(() => {
    // Identity comes from the platform session (student or staff login)
    const ownerKey = getEventsOwnerKey()
    setIsLoggedIn(ownerKey !== null)
    if (!ownerKey) return

    let cancelled = false
    async function loadSavedState() {
      try {
        const params = `owner=${encodeURIComponent(ownerKey!)}`
        const [savedRes, profileRes] = await Promise.all([
          fetch(`/api/events/saved?${params}`),
          fetch(`/api/events/profile?${params}`),
        ])
        const savedJson = await savedRes.json()
        if (savedRes.ok && savedJson.success && !cancelled) {
          setSavedIds(savedJson.data)
        }
        const profileJson = await profileRes.json()
        if (profileRes.ok && profileJson.success && profileJson.data && !cancelled) {
          setProfile({ ...DEFAULT_PROFILE, ...profileJson.data })
        }
      } catch (e) {
        console.warn('[events] Failed to load saved state — using defaults:', e)
      }
    }
    loadSavedState()
    return () => {
      cancelled = true
    }
  }, [])

  function requireLogin(): boolean {
    if (isLoggedIn) return true
    setShowLoginModal(true)
    return false
  }

  function toggleSaved(id: string) {
    if (!requireLogin()) return
    const ownerKey = getEventsOwnerKey()
    if (!ownerKey) {
      setShowLoginModal(true)
      return
    }

    const removing = savedIds.includes(id)
    setSavedIds((prev) => (removing ? prev.filter((s) => s !== id) : [...prev, id]))

    // Persist to Supabase via server route (UI updates immediately)
    const request = removing
      ? fetch(`/api/events/saved?owner=${encodeURIComponent(ownerKey)}&eventId=${encodeURIComponent(id)}`, { method: 'DELETE' })
      : fetch('/api/events/saved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ownerKey, eventId: id }),
        })
    request
      .then(async (res) => {
        if (!res.ok) console.error('[events] Save sync failed:', await res.text())
      })
      .catch((e) => console.error('[events] Save sync failed:', e))
  }

  function handleSavedChipClick() {
    if (!requireLogin()) return
    setSavedOnly(!savedOnly)
  }

  function updateProfile(patch: Partial<StudentEventProfile>) {
    setProfile((prev) => {
      const next = { ...prev, ...patch }
      const ownerKey = getEventsOwnerKey()
      if (ownerKey) {
        // Persist to Supabase via server route (UI updates immediately)
        fetch('/api/events/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ownerKey, profile: next }),
        })
          .then(async (res) => {
            if (!res.ok) console.error('[events] Profile sync failed:', await res.text())
          })
          .catch((e) => console.error('[events] Profile sync failed:', e))
      }
      return next
    })
  }

  function toggleInterest(interest: string) {
    updateProfile({
      interests: profile.interests.includes(interest)
        ? profile.interests.filter((i) => i !== interest)
        : [...profile.interests, interest],
    })
  }

  const activeEvents = useMemo(() => EVENTS.filter(isActiveForDiscovery), [])

  const districts = useMemo(
    () => Array.from(new Set(activeEvents.map((e) => e.district))).sort(),
    [activeEvents]
  )

  const filtered = useMemo(() => {
    let list = activeEvents

    if (!savedOnly) {
      if (query.trim()) {
        const q = query.trim().toLowerCase()
        list = list.filter((e) =>
          [e.title, e.description, e.category, e.location, e.skills.join(' ')]
            .join(' ')
            .toLowerCase()
            .includes(q)
        )
      }
      list = list.filter((e) => matchesChip(e, activeChip))
      if (district) list = list.filter((e) => e.district === district || e.format === 'online')
      if (format) list = list.filter((e) => e.format === format)
      if (freeOnly) list = list.filter((e) => e.registrationFee === 0)
      if (teamOnly) list = list.filter((e) => e.participation === 'team' || e.participation === 'both')
      if (verifiedOnly) list = list.filter((e) => e.verificationStatus !== 'unverified')
    } else {
      list = list.filter((e) => savedIds.includes(e.id))
    }

    return list.sort((a, b) => a.registrationDeadline.localeCompare(b.registrationDeadline))
  }, [activeEvents, query, activeChip, district, format, freeOnly, teamOnly, verifiedOnly, savedOnly, savedIds])

  const upcomingDeadlines = useMemo(() => {
    return filtered
      .filter(isRegistrationOpen)
      .slice(0, 6)
  }, [filtered])

  const profileActive =
    profile.interests.length > 0 || profile.location !== '' || profile.preferFree || profile.preferOnline || profile.preferTeam

  return (
    <>
      {/* Hero */}
      <section style={{ padding: '56px 40px 40px', maxWidth: '1080px', margin: '0 auto', textAlign: 'center' }}>
        <div className="badge badge-primary" style={{ marginBottom: '16px', display: 'inline-flex' }}>
          <Sparkles size={12} aria-hidden="true" />
          Verified opportunity discovery layer for Nepali students
        </div>
        <h1 style={{ maxWidth: '760px', margin: '0 auto 16px' }}>
          Find hackathons, competitions, workshops &amp; more — before the deadline
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto', lineHeight: 1.7 }}>
          One student-first place to discover what&apos;s happening, who can join, what it costs,
          and when registration closes. Every listing carries its source and verification status.
        </p>
      </section>

      {/* Search + category chips */}
      <section style={{ maxWidth: '1080px', margin: '0 auto', padding: '0 40px' }}>
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} aria-hidden="true" />
          <input
            type="text"
            placeholder="Search events, skills, categories…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: '40px', padding: '12px 14px 12px 40px', fontSize: '15px' }}
            aria-label="Search events"
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {CATEGORY_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setActiveChip(chip.id)}
              style={{
                padding: '7px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: `1px solid ${activeChip === chip.id ? 'var(--primary)' : 'var(--border)'}`,
                background: activeChip === chip.id ? 'var(--primary-soft)' : 'var(--surface)',
                color: activeChip === chip.id ? 'var(--primary)' : 'var(--text-secondary)',
              }}
            >
              {chip.label}
            </button>
          ))}
          <button
            type="button"
            onClick={handleSavedChipClick}
            style={{
              padding: '7px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${savedOnly ? 'var(--primary)' : 'var(--border)'}`,
              background: savedOnly ? 'var(--primary-soft)' : 'var(--surface)',
              color: savedOnly ? 'var(--primary)' : 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginLeft: savedIds.length > 0 ? 'auto' : undefined,
            }}
          >
            <Bookmark size={13} aria-hidden="true" />
            Saved ({savedIds.length})
          </button>
        </div>

        {/* Filters row */}
        <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="meta-text" style={{ fontWeight: 600 }}>Filters:</span>
          <select value={district} onChange={(e) => setDistrict(e.target.value)} style={{ width: 'auto', minWidth: '150px' }} aria-label="Filter by district">
            <option value="">Any district</option>
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select value={format} onChange={(e) => setFormat(e.target.value)} style={{ width: 'auto', minWidth: '140px' }} aria-label="Filter by format">
            <option value="">Any format</option>
            <option value="online">Online</option>
            <option value="physical">In person</option>
            <option value="hybrid">Hybrid</option>
          </select>
          {[
            { checked: freeOnly, set: setFreeOnly, label: 'Free only' },
            { checked: teamOnly, set: setTeamOnly, label: 'Team events' },
            { checked: verifiedOnly, set: setVerifiedOnly, label: 'Verified only' },
          ].map((t) => (
            <label key={t.label} className="flex items-center gap-2" style={{ cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={t.checked} onChange={(e) => t.set(e.target.checked)} style={{ accentColor: 'var(--primary)', width: '15px', height: '15px' }} />
              {t.label}
            </label>
          ))}
        </div>
      </section>

      {/* Student matching panel */}
      <section style={{ maxWidth: '1080px', margin: '0 auto', padding: '0 40px 8px' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--primary)', marginBottom: '32px' }}>
          <button
            type="button"
            onClick={() => setShowProfilePanel(!showProfilePanel)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 24px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
            }}
            aria-expanded={showProfilePanel}
          >
            <div className="flex items-center gap-3">
              <GraduationCap size={20} style={{ color: 'var(--primary)' }} aria-hidden="true" />
              <div>
                <h3 style={{ fontSize: '15px' }}>Personalize your matches</h3>
                <p className="meta-text">
                  Tell us your level, interests and city — every card shows an explainable match score.
                  {profileActive && <span className="badge badge-primary" style={{ marginLeft: '8px' }}>Profile active</span>}
                </p>
              </div>
            </div>
            <ChevronDown size={18} style={{ color: 'var(--text-muted)', transform: showProfilePanel ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease' }} aria-hidden="true" />
          </button>

          {showProfilePanel && (
            <div style={{ padding: '0 24px 24px' }}>
              <div className="form-grid" style={{ marginBottom: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="match-edu">Education level</label>
                  <select
                    id="match-edu"
                    value={profile.educationLevel}
                    onChange={(e) => updateProfile({ educationLevel: e.target.value as EducationLevel })}
                  >
                    {(Object.keys(EDU_LABELS) as EducationLevel[]).map((level) => (
                      <option key={level} value={level}>{EDU_LABELS[level]}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="match-city">Your district</label>
                  <select
                    id="match-city"
                    value={profile.location}
                    onChange={(e) => updateProfile({ location: e.target.value })}
                  >
                    <option value="">Anywhere in Nepal</option>
                    {['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Kaski'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label>Interests</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {INTEREST_OPTIONS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: `1px solid ${profile.interests.includes(interest) ? 'var(--primary)' : 'var(--border)'}`,
                      background: profile.interests.includes(interest) ? 'var(--primary-soft)' : 'var(--surface)',
                      color: profile.interests.includes(interest) ? 'var(--primary)' : 'var(--text-secondary)',
                    }}
                  >
                    {interest}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {([
                  { key: 'preferFree', label: 'Free events preferred' },
                  { key: 'preferOnline', label: 'Prefer online' },
                  { key: 'preferTeam', label: 'Looking for team events' },
                ] as const).map((t) => (
                  <label key={t.key} className="flex items-center gap-2" style={{ cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={profile[t.key]}
                      onChange={(e) => updateProfile({ [t.key]: e.target.checked })}
                      style={{ accentColor: 'var(--primary)', width: '15px', height: '15px' }}
                    />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      <section style={{ maxWidth: '1080px', margin: '0 auto', padding: '0 40px 48px' }}>
        <p className="meta-text" style={{ marginBottom: '16px' }}>
          Showing {filtered.length} of {activeEvents.length} active opportunities · expired events move out of discovery automatically
        </p>

        {filtered.length === 0 ? (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '8px' }}>No events match your filters</h3>
            <p className="body-text">Try clearing the search or widening your filters.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {filtered.map((event) => {
              const org = getOrganizationById(event.organizationId)
              const match = computeMatch(event, profile)
              const open = isRegistrationOpen(event)
              const verification = VERIFICATION_BADGES[event.verificationStatus]
              const isSaved = savedIds.includes(event.id)

              return (
                <div key={event.id} className="card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '6px' }}>
                    <span className="meta-text">
                      {TYPE_LABELS[event.eventType]} · {event.location}
                    </span>
                    <span
                      className={match.score >= 70 ? 'badge badge-success' : match.score >= 45 ? 'badge badge-info' : 'badge'}
                      title="Match based on your profile"
                    >
                      {match.score}% Match
                    </span>
                  </div>

                  <Link href={`/events/${event.id}`} style={{ textDecoration: 'none' }}>
                    <h3 style={{ color: 'var(--text-primary)', lineHeight: 1.35 }}>{event.title}</h3>
                  </Link>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span className="flex items-center gap-2">
                      <CalendarDays size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} aria-hidden="true" />
                      Registration closes: <strong style={{ fontWeight: 600 }}>{formatDate(event.registrationDeadline)}</strong>
                      {open && <span className="badge badge-warning">{deadlineCountdown(event.registrationDeadline)}</span>}
                    </span>
                    {event.prizeInformation && (
                      <span className="flex items-center gap-2">
                        <Trophy size={14} style={{ color: 'var(--warning)', flexShrink: 0 }} aria-hidden="true" />
                        Prize: {event.prizeInformation}
                      </span>
                    )}
                    <span className="flex items-center gap-2">
                      <Ticket size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} aria-hidden="true" />
                      Entry: {formatFee(event.registrationFee)}
                    </span>
                    <span className="flex items-center gap-2">
                      <Users size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} aria-hidden="true" />
                      {event.participation === 'individual'
                        ? 'Individual entry'
                        : event.teamSizeMin
                          ? `Team: ${event.teamSizeMin}–${event.teamSizeMax} people`
                          : 'Individual or team'}
                    </span>
                  </div>

                  {/* Explainable matching (MD §Matching Should Be Explainable) */}
                  <details style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                    <summary className="meta-text" style={{ cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Why this matches you
                      <ChevronDown size={13} aria-hidden="true" />
                    </summary>
                    <ul style={{ listStyle: 'none', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {match.reasons.map((reason) => (
                        <li key={reason.text} className="flex items-start gap-2 meta-text">
                          {reason.ok
                            ? <CheckCircle2 size={13} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
                            : <XCircle size={13} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />}
                          {reason.text}
                        </li>
                      ))}
                    </ul>
                  </details>

                  <div className="flex items-center justify-between" style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border)', gap: '8px' }}>
                    <span className={verification.className} style={{ fontSize: '11px' }}>{verification.label}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSaved(event.id)}
                        aria-label={isSaved ? 'Remove from saved' : 'Save event'}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                          borderRadius: '6px', display: 'inline-flex', alignItems: 'center',
                          color: isSaved ? 'var(--primary)' : 'var(--text-muted)',
                        }}
                      >
                        {isSaved ? <BookmarkCheck size={17} aria-hidden="true" /> : <Bookmark size={17} aria-hidden="true" />}
                      </button>
                      <Link href={`/events/${event.id}`} className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                        View Event
                      </Link>
                    </div>
                  </div>

                  {org && (
                    <p className="meta-text" style={{ fontSize: '12px' }}>
                      Organized by {org.name}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Upcoming deadlines (MD §Event Calendar) */}
      {!savedOnly && upcomingDeadlines.length > 0 && (
        <section style={{ background: 'var(--surface-muted)', padding: '48px 40px' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Closing soon</h2>
            <p className="body-text" style={{ textAlign: 'center', marginBottom: '28px' }}>
              Registration deadlines approaching across your current results.
            </p>
            <div className="card" style={{ padding: '8px 24px' }}>
              {upcomingDeadlines.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between"
                  style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', gap: '12px' }}
                >
                  <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
                    <Clock size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} aria-hidden="true" />
                    <Link href={`/events/${event.id}`} className="nav-link" style={{ padding: 0, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {event.title}
                    </Link>
                  </div>
                  <div className="flex items-center gap-3" style={{ flexShrink: 0 }}>
                    <span className="meta-text flex items-center gap-1">
                      <MapPin size={12} aria-hidden="true" />
                      {event.location}
                    </span>
                    <span className="badge badge-warning">{formatDate(event.registrationDeadline)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust note (MD §Do Not Trust an Event Just Because It Is on Social Media) */}
      <section style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 40px 72px' }}>
        <div className="card" style={{ padding: '28px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <ShieldCheck size={24} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
          <div>
            <h3 style={{ marginBottom: '6px' }}>How verification works here</h3>
            <p className="body-text" style={{ lineHeight: 1.7 }}>
              Events are discovered through scattered channels, then cross-checked against the official organizer
              before publication. Social media posts alone are never enough to mark something verified.
              Unverified listings stay visible but carry warning flags — check the source before you register.
              If a detail looks wrong, trust the official organizer page over any repost.
            </p>
          </div>
        </div>
      </section>

      {/* Login-required modal (browsing stays public — only saving needs an account) */}
      {showLoginModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-modal-title"
          onClick={() => setShowLoginModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '420px',
              width: '100%',
              padding: '32px',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setShowLoginModal(false)}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'inline-flex',
                color: 'var(--text-muted)',
              }}
            >
              <X size={16} aria-hidden="true" />
            </button>

            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'var(--primary-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Lock size={24} style={{ color: 'var(--primary)' }} aria-hidden="true" />
            </div>

            <h2 id="login-modal-title" style={{ fontSize: '18px', marginBottom: '8px' }}>
              You need to log in to continue
            </h2>
            <p className="body-text" style={{ marginBottom: '24px', lineHeight: 1.7 }}>
              Browsing events is open to everyone — but saving events and tracking deadlines
              requires an account so your list follows you across devices.
            </p>

            <Link
              href="/login"
              className="btn-primary w-full"
              style={{ justifyContent: 'center', padding: '12px', fontSize: '14px' }}
            >
              Go to Login
              <LogIn size={15} aria-hidden="true" />
            </Link>

            <button
              type="button"
              className="btn-secondary w-full"
              style={{ justifyContent: 'center', padding: '10px', fontSize: '13px', marginTop: '10px' }}
              onClick={() => setShowLoginModal(false)}
            >
              Keep browsing events
            </button>
          </div>
        </div>
      )}
    </>
  )
}
