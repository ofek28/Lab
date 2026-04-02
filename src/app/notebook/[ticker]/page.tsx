import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { NoteEditor } from '@/components/notebook/NoteEditor'
import { NoteHistory } from '@/components/notebook/NoteHistory'
import { RATING_LABELS, RATING_COLORS } from '@/types/notebook'
import type { NoteWithHistory } from '@/types/notebook'
import { cn, formatCurrency } from '@/lib/utils'
import { BarChart2, Clock, ArrowLeft, Target } from 'lucide-react'
import { format } from 'date-fns'

interface Props {
  params: { ticker: string }
}

async function getNoteWithHistory(ticker: string): Promise<NoteWithHistory | null> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('notes')
      .select('*, note_versions(*)')
      .eq('ticker', ticker.toUpperCase())
      .order('created_at', { referencedTable: 'note_versions', ascending: false })
      .maybeSingle()

    if (error || !data) return null
    return data as NoteWithHistory
  } catch {
    return null
  }
}

export default async function NotebookTickerPage({ params }: Props) {
  const ticker = params.ticker.toUpperCase()
  const note = await getNoteWithHistory(ticker)

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Back */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/notebook"
          className="flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Notebook
        </Link>
        <span className="text-slate-300">/</span>
        <span className="font-mono text-sm font-semibold text-blue-600">{ticker}</span>
      </div>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {note?.company_name ?? ticker}
          </h1>
          <div className="mt-1 flex items-center gap-3">
            <span className="font-mono text-base font-semibold text-blue-600">{ticker}</span>
            {note?.rating && (
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  RATING_COLORS[note.rating]
                )}
              >
                {RATING_LABELS[note.rating]}
              </span>
            )}
            {note?.target_price && (
              <span className="flex items-center gap-1 text-sm text-slate-500">
                <Target className="h-3.5 w-3.5" />
                Target: {formatCurrency(note.target_price)}
              </span>
            )}
            {note?.updated_at && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3 w-3" />
                Updated {format(new Date(note.updated_at), 'MMM d, yyyy')}
              </span>
            )}
          </div>
        </div>

        <Link
          href={`/analyze/${ticker}`}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
        >
          <BarChart2 className="h-4 w-4" />
          View Analysis
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main editor */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-sm font-semibold text-slate-700">
              {note ? 'Edit Note' : 'Create Note'}
            </h2>
            <NoteEditor
              ticker={ticker}
              companyName={note?.company_name ?? undefined}
              existingNote={note}
            />
          </div>
        </div>

        {/* History sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">
              Edit History
              {note?.note_versions && note.note_versions.length > 0 && (
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  {note.note_versions.length}
                </span>
              )}
            </h2>
            <NoteHistory versions={note?.note_versions ?? []} />
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  return {
    title: `${params.ticker.toUpperCase()} Notebook | StockAnalyst`,
  }
}
