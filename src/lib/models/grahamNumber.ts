import type { ScoringModel, ModelResult } from './types'
import type { FinancialData, PriceBar } from '@/types/stock'

// ============================================================
// Graham Number Model
// Graham Number = sqrt(22.5 * EPS * Book Value Per Share)
// Originally formulated by Benjamin Graham as a rough estimate
// of maximum fair value for defensive investors.
// ============================================================

export const grahamNumberModel: ScoringModel = {
  id: 'graham_number',
  name: 'Graham Number',
  description: "Benjamin Graham's intrinsic value estimate based on earnings and book value",
  category: 'value',

  run(financials: FinancialData, _prices: PriceBar[], currentPrice: number): ModelResult {
    const { trailingEps, bookValue } = financials.metrics

    if (!trailingEps || !bookValue || trailingEps <= 0 || bookValue <= 0) {
      return {
        modelId: 'graham_number',
        modelName: 'Graham Number',
        score: 50,
        signal: 'inconclusive',
        description: 'Insufficient data (requires positive EPS and book value)',
        details: {
          eps: trailingEps,
          bookValue: bookValue,
          reason: 'Requires positive EPS and book value',
        },
      }
    }

    const grahamNumber = Math.sqrt(22.5 * trailingEps * bookValue)
    const upside = ((grahamNumber - currentPrice) / currentPrice) * 100

    let signal: ModelResult['signal']
    let score: number

    if (upside >= 20) {
      signal = 'undervalued'
      score = Math.min(90, 60 + upside / 2)
    } else if (upside <= -20) {
      signal = 'overvalued'
      score = Math.max(10, 40 + upside / 2)
    } else {
      signal = 'fairly_valued'
      score = 50 + upside
    }

    score = Math.max(0, Math.min(100, score))

    return {
      modelId: 'graham_number',
      modelName: 'Graham Number',
      score,
      signal,
      intrinsicValue: grahamNumber,
      upside,
      description: `Graham Number of $${grahamNumber.toFixed(2)} implies ${upside > 0 ? '+' : ''}${upside.toFixed(1)}% ${upside > 0 ? 'upside' : 'downside'} from current price`,
      details: {
        eps_ttm: trailingEps,
        book_value_per_share: bookValue,
        graham_number: grahamNumber,
        current_price: currentPrice,
        upside_pct: upside,
      },
    }
  },
}
