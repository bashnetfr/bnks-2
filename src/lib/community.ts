// ================================================================
// Ed-Vantage — Community Hub data layer
// community-hub-mega-spec.md §5 (permission matrix), §8 (post model),
// §13–14 (like/save uniqueness), §20 (reports), §22 (audit),
// §23 (notifications), §57 (MVP scope)
//
// Demo persistence: single localStorage blob (matches survey/events
// pattern). The permission helpers below are the single source of
// truth for authorization — they are called by the UI AND by
// /api/community/feed so the same rules run server-side.
// ================================================================

import type {
  CommunityUser, CommunityPost, MediaItem, ReportRecord,
  NotificationItem, AuditEntry, VerificationRequest,
  Conversation, DirectMessage, CommunityRole,
} from './community-types'

export type {
  CommunityUser, CommunityPost, MediaItem, ReportRecord,
  NotificationItem, AuditEntry, VerificationRequest,
  Conversation, DirectMessage, CommunityRole,
}

// ---------------------------------------------------------------
// Permission matrix (spec §5) — every capability check lives here
// ---------------------------------------------------------------

export function isStaff(user: CommunityUser | null): boolean {
  return user?.role === 'teacher' || user?.role === 'admin'
}

/** Rule 1 & 2: students never publish; teachers must be verified. */
export function canCreatePost(user: CommunityUser | null): boolean {
  if (!user) return false
  if (user.role === 'admin') return true
  if (user.role !== 'teacher') return false
  return user.verificationStatus === 'approved'
}

export function canEditPost(user: CommunityUser | null, post: CommunityPost): boolean {
  if (!user || !canCreatePost(user)) return false
  return post.authorId === user.id
}

export function canDeleteOwnPost(user: CommunityUser | null, post: CommunityPost): boolean {
  if (!user || !canCreatePost(user)) return false
  return post.authorId === user.id
}

export function canModeratePosts(user: CommunityUser | null): boolean {
  return user?.role === 'admin'
}

export function canVerifyTeachers(user: CommunityUser | null): boolean {
  return user?.role === 'admin'
}

export function canReport(user: CommunityUser | null): boolean {
  return user !== null
}

/** Students may only message verified staff (child-safety, spec §44).
 *  Staff may message anyone. */
export function canDirectMessage(user: CommunityUser | null, target: CommunityUser): boolean {
  if (!user || user.id === target.id) return false
  if (isStaff(user)) return true
  return (
    target.role === 'admin' ||
    (target.role === 'teacher' && target.verificationStatus === 'approved')
  )
}

// ---------------------------------------------------------------
// Controlled report reasons (spec §20.1)
// ---------------------------------------------------------------

export const REPORT_REASONS = [
  'Inappropriate content',
  'Misleading information',
  'Spam',
  'Harassment/bullying',
  'Privacy concern',
  'Other',
] as const

export type ReportReason = (typeof REPORT_REASONS)[number]

// ---------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------

const H = 3600_000
const D = 24 * H

function svgUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const SCIENCE_DIAGRAM = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="420" viewBox="0 0 800 420">
  <rect width="800" height="420" fill="#F1F5F9"/>
  <circle cx="150" cy="210" r="80" fill="rgba(216,50,42,0.15)" stroke="#D8322A" stroke-width="3"/>
  <text x="150" y="205" text-anchor="middle" font-family="Arial" font-size="18" font-weight="bold" fill="#0F172A">Evaporation</text>
  <text x="150" y="228" text-anchor="middle" font-family="Arial" font-size="13" fill="#64748B">liquid → gas</text>
  <path d="M240 160 Q 400 60 560 160" fill="none" stroke="#2563EB" stroke-width="4" marker-end="true"/>
  <polygon points="552,148 572,166 546,170" fill="#2563EB"/>
  <circle cx="650" cy="210" r="80" fill="rgba(37,99,235,0.12)" stroke="#2563EB" stroke-width="3"/>
  <text x="650" y="205" text-anchor="middle" font-family="Arial" font-size="18" font-weight="bold" fill="#0F172A">Condensation</text>
  <text x="650" y="228" text-anchor="middle" font-family="Arial" font-size="13" fill="#64748B">gas → liquid</text>
  <path d="M560 270 Q 400 370 240 270" fill="none" stroke="#16A34A" stroke-width="4"/>
  <polygon points="248,282 228,264 254,260" fill="#16A34A"/>
  <rect x="330" y="180" width="140" height="56" rx="10" fill="#fff" stroke="#CBD5E1" stroke-width="2"/>
  <text x="400" y="204" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="#0F172A">The Water Cycle</text>
  <text x="400" y="224" text-anchor="middle" font-family="Arial" font-size="11" fill="#94A3B8">Grade 10 · Unit 4</text>
