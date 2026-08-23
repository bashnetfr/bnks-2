'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, BookOpen, ChevronRight } from 'lucide-react'

export default function TopNav() {
  const pathname = usePathname()

  // Don't show marketing nav inside dashboard or survey
  const isDashboard = pathname.startsWith('/dashboard')
  const isSurvey = pathname.startsWith('/survey')
  if (isDashboard || isSurvey) return null

  return (
    <nav className="top-nav" role="navigation" aria-label="Main navigation">
      <Link href="/" className="nav-logo">
        <BarChart2 size={20} style={{ color: 'var(--primary)' }} aria-hidden="true" />
        <span>EduFit <span className="logo-accent">Nepal</span></span>
      </Link>

      <div className="nav-links">
        <Link href="/#how-it-works" className="nav-link">How it works</Link>
        <Link href="/#research"     className="nav-link">Research</Link>
        <Link href="/pricing"       className="nav-link">Pricing</Link>
        <Link href="/#faq"          className="nav-link">FAQ</Link>
      </div>

      <div className="nav-actions">
        <Link href="/survey" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
          <BookOpen size={14} aria-hidden="true" />
          Student Survey
        </Link>
        <Link href="/dashboard" className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
          Run Assessment
          <ChevronRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </nav>
  )
}
