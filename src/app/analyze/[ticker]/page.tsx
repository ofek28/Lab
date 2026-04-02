import Link from 'next/link'
import { fetchQuote, fetchFinancials, fetchHistorical } from '@/lib/yahoo/client'
import { QuoteHeader } from '@/components/analysis/QuoteHeader'
import { PriceChart } from '@/components/analysis/PriceChart'
import { FundamentalsCard } from '@/components/analysis/FundamentalsCard'
import { AgentReport } from '@/components/analysis/AgentReport'
import { TickerSearch } from '@/components/analysis/TickerSearch'
import { BookOpen, ExternalLink } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import type { CompositeReport } from '@/lib/agents/types'

interface Props {
  params: { ticker: string }
}

async function getNote(ticker: string) {
  try {
    const supabase = createServerClient()
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('ticker', ticker.toUpperCase())
      .single()
    return data
  } catch {
    return null
  }
}

async function getCachedReport(ticker: string): Promise<CompositeReport | null> {
  try {
    const supabase = createServerClient()
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('agent_reports')
      .select('content')
      .eq('ticker', ticker.toUpperCase())
      .eq('report_type', 'composite')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    return data?.content as CompositeReport ?? null
  } catch {
    return null
  }
}

export default async function StockPage({ params }: Props) {
  const ticker = params.ticker.toUpperCase()

  // Fetch all data in parallel
  const [quoteResult, financialsResult, historicalResult, existingNote, cachedReport] =
    await Promise.allSettled([
      fetchQuote(ticker),
      fetchFinancials(ticker),
      fetchHistorical(ticker, '6mo'),
      getNote(ticker),
      getCachedReport(ticker),
    ])

  if (quoteResult.status === 'rejected') {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <div className="mb-3 text-4xl">⚠️</div>
        <h1 className="mb-2 text-xl font-bold text-slate-800">Ticker not found: {ticker}</h1>
        <p className="mb-6 text-sm text-slate-500">
          Make sure the ticker symbol is correct and try again.
          Yahoo Finance may also be temporarily unavailable.
        </p>
        <a href="/analyze" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
          Back to search
        </a>
      </div>
    )
  }

  const quote = quoteResult.value
  const financials = financialsResult.status === 'fulfilled' ? financialsResult.value : null
  const historical = historicalResult.status === 'fulfilled' ? historicalResult.value : []
  const note = existingNote.status === 'fulfilled' ? existingNote.value : null
  const report = cachedReport.status === 'fulfilled' ? cachedReport.value : null

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Top bar */}
      <div className="mb-6 flex items-center gap-4">
        <TickerSearch className="max-w-xs" placeholder="Search another ticker..." />
        <Link
          href={`/notebook/${ticker}`}
          className="ml-auto flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
        >
          <BookOpen className="h-4 w-4" />
          {note ? 'View Notebook' : 'Add to Notebook'}
        </Link>
      </div>

      {/* Quote header */}
      <div className="mb-5">
        <QuoteHeader quote={quote} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Left column: chart + fundamentals */}
        <div className="space-y-5 xl:col-span-2">
          {/* Price chart */}
          {historical.length > 0 ? (
            <PriceChart data={historical} currentPrice={quote.price} />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-400">
              Price chart unavailable
            </div>
          )}

          {/* Financial metrics */}
          {financials ? (
            <FundamentalsCard financials={financials} ticker={ticker} />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-400">
              Financial data unavailable
            </div>
          )}
        </div>

        {/* Right column: AI analysis */}
        <div className="xl:col-span-1">
          <AgentReport ticker={ticker} initialReport={report} />
        </div>
      </div>

      {/* Yahoo Finance link */}
      <div className="mt-6 text-center text-xs text-slate-400">
        Data from Yahoo Finance ·{' '}
        <a
          href={`https://finance.yahoo.com/quote/${ticker}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:text-blue-500"
        >
          View on Yahoo Finance <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const ticker = params.ticker.toUpperCase()
  return {
    title: `${ticker} — Stock Analysis | StockAnalyst`,
  }
}
