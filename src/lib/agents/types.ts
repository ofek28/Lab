import type { FinancialData, PriceBar } from '@/types/stock'

// ============================================================
// Agent Input / Output Types
// ============================================================

export interface AgentInput {
  ticker: string
  companyName: string
  currentPrice: number
  financials: FinancialData
  historicalPrices: PriceBar[]
  newsHeadlines: string[]
}

// -------------------------------------------------------
// Sub-Agent Reports
// -------------------------------------------------------

export interface MetricSignal {
  label: string
  value: string
  signal: 'positive' | 'neutral' | 'negative'
  note?: string
}

export interface FundamentalReport {
  type: 'fundamental'
  summary: string
  score: number  // 1–10
  keyMetrics: MetricSignal[]
  strengths: string[]
  weaknesses: string[]
}

export interface TechnicalReport {
  type: 'technical'
  summary: string
  score: number  // 1–10
  trend: 'uptrend' | 'downtrend' | 'sideways'
  support: number
  resistance: number
  signals: string[]
  momentum: 'strong_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strong_bearish'
}

export interface NewsReport {
  type: 'news'
  summary: string
  score: number  // 1–10
  sentiment: 'bullish' | 'neutral' | 'bearish'
  keyThemes: string[]
  catalysts: string[]
  risks: string[]
}

// -------------------------------------------------------
// Composite (Orchestrator) Report
// -------------------------------------------------------

export interface CompositeReport {
  type: 'composite'
  ticker: string
  companyName: string
  overallScore: number          // weighted average 1–10
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell'
  executiveSummary: string
  investmentThesis: string
  keyRisks: string[]
  fundamental: FundamentalReport
  technical: TechnicalReport
  news: NewsReport
  generatedAt: string
}
