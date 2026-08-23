import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

// ================================================================
// /api/events/saved — per-student saved event bookmarks
//
// GET    ?owner=<ownerKey>          -> string[] of saved event ids
// POST   { ownerKey, eventId }      -> save an event (idempotent)
// DELETE ?owner=<key>&eventId=<id>  -> remove a saved event
// ================================================================

export async function GET(request: NextRequest) {
  try {
    const owner = new URL(request.url).searchParams.get('owner')
    if (!owner) {
      return NextResponse.json({ success: false, error: 'Missing owner' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('student_saved_events')
      .select('event_id')
      .eq('owner_key', owner)

    if (error) throw error

    const ids = (data ?? []).map((row) => row.event_id)
    return NextResponse.json({ success: true, data: ids, count: ids.length })
  } catch (err) {
    console.error('[api/events/saved] GET failed:', err)
    return NextResponse.json({ success: false, error: 'Failed to load saved events' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body?.ownerKey || !body?.eventId) {
      return NextResponse.json({ success: false, error: 'Missing ownerKey or eventId' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    const { error } = await supabase
      .from('student_saved_events')
      .upsert(
        { owner_key: body.ownerKey, event_id: body.eventId },
        { onConflict: 'owner_key,event_id' }
      )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/events/saved] POST failed:', err)
    return NextResponse.json({ success: false, error: 'Failed to save event' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const params = new URL(request.url).searchParams
    const owner = params.get('owner')
    const eventId = params.get('eventId')
    if (!owner || !eventId) {
      return NextResponse.json({ success: false, error: 'Missing owner or eventId' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    const { error } = await supabase
      .from('student_saved_events')
      .delete()
      .eq('owner_key', owner)
      .eq('event_id', eventId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/events/saved] DELETE failed:', err)
    return NextResponse.json({ success: false, error: 'Failed to remove saved event' }, { status: 500 })
  }
}
