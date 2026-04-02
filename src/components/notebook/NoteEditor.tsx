'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Note, NoteFormData, Rating } from '@/types/notebook'
import { RATING_LABELS, RATING_COLORS } from '@/types/notebook'
import { cn } from '@/lib/utils'
import { Save, Loader2 } from 'lucide-react'

interface Props {
  ticker: string
  companyName?: string
  existingNote?: Note | null
}

const RATINGS: Rating[] = ['strong_buy', 'buy', 'hold', 'sell', 'strong_sell']

export function NoteEditor({ ticker, companyName, existingNote }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [thesis, setThesis] = useState(existingNote?.thesis ?? '')
  const [risks, setRisks] = useState(existingNote?.risks ?? '')
  const [targetPrice, setTargetPrice] = useState(
    existingNote?.target_price?.toString() ?? ''
  )
  const [conviction, setConviction] = useState<number>(existingNote?.conviction ?? 3)
  const [rating, setRating] = useState<Rating | ''>(existingNote?.rating ?? '')

  async function save() {
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const payload: NoteFormData = {
        ticker: ticker.toUpperCase(),
        company_name: companyName,
        thesis: thesis || undefined,
        risks: risks || undefined,
        target_price: targetPrice ? parseFloat(targetPrice) : null,
        conviction: conviction || null,
        rating: (rating as Rating) || null,
      }

      const method = existingNote ? 'PUT' : 'POST'
      const url = existingNote
        ? `/api/notebook/${existingNote.id}`
        : '/api/notebook'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to save')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Rating & Conviction */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Rating
          </label>
          <div className="flex flex-wrap gap-1.5">
            {RATINGS.map((r) => (
              <button
                key={r}
                onClick={() => setRating(rating === r ? '' : r)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold transition',
                  rating === r
                    ? RATING_COLORS[r]
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                )}
              >
                {RATING_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Conviction (1–5)
          </label>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setConviction(n)}
                className={cn(
                  'h-9 w-9 rounded-full text-sm font-bold transition',
                  conviction === n
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Target price */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
          Price Target ($)
        </label>
        <input
          type="number"
          step="0.01"
          value={targetPrice}
          onChange={(e) => setTargetPrice(e.target.value)}
          placeholder="e.g. 210.00"
          className="w-48 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Thesis */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
          Investment Thesis (Bull Case)
        </label>
        <textarea
          value={thesis}
          onChange={(e) => setThesis(e.target.value)}
          rows={6}
          placeholder="Why do you believe in this investment? What are the key growth drivers, competitive advantages, and catalysts that will drive the stock higher?"
          className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm leading-relaxed outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Risks */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
          Key Risks (Bear Case)
        </label>
        <textarea
          value={risks}
          onChange={(e) => setRisks(e.target.value)}
          rows={4}
          placeholder="What could go wrong? What assumptions could prove false? What would make you exit the position?"
          className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm leading-relaxed outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Save button */}
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
      )}

      {saved && (
        <div className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-600">
          Note saved successfully.
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? 'Saving...' : existingNote ? 'Update Note' : 'Save Note'}
      </button>
    </div>
  )
}