</svg>`
)

const MATH_POSTER = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="420" viewBox="0 0 800 420">
  <rect width="800" height="420" rx="18" fill="#0F172A"/>
  <text x="400" y="90" text-anchor="middle" font-family="Georgia" font-size="34" fill="#fff">Math Club — Saturday Sessions</text>
  <text x="400" y="130" text-anchor="middle" font-family="Arial" font-size="16" fill="#94A3B8">Problem solving · Olympiad practice · Puzzles</text>
  <g font-family="Arial" font-size="17" fill="#E2E8F0">
    <rect x="120" y="180" width="520" height="52" rx="10" fill="rgba(216,50,42,0.25)"/>
    <text x="145" y="213">Every Saturday · 10:00 AM · Room 12</text>
    <rect x="120" y="250" width="520" height="52" rx="10" fill="rgba(37,99,235,0.25)"/>
    <text x="145" y="283">Bring: notebook, geometry box, curiosity</text>
    <rect x="120" y="320" width="520" height="52" rx="10" fill="rgba(22,163,74,0.25)"/>
    <text x="145" y="353">Open to Grades 9–12 · No fee</text>
  </g>
</svg>`
)

function seedUsers(): CommunityUser[] {
  return [
    {
      id: 'u-admin-office',
      name: 'School Administration',
      email: 'admin@edufit.edu.np',
      role: 'admin',
      verificationStatus: 'approved',
      subject: 'Administration',
      initialsColor: '#D8322A',
    },
    {
      id: 'u-sharma',
      name: 'Ms. Anjali Sharma',
      email: 'teacher.ktm@edufit-test.edu.np',
      role: 'teacher',
      verificationStatus: 'approved',
      subject: 'Science',
      initialsColor: '#2563EB',
    },
    {
      id: 'u-gurung',
      name: 'Mr. Prakash Gurung',
      email: 'teacher.lal@edufit-test.edu.np',
      role: 'teacher',
      verificationStatus: 'approved',
      subject: 'Mathematics',
      initialsColor: '#16A34A',
    },
    {
      id: 'u-rai',
      name: 'Ms. Sunita Rai',
      email: 'teacher.rai@edufit-test.edu.np',
      role: 'teacher',
      verificationStatus: 'pending',
      subject: 'English',
      initialsColor: '#F59E0B',
    },
    {
      id: 'u-thapa',
      name: 'Aarav Thapa',
      email: 'student.ktm@edufit-test.edu.np',
      role: 'student',
      verificationStatus: 'not_applicable',
      subject: 'Grade 10',
      initialsColor: '#7C3AED',
    },
    {
      id: 'u-karki',
      name: 'Sneha Karki',
      email: 'student.lal@edufit-test.edu.np',
      role: 'student',
      verificationStatus: 'not_applicable',
      subject: 'Grade 9',
      initialsColor: '#0891B2',
    },
  ]
}

