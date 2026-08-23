import type { ReactNode } from 'react'
import AuthGuard from '@/components/AuthGuard'

export default function StudentDashboardLayout({ children }: { children: ReactNode }) {
  return <AuthGuard allowedRole="student">{children}</AuthGuard>
}
