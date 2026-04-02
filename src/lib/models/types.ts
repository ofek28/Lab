import type { FinancialData, PriceBar } from '@/types/stock'

// ============================================================
// Scoring Model Interface
// ============================================================
// Add new models by implementing this interface and registering
// them in src/lib/models/index.ts

export interface ModelResult {
  modelId: string
  modelName: string
  score: number           // 0–100 normalized score
  signal: 'undervalued' | 'fairly_valued' | 'overvalued' | 'inconclusive'
  intrinsicValue?: number // Estimated fair value
  upside?: number         // % upside to intrinsic value
  details: Record<string, string | number | null>
  description: string
}

export interface ScoringModel {
  id: string
  name: string
  description: string
  category: 'value' | 'growth' | 'technical' | 'composite'
  run(
    financials: FinancialData,
    historicalPrices: PriceBar[],
    currentPrice: number
  ): ModelResult
}
