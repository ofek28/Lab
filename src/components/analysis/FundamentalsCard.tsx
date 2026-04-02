import type { FinancialData } from '@/types/stock'
import {
  formatMultiple,
  formatPercent,
  formatCurrency,
  colorForChange,
} from '@/lib/utils'

interface Props {
  financials: FinancialData
  ticker: string
}

interface MetricRow {
  label: string
  value: string
  tooltip?: string
}

function Section({ title, metrics }: { title: string; metrics: MetricRow[] }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </h3>
      <div className="space-y-1">
        {metrics.map(({ label, value }) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-slate-500">{label}</span>
            <span className="font-medium text-slate-800">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FundamentalsCard({ financials }: Props) {
  const m = financials.metrics

  const valuation: MetricRow[] = [
    { label: 'P/E (Trailing)', value: formatMultiple(m.trailingPE) },
    { label: 'P/E (Forward)', value: formatMultiple(m.forwardPE) },
    { label: 'P/B', value: formatMultiple(m.priceToBook) },
    { label: 'P/S', value: formatMultiple(m.priceToSales) },
    { label: 'PEG Ratio', value: formatMultiple(m.pegRatio) },
    { label: 'EV/EBITDA', value: formatMultiple(m.enterpriseToEbitda) },
  ]

  const profitability: MetricRow[] = [
    { label: 'Gross Margin', value: formatPercent(m.grossMargins, { multiply: true }) },
    { label: 'Operating Margin', value: formatPercent(m.operatingMargins, { multiply: true }) },
    { label: 'Net Margin', value: formatPercent(m.profitMargins, { multiply: true }) },
    { label: 'ROE', value: formatPercent(m.returnOnEquity, { multiply: true }) },
    { label: 'ROA', value: formatPercent(m.returnOnAssets, { multiply: true }) },
  ]

  const growth: MetricRow[] = [
    { label: 'Revenue Growth', value: formatPercent(m.revenueGrowth, { multiply: true }) },
    { label: 'Earnings Growth', value: formatPercent(m.earningsGrowth, { multiply: true }) },
    { label: 'EPS (TTM)', value: formatCurrency(m.trailingEps) },
    { label: 'EPS (Forward)', value: formatCurrency(m.forwardEps) },
  ]

  const balanceSheet: MetricRow[] = [
    { label: 'Total Cash', value: formatCurrency(m.totalCash, { compact: true }) },
    { label: 'Total Debt', value: formatCurrency(m.totalDebt, { compact: true }) },
    { label: 'D/E Ratio', value: formatMultiple(m.debtToEquity) },
    { label: 'Current Ratio', value: formatMultiple(m.currentRatio) },
    { label: 'Free Cash Flow', value: formatCurrency(m.freeCashflow, { compact: true }) },
  ]

  const other: MetricRow[] = [
    { label: 'Beta', value: formatMultiple(m.beta) },
    { label: 'Dividend Yield', value: formatPercent(m.dividendYield, { multiply: true }) },
    { label: '52W Change', value: formatPercent(m.fiftyTwoWeekChange, { multiply: true }) },
    { label: 'Short Ratio', value: formatMultiple(m.shortRatio) },
  ]

  const analystConsensus = m.recommendationKey
    ? m.recommendationKey.replace(/_/g, ' ').toUpperCase()
    : 'N/A'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Financial Metrics</h2>
        {m.recommendationKey && (
          <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Analyst: {analystConsensus}
            {m.numberOfAnalystOpinions ? ` (${m.numberOfAnalystOpinions})` : ''}
          </div>
        )}
      </div>

      {/* Analyst target */}
      {m.targetMeanPrice && (
        <div className="mb-5 rounded-xl bg-slate-50 px-4 py-3">
          <div className="text-xs text-slate-500">Analyst Price Target</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">
              {formatCurrency(m.targetMeanPrice)}
            </span>
            <span className="text-xs text-slate-400">
              Range: {formatCurrency(m.targetLowPrice)} – {formatCurrency(m.targetHighPrice)}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <Section title="Valuation" metrics={valuation} />
        <Section title="Profitability" metrics={profitability} />
        <Section title="Growth & EPS" metrics={growth} />
        <Section title="Balance Sheet" metrics={balanceSheet} />
        <Section title="Other" metrics={other} />

        {/* Income history */}
        {financials.incomeHistory.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Revenue History
            </h3>
            <div className="space-y-1">
              {financials.incomeHistory.slice(0, 4).map((row) => (
                <div key={row.date} className="flex justify-between text-sm">
                  <span className="text-slate-500">{row.date}</span>
                  <span className="font-medium text-slate-800">
                    {formatCurrency(row.totalRevenue, { compact: true })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
