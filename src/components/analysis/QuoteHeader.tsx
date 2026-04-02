import type { StockQuote } from '@/types/stock'
import { formatCurrency, formatNumber, colorForChange } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Props {
  quote: StockQuote
}

export function QuoteHeader({ quote }: Props) {
  const changeColor = colorForChange(quote.changePercent)
  const Icon =
    quote.changePercent > 0 ? TrendingUp : quote.changePercent < 0 ? TrendingDown : Minus

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Company name & exchange */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{quote.longName}</h1>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono text-lg font-semibold text-blue-600">{quote.ticker}</span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              {quote.exchange}
            </span>
            <span className="text-xs text-slate-400">{quote.currency}</span>
          </div>
        </div>

        {/* Price */}
        <div className="text-right">
          <div className="text-3xl font-bold text-slate-900">
            {formatCurrency(quote.price, { decimals: 2 })}
          </div>
          <div className={cn('flex items-center justify-end gap-1 text-sm font-medium', changeColor)}>
            <Icon className="h-4 w-4" />
            <span>
              {formatCurrency(Math.abs(quote.change), { decimals: 2 })}{' '}
              ({quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Key stats grid */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 border-t border-slate-100 pt-4 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Market Cap" value={formatCurrency(quote.marketCap, { compact: true })} />
        <Stat label="Volume" value={formatNumber(quote.volume, { compact: true })} />
        <Stat label="Avg Volume" value={formatNumber(quote.avgVolume, { compact: true })} />
        <Stat label="Day Range" value={`${formatCurrency(quote.dayLow)} – ${formatCurrency(quote.dayHigh)}`} />
        <Stat label="52W High" value={formatCurrency(quote.fiftyTwoWeekHigh)} />
        <Stat label="52W Low" value={formatCurrency(quote.fiftyTwoWeekLow)} />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-sm font-semibold text-slate-800">{value}</div>
    </div>
  )
}
