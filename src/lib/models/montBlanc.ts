/**
 * Mont Blanc Model — Company Lifecycle Classification
 *
 * Classifies a company into 4 stages (like climbing a mountain):
 *   🟢 Green  (75–100) — Proven Growth Compounder
 *   🔵 Blue   (50–75)  — Stable Quality Business
 *   🟡 Yellow (25–50)  — Early Stage / Dream
 *   🔴 Red    (0–25)   — Declining / Broken
 *
 * CRITICAL RULE: High growth + negative earnings → Yellow (not Green).
 */

import type { FinancialData } from '@/types/stock'
import type { ScoringModel, ModelResult } from './types'

// ============================================================
// Result Types
// ============================================================

export type MontBlancStage = 'green' | 'blue' | 'yellow' | 'red'
export type MontBlancDirection = 'improving' | 'stable' | 'deteriorating' | 'unknown'

export interface MontBlancSignal {
  label: string
  value: string
  signal: 'positive' | 'neutral' | 'negative'
}

export interface MontBlancScoreBreakdown {
  growth: { score: number; max: number; label: string }
  profitability: { score: number; max: number; label: string }
  returns: { score: number; max: number; label: string }
  valuation: { score: number; max: number; label: string }
  stability: { score: number; max: number; label: string }
  moat: { score: number; max: number; label: string }
}

export interface MontBlancResult {
  score: number                   // 0–100
  stage: MontBlancStage
  stageLabel: string              // e.g. "Elite Compounder"
  stageDescription: string        // stage category name
  isBorderline: boolean
  direction: MontBlancDirection
  overrideReason?: string         // e.g. "Capped at Yellow: high growth, negative margins"
  breakdown: MontBlancScoreBreakdown
  signals: MontBlancSignal[]
  positionPct: number             // 0–1, for mountain marker
}

// ============================================================
// Stage Metadata
// ============================================================

export const STAGE_META: Record<MontBlancStage, {
  color: string
  bg: string
  border: string
  text: string
  emoji: string
  category: string
  tagline: string
}> = {
  green: {
    color: '#10b981',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-700',
    emoji: '🟢',
    category: 'Proven Growth',
    tagline: 'Strong fundamentals with proven scalability',
  },
  blue: {
    color: '#3b82f6',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-700',
    emoji: '🔵',
    category: 'Stable Quality',
    tagline: 'Mature compounder with durable competitive advantage',
  },
  yellow: {
    color: '#f59e0b',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-700',
    emoji: '🟡',
    category: 'Dream / Early Stage',
    tagline: 'High expectations, profitability not yet proven',
  },
  red: {
    color: '#ef4444',
    bg: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-700',
    emoji: '🔴',
    category: 'Declining / Broken',
    tagline: 'Deteriorating fundamentals or structural headwinds',
  },
}

// ============================================================
// Helpers
// ============================================================

