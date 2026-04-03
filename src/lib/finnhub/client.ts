// Smart data router — SERVER ONLY
// Routes requests based on ticker:
//   .TA suffix (TASE) → Yahoo Finance chart API (direct fetch, no auth)
//   All others        → Finnhub (free tier, 60 req/min)
//
// Required .env.local:
//   FINNHUB_API_KEY=your_key

import type { StockQuote, FinancialData, FinancialMetrics, IncomeStatement, SearchResult } from '@/types/stock'

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
}

// -------------------------------------------------------
// Router helpers
// -------------------------------------------------------
function isTASE(ticker: string) {
  return ticker.toUpperCase().endsWith('.TA')
}

// -------------------------------------------------------
// Yahoo Finance Chart API (TASE + fallback)
// Works without authentication from residential IPs
// -------------------------------------------------------
async function yahooChartFetch(ticker: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d&includePrePost=false`
  const res = await fetch(url, { headers: BROWSER_HEADERS, next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`Yahoo Finance chart API → ${res.status} for ${ticker}`)
  const data = await res.json()
  const result = data?.chart?.result?.[0]
  if (!result) throw new Error(`No chart data returned for ${ticker}`)
  return result
}

export async function fetchQuoteTASE(ticker: string): Promise<StockQuote> {
  const result = await yahooChartFetch(ticker)
  const m = result.meta

  const price = m.regularMarketPrice ?? 0
  const prevClose = m.chartPreviousClose ?? m.regularMarketPreviousClose ?? price
  const change = price - prevClose
  const changePercent = prevClose ? (change / prevClose) * 100 : 0

  return {
    ticker: m.symbol ?? ticker,
    shortName: m.shortName ?? m.symbol ?? ticker,
    longName: m.longName ?? m.shortName ?? m.symbol ?? ticker,
    price,
    change,
    changePercent,
    volume: m.regularMarketVolume ?? 0,
    avgVolume: m.regularMarketVolume ?? 0,
    marketCap: 0, // not in chart meta
    dayHigh: m.regularMarketDayHigh ?? price,
    dayLow: m.regularMarketDayLow ?? price,
    fiftyTwoWeekHigh: m.fiftyTwoWeekHigh ?? 0,
    fiftyTwoWeekLow: m.fiftyTwoWeekLow ?? 0,
    currency: m.currency ?? 'ILS',
    exchange: m.exchangeName ?? 'TLV',
  }
}

async function fetchFinancialsTASE(ticker: string): Promise<FinancialData> {
  // Yahoo Finance quoteSummary via direct fetch
  const modules = 'financialData,defaultKeyStatistics,summaryDetail,incomeStatementHistory'
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=${modules}`
  const res = await fetch(url, { headers: BROWSER_HEADERS, next: { revalidate: 300 } })

  // If quoteSummary is blocked, return empty metrics (TASE financial data is harder to get free)
  if (!res.ok) {
    return { metrics: emptyMetrics(), incomeHistory: [] }
  }

  const data = await res.json()
  const summary = data?.quoteSummary?.result?.[0]
  if (!summary) return { metrics: emptyMetrics(), incomeHistory: [] }

  const fd = summary.financialData
  const ks = summary.defaultKeyStatistics
  const sd = summary.summaryDetail
  const income = summary.incomeStatementHistory?.incomeStatementHistory ?? []

  return {
    metrics: {
      trailingPE: ks?.trailingPE?.raw ?? null,
      forwardPE: ks?.forwardPE?.raw ?? null,
      priceToBook: ks?.priceToBook?.raw ?? null,
      priceToSales: ks?.priceToSalesTrailingTwelveMonths?.raw ?? null,
      pegRatio: ks?.pegRatio?.raw ?? null,
      enterpriseToRevenue: ks?.enterpriseToRevenue?.raw ?? null,
      enterpriseToEbitda: ks?.enterpriseToEbitda?.raw ?? null,
      grossMargins: fd?.grossMargins?.raw ?? null,
      operatingMargins: fd?.operatingMargins?.raw ?? null,
      ebitdaMargins: fd?.ebitdaMargins?.raw ?? null,
      profitMargins: fd?.profitMargins?.raw ?? null,
      returnOnEquity: fd?.returnOnEquity?.raw ?? null,
      returnOnAssets: fd?.returnOnAssets?.raw ?? null,
      revenueGrowth: fd?.revenueGrowth?.raw ?? null,
      earningsGrowth: fd?.earningsGrowth?.raw ?? null,
      trailingEps: ks?.trailingEps?.raw ?? null,
      forwardEps: ks?.forwardEps?.raw ?? null,
      bookValue: ks?.bookValue?.raw ?? null,
      totalCash: fd?.totalCash?.raw ?? null,
      totalDebt: fd?.totalDebt?.raw ?? null,
      debtToEquity: fd?.debtToEquity?.raw ?? null,
      currentRatio: fd?.currentRatio?.raw ?? null,
      quickRatio: fd?.quickRatio?.raw ?? null,
      freeCashflow: fd?.freeCashflow?.raw ?? null,
      operatingCashflow: fd?.operatingCashflow?.raw ?? null,
      dividendYield: sd?.dividendYield?.raw ?? null,
      payoutRatio: sd?.payoutRatio?.raw ?? null,
      beta: ks?.beta?.raw ?? null,
      shortRatio: ks?.shortRatio?.raw ?? null,
      fiftyTwoWeekChange: ks?.fiftyTwoWeekChange?.raw ?? null,
      targetMeanPrice: fd?.targetMeanPrice?.raw ?? null,
      targetHighPrice: fd?.targetHighPrice?.raw ?? null,
      targetLowPrice: fd?.targetLowPrice?.raw ?? null,
      recommendationKey: fd?.recommendationKey ?? null,
      numberOfAnalystOpinions: fd?.numberOfAnalystOpinions?.raw ?? null,
    },
    incomeHistory: income.map((item: Record<string, { raw?: number }>) => ({
      date: (item.endDate as unknown as { fmt?: string })?.fmt ?? '',
      totalRevenue: item.totalRevenue?.raw ?? null,
      grossProfit: item.grossProfit?.raw ?? null,
      ebitda: item.ebitda?.raw ?? null,
      netIncome: item.netIncome?.raw ?? null,
      researchDevelopment: item.researchDevelopment?.raw ?? null,
      sellingGeneralAdministrative: item.sellingGeneralAdministrative?.raw ?? null,
    })),
  }
}

