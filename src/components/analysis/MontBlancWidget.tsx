'use client'

import { useMemo } from 'react'
import type { FinancialData } from '@/types/stock'
import { scoreMontBlanc, STAGE_META } from '@/lib/models/montBlanc'
import type { MontBlancResult, MontBlancStage } from '@/lib/models/montBlanc'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Info } from 'lucide-react'

interface Props {
  financials: FinancialData
  currentPrice: number
  ticker: string
}

// ============================================================
// Mountain SVG
// ============================================================

function MountainSVG({ result }: { result: MontBlancResult }) {
  const W = 160
  const H = 260
  const peakX = W / 2
  const peakY = 18
  const baseY = H - 10

  // Mountain polygon points
  const mountain = `${peakX},${peakY} ${W - 8},${baseY} 8,${baseY}`

  // Band heights (equal quarters of mountain height)
  const totalH = baseY - peakY
  const bandH = totalH / 4

  // Colors bottom→top: red, yellow, blue, green
  const bands = [
    { color: '#fca5a5', top: peakY + bandH * 3, label: '🔴', labelY: peakY + bandH * 3.5 },
    { color: '#fde68a', top: peakY + bandH * 2, label: '🟡', labelY: peakY + bandH * 2.5 },
    { color: '#93c5fd', top: peakY + bandH * 1, label: '🔵', labelY: peakY + bandH * 1.5 },
    { color: '#6ee7b7', top: peakY,              label: '🟢', labelY: peakY + bandH * 0.5 },
  ]

  // Marker position: interpolate along left slope of mountain
  // score=0 → bottom, score=100 → peak
  const markerY = baseY - result.positionPct * totalH
  // At markerY, the mountain left slope gives x:
  // Left slope: from (8, baseY) to (peakX, peakY)
  // x = 8 + (peakX - 8) * (baseY - markerY) / (baseY - peakY)
  // We'll place marker on right slope for visibility:
  // Right slope: from (peakX, peakY) to (W-8, baseY)
  // x = peakX + (W - 8 - peakX) * (markerY - peakY) / (baseY - peakY)
  const markerX = peakX + (W - 8 - peakX) * (markerY - peakY) / (baseY - peakY)

  const stageColor = STAGE_META[result.stage].color

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[160px]" aria-label="Mont Blanc mountain visualization">
      <defs>
        <clipPath id="mb-mountain-clip">
          <polygon points={mountain} />
        </clipPath>
        {/* Snow cap gradient */}
        <linearGradient id="mb-snow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {/* Glow filter for marker */}
        <filter id="mb-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Band fills clipped to mountain shape */}
      {bands.map((band, i) => (
        <rect
          key={i}
          x={0}
          y={band.top}
          width={W}
          height={bandH + 2}
          fill={band.color}
          clipPath="url(#mb-mountain-clip)"
        />
      ))}

      {/* Snow cap overlay */}
      <polygon
        points={mountain}
        fill="url(#mb-snow)"
        clipPath="url(#mb-mountain-clip)"
      />

      {/* Mountain outline */}
      <polygon
        points={mountain}
        fill="none"
        stroke="#1e293b"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Stage emoji labels on right side */}
      {bands.map((band, i) => (
        <text
          key={`label-${i}`}
          x={W - 4}
          y={band.labelY + 4}
          textAnchor="end"
          fontSize="11"
          className="select-none"
        >
          {band.label}
        </text>
      ))}

      {/* Dashed horizontal line at marker height */}
      <line
        x1={12}
        y1={markerY}
        x2={markerX - 6}
        y2={markerY}
        stroke={stageColor}
        strokeWidth="1.5"
        strokeDasharray="3,2"
        opacity="0.7"
      />

      {/* Marker pulse ring */}
      <circle
        cx={markerX}
        cy={markerY}
        r="10"
        fill={stageColor}
        opacity="0.25"
        filter="url(#mb-glow)"
      />

      {/* Marker outer ring */}
      <circle
        cx={markerX}
        cy={markerY}
        r="7"
        fill="white"
        stroke={stageColor}
        strokeWidth="2.5"
      />

      {/* Marker inner dot */}
      <circle
        cx={markerX}
        cy={markerY}
        r="3.5"
        fill={stageColor}
      />

      {/* Score label next to marker */}
      <rect
        x={markerX + 10}
        y={markerY - 9}
        width={34}
        height={18}
        rx="4"
        fill={stageColor}
      />
      <text
        x={markerX + 27}
        y={markerY + 4}
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fill="white"
        className="select-none"
      >
        {result.score}
      </text>
    </svg>
  )
}