function seedPosts(): CommunityPost[] {
  const now = Date.now()
  const mk = (
    id: string, authorId: string, content: string, createdAt: number,
    extra: Partial<CommunityPost> = {}
  ): CommunityPost => ({
    id, authorId, content, postType: 'text', status: 'published', pinned: false,
    createdAt: new Date(createdAt).toISOString(), publishedAt: new Date(createdAt).toISOString(),
    likeCount: 0, saveCount: 0, viewCount: 0, edited: false, ...extra,
  })

  return [
    mk('post-welcome-01', 'u-admin-office',
      'Welcome to the Community Hub! This is your school\'s moderated feed. Verified teachers and the administration will share announcements, study material and event updates here. Be kind, stay curious — and use the report button if anything looks wrong.',
      now - 6 * D, { pinned: true, likeCount: 24, saveCount: 9, viewCount: 132 }),
    mk('post-exam-notice-01', 'u-admin-office',
      'TERM 2 EXAMINATION SCHEDULE: The Term 2 exam routine has been posted on the main notice board and shared with class teachers. Exams begin Monday, Aswin 15. Students must arrive 20 minutes before start time with school ID cards.',
      now - 5 * D, { likeCount: 41, saveCount: 58, viewCount: 310 }),
    mk('post-science-diagram-01', 'u-sharma',
      'Here is the water-cycle revision diagram from today\'s Grade 10 lesson. Remember: evaporation and condensation arrows ALWAYS point in opposite directions — this is a favourite exam question. Save it for Sunday\'s quiz!',
      now - 2 * D, {
        postType: 'image', likeCount: 18, saveCount: 27, viewCount: 96,
      }),
    mk('post-video-lesson-01', 'u-sharma',
      'Watch this short clip before tomorrow\'s class — we will use it to open the discussion on plant reproduction. Note down TWO things you find surprising; we start with your observations.',
      now - 30 * H, {
        postType: 'video', likeCount: 12, saveCount: 15, viewCount: 74,
      }),
    mk('post-math-homework-01', 'u-gurung',
      'Grade 10 Mathematics: complete exercise 8.2, questions 1–12, by Thursday. Show every step — method marks are half the score. If you get stuck on question 9, re-read example 4 on page 142 first.',
      now - 26 * H, { likeCount: 9, saveCount: 21, viewCount: 88 }),
    mk('post-math-poster-01', 'u-gurung',
      'Math Club starts this Saturday! Open to Grades 9–12, completely free. We focus on olympiad-style problem solving — great preparation for the Nepal Informatics Olympiad and NMO.',
      now - 20 * H, {
        postType: 'image', likeCount: 15, saveCount: 11, viewCount: 67,
      }),
    mk('post-library-01', 'u-admin-office',
      'Library extended hours during exam season: open until 5 PM daily, including Fridays. Silence zones are strictly enforced. Bring your library card for textbook reservations.',
      now - 8 * H, { likeCount: 7, saveCount: 14, viewCount: 45 }),
    mk('post-volunteer-01', 'u-admin-office',
      'Volunteering opportunity: the Inter-House Sports Meet needs student volunteers for scorekeeping and logistics next month. Participants receive service certificates. Sign up with your class teacher by Friday.',
      now - 3 * H, { likeCount: 11, saveCount: 19, viewCount: 52 }),
  ]
}

function seedMedia(): Record<string, MediaItem[]> {
  const now = new Date().toISOString()
  return {
    'post-science-diagram-01': [{
      id: 'media-01', postId: 'post-science-diagram-01', type: 'image',
      url: SCIENCE_DIAGRAM, mimeType: 'image/svg+xml', sizeBytes: 1400,
      width: 800, height: 420, createdAt: now,
    }],
    'post-math-poster-01': [{
      id: 'media-02', postId: 'post-math-poster-01', type: 'image',
      url: MATH_POSTER, mimeType: 'image/svg+xml', sizeBytes: 1100,
      width: 800, height: 420, createdAt: now,
    }],
    'post-video-lesson-01': [{
      id: 'media-03', postId: 'post-video-lesson-01', type: 'video',
      url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      mimeType: 'video/mp4', sizeBytes: 0, durationSeconds: 24, createdAt: now,
    }],
  }
}

function seedInteractions(): { likes: CommunityLike[], saves: CommunitySave[], views: CommunityView[] } {
  const t = (hoursAgo: number) => new Date(Date.now() - hoursAgo * H).toISOString()
  return {
    likes: [
      { userId: 'u-thapa', postId: 'post-welcome-01', createdAt: t(100) },
      { userId: 'u-karki', postId: 'post-welcome-01', createdAt: t(90) },
      { userId: 'u-thapa', postId: 'post-exam-notice-01', createdAt: t(80) },
      { userId: 'u-karki', postId: 'post-exam-notice-01', createdAt: t(70) },
      { userId: 'u-thapa', postId: 'post-science-diagram-01', createdAt: t(30) },
      { userId: 'u-gurung', postId: 'post-science-diagram-01', createdAt: t(28) },
      { userId: 'u-thapa', postId: 'post-video-lesson-01', createdAt: t(12) },
      { userId: 'u-karki', postId: 'post-math-homework-01', createdAt: t(10) },
      { userId: 'u-thapa', postId: 'post-math-poster-01', createdAt: t(8) },
      { userId: 'u-karki', postId: 'post-volunteer-01', createdAt: t(2) },
    ],
    saves: [
      { userId: 'u-thapa', postId: 'post-exam-notice-01', createdAt: t(79) },
      { userId: 'u-thapa', postId: 'post-science-diagram-01', createdAt: t(29) },
      { userId: 'u-karki', postId: 'post-science-diagram-01', createdAt: t(26) },
      { userId: 'u-thapa', postId: 'post-video-lesson-01', createdAt: t(11) },
      { userId: 'u-karki', postId: 'post-math-homework-01', createdAt: t(9) },
    ],
    views: [
      { userId: 'u-thapa', postId: 'post-welcome-01', createdAt: t(100) },
      { userId: 'u-thapa', postId: 'post-exam-notice-01', createdAt: t(80) },
      { userId: 'u-thapa', postId: 'post-science-diagram-01', createdAt: t(30) },
      { userId: 'u-karki', postId: 'post-science-diagram-01', createdAt: t(27) },
      { userId: 'u-thapa', postId: 'post-video-lesson-01', createdAt: t(12) },
      { userId: 'u-karki', postId: 'post-video-lesson-01', createdAt: t(6) },
      { userId: 'u-thapa', postId: 'post-math-homework-01', createdAt: t(10) },
    ],
  }
}