function emptyMetrics(): FinancialMetrics {
  const nullFields = [
    'trailingPE','forwardPE','priceToBook','priceToSales','pegRatio',
    'enterpriseToRevenue','enterpriseToEbitda','grossMargins','operatingMargins',
    'ebitdaMargins','profitMargins','returnOnEquity','returnOnAssets',
    'revenueGrowth','earningsGrowth','trailingEps','forwardEps','bookValue',
    'totalCash','totalDebt','debtToEquity','currentRatio','quickRatio',
    'freeCashflow','operatingCashflow','dividendYield','payoutRatio',
    'beta','shortRatio','fiftyTwoWeekChange','targetMeanPrice',
    'targetHighPrice','targetLowPrice','numberOfAnalystOpinions',
  ]
  return Object.fromEntries([
    ...nullFields.map(k => [k, null]),
    ['recommendationKey', null],
  ]) as FinancialMetrics
}

// -------------------------------------------------------
// Finnhub client (US stocks)
// -------------------------------------------------------
const FINNHUB = 'https://finnhub.io/api/v1'

function fhKey() {
  const k = process.env.FINNHUB_API_KEY
  if (!k) throw new Error('FINNHUB_API_KEY is not set in .env.local')
  return k
}

async function fhGet<T>(path: string): Promise<T> {
  const url = `${FINNHUB}${path}&token=${fhKey()}`
  const res = await fetch(url, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`Finnhub ${path} → ${res.status}`)
  return res.json() as Promise<T>
}

