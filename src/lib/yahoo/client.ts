// Yahoo Finance — historical prices only (CSV download, no auth required)
// For quotes, financials, and news use src/lib/finnhub/client.ts

import yahooFinance from 'yahoo-finance2'
import type { PriceBar } from '@/types/stock'

export async function fetchHistorical(
  ticker: string,
  period: '1mo' | '3mo' | '6mo' | '1y' | '2y' = '6mo'
): Promise<PriceBar[]> {
  const periodToDays: Record<string, number> = {
    '1mo': 30,
    '3mo': 90,
    '6mo': 180,
    '1y': 365,
    '2y': 730,
  }

  const days = periodToDays[period] ?? 180
  const period1 = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const results = await yahooFinance.historical(ticker, {
    period1,
    interval: period === '2y' ? '1wk' : '1d',
  }, { validateResult: false })

  return results.map((bar) => ({
    date: bar.date.toISOString().split('T')[0],
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume,
  }))
}
