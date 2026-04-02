// yahoo-finance2 wrapper with error handling and type safety
// This module is SERVER-ONLY (Node.js). Never import from client components.

import yahooFinance from 'yahoo-finance2'
import type { StockQuote, FinancialData, FinancialMetrics, IncomeStatement, PriceBar, SearchResult } from '@/types/stock'


// -------------------------------------------------------
// Quote
// -------------------------------------------------------
export async function fetchQuote(ticker: string): Promise<StockQuote> {
  const quote = await yahooFinance.quote(ticker, {}, { validateResult: false })

  return {
    ticker: quote.symbol,
    shortName: quote.shortName ?? quote.symbol,
    longName: quote.longName ?? quote.shortName ?? quote.symbol,
    price: quote.regularMarketPrice ?? 0,
    change: quote.regularMarketChange ?? 0,
    changePercent: quote.regularMarketChangePercent ?? 0,
    volume: quote.regularMarketVolume ?? 0,
    avgVolume: quote.averageDailyVolume3Month ?? 0,
    marketCap: quote.marketCap ?? 0,
    dayHigh: quote.regularMarketDayHigh ?? 0,
    dayLow: quote.regularMarketDayLow ?? 0,
    fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh ?? 0,
    fiftyTwoWeekLow: quote.fiftyTwoWeekLow ?? 0,
    currency: quote.currency ?? 'USD',
    exchange: quote.fullExchangeName ?? quote.exchange ?? '',
  }
}

// -------------------------------------------------------
// Financials
// -------------------------------------------------------
export async function fetchFinancials(ticker: string): Promise<FinancialData> {
  const summary = await yahooFinance.quoteSummary(ticker, {
    modules: [
      'financialData',
      'defaultKeyStatistics',
      'summaryDetail',
      'incomeStatementHistory',
      'earningsTrend',
    ],
  }, { validateResult: false })

  const fd = summary.financialData
  const ks = summary.defaultKeyStatistics
  const sd = summary.summaryDetail
  const income = summary.incomeStatementHistory?.incomeStatementHistory ?? []

  const metrics: FinancialMetrics = {
    // Valuation
    trailingPE: ks?.trailingPE ?? null,
    forwardPE: ks?.forwardPE ?? null,
    priceToBook: ks?.priceToBook ?? null,
    priceToSales: ks?.priceToSalesTrailingTwelveMonths ?? null,
    pegRatio: ks?.pegRatio ?? null,
    enterpriseToRevenue: ks?.enterpriseToRevenue ?? null,
    enterpriseToEbitda: ks?.enterpriseToEbitda ?? null,

    // Profitability
    grossMargins: fd?.grossMargins ?? null,
    operatingMargins: fd?.operatingMargins ?? null,
    ebitdaMargins: fd?.ebitdaMargins ?? null,
    profitMargins: fd?.profitMargins ?? null,
    returnOnEquity: fd?.returnOnEquity ?? null,
    returnOnAssets: fd?.returnOnAssets ?? null,

    // Growth
    revenueGrowth: fd?.revenueGrowth ?? null,
    earningsGrowth: fd?.earningsGrowth ?? null,

    // Per Share
    trailingEps: ks?.trailingEps ?? null,
    forwardEps: ks?.forwardEps ?? null,
    bookValue: ks?.bookValue ?? null,

    // Balance Sheet
    totalCash: fd?.totalCash ?? null,
    totalDebt: fd?.totalDebt ?? null,
    debtToEquity: fd?.debtToEquity ?? null,
    currentRatio: fd?.currentRatio ?? null,
    quickRatio: fd?.quickRatio ?? null,

    // Cash Flow
    freeCashflow: fd?.freeCashflow ?? null,
    operatingCashflow: fd?.operatingCashflow ?? null,

    // Dividend
    dividendYield: sd?.dividendYield ?? null,
    payoutRatio: sd?.payoutRatio ?? null,

    // Other
    beta: ks?.beta ?? null,
    shortRatio: ks?.shortRatio ?? null,
    fiftyTwoWeekChange: ks?.fiftyTwoWeekChange ?? null,

    // Analyst
    targetMeanPrice: fd?.targetMeanPrice ?? null,
    targetHighPrice: fd?.targetHighPrice ?? null,
    targetLowPrice: fd?.targetLowPrice ?? null,
    recommendationKey: fd?.recommendationKey ?? null,
    numberOfAnalystOpinions: fd?.numberOfAnalystOpinions ?? null,
  }

  const incomeHistory: IncomeStatement[] = income.map((item) => ({
    date: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '',
    totalRevenue: item.totalRevenue ?? null,
    grossProfit: item.grossProfit ?? null,
    ebitda: item.ebitda ?? null,
    netIncome: item.netIncome ?? null,
    researchDevelopment: item.researchDevelopment ?? null,
    sellingGeneralAdministrative: item.sellingGeneralAdministrative ?? null,
  }))

  return { metrics, incomeHistory }
}

// -------------------------------------------------------
// Historical Prices
// -------------------------------------------------------
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

// -------------------------------------------------------
// News / Search
// -------------------------------------------------------
export async function fetchNewsHeadlines(ticker: string): Promise<string[]> {
  try {
    const results = await yahooFinance.search(ticker, {
      quotesCount: 0,
      newsCount: 10,
      enableFuzzyQuery: false,
    })
    return (results.news ?? []).map((n) => n.title).filter(Boolean)
  } catch {
    return []
  }
}

export async function searchTickers(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 1) return []

  try {
    const results = await yahooFinance.search(query, {
      quotesCount: 8,
      newsCount: 0,
      enableFuzzyQuery: true,
    })

    return (results.quotes ?? [])
      .filter((q) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
      .map((q) => ({
        ticker: q.symbol,
        shortName: q.shortName ?? q.symbol,
        longName: q.longname ?? q.shortName ?? q.symbol,
        exchange: q.exchange ?? '',
        quoteType: q.quoteType ?? '',
      }))
  } catch {
    return []
  }
}