function seedReports(): ReportRecord[] {
  return [
    {
      id: 'rep-seed-01', reporterId: 'u-karki', targetType: 'post', targetId: 'post-video-lesson-01',
      reason: 'Misleading information',
      details: 'I think this video might be about a different topic than what the post says?',
      status: 'open', createdAt: new Date(Date.now() - 5 * H).toISOString(),
    },
    {
      id: 'rep-seed-02', reporterId: 'u-thapa', targetType: 'post', targetId: 'post-library-01',
      reason: 'Spam', details: '',
      status: 'dismissed', reviewedBy: 'u-admin-office',
      reviewedAt: new Date(Date.now() - 4 * H).toISOString(),
      createdAt: new Date(Date.now() - 7 * H).toISOString(),
    },
  ]
}

function seedNotifications(): NotificationItem[] {
  const t = (hoursAgo: number) => new Date(Date.now() - hoursAgo * H).toISOString()
  return [
    {
      id: 'ntf-01', userId: 'u-thapa', type: 'announcement',
      title: 'New important announcement',
      body: 'School Administration posted the Term 2 examination schedule.',
      referenceType: 'post', referenceId: 'post-exam-notice-01',
      isRead: false, createdAt: t(5 * D / H),
    },
    {
      id: 'ntf-02', userId: 'u-thapa', type: 'like', title: 'New engagement',
      body: 'Your activity received new attention: 3 students liked posts you interacted with.',
      referenceType: 'post', referenceId: 'post-science-diagram-01',
      isRead: false, createdAt: t(20),
    },
    {
      id: 'ntf-03', userId: 'u-sharma', type: 'like', title: 'Students liked your post',
      body: '12 students liked "Water-cycle revision diagram".',
      referenceType: 'post', referenceId: 'post-science-diagram-01',
      isRead: false, createdAt: t(18),
    },
    {
      id: 'ntf-04', userId: 'u-rai', type: 'verification',
      title: 'Verification request received',
      body: 'Your teacher verification request is awaiting administrator review.',
      referenceType: 'verification', referenceId: 'ver-rai-01',
      isRead: true, createdAt: t(48),
    },
  ]
}

function seedAudit(): AuditEntry[] {
  const t = (hoursAgo: number) => new Date(Date.now() - hoursAgo * H).toISOString()
  return [
    {
      id: 'aud-01', actorId: 'u-admin-office', action: 'teacher_verified',
      targetType: 'user', targetId: 'u-sharma',
      metadata: 'Approved science teacher publishing access',
      createdAt: t(200),
    },
    {
      id: 'aud-02', actorId: 'u-admin-office', action: 'teacher_verified',
      targetType: 'user', targetId: 'u-gurung',
      metadata: 'Approved mathematics teacher publishing access',
      createdAt: t(190),
    },
    {
      id: 'aud-03', actorId: 'u-admin-office', action: 'report_dismissed',
      targetType: 'report', targetId: 'rep-seed-02',
      metadata: 'Dismissed — library notice is genuine',
      createdAt: t(4),
    },
  ]
}

function seedVerificationRequests(): VerificationRequest[] {
  return [
    {
      id: 'ver-rai-01', userEmail: 'teacher.rai@edufit-test.edu.np', userName: 'Ms. Sunita Rai',
      subject: 'English', status: 'pending',
      reason: 'Teaching English literature at this school since 2023.',
      requestedAt: new Date(Date.now() - 48 * H).toISOString(),
    },
  ]
}

