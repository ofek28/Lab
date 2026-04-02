import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { NoteFormData } from '@/types/notebook'

// GET /api/notebook — list all notes
export async function GET() {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/notebook — create a new note (or upsert by ticker)
export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const body = (await request.json()) as NoteFormData

    if (!body.ticker) {
      return NextResponse.json({ error: 'ticker is required' }, { status: 400 })
    }

    // Upsert: if a note for this ticker already exists, update it
    const { data, error } = await supabase
      .from('notes')
      .upsert(
        {
          ticker: body.ticker.toUpperCase(),
          company_name: body.company_name ?? null,
          thesis: body.thesis ?? null,
          risks: body.risks ?? null,
          target_price: body.target_price ?? null,
          conviction: body.conviction ?? null,
          rating: body.rating ?? null,
        },
        { onConflict: 'ticker' }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid request' },
      { status: 400 }
    )
  }
}
