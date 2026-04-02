import type { ScoringModel, ModelResult } from './types'
import { grahamNumberModel } from './grahamNumber'
import type { FinancialData, PriceBar } from '@/types/stock'

// ============================================================
// Model Registry
// To add a new model:
// 1. Create src/lib/models/yourModel.ts implementing ScoringModel
// 2. Import it here and add to MODEL_REGISTRY
// ============================================================

export const MODEL_REGISTRY: ScoringModel[] = [
  grahamNumberModel,
  // Add more models here, e.g.:
  // dcfModel,
  // magicFormulaModel,
  // piotroskiScoreModel,
]

export function runAllModels(
  financials: FinancialData,
  prices: PriceBar[],
  currentPrice: number
): ModelResult[] {
  return MODEL_REGISTRY.map((model) => {
    try {
      return model.run(financials, prices, currentPrice)
    } catch (err) {
      return {
        modelId: model.id,
        modelName: model.name,
        score: 50,
        signal: 'inconclusive' as const,
        description: `Error running model: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: {},
      }
    }
  })
}

export type { ScoringModel, ModelResult }