// ============================================================
// Score Bar
// ============================================================

function ScoreBar({ score, max, label, color }: { score: number; max: number; label: string; color: string }) {
  const pct = Math.round((score / max) * 100)
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold text-slate-700">{score}/{max}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ============================================================
// Direction Badge
// ============================================================

function DirectionBadge({ direction }: { direction: MontBlancResult['direction'] }) {
  if (direction === 'improving') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
      <TrendingUp className="h-3 w-3" /> Improving
    </span>
  )
  if (direction === 'deteriorating') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
      <TrendingDown className="h-3 w-3" /> Deteriorating
    </span>
  )
  if (direction === 'stable') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
      <Minus className="h-3 w-3" /> Stable
    </span>
  )
  return null
}

// ============================================================
// Signal Row
// ============================================================

const SIGNAL_COLORS = {
  positive: 'text-emerald-600',
  neutral: 'text-slate-500',
  negative: 'text-red-500',
}

const SIGNAL_DOTS = {
  positive: 'bg-emerald-400',
  neutral: 'bg-slate-300',
  negative: 'bg-red-400',
}

// ============================================================
// Main Widget
// ============================================================

export function MontBlancWidget({ financials, currentPrice, ticker }: Props) {
  const result = useMemo(
    () => scoreMontBlanc(financials, currentPrice),
    [financials, currentPrice]
  )

  const meta = STAGE_META[result.stage]
  const breakdownEntries = Object.values(result.breakdown)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header band */}
      <div
        className="px-5 py-3"
        style={{ backgroundColor: meta.color + '18', borderBottom: `2px solid ${meta.color}30` }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Mont Blanc Model
            </div>
            <div className="mt-0.5 text-lg font-bold" style={{ color: meta.color }}>
              {meta.emoji} {meta.category}
            </div>
          </div>
          <DirectionBadge direction={result.direction} />
        </div>
      </div>

      <div className="flex gap-0 divide-x divide-slate-100">
        {/* Left: Mountain + score */}
        <div className="flex flex-col items-center px-5 py-5 gap-3">
          <MountainSVG result={result} />

          {/* Score ring */}
          <div
            className="flex h-14 w-14 flex-col items-center justify-center rounded-full border-4"
            style={{ borderColor: meta.color }}
          >
            <span className="text-lg font-extrabold leading-none" style={{ color: meta.color }}>
              {result.score}
            </span>
            <span className="text-[9px] text-slate-400 leading-none">/100</span>
          </div>

          <div className="text-center">
            <div className="text-xs font-bold text-slate-700">{result.stageLabel}</div>
            {result.isBorderline && (
              <div className="mt-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                Borderline
              </div>
            )}
          </div>
        </div>

        {/* Right: Details */}
        <div className="flex-1 px-5 py-5 space-y-5">
          {/* Tagline */}
          <p className="text-sm text-slate-500 italic">{meta.tagline}</p>

          {/* Override warning */}
          {result.overrideReason && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <p className="text-xs text-amber-700">{result.overrideReason}</p>
            </div>
          )}

          {/* Score breakdown bars */}
          <div className="space-y-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Score Breakdown
            </div>
            {breakdownEntries.map((b) => (
              <ScoreBar
                key={b.label}
                label={b.label}
                score={b.score}
                max={b.max}
                color={meta.color}
              />
            ))}
          </div>

          {/* Key signals */}
          <div>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Key Metrics
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {result.signals.map((s) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', SIGNAL_DOTS[s.signal])} />
                  <span className="text-xs text-slate-500">{s.label}:</span>
                  <span className={cn('text-xs font-semibold', SIGNAL_COLORS[s.signal])}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stage transition legend */}
      <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {(['red', 'yellow', 'blue', 'green'] as MontBlancStage[]).map((s) => (
            <div
              key={s}
              className={cn(
                'flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition',
                result.stage === s
                  ? 'opacity-100 ring-1 ring-offset-1'
                  : 'opacity-40'
              )}
              style={{
                backgroundColor: STAGE_META[s].color + '20',
                color: STAGE_META[s].color,
                ringColor: result.stage === s ? STAGE_META[s].color : 'transparent',
              }}
            >
              {STAGE_META[s].emoji} {STAGE_META[s].category}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <Info className="h-3 w-3" />
          <span>0–25 🔴 · 25–50 🟡 · 50–75 🔵 · 75–100 🟢</span>
        </div>
      </div>
    </div>
  )
}
