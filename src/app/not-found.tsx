import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div
      style={{
        maxWidth: '480px',
        margin: '100px auto',
        padding: '0 40px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '72px',
          fontWeight: 700,
          color: 'var(--primary)',
          letterSpacing: '-0.04em',
          lineHeight: 1,
          marginBottom: '8px',
        }}
        aria-hidden="true"
      >
        404
      </div>

      <div
        style={{
          width: '1px',
          height: '40px',
          background: 'var(--border)',
          margin: '0 auto 20px',
        }}
        aria-hidden="true"
      />

      <h1 style={{ fontSize: '20px', marginBottom: '10px' }}>Page not found</h1>
      <p className="body-text" style={{ marginBottom: '32px' }}>
        This page doesn&apos;t exist or has been moved. Ed-Vantage has: a home page,
        a school assessment dashboard, a student survey, a pricing page, and a privacy policy.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
        <Link href="/" className="btn-primary">
          <Image src="/logo.png" alt="" width={14} height={14} aria-hidden="true" />
          Back to Ed-Vantage
        </Link>
        <Link href="/dashboard" className="btn-secondary" style={{ fontSize: '13px' }}>
          <ArrowLeft size={13} aria-hidden="true" />
          Go to school assessment
        </Link>
      </div>
    </div>
  )
}