function seedConversations(): { conversations: Conversation[], messages: DirectMessage[] } {
  const t = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60_000).toISOString()
  return {
    conversations: [
      {
        id: 'con-01', participantIds: ['u-thapa', 'u-sharma'],
        lastMessageAt: t(35),
      },
      {
        id: 'con-02', participantIds: ['u-karki', 'u-gurung'],
        lastMessageAt: t(300),
      },
    ],
    messages: [
      {
        id: 'msg-01', conversationId: 'con-01', senderId: 'u-thapa',
        body: 'Namaste ma\'am! Could you re-share the page number for the water cycle summary questions?',
        createdAt: t(40), readBy: ['u-thapa'],
      },
      {
        id: 'msg-02', conversationId: 'con-01', senderId: 'u-sharma',
        body: 'Namaste Aarav! Page 134, questions 3 to 7. The diagram I posted today covers exactly those.',
        createdAt: t(35), readBy: ['u-thapa', 'u-sharma'],
      },
      {
        id: 'msg-03', conversationId: 'con-02', senderId: 'u-karki',
        body: 'Sir, is Math Club suitable for someone who has never done olympiad problems?',
        createdAt: t(305), readBy: ['u-karki'],
      },
      {
        id: 'msg-04', conversationId: 'con-02', senderId: 'u-gurung',
        body: 'Absolutely Sneha — we start with warm-up puzzles every session. Come this Saturday and see how it feels.',
        createdAt: t(300), readBy: ['u-karki', 'u-gurung'],
      },
    ],
  }
}

// ---------------------------------------------------------------
// Store (localStorage-backed, seeded on first load)
// ---------------------------------------------------------------

export interface CommunityData {
  users: CommunityUser[]
  posts: CommunityPost[]
  media: Record<string, MediaItem[]>
  likes: CommunityLike[]
  saves: CommunitySave[]
  views: CommunityView[]
  reports: ReportRecord[]
  notifications: NotificationItem[]
  auditLogs: AuditEntry[]
  verificationRequests: VerificationRequest[]
  conversations: Conversation[]
  messages: DirectMessage[]
}

export interface CommunityLike { userId: string, postId: string, createdAt: string }
export interface CommunitySave { userId: string, postId: string, createdAt: string }
export interface CommunityView { userId: string, postId: string, createdAt: string }

const STORAGE_KEY = 'edufit_community_v1'

export function loadCommunityData(): CommunityData {
  if (typeof window === 'undefined') {
    throw new Error('loadCommunityData requires a browser environment')
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as CommunityData
  } catch (e) {
    console.error('Failed to parse community data, reseeding:', e)
  }
  return reseed()
}

function reseed(): CommunityData {
  const fresh: CommunityData = {
    users: seedUsers(),
    posts: seedPosts(),
    media: seedMedia(),
    ...seedInteractions(),
    reports: seedReports(),
    notifications: seedNotifications(),
    auditLogs: seedAudit(),
    verificationRequests: seedVerificationRequests(),
    ...seedConversations(),
  }
  if (typeof window !== 'undefined') saveCommunityData(fresh)
  return fresh
}

/** Read-only snapshot for server contexts (API routes, SSR). */
export function getSeedCommunityData(): CommunityData {
  return reseed()
}

export function saveCommunityData(data: CommunityData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to persist community data:', e)
  }
}

export function resetCommunityData(): CommunityData {
  localStorage.removeItem(STORAGE_KEY)
  return loadCommunityData()
}

// ---------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------

export function getUserById(data: CommunityData, id: string): CommunityUser | undefined {
  return data.users.find((u) => u.id === id)
}

export function getUserByEmail(data: CommunityData, email: string): CommunityUser | undefined {
  return data.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
}

/** Spec §7.2 ordering: pinned announcements first, then newest. */
export function getFeedPosts(
  data: CommunityData,
  opts: { includeHiddenForAdmin?: boolean } = {}
): CommunityPost[] {
  const visible = data.posts.filter((p) => {
    if (p.status === 'published') return true
    return Boolean(opts.includeHiddenForAdmin && p.status === 'hidden')
  })
  return visible.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return b.createdAt.localeCompare(a.createdAt)
  })
}

export function hasLiked(data: CommunityData, userId: string, postId: string): boolean {
  return data.likes.some((l) => l.userId === userId && l.postId === postId)
}