// -------------------------------------------------------
// Public API — auto-routes based on ticker
// -------------------------------------------------------
export async function fetchQuote(ticker: string): Promise<StockQuote> {
  if (isTASE(ticker)) return fetchQuoteTASE(ticker)

  const [quote, profile, metrics] = await Promise.all([
    fhGet<FinnhubQuote>(`/quote?symbol=${ticker}`),
    fhGet<FinnhubProfile>(`/stock/profile2?symbol=${ticker}`),
    fhGet<{ metric: FinnhubMetrics }>(`/stock/metric?symbol=${ticker}&metric=all`),
  ])

  if (!quote.c || quote.c === 0) throw new Error(`No quote data for ${ticker}`)

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

export async function fetchFinancials(ticker: string): Promise<FinancialData> {
  if (isTASE(ticker)) return fetchFinancialsTASE(ticker)

  const [metricsRes, financialsRes] = await Promise.all([
    fhGet<{ metric: FinnhubMetrics }>(`/stock/metric?symbol=${ticker}&metric=all`),
    fhGet<FinnhubFinancials>(`/stock/financials-reported?symbol=${ticker}&freq=annual`),
  ])

  const m = metricsRes.metric ?? {}
  const metrics: FinancialMetrics = {
    trailingPE: m.peExclExtraTTM ?? m.peTTM ?? null,
    forwardPE: m.peNormalizedAnnual ?? null,
    priceToBook: m.pbAnnual ?? m.pbQuarterly ?? null,
    priceToSales: m.psTTM ?? m.psAnnual ?? null,
    pegRatio: null,
    enterpriseToRevenue: m.evToRevenueTTM ?? null,
    enterpriseToEbitda: m.evToEbitdaTTM ?? null,
    grossMargins: m.grossMarginTTM != null ? m.grossMarginTTM / 100 : null,
    operatingMargins: m.operatingMarginTTM != null ? m.operatingMarginTTM / 100 : null,
    ebitdaMargins: null,
    profitMargins: m.netProfitMarginTTM != null ? m.netProfitMarginTTM / 100 : null,
    returnOnEquity: m.roeTTM != null ? m.roeTTM / 100 : null,
    returnOnAssets: m.roaTTM != null ? m.roaTTM / 100 : null,
    revenueGrowth: m.revenueGrowthTTMYoy != null ? m.revenueGrowthTTMYoy / 100 : null,
    earningsGrowth: m.epsGrowthTTMYoy != null ? m.epsGrowthTTMYoy / 100 : null,
    trailingEps: m.epsTTM ?? m.epsAnnual ?? null,
    forwardEps: m.epsNormalizedAnnual ?? null,
    bookValue: m.bookValuePerShareAnnual ?? m.bookValuePerShareQuarterly ?? null,
    totalCash: null,
    totalDebt: null,
    debtToEquity: m.totalDebtToEquityAnnual ?? m.totalDebtToEquityQuarterly ?? null,
    currentRatio: m.currentRatioAnnual ?? m.currentRatioQuarterly ?? null,
    quickRatio: m.quickRatioAnnual ?? m.quickRatioQuarterly ?? null,
    freeCashflow: m.freeCashFlowTTM != null ? m.freeCashFlowTTM * 1e6 : null,
    operatingCashflow: null,
    dividendYield: m.dividendYieldIndicatedAnnual != null ? m.dividendYieldIndicatedAnnual / 100 : null,
    payoutRatio: m.payoutRatioAnnual != null ? m.payoutRatioAnnual / 100 : null,
    beta: m.beta ?? null,
    shortRatio: null,
    fiftyTwoWeekChange: m['52WeekPriceReturnDaily'] != null ? m['52WeekPriceReturnDaily'] / 100 : null,
    targetMeanPrice: null,
    targetHighPrice: null,
    targetLowPrice: null,
    recommendationKey: null,
    numberOfAnalystOpinions: null,
  }

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

export async function fetchNewsHeadlines(ticker: string): Promise<string[]> {
  try {
    if (isTASE(ticker)) {
      // Use Yahoo Finance news for TASE
      const baseTicker = ticker.replace('.TA', '')
      const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${baseTicker}&newsCount=10&quotesCount=0`
      const res = await fetch(url, { headers: BROWSER_HEADERS })
      if (!res.ok) return []
      const data = await res.json()
      return (data?.news ?? []).map((n: { title: string }) => n.title).filter(Boolean).slice(0, 10)
    }

    const to = new Date().toISOString().split('T')[0]
    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const news = await fhGet<FinnhubNews[]>(`/company-news?symbol=${ticker}&from=${from}&to=${to}`)
    return (news ?? []).slice(0, 10).map((n) => n.headline).filter(Boolean)
  } catch {
    return []
  }
}

export async function searchTickers(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 1) return []

  try {
    // Always search Finnhub (returns global results including .TA if searched)
    const res = await fhGet<{ result: FinnhubSearchResult[] }>(`/search?q=${encodeURIComponent(query)}`)
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
// Internal types
// -------------------------------------------------------
interface FinnhubQuote { c: number; d: number; dp: number; h: number; l: number; o: number; pc: number; v: number }
interface FinnhubProfile { name: string; ticker: string; exchange: string; currency: string; marketCapitalization: number }
interface FinnhubMetrics { [key: string]: number | null | undefined }
interface FinnhubNews { headline: string; summary: string; url: string; datetime: number }
interface FinnhubSearchResult { symbol: string; description: string; displaySymbol: string; type: string }
interface FinnhubFinancials {
  data: Array<{ endDate: string; report: { ic: Array<{ concept: string; value: number }> } }>
}
