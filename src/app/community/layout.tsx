import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Community Hub',
  description:
    'Moderated school community feed — announcements, lesson material and private messaging from verified teachers and administrators.',
}

export default function CommunityLayout({ children }: { children: ReactNode }) {
  return children
}
