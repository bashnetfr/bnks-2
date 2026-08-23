import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Request Received',
  description: 'Thank you for reaching out to Ed-Vantage. We will be in touch within 2 business days.',
}

export default function ThankYouPage() {
  return (
    <div
      style={{
        maxWidth: '520px',
        margin: '80px auto',
        padding: '0 40px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(22, 163, 74, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}
      >
        <CheckCircle size={28} style={{ color: 'var(--success)' }} aria-label="Success" />
      </div>

      <h1 style={{ marginBottom: '12px' }}>We got your message</h1>
      <p className="body-text" style={{ fontSize: '15px', lineHeight: 1.7, marginBottom: '32px' }}>
        Thank you for reaching out. The Ed-Vantage team will be in touch within
        2 business days to discuss your pilot or answer your questions.
      </p>

      <div className="card" style={{ padding: '20px', marginBottom: '24px', textAlign: 'left' }}>
        <h3 style={{ marginBottom: '12px', fontSize: '14px' }}>While you wait</h3>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { label: 'Read how the scoring works', href: '/#how-it-works' },
            { label: 'Review the research behind Ed-Vantage', href: '/#research' },
            { label: 'Read the privacy policy', href: '/privacy' },
          ].map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  color: 'var(--primary)',
                  textDecoration: 'none',
                }}
              >
                <ArrowRight size={12} aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <Link href="/" className="btn-secondary">
        Back to home
      </Link>
    </div>
  )
}
