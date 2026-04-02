'use client'

import { useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import type { PriceBar } from '@/types/stock'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Props {
  data: PriceBar[]
  currentPrice: number
}

const PERIODS = ['1mo', '3mo', '6mo', '1y', '2y'] as const
type Period = (typeof PERIODS)[number]

const PERIOD_LABELS: Record<Period, string> = {
  '1mo': '1M',
  '3mo': '3M',
  '6mo': '6M',
  '1y': '1Y',
  '2y': '2Y',
}

export function PriceChart({ data, currentPrice }: Props) {
  const [period, setPeriod] = useState<Period>('6mo')
  const [chartData, setChartData] = useState<PriceBar[]>(data)
  const [loading, setLoading] = useState(false)

  const ticker = data.length > 0 ? '' : ''

  async function changePeriod(p: Period) {
    if (p === period) return
    setPeriod(p)
    setLoading(true)
    // We'll handle period changes via a prop — just filter for now
    // In a real implementation, refetch via API
    setLoading(false)
  }

  const firstPrice = chartData[0]?.close ?? currentPrice
  const isPositive = currentPrice >= firstPrice
  const strokeColor = isPositive ? '#10b981' : '#ef4444'
  const fillColor = isPositive ? '#d1fae5' : '#fee2e2'

  const minPrice = Math.min(...chartData.map((b) => b.close)) * 0.98
  const maxPrice = Math.max(...chartData.map((b) => b.close)) * 1.02

  const formatXAxis = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean
    payload?: Array<{ value: number }>
    label?: string
  }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
        <div className="text-xs text-slate-500">
          {label ? new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
        </div>
        <div className="text-sm font-bold text-slate-900">{formatCurrency(payload[0].value)}</div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Price History</h2>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => changePeriod(p)}
              className={cn(
                'rounded px-2.5 py-1 text-xs font-medium transition',
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-400">
          Loading...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.2} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minPrice, maxPrice]}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={firstPrice}
              stroke="#cbd5e1"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={strokeColor}
              strokeWidth={2}
              fill="url(#priceGradient)"
              dot={false}
              activeDot={{ r: 4, fill: strokeColor }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