function pct(v: number | null | undefined): string {
  if (v == null) return 'N/A'
  return `${(v * 100).toFixed(1)}%`
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function subLabel(score: number, stage: MontBlancStage): string {
  if (stage === 'green') return score >= 88 ? 'Elite Compounder' : 'Proven Compounder'
  if (stage === 'blue') return score >= 63 ? 'Strong Compounder' : 'Quality Business'
  if (stage === 'yellow') return score >= 38 ? 'Promising Growth Story' : 'Early Stage / Unproven'
  return score <= 10 ? 'Structural Decline' : 'Turnaround Candidate'
}

// ============================================================
// Core Scoring Function
// ============================================================

export function scoreMontBlanc(
  financials: FinancialData,
  currentPrice: number
): MontBlancResult {
  const m = financials.metrics

  // ── 1. Growth (0–25 pts) ──────────────────────────────────
  const revGrowth = m.revenueGrowth  // decimal, e.g. 0.20
  const epsGrowth = m.earningsGrowth
  let growthScore = 0

  if (revGrowth != null) {
    if (revGrowth > 0.30) growthScore = 25
    else if (revGrowth > 0.20) growthScore = 21
    else if (revGrowth > 0.12) growthScore = 17
    else if (revGrowth > 0.06) growthScore = 12
    else if (revGrowth > 0.02) growthScore = 8
    else if (revGrowth > 0) growthScore = 4
    else growthScore = 0   // shrinking
  } else {
    growthScore = 10       // unknown — neutral assumption
  }

  // EPS growth bonus (+3 max)
  if (epsGrowth != null && epsGrowth > 0.15) growthScore = Math.min(25, growthScore + 3)

  // ── 2. Profitability (0–20 pts) ───────────────────────────
  const netMargin = m.profitMargins
  const opMargin = m.operatingMargins
  let profScore = 0

  if (netMargin != null) {
    if (netMargin > 0.25) profScore += 10
    else if (netMargin > 0.15) profScore += 8
    else if (netMargin > 0.08) profScore += 6
    else if (netMargin > 0.03) profScore += 4
    else if (netMargin > 0) profScore += 2
    else profScore += 0   // negative
  } else profScore += 4   // unknown

  if (opMargin != null) {
    if (opMargin > 0.25) profScore += 10
    else if (opMargin > 0.15) profScore += 8
    else if (opMargin > 0.08) profScore += 6
    else if (opMargin > 0.03) profScore += 4
    else if (opMargin > 0) profScore += 2
    else profScore += 0
  } else profScore += 4

  // ── 3. Capital Returns / ROIC (0–20 pts) ─────────────────
  const roe = m.returnOnEquity
  const roa = m.returnOnAssets
  let returnsScore = 0

  if (roe != null) {
    if (roe > 0.30) returnsScore += 10
    else if (roe > 0.20) returnsScore += 8
    else if (roe > 0.12) returnsScore += 6
    else if (roe > 0.06) returnsScore += 4
    else if (roe > 0) returnsScore += 2
    else returnsScore += 0
  } else returnsScore += 4

  if (roa != null) {
    if (roa > 0.15) returnsScore += 10
    else if (roa > 0.08) returnsScore += 8
    else if (roa > 0.04) returnsScore += 6
    else if (roa > 0.02) returnsScore += 4
    else if (roa > 0) returnsScore += 2
    else returnsScore += 0
  } else returnsScore += 4

  // ── 4. Valuation Quality (0–15 pts) ──────────────────────
  // Cheap relative to growth = positive signal
  const pe = m.trailingPE ?? m.forwardPE
  const pegProvided = m.pegRatio
  let valScore = 7  // neutral default

  if (pegProvided != null && pegProvided > 0) {
    if (pegProvided < 0.5) valScore = 15
    else if (pegProvided < 1.0) valScore = 13
    else if (pegProvided < 1.5) valScore = 10
    else if (pegProvided < 2.5) valScore = 7
    else if (pegProvided < 4.0) valScore = 4
    else valScore = 2
  } else if (pe != null && pe > 0 && revGrowth != null && revGrowth > 0) {
    // Synthetic PEG
    const syntheticPEG = pe / (revGrowth * 100)
    if (syntheticPEG < 0.5) valScore = 15
    else if (syntheticPEG < 1.0) valScore = 13
    else if (syntheticPEG < 1.5) valScore = 10
    else if (syntheticPEG < 2.5) valScore = 7
    else if (syntheticPEG < 4.0) valScore = 4
    else valScore = 2
  } else if (pe != null && pe > 0) {
    // No growth data — use absolute P/E
    if (pe < 10) valScore = 13
    else if (pe < 18) valScore = 10
    else if (pe < 28) valScore = 7
    else if (pe < 45) valScore = 4
    else valScore = 2
  }

  // ── 5. Financial Stability (0–10 pts) ────────────────────
  const currentRatio = m.currentRatio
  const deRatio = m.debtToEquity
  let stabScore = 5  // neutral start

  if (currentRatio != null) {
    if (currentRatio >= 2.5) stabScore += 3
    else if (currentRatio >= 1.5) stabScore += 2
    else if (currentRatio >= 1.0) stabScore += 0
    else stabScore -= 2
  }
  if (deRatio != null) {
    if (deRatio < 0.3) stabScore += 2
    else if (deRatio < 1.0) stabScore += 1
    else if (deRatio < 2.5) stabScore -= 1
    else stabScore -= 3
  }
  const stabilityScore = clamp(stabScore, 0, 10)

  // ── 6. Moat Proxy (0–10 pts) ─────────────────────────────
  let moatScore = 4  // baseline
  if (netMargin != null && netMargin > 0.20) moatScore += 2  // pricing power
  if (roe != null && roe > 0.20) moatScore += 2              // high returns = competitive moat
  if (opMargin != null && opMargin > 0.20) moatScore += 2   // operational efficiency
  const moatFinal = clamp(moatScore, 0, 10)

  // ── Total Score ───────────────────────────────────────────
  let score =
    growthScore +
    profScore +
    returnsScore +
    valScore +
    stabilityScore +
    moatFinal

  score = clamp(score, 0, 100)

  // ── CRITICAL OVERRIDE: Growth + no profitability → Yellow ─
  const isHighGrowth = revGrowth != null && revGrowth > 0.12
  const isNegativeNet = netMargin != null && netMargin <= 0
  const isNegativeOp = opMargin != null && opMargin <= 0
  let overrideReason: string | undefined

  if (score >= 50 && isHighGrowth && isNegativeNet && isNegativeOp) {
    score = clamp(score, 0, 49)
    overrideReason = `Revenue growth is strong (+${pct(revGrowth)}) but net margins are negative. Classified Yellow until profitability is demonstrated.`
  }

  // ── Stage ─────────────────────────────────────────────────
  let stage: MontBlancStage
  if (score >= 75) stage = 'green'
  else if (score >= 50) stage = 'blue'
  else if (score >= 25) stage = 'yellow'
  else stage = 'red'

  const stageLabel = subLabel(score, stage)

  // ── Borderline check (±5 of any boundary: 25/50/75) ───────
  const distFromBoundary = Math.min(
    Math.abs(score - 25),
    Math.abs(score - 50),
    Math.abs(score - 75)
  )
  const isBorderline = distFromBoundary <= 5

  // ── Direction ─────────────────────────────────────────────
  let direction: MontBlancDirection = 'unknown'
  if (revGrowth != null) {
    if (revGrowth > 0.10) direction = 'improving'
    else if (revGrowth >= 0) direction = 'stable'
    else direction = 'deteriorating'
  }
  if (direction === 'stable' && epsGrowth != null) {
    if (epsGrowth > 0.10) direction = 'improving'
    else if (epsGrowth < -0.05) direction = 'deteriorating'
  }

  // ── Signals ───────────────────────────────────────────────
  const signals: MontBlancSignal[] = [
    {
      label: 'Revenue Growth',
      value: pct(revGrowth),
      signal: revGrowth == null ? 'neutral' : revGrowth > 0.10 ? 'positive' : revGrowth > 0 ? 'neutral' : 'negative',
    },
    {
      label: 'Net Margin',
      value: pct(netMargin),
      signal: netMargin == null ? 'neutral' : netMargin > 0.10 ? 'positive' : netMargin > 0 ? 'neutral' : 'negative',
    },
    {
      label: 'Operating Margin',
      value: pct(opMargin),
      signal: opMargin == null ? 'neutral' : opMargin > 0.10 ? 'positive' : opMargin > 0 ? 'neutral' : 'negative',
    },
    {
      label: 'Return on Equity',
      value: pct(roe),
      signal: roe == null ? 'neutral' : roe > 0.15 ? 'positive' : roe > 0.05 ? 'neutral' : 'negative',
    },
    {
      label: 'Return on Assets',
      value: pct(roa),
      signal: roa == null ? 'neutral' : roa > 0.08 ? 'positive' : roa > 0.02 ? 'neutral' : 'negative',
    },
    {
      label: 'Debt / Equity',
      value: deRatio != null ? deRatio.toFixed(2) : 'N/A',
      signal: deRatio == null ? 'neutral' : deRatio < 0.5 ? 'positive' : deRatio < 1.5 ? 'neutral' : 'negative',
    },
    {
      label: 'P/E Ratio',
      value: pe != null ? pe.toFixed(1) : 'N/A',
      signal: pe == null ? 'neutral' : pe < 20 ? 'positive' : pe < 40 ? 'neutral' : 'negative',
    },
  ]

  return {
    score,
    stage,
    stageLabel,
    stageDescription: STAGE_META[stage].category,
    isBorderline,
    direction,
    overrideReason,
    signals,
    positionPct: score / 100,
    breakdown: {
      growth:       { score: growthScore,    max: 25, label: 'Revenue Growth' },
      profitability:{ score: profScore,       max: 20, label: 'Profitability'  },
      returns:      { score: returnsScore,    max: 20, label: 'Capital Returns' },
      valuation:    { score: valScore,        max: 15, label: 'Valuation'      },
      stability:    { score: stabilityScore,  max: 10, label: 'Balance Sheet'  },
      moat:         { score: moatFinal,       max: 10, label: 'Moat Proxy'    },
    },
  }
}

// ============================================================
// ScoringModel registration (plugs into model registry)
// ============================================================

export const montBlancModel: ScoringModel = {
  id: 'mont_blanc',
  name: 'Mont Blanc Model',
  description: '4-stage lifecycle classification: Red → Yellow → Blue → Green',
  category: 'composite',

  run(financials: FinancialData, _prices: unknown[], currentPrice: number): ModelResult {
    const result = scoreMontBlanc(financials, currentPrice)

    return {
      modelId: 'mont_blanc',
      modelName: 'Mont Blanc Model',
      score: result.score,
      signal:
        result.stage === 'green' ? 'undervalued'
        : result.stage === 'red' ? 'overvalued'
        : 'fairly_valued',
      description: `${STAGE_META[result.stage].emoji} ${result.stageDescription} — ${result.stageLabel} (${result.score}/100)`,
      details: {
        stage: result.stage,
        score: result.score,
        direction: result.direction,
      },
    }
  },
}
