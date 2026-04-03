import type { ScoringModel, ModelResult } from './types'
import { grahamNumberModel } from './grahamNumber'
import { montBlancModel } from './montBlanc'
import type { FinancialData, PriceBar } from '@/types/stock'

export const MODEL_REGISTRY: ScoringModel[] = [
  montBlancModel,
  grahamNumberModel,
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