export function hasSaved(data: CommunityData, userId: string, postId: string): boolean {
  return data.saves.some((s) => s.userId === userId && s.postId === postId)
}

export function hasViewed(data: CommunityData, userId: string, postId: string): boolean {
  return data.views.some((v) => v.userId === userId && v.postId === postId)
}

/** Spec §13.1 — unique constraint simulated: toggling never duplicates. */
export function toggleLike(data: CommunityData, userId: string, postId: string): CommunityData {
  const existing = data.likes.findIndex((l) => l.userId === userId && l.postId === postId)
  const posts = [...data.posts]
  const idx = posts.findIndex((p) => p.id === postId)
  if (idx === -1) return data

  if (existing >= 0) {
    data.likes.splice(existing, 1)
    posts[idx] = { ...posts[idx], likeCount: Math.max(0, posts[idx].likeCount - 1) }
  } else {
    data.likes.push({ userId, postId, createdAt: new Date().toISOString() })
    posts[idx] = { ...posts[idx], likeCount: posts[idx].likeCount + 1 }
  }
  return { ...data, likes: [...data.likes], posts }
}

/** Spec §14.1 — save once, unsave on repeat. */
export function toggleSave(data: CommunityData, userId: string, postId: string): CommunityData {
  const existing = data.saves.findIndex((s) => s.userId === userId && s.postId === postId)
  const posts = [...data.posts]
  const idx = posts.findIndex((p) => p.id === postId)
  if (idx === -1) return data

  if (existing >= 0) {
    data.saves.splice(existing, 1)
    posts[idx] = { ...posts[idx], saveCount: Math.max(0, posts[idx].saveCount - 1) }
  } else {
    data.saves.push({ userId, postId, createdAt: new Date().toISOString() })
    posts[idx] = { ...posts[idx], saveCount: posts[idx].saveCount + 1 }
  }
  return { ...data, saves: [...data.saves], posts }
}

/** Spec §25 — count a view once per user per post. */
export function recordView(data: CommunityData, userId: string, postId: string): CommunityData {
  if (hasViewed(data, userId, postId)) return data
  const posts = [...data.posts]
  const idx = posts.findIndex((p) => p.id === postId)
  if (idx === -1) return data
  posts[idx] = { ...posts[idx], viewCount: posts[idx].viewCount + 1 }
  return {
    ...data,
    views: [...data.views, { userId, postId, createdAt: new Date().toISOString() }],
    posts,
  }
}

export function getSavedPosts(data: CommunityData, userId: string): CommunityPost[] {
  const ids = new Set(data.saves.filter((s) => s.userId === userId).map((s) => s.postId))
  return data.posts
    .filter((p) => ids.has(p.id) && p.status === 'published')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getConversationsFor(data: CommunityData, userId: string): Array<{
  conversation: Conversation
  partner: CommunityUser
  lastMessage?: DirectMessage
  unreadCount: number
}> {
  return data.conversations
    .filter((c) => c.participantIds.includes(userId))
    .map((conversation) => {
      const partnerId = conversation.participantIds.find((p) => p !== userId) ?? ''
      const msgs = data.messages
        .filter((m) => m.conversationId === conversation.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      const partner = getUserById(data, partnerId) ?? {
        id: partnerId, name: 'Unknown member', email: '', role: 'student' as CommunityRole,
        verificationStatus: 'not_applicable', subject: '', initialsColor: '#94A3B8',
      }
      return {
        conversation,
        partner,
        lastMessage: msgs[0],
        unreadCount: msgs.filter(
          (m) => m.senderId !== userId && !m.readBy.includes(userId)
        ).length,
      }
    })
    .sort((a, b) => b.conversation.lastMessageAt.localeCompare(a.conversation.lastMessageAt))
}

export function getMessagesFor(data: CommunityData, conversationId: string): DirectMessage[] {
  return data.messages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

/** Staff directory a given user is allowed to start conversations with. */
export function getDmDirectory(data: CommunityData, user: CommunityUser): CommunityUser[] {
  return data.users.filter((candidate) => canDirectMessage(user, candidate))
}

export function getNotificationsFor(data: CommunityData, userId: string): NotificationItem[] {
  return data.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getOpenReports(data: CommunityData): ReportRecord[] {
  return data.reports
    .filter((r) => r.status === 'open' || r.status === 'under_review')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
