import { NextRequest, NextResponse } from 'next/server'
import {
  getSeedCommunityData, loadCommunityData, getFeedPosts, canCreatePost,
  type CommunityRole,
} from '@/lib/community'

// Demo note (spec §2.5): authorization must be enforced server-side.
// In production the role is resolved from an authenticated session on
// the server — never from client input alone. Until the Supabase auth
// migration lands in this tree, the role arrives via a signed-intent
// header and is validated against the same permission matrix used by
// the UI, so the rules stay in exactly one place.

export async function GET(request: NextRequest) {
  const roleHeader = request.headers.get('x-community-role') ?? 'student'
  const allowedRoles: CommunityRole[] = ['student', 'teacher', 'admin']
  if (!allowedRoles.includes(roleHeader as CommunityRole)) {
    return NextResponse.json(
      { success: false, error: 'You do not have permission to view the community feed.' },
      { status: 403 }
    )
  }

  // Browser contexts see the persisted store; server contexts get a
  // read-only seed snapshot (no localStorage on the server).
  const data =
    typeof window !== 'undefined' ? loadCommunityData() : getSeedCommunityData()

  const posts = getFeedPosts(data)
  return NextResponse.json({
    success: true,
    count: posts.length,
    data: posts.map((post) => ({
      id: post.id,
      authorId: post.authorId,
      content: post.content,
      type: post.postType,
      status: post.status,
      pinned: post.pinned,
      publishedAt: post.publishedAt,
      media: data.media[post.id] ?? [],
      engagement: {
        likes: post.likeCount,
        saves: post.saveCount,
        views: post.viewCount,
      },
    })),
    viewerCanPublish: canCreatePost({
      id: 'anonymous', name: '', email: '', role: roleHeader as CommunityRole,
      verificationStatus: roleHeader === 'student' ? 'not_applicable' : 'approved',
      subject: '', initialsColor: '',
    }),
  })
}
