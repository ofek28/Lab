import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { NoteFormData } from '@/types/notebook'

// GET /api/notebook/[id] — get note with full history
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('notes')
    .select('*, note_versions(*)')
    .eq('id', params.id)
    .order('created_at', { referencedTable: 'note_versions', ascending: false })
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json(data)
}

// PUT /api/notebook/[id] — update a note (DB trigger auto-saves version)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient()

  try {
    const body = (await request.json()) as Partial<NoteFormData>

    const updatePayload: Record<string, unknown> = {}
    if (body.thesis !== undefined) updatePayload.thesis = body.thesis
    if (body.risks !== undefined) updatePayload.risks = body.risks
    if (body.target_price !== undefined) updatePayload.target_price = body.target_price
    if (body.conviction !== undefined) updatePayload.conviction = body.conviction
    if (body.rating !== undefined) updatePayload.rating = body.rating
    if (body.company_name !== undefined) updatePayload.company_name = body.company_name

    const { data, error } = await supabase
      .from('notes')
      .update(updatePayload)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid request' },
      { status: 400 }
    )
  }
}

// DELETE /api/notebook/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient()

  const { error } = await supabase.from('notes').delete().eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
