// Finnhub API client — SERVER ONLY
// Free tier: 60 API calls/minute. Sign up at https://finnhub.io
// Add FINNHUB_API_KEY to your .env.local

import type { StockQuote, FinancialData, FinancialMetrics, IncomeStatement, SearchResult, PriceBar } from '@/types/stock'

const BASE = 'https://finnhub.io/api/v1'

function key() {
  const k = process.env.FINNHUB_API_KEY
  if (!k) throw new Error('FINNHUB_API_KEY is not set in .env.local')
  return k
}

async function get<T>(path: string): Promise<T> {
  const url = `${BASE}${path}&token=${key()}`
  const res = await fetch(url, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`Finnhub ${path} → ${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

// -------------------------------------------------------
// Quote
// -------------------------------------------------------
export async function fetchQuote(ticker: string): Promise<StockQuote> {
  const [quote, profile, metrics] = await Promise.all([
    get<FinnhubQuote>(`/quote?symbol=${ticker}`),
    get<FinnhubProfile>(`/stock/profile2?symbol=${ticker}`),
    get<{ metric: FinnhubMetrics }>(`/stock/metric?symbol=${ticker}&metric=all`),
  ])

  if (!quote.c || quote.c === 0) {
    throw new Error(`No quote data for ${ticker}`)
  }

  const m = metrics.metric ?? {}

  return {
    ticker: ticker.toUpperCase(),
    shortName: profile.name ?? ticker,
    longName: profile.name ?? ticker,
    price: quote.c,
    change: quote.d ?? 0,
    changePercent: quote.dp ?? 0,
    volume: quote.v ?? 0,
    avgVolume: 0,
    marketCap: (profile.marketCapitalization ?? 0) * 1e6,
    dayHigh: quote.h ?? 0,
    dayLow: quote.l ?? 0,
    fiftyTwoWeekHigh: m['52WeekHigh'] ?? 0,
    fiftyTwoWeekLow: m['52WeekLow'] ?? 0,
    currency: profile.currency ?? 'USD',
    exchange: profile.exchange ?? '',
  }
}

// -------------------------------------------------------
// Financials
// -------------------------------------------------------
export async function fetchFinancials(ticker: string): Promise<FinancialData> {
  const [metricsRes, financialsRes] = await Promise.all([
    get<{ metric: FinnhubMetrics }>(`/stock/metric?symbol=${ticker}&metric=all`),
    get<FinnhubFinancials>(`/stock/financials-reported?symbol=${ticker}&freq=annual`),
  ])

  const m = metricsRes.metric ?? {}

  const metrics: FinancialMetrics = {
    // Valuation
    trailingPE: m.peExclExtraTTM ?? m.peTTM ?? null,
    forwardPE: m.peNormalizedAnnual ?? null,
    priceToBook: m.pbAnnual ?? m.pbQuarterly ?? null,
    priceToSales: m.psTTM ?? m.psAnnual ?? null,
    pegRatio: null,
    enterpriseToRevenue: m.evToRevenueTTM ?? null,
    enterpriseToEbitda: m.evToEbitdaTTM ?? null,

    // Profitability
    grossMargins: m.grossMarginTTM != null ? m.grossMarginTTM / 100 : null,
    operatingMargins: m.operatingMarginTTM != null ? m.operatingMarginTTM / 100 : null,
    ebitdaMargins: null,
    profitMargins: m.netProfitMarginTTM != null ? m.netProfitMarginTTM / 100 : null,
    returnOnEquity: m.roeTTM != null ? m.roeTTM / 100 : null,
    returnOnAssets: m.roaTTM != null ? m.roaTTM / 100 : null,

    // Growth
    revenueGrowth: m.revenueGrowthTTMYoy != null ? m.revenueGrowthTTMYoy / 100 : null,
    earningsGrowth: m.epsGrowthTTMYoy != null ? m.epsGrowthTTMYoy / 100 : null,

    // Per Share
    trailingEps: m.epsTTM ?? m.epsAnnual ?? null,
    forwardEps: m.epsNormalizedAnnual ?? null,
    bookValue: m.bookValuePerShareAnnual ?? m.bookValuePerShareQuarterly ?? null,

    // Balance Sheet
    totalCash: m.cashPerSharePerShareAnnual != null ? null : null,
    totalDebt: m.totalDebtToEquityAnnual != null ? null : null,
    debtToEquity: m.totalDebtToEquityAnnual ?? m.totalDebtToEquityQuarterly ?? null,
    currentRatio: m.currentRatioAnnual ?? m.currentRatioQuarterly ?? null,
    quickRatio: m.quickRatioAnnual ?? m.quickRatioQuarterly ?? null,

    // Cash Flow
    freeCashflow: m.freeCashFlowTTM != null ? m.freeCashFlowTTM * 1e6 : null,
    operatingCashflow: null,

    // Dividend
    dividendYield: m.dividendYieldIndicatedAnnual != null ? m.dividendYieldIndicatedAnnual / 100 : null,
    payoutRatio: m.payoutRatioAnnual != null ? m.payoutRatioAnnual / 100 : null,

    // Other
    beta: m.beta ?? null,
    shortRatio: null,
    fiftyTwoWeekChange: m['52WeekPriceReturnDaily'] != null ? m['52WeekPriceReturnDaily'] / 100 : null,

    // Analyst (not available in Finnhub free tier directly)
    targetMeanPrice: m.targetPrice ?? null,
    targetHighPrice: null,
    targetLowPrice: null,
    recommendationKey: null,
    numberOfAnalystOpinions: null,
  }

  // Income history from reported financials
  const reports = financialsRes.data ?? []
  const incomeHistory: IncomeStatement[] = reports.slice(0, 4).map((r) => {
    const ic = r.report?.ic ?? []
    const find = (concepts: string[]) => {
      for (const c of concepts) {
        const item = ic.find((x: { concept: string; value: number }) => x.concept === c)
        if (item) return item.value
      }
      return null
    }
    return {
      date: r.endDate ?? '',
      totalRevenue: find(['Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax', 'SalesRevenueNet']),
      grossProfit: find(['GrossProfit']),
      ebitda: null,
      netIncome: find(['NetIncomeLoss', 'ProfitLoss']),
      researchDevelopment: find(['ResearchAndDevelopmentExpense']),
      sellingGeneralAdministrative: find(['SellingGeneralAndAdministrativeExpense']),
    }
  })

  return { metrics, incomeHistory }
}

// -------------------------------------------------------
// News
// -------------------------------------------------------
export async function fetchNewsHeadlines(ticker: string): Promise<string[]> {
  try {
    const to = new Date().toISOString().split('T')[0]
    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const news = await get<FinnhubNews[]>(`/company-news?symbol=${ticker}&from=${from}&to=${to}`)
    return (news ?? []).slice(0, 10).map((n) => n.headline).filter(Boolean)
  } catch {
    return []
  }
}

// -------------------------------------------------------
// Search
// -------------------------------------------------------
export async function searchTickers(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 1) return []
  try {
    const res = await get<{ result: FinnhubSearchResult[] }>(`/search?q=${encodeURIComponent(query)}`)
    return (res.result ?? [])
      .filter((r) => r.type === 'Common Stock' || r.type === 'ETP')
      .slice(0, 8)
      .map((r) => ({
        ticker: r.symbol,
        shortName: r.description,
        longName: r.description,
        exchange: r.displaySymbol,
        quoteType: r.type,
      }))
  } catch {
    return []
  }
}

// -------------------------------------------------------
// Finnhub response types (internal)
// -------------------------------------------------------
interface FinnhubQuote {
  c: number   // current price
  d: number   // change
  dp: number  // change percent
  h: number   // high
  l: number   // low
  o: number   // open
  pc: number  // prev close
  v: number   // volume
}

interface FinnhubProfile {
  name: string
  ticker: string
  exchange: string
  currency: string
  marketCapitalization: number
  shareOutstanding: number
}

interface FinnhubMetrics {
  [key: string]: number | null | undefined
}

interface FinnhubNews {
  headline: string
  summary: string
  url: string
  datetime: number
}

interface FinnhubSearchResult {
  symbol: string
  description: string
  displaySymbol: string
  type: string
}

interface FinnhubFinancials {
  data: Array<{
    endDate: string
    report: {
      ic: Array<{ concept: string; value: number }>
    }
  }>
}
