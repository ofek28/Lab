import { createServerClient } from '@/lib/supabase/server'
import { NoteCard } from '@/components/notebook/NoteCard'
import { TickerSearch } from '@/components/analysis/TickerSearch'
import { BookOpen, PlusCircle } from 'lucide-react'
import type { Note } from '@/types/notebook'

async function getNotes(): Promise<Note[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false })
    if (error) return []
    return data as Note[]
  } catch {
    return []
  }
}

export default async function NotebookPage() {
  const notes = await getNotes()

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Investment Notebook</h1>
          <p className="mt-1 text-sm text-slate-500">
            Your personal investment research journal.{' '}
            {notes.length > 0 ? `${notes.length} notes saved.` : 'Start by analyzing a stock.'}
          </p>
        </div>
        <TickerSearch className="w-64" placeholder="Add new ticker..." />
      </div>

      {/* Notes grid */}
      {notes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-20 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <h3 className="mb-1 font-semibold text-slate-600">No notes yet</h3>
          <p className="mb-4 text-sm text-slate-400">
            Search for a stock above or click "Add to Notebook" on any analysis page.
          </p>
          <a
            href="/analyze"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
          >
            <PlusCircle className="h-4 w-4" />
            Analyze a stock
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  )
}

export const metadata = {
  title: 'Investment Notebook | StockAnalyst',
}
