import Link from 'next/link'
import type { Note } from '@/types/notebook'
import { RATING_LABELS, RATING_COLORS } from '@/types/notebook'
import { cn, formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { BookOpen, Target, Clock } from 'lucide-react'

interface Props {
  note: Note
}

const CONVICTION_LABELS = ['', 'Low', 'Below Avg', 'Average', 'Above Avg', 'High']

export function NoteCard({ note }: Props) {
  return (
    <Link
      href={`/notebook/${note.ticker}`}
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="font-mono text-lg font-bold text-blue-600">{note.ticker}</div>
          {note.company_name && (
            <div className="text-sm text-slate-500">{note.company_name}</div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {note.rating && (
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                RATING_COLORS[note.rating]
              )}
            >
              {RATING_LABELS[note.rating]}
            </span>
          )}
          {note.conviction && (
            <span className="text-xs text-slate-400">
              Conviction: {CONVICTION_LABELS[note.conviction]}
            </span>
          )}
        </div>
      </div>

      {/* Thesis preview */}
      {note.thesis && (
        <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-slate-600">
          {note.thesis}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-4 text-xs text-slate-400">
        {note.target_price && (
          <span className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            {formatCurrency(note.target_price)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {format(new Date(note.updated_at), 'MMM d, yyyy')}
        </span>
        <span className="ml-auto flex items-center gap-1 text-blue-500">
          <BookOpen className="h-3 w-3" />
          View note
        </span>
      </div>
    </Link>
  )
}
