// ================================================================
// Ed-Vantage — Community Hub type definitions
// community-hub-mega-spec.md §4 (roles), §6 (verification),
// §8 (post model), §12 (media), §20–24 (reports/audit/notifications)
// ================================================================

export type CommunityRole = 'student' | 'teacher' | 'admin'

export type VerificationState =
  | 'approved'
  | 'pending'
  | 'rejected'
  | 'revoked'
  | 'not_applicable' // students

export interface CommunityUser {
  id: string
  name: string
  email: string
  role: CommunityRole
  verificationStatus: VerificationState
  subject: string
  initialsColor: string
}

export type PostType = 'text' | 'image' | 'video' | 'mixed'

/** Spec §8.2 — only published content appears in student feeds. */
export type PostStatus = 'published' | 'hidden' | 'removed'

export interface CommunityPost {
  id: string
  authorId: string
  content: string
  postType: PostType
  status: PostStatus
  pinned: boolean
  createdAt: string // ISO
  updatedAt?: string
  publishedAt: string
  likeCount: number
  saveCount: number
  viewCount: number
  edited: boolean
}

/** Spec §12.1 — media metadata kept separate from post text. */
export interface MediaItem {
  id: string
  postId: string
  type: 'image' | 'video'
  url: string // data URI (uploaded) or https delivery reference
  mimeType?: string
  sizeBytes?: number
  width?: number
  height?: number
  durationSeconds?: number
  createdAt: string
}

/** Spec §20.2 */
export interface ReportRecord {
  id: string
  reporterId: string
  targetType: 'post' | 'user'
  targetId: string
  reason: string
  details?: string
  status: 'open' | 'under_review' | 'resolved' | 'dismissed'
  reviewedBy?: string
  reviewedAt?: string
  createdAt: string
}

/** Spec §23.3 */
export interface NotificationItem {
  id: string
  userId: string
  type: 'announcement' | 'like' | 'save' | 'system' | 'verification'
  title: string
  body: string
  referenceType?: string
  referenceId?: string
  isRead: boolean
  createdAt: string
}

/** Spec §22 — administrative actions are auditable. */
export interface AuditEntry {
  id: string
  actorId: string
  action:
    | 'teacher_verified'
    | 'teacher_verification_revoked'
    | 'post_removed'
    | 'report_resolved'
    | 'report_dismissed'
    | 'account_restricted'
  targetType: 'user' | 'post' | 'report'
  targetId: string
  metadata?: string
  createdAt: string
}

/** Spec §6.3 */
export interface VerificationRequest {
  id: string
  userEmail: string
  userName: string
  subject: string
  status: 'pending' | 'approved' | 'rejected' | 'revoked'
  reason?: string
  requestedAt: string
  reviewedBy?: string
  reviewedAt?: string
}

/** Lightweight member shape used when resolving real sessions. */
export interface MemberRecord {
  email: string
  role: 'student' | 'teacher'
  fullName?: string
}

// --- Private direct messages (user-requested addition) ---

export interface Conversation {
  id: string
  participantIds: string[] // exactly two members
  lastMessageAt: string
}

export interface DirectMessage {
  id: string
  conversationId: string
  senderId: string
  body: string
  createdAt: string
  /** Spec §44 privacy — per-member read receipts */
  readBy: string[]
}
