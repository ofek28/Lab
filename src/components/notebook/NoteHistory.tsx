import type { NoteVersion } from '@/types/notebook'
import { RATING_LABELS, RATING_COLORS } from '@/types/notebook'
import { cn, formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { Clock } from 'lucide-react'

interface Props {
  versions: NoteVersion[]
}

export function NoteHistory({ versions }: Props) {
  if (versions.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-slate-400">
        No edit history yet. History is saved automatically when you update a note.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {versions.map((v, i) => (
        <div
          key={v.id}
          className="relative pl-6 before:absolute before:left-2 before:top-0 before:h-full before:w-px before:bg-slate-200"
        >
          {/* Timeline dot */}
          <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-blue-400 bg-white" />

          {/* Version card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              {format(new Date(v.created_at), 'MMM d, yyyy — HH:mm')}
              {i === 0 && (
                <span className="ml-1 rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-600">
                  Previous version
                </span>
              )}
            </div>

            <div className="space-y-2">
              {v.rating && (
                <span
                  className={cn(
                    'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    RATING_COLORS[v.rating]
                  )}
                >
                  {RATING_LABELS[v.rating]}
                </span>
              )}

              {v.target_price && (
                <div className="text-xs text-slate-500">
                  Target: <span className="font-medium">{formatCurrency(v.target_price)}</span>
                </div>
              )}

              {v.thesis && (
                <div>
                  <div className="mb-0.5 text-xs font-semibold text-slate-400">Thesis</div>
                  <p className="line-clamp-4 text-sm text-slate-600">{v.thesis}</p>
                </div>
              )}

              {v.risks && (
                <div>
                  <div className="mb-0.5 text-xs font-semibold text-slate-400">Risks</div>
                  <p className="line-clamp-3 text-sm text-slate-600">{v.risks}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
