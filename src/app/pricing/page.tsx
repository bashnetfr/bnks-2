import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'EduFit Nepal pricing: free pilot phase for NGOs and municipalities. Long-term direction is government-funded access for schools across Nepal.',
}

export default function PricingPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '64px 40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div className="badge badge-primary" style={{ marginBottom: '12px', display: 'inline-flex' }}>
          Pricing
        </div>
        <h1 style={{ marginBottom: '12px' }}>Simple, mission-aligned pricing</h1>
        <p className="body-text" style={{ fontSize: '16px', maxWidth: '520px', margin: '0 auto' }}>
          We are in pilot phase. The first pilot is free — we want to prove the value
          before asking anyone to pay.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '40px',
        }}
      >
        {/* Pilot tier */}
        <div className="card" style={{ padding: '32px', borderTop: '3px solid var(--primary)' }}>
          <div className="badge badge-primary" style={{ marginBottom: '16px', display: 'inline-flex' }}>
            Current Phase
          </div>
          <h2 style={{ fontSize: '22px', marginBottom: '4px' }}>Pilot</h2>
          <div
            style={{
              fontSize: '36px',
              fontWeight: 700,
              color: 'var(--primary)',
              margin: '12px 0',
            }}
          >
            Free
          </div>
          <p className="body-text" style={{ marginBottom: '24px', fontSize: '13px' }}>
            First pilot with one NGO, municipality or school network at no cost.
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              'Unlimited school assessments',
              'Student digital-access surveys',
              'AI explanation + 90-day action plan',
              'Student Event Finder access',
              'Reality-gap flagging',
              'Direct access to EduFit team',
            ].map((item) => (
              <li
                key={item}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                }}
              >
                <CheckCircle size={14} style={{ color: 'var(--success)', marginTop: '2px', flexShrink: 0 }} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <Link href="/dashboard" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '24px' }}>
            Start a pilot
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>

        {/* Government tier */}
        <div className="card" style={{ padding: '32px', background: 'var(--surface-muted)' }}>
          <div className="badge badge-info" style={{ marginBottom: '16px', display: 'inline-flex' }}>
            Long-Term Direction
          </div>
          <h2 style={{ fontSize: '22px', marginBottom: '4px' }}>Government-Funded</h2>
          <div
            style={{
              fontSize: '36px',
              fontWeight: 700,
              color: 'var(--info)',
              margin: '12px 0',
            }}
          >
            Ministry-level
          </div>
          <p className="body-text" style={{ marginBottom: '24px', fontSize: '13px' }}>
            A ministry funds the platform and distributes access to schools and NGOs
            under them — mirroring how ETRI itself is normally deployed.
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              'Platform funded at ministry level',
              'Free access for all schools/NGOs under mandate',
              'Aggregated national reporting',
              'Curriculum alignment with DoE standards',
              'Formal procurement pathway',
            ].map((item) => (
              <li
                key={item}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                }}
              >
                <CheckCircle size={14} style={{ color: 'var(--info)', marginTop: '2px', flexShrink: 0 }} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <div
            style={{
              marginTop: '24px',
              padding: '12px',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              color: 'var(--text-muted)',
              textAlign: 'center',
            }}
          >
            This is a planned direction, not an existing relationship.
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '8px' }}>Ready to discuss a pilot for your organization?</h3>
        <p className="body-text" style={{ marginBottom: '16px', fontSize: '13px' }}>
          We work directly with NGOs and municipalities. Get in touch and we will set up
          your pilot within a week.
        </p>
        <Link href="/thank-you?type=inquiry" className="btn-primary" style={{ display: 'inline-flex' }}>
          Request a conversation
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>

      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <p className="meta-text">
          Questions?{' '}
          <Link href="/#faq" style={{ color: 'var(--primary)' }}>
            Read the FAQ
          </Link>
          {' · '}
          <Link href="/privacy" style={{ color: 'var(--primary)' }}>
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}
