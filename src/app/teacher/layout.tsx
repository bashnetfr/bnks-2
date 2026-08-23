import type { ReactNode } from 'react'
import AuthGuard from '@/components/AuthGuard'

export default function TeacherDashboardLayout({ children }: { children: ReactNode }) {
  return <AuthGuard allowedRole="teacher">{children}</AuthGuard>
}
