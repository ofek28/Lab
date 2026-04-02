'use client'

import { useState } from 'react'
import type { CompositeReport } from '@/lib/agents/types'
import { formatCurrency, colorForScore, bgForScore, cn } from '@/lib/utils'
import {
  Brain,
  BarChart2,
  Newspaper,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from 'lucide-react'

interface Props {
  ticker: string
  initialReport?: CompositeReport | null
}

const RECOMMENDATION_STYLES: Record<string, string> = {
  strong_buy: 'bg-emerald-500 text-white',
  buy: 'bg-green-500 text-white',
  hold: 'bg-yellow-500 text-white',
  sell: 'bg-orange-500 text-white',
  strong_sell: 'bg-red-500 text-white',
}

const RECOMMENDATION_LABELS: Record<string, string> = {
  strong_buy: 'Strong Buy',
  buy: 'Buy',
  hold: 'Hold',
  sell: 'Sell',
  strong_sell: 'Strong Sell',
}

const SIGNAL_STYLES: Record<string, string> = {
  positive: 'text-emerald-600',
  neutral: 'text-slate-500',
  negative: 'text-red-500',
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 7 ? '#10b981' : score >= 5 ? '#eab308' : '#ef4444'
  return (
    <div className="flex flex-col items-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full border-4 text-lg font-bold"
        style={{ borderColor: color, color }}
      >
        {score.toFixed(1)}
      </div>
      <div className="mt-1 text-xs text-slate-400">/ 10</div>
    </div>
  )
}

function CollapseSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl border border-slate-200">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Icon className="h-4 w-4 text-blue-500" />
          {title}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>
      {open && <div className="border-t border-slate-100 px-4 pb-4 pt-3">{children}</div>}
    </div>
  )
}

export function AgentReport({ ticker, initialReport }: Props) {
  const [report, setReport] = useState<CompositeReport | null>(initialReport ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runAnalysis(forceRefresh = false) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/agents/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, forceRefresh }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Analysis failed')
      }
      const data = await res.json()
      setReport(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  if (!report && !loading && !error) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
        <Brain className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <h3 className="mb-1 font-semibold text-slate-600">AI Analysis</h3>
        <p className="mb-4 text-sm text-slate-400">
          Run a multi-agent analysis using Claude AI — covering fundamentals, technicals, and news sentiment.
        </p>
        <button
          onClick={() => runAnalysis(false)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
        >
          <Sparkles className="h-4 w-4" />
          Run AI Analysis
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm text-slate-500">
          Running multi-agent analysis... This may take up to 30 seconds.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Fundamental → Technical → News → Synthesis
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-semibold">Analysis failed</span>
        </div>
        <p className="mt-1 text-sm text-red-500">{error}</p>
        <button
          onClick={() => runAnalysis(false)}
          className="mt-3 text-sm font-medium text-red-600 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!report) return null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={cn('rounded-2xl border p-6', bgForScore(report.overallScore))}>
        <div className="flex items-start gap-5">
          <ScoreRing score={report.overallScore} />
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-sm font-bold',
                  RECOMMENDATION_STYLES[report.recommendation] ?? 'bg-slate-200 text-slate-700'
                )}
              >
                {RECOMMENDATION_LABELS[report.recommendation] ?? report.recommendation}
              </span>
              <span className="text-xs text-slate-400">
                Generated {new Date(report.generatedAt).toLocaleDateString()}
              </span>
              <button
                onClick={() => runAnalysis(true)}
                className="ml-auto flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-400 hover:bg-white hover:text-slate-600"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </button>
            </div>
            <p className="text-sm leading-relaxed text-slate-700">{report.executiveSummary}</p>
          </div>
        </div>

        {/* Investment thesis */}
        <div className="mt-4 rounded-xl bg-white/60 px-4 py-3">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Investment Thesis
          </div>
          <p className="text-sm text-slate-700">{report.investmentThesis}</p>
        </div>

        {/* Key risks */}
        {report.keyRisks.length > 0 && (
          <div className="mt-3 rounded-xl bg-white/60 px-4 py-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Key Risks
            </div>
            <ul className="space-y-1">
              {report.keyRisks.map((risk, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Sub-agent reports */}
      <div className="space-y-2">
        {/* Fundamental */}
        <CollapseSection title={`Fundamental Analysis — ${report.fundamental.score}/10`} icon={BarChart2} defaultOpen>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">{report.fundamental.summary}</p>

            {/* Key metrics */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {report.fundamental.keyMetrics.map((m, i) => (
                <div key={i} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span className="text-slate-500">{m.label}</span>
                  <span className={cn('font-medium', SIGNAL_STYLES[m.signal])}>
                    {m.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="mb-1.5 text-xs font-semibold text-slate-400">Strengths</div>
                <ul className="space-y-1">
                  {report.fundamental.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-1.5 text-xs font-semibold text-slate-400">Weaknesses</div>
                <ul className="space-y-1">
                  {report.fundamental.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </CollapseSection>

        {/* Technical */}
        <CollapseSection title={`Technical Analysis — ${report.technical.score}/10`} icon={BarChart2}>
          <div className="space-y-3">
            <p className="text-sm text-slate-600">{report.technical.summary}</p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600">
                Trend: {report.technical.trend}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600">
                Momentum: {report.technical.momentum.replace(/_/g, ' ')}
              </span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                Support: {formatCurrency(report.technical.support)}
              </span>
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-600">
                Resistance: {formatCurrency(report.technical.resistance)}
              </span>
            </div>
            <ul className="space-y-1">
              {report.technical.signals.map((s, i) => (
                <li key={i} className="text-sm text-slate-600">• {s}</li>
              ))}
            </ul>
          </div>
        </CollapseSection>

        {/* News */}
        <CollapseSection title={`News Sentiment — ${report.news.score}/10`} icon={Newspaper}>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold capitalize',
                  report.news.sentiment === 'bullish'
                    ? 'bg-emerald-100 text-emerald-700'
                    : report.news.sentiment === 'bearish'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-slate-100 text-slate-600'
                )}
              >
                {report.news.sentiment}
              </span>
            </div>
            <p className="text-sm text-slate-600">{report.news.summary}</p>
            {report.news.catalysts.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-semibold text-slate-400">Catalysts</div>
                <ul className="space-y-1">
                  {report.news.catalysts.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.news.risks.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-semibold text-slate-400">Concerns</div>
                <ul className="space-y-1">
                  {report.news.risks.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CollapseSection>
      </div>
    </div>
  )
}
