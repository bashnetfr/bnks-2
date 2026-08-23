import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Student Events & Competitions Finder',
  description:
    'Discover hackathons, coding competitions, debates, MUNs, workshops and volunteering across Nepal — with deadlines, fees, prizes, eligibility and verification status for every event.',
}

export default function EventsLayout({ children }: { children: ReactNode }) {
  return children
}
