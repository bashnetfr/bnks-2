import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft, MapPin, CalendarDays, Users, Trophy, Ticket, ShieldCheck,
  AlertTriangle, ExternalLink, GraduationCap, Award, Globe, Clock,
  CheckCircle2, Building2
} from 'lucide-react'
import type { EventBenefit } from '@/lib/types'
import {
  getAllEvents, getEventById, getOrganizationById, getEffectiveStatus, isRegistrationOpen,
} from '@/lib/events'

export function generateStaticParams() {
  return getAllEvents().map((event) => ({ id: event.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const event = getEventById(id)
  if (!event) return { title: 'Event not found' }
  return {
    title: event.title,
    description: event.description.slice(0, 155),
  }
}

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

const EDU_LABELS: Record<string, string> = {
  school: 'School (up to Grade 10)',
  see: 'SEE appeared / passed',
  plus_two: '+2 (Higher Secondary)',
  bachelors: "Bachelor's",
  masters: "Master's",
  recent_graduate: 'Recent graduate',
}

const ORG_TYPE_LABELS: Record<string, string> = {
  student_club: 'Student club',
  college_club: 'College club',
  university: 'University',
  ngo: 'NGO',
  ingo: 'INGO',
  youth_organization: 'Youth organization',
  tech_community: 'Tech community',
  professional_organization: 'Professional organization',
  company: 'Company',
  government: 'Government body',
  municipality: 'Municipality',
  community_organization: 'Community organization',
}

const BENEFIT_LABELS: Record<EventBenefit, string> = {
  prize: 'Prize',
  certificate: 'Certificate',
  mentorship: 'Mentorship',
  networking: 'Networking',
  portfolio_project: 'Portfolio project',
  internship_opportunity: 'Internship opportunity',
  exposure: 'Exposure',
  training: 'Training',
}

const REG_URL_LABELS: Record<string, string> = {
  official: 'Official registration',
  external: 'External registration',
  google_form: 'Google Form registration',
  unknown: 'Unknown registration channel',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function formatFee(fee: number | null): string {
  if (fee === null) return 'Unclear — confirm with organizer'
  if (fee === 0) return 'Free'
  return `NPR ${fee.toLocaleString('en-US')}`
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
        <Icon size={15} style={{ color: 'var(--primary)' }} aria-hidden="true" />
        <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</h3>
      </div>
      <div className="body-text" style={{ lineHeight: 1.7 }}>{children}</div>
    </div>
  )
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = getEventById(id)
  if (!event) notFound()

  const org = getOrganizationById(event.organizationId)
  const status = getEffectiveStatus(event)
  const open = isRegistrationOpen(event)

  const statusBadge =
    status === 'registration_open'
      ? { label: 'Registration open', className: 'badge badge-success' }
      : status === 'upcoming'
        ? { label: 'Opening soon', className: 'badge badge-info' }
        : status === 'ongoing'
          ? { label: 'Ongoing now', className: 'badge badge-primary' }
          : { label: 'Registration closed', className: 'badge badge-danger' }

  return (
    <>
      {/* Header */}
      <section style={{ background: 'var(--surface-muted)', borderBottom: '1px solid var(--border)', padding: '32px 40px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <Link href="/events" className="nav-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: 0, marginBottom: '16px' }}>
            <ArrowLeft size={14} aria-hidden="true" />
            All events
          </Link>

          <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
            <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
              <span className="badge badge-primary">{TYPE_LABELS[event.eventType]}</span>
              <span className={statusBadge.className}>{statusBadge.label}</span>
              {event.verificationStatus !== 'unverified' && event.verificationStatus !== 'expired' && (
                <span className="badge badge-success">
                  <ShieldCheck size={11} aria-hidden="true" />
                  {event.verificationStatus === 'verified_organizer' && 'Verified organizer'}
                  {event.verificationStatus === 'verified_event' && 'Event verified'}
                  {event.verificationStatus === 'cross_checked' && 'Cross-checked'}
                </span>
              )}
            </div>
            <span className="meta-text">Last verified: {event.lastVerified}</span>
          </div>

          <h1>{event.title}</h1>
          <p className="meta-text" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <MapPin size={13} aria-hidden="true" />
            {event.location} · {event.district} district · {event.format.toUpperCase()} format
          </p>
        </div>
      </section>

      {/* Anti-scam warnings (MD §Anti-Scam — neutral language) */}
      {event.safetyFlags.length > 0 && (
        <section style={{ maxWidth: '860px', margin: '24px auto 0', padding: '0 40px' }}>
          <div
            role="alert"
            style={{
              border: '1px solid rgba(245, 158, 11, 0.4)',
              background: 'rgba(245, 158, 11, 0.07)',
              borderRadius: 'var(--radius-md)',
              padding: '18px 22px',
              display: 'flex',
              gap: '14px',
              alignItems: 'flex-start',
            }}
          >
            <AlertTriangle size={20} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
            <div>
              <h3 style={{ fontSize: '14px', marginBottom: '6px', color: 'var(--text-primary)' }}>
                Safety signals for this listing
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {event.safetyFlags.map((flag) => (
                  <li key={flag} className="body-text" style={{ fontSize: '13px' }}>· {flag}</li>
                ))}
              </ul>
              <p className="meta-text" style={{ marginTop: '8px' }}>
                Review the source carefully and register only through the organizer&apos;s official channels.
                This listing has not been confirmed as fraudulent — it simply could not be verified.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Main content */}
      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 40px 80px' }}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <Section title="About this event" icon={CalendarDays}>
            <p>{event.description}</p>
            {event.category && (
              <p className="meta-text" style={{ marginTop: '8px' }}>
                Category: {event.category}{event.subCategory ? ` · ${event.subCategory}` : ''}
              </p>
            )}
          </Section>

          <Section title="Organizer" icon={Building2}>
            {org ? (
              <>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {org.name}
                  {'  '}
                  {org.verificationStatus !== 'unverified' && (
                    <span className="badge badge-success" style={{ verticalAlign: 'middle' }}>
                      <ShieldCheck size={11} aria-hidden="true" /> Verified
                    </span>
                  )}
                </p>
                <p>{org.description}</p>
                <p className="meta-text" style={{ marginTop: '6px' }}>
                  Type: {ORG_TYPE_LABELS[org.organizationType] ?? org.organizationType}
                  {org.affiliation ? ` · Affiliation: ${org.affiliation}` : ''}
                  {` · Located in ${org.location}`}
                </p>
                {(org.website || org.facebook || org.instagram || org.linkedin) && (
                  <p style={{ marginTop: '8px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Website', url: org.website },
                      { label: 'Facebook', url: org.facebook },
                      { label: 'Instagram', url: org.instagram },
                      { label: 'LinkedIn', url: org.linkedin },
                    ]
                      .filter((l) => l.url)
                      .map((link) => (
                        <a
                          key={link.label}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '13px', color: 'var(--info)', textDecoration: 'none', fontWeight: 500 }}
                        >
                          {link.label} ↗
                        </a>
                      ))}
                  </p>
                )}
              </>
            ) : (
              <p>Organizer information unavailable.</p>
            )}
          </Section>

          <Section title="Date & venue" icon={CalendarDays}>
            <p><strong>Starts:</strong> {formatDate(event.startDatetime)}</p>
            <p><strong>Ends:</strong> {formatDate(event.endDatetime)}</p>
            {event.format === 'online' ? (
              <p className="flex items-center gap-2" style={{ marginTop: '4px' }}>
                <Globe size={14} aria-hidden="true" /> Fully online — join from anywhere.
              </p>
            ) : (
              <p className="flex items-center gap-2" style={{ marginTop: '4px' }}>
                <MapPin size={14} aria-hidden="true" />
                {event.format === 'hybrid' ? `Hybrid — physical venue: ${event.venue ?? 'TBA'} (online option available)` : `Venue: ${event.venue ?? 'To be announced'}`}
              </p>
            )}
            {event.format === 'unknown' && (
              <p className="meta-text">Format could not be confirmed.</p>
            )}
          </Section>

          <Section title="Registration" icon={Clock}>
            <p>
              <strong>Deadline:</strong>{' '}
              {new Date(event.registrationDeadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              {' '}
              {open
                ? <span className="badge badge-warning">{Math.max(0, Math.ceil((new Date(event.registrationDeadline).getTime() - Date.now()) / 86400000))} days left</span>
                : <span className="badge badge-danger">Closed</span>}
            </p>
            <p style={{ marginTop: '6px' }}>{REG_URL_LABELS[event.registrationUrlType]}</p>
            {event.contactInformation && (
              <p className="meta-text" style={{ marginTop: '4px' }}>Contact: {event.contactInformation}</p>
            )}
            {open && (
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
                style={{ marginTop: '12px' }}
              >
                Register now
                <ExternalLink size={15} aria-hidden="true" />
              </a>
            )}
            {event.registrationUrlType === 'google_form' && (
              <p className="meta-text" style={{ marginTop: '8px' }}>
                Note: a Google Form link alone does not guarantee safety — confirm it matches the organizer&apos;s official announcements.
              </p>
            )}
          </Section>

          <Section title="Eligibility" icon={GraduationCap}>
            <p><strong>Open to:</strong> {event.eligibility.educationLevels.map((level) => EDU_LABELS[level]).join(', ')}</p>
            {(event.eligibility.minimumAge || event.eligibility.maximumAge) && (
              <p>
                <strong>Age range:</strong>{' '}
                {event.eligibility.minimumAge ?? '—'} to {event.eligibility.maximumAge ?? '—'} years
              </p>
            )}
            {event.eligibility.allowedPrograms && (
              <p><strong>Programs:</strong> {event.eligibility.allowedPrograms.join(', ')}</p>
            )}
            {event.eligibility.eligibilityNotes && (
              <p className="meta-text" style={{ marginTop: '4px' }}>{event.eligibility.eligibilityNotes}</p>
            )}
          </Section>

          <Section title="Participation" icon={Users}>
            <p>
              {event.participation === 'individual' && 'Individual entry only.'}
              {event.participation === 'team' && `Team entry required${event.teamSizeMin ? ` — team size ${event.teamSizeMin}–${event.teamSizeMax}` : ''}.`}
              {event.participation === 'both' && `Individual or team${event.teamSizeMin ? ` (team size ${event.teamSizeMin}–${event.teamSizeMax})` : ''}.`}
              {event.participation === 'unknown' && 'Participation mode not specified.'}
            </p>
          </Section>

          <Section title="Cost" icon={Ticket}>
            <p><strong>Entry:</strong> {formatFee(event.registrationFee)}</p>
            {event.registrationFee === null && (
              <p className="meta-text">Fee was not clearly published — verify with the organizer before registering.</p>
            )}
          </Section>

          {event.prizeInformation && (
            <Section title="Prizes" icon={Trophy}>
              <p>{event.prizeInformation}</p>
            </Section>
          )}

          <Section title="Certificate" icon={Award}>
            <p>
              {event.certificateAvailable
                ? 'Official certificate provided to participants.'
                : 'No certificate officially provided for this event.'}
            </p>
          </Section>

          {event.skills.length > 0 && (
            <Section title="Skills relevant to this event" icon={CheckCircle2}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {event.skills.map((skill) => (
                  <span key={skill} className="badge badge-info">{skill}</span>
                ))}
              </div>
            </Section>
          )}

          <Section title="What you gain" icon={Award}>
            {event.benefits.length > 0 ? (
              <ul style={{ listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '6px' }}>
                {event.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2">
                    <CheckCircle2 size={13} style={{ color: 'var(--success)', flexShrink: 0 }} aria-hidden="true" />
                    {BENEFIT_LABELS[benefit]}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="meta-text">Benefits not published by the organizer.</p>
            )}
          </Section>

          <Section title="Source" icon={ExternalLink}>
            <p>
              Original source:{' '}
              <a href={event.sourceUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--info)', fontWeight: 600, textDecoration: 'none' }}>
                {event.sourceUrl}
              </a>
            </p>
            <p className="meta-text" style={{ marginTop: '4px' }}>
              Source type: {event.sourceType.replace(/_/g, ' ')} · Information recorded on {event.lastVerified}.
              Always confirm details on the official page before paying any fee.
            </p>
          </Section>
        </div>

        {/* Trust model note (MD §Trust Model — show evidence, not claims) */}
        <p className="meta-text" style={{ textAlign: 'center', marginTop: '24px', lineHeight: 1.7 }}>
          We don&apos;t claim events are 100% safe — we show the evidence behind every listing so you can decide.
          Registration links open external sites in a new tab.
        </p>
      </main>
    </>
  )
}
