// ============================================================
// Stock & Financial Data Types
// ============================================================

export interface StockQuote {
  ticker: string
  shortName: string
  longName: string
  price: number
  change: number
  changePercent: number
  volume: number
  avgVolume: number
  marketCap: number
  dayHigh: number
  dayLow: number
  fiftyTwoWeekHigh: number
  fiftyTwoWeekLow: number
  currency: string
  exchange: string
}

export interface FinancialMetrics {
  // Valuation
  trailingPE: number | null
  forwardPE: number | null
  priceToBook: number | null
  priceToSales: number | null
  pegRatio: number | null
  enterpriseToRevenue: number | null
  enterpriseToEbitda: number | null

  // Profitability
  grossMargins: number | null
  operatingMargins: number | null
  ebitdaMargins: number | null
  profitMargins: number | null
  returnOnEquity: number | null
  returnOnAssets: number | null

  // Growth
  revenueGrowth: number | null
  earningsGrowth: number | null

  // Per Share
  trailingEps: number | null
  forwardEps: number | null
  bookValue: number | null

  // Balance Sheet
  totalCash: number | null
  totalDebt: number | null
  debtToEquity: number | null
  currentRatio: number | null
  quickRatio: number | null

  // Cash Flow
  freeCashflow: number | null
  operatingCashflow: number | null

  // Dividend
  dividendYield: number | null
  payoutRatio: number | null

  // Other
  beta: number | null
  shortRatio: number | null
  fiftyTwoWeekChange: number | null

  // Analyst
  targetMeanPrice: number | null
  targetHighPrice: number | null
  targetLowPrice: number | null
  recommendationKey: string | null
  numberOfAnalystOpinions: number | null
}

export interface IncomeStatement {
  date: string
  totalRevenue: number | null
  grossProfit: number | null
  ebitda: number | null
  netIncome: number | null
  researchDevelopment: number | null
  sellingGeneralAdministrative: number | null
}

export interface FinancialData {
  metrics: FinancialMetrics
  incomeHistory: IncomeStatement[]
}

export interface PriceBar {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface SearchResult {
  ticker: string
  shortName: string
  longName: string
  exchange: string
  quoteType: string
}
