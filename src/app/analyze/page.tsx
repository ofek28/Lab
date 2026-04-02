import { TickerSearch } from '@/components/analysis/TickerSearch'
import { TrendingUp, BarChart2, BookOpen, Brain } from 'lucide-react'

const POPULAR_TICKERS = [
  { ticker: 'AAPL', name: 'Apple' },
  { ticker: 'MSFT', name: 'Microsoft' },
  { ticker: 'GOOGL', name: 'Alphabet' },
  { ticker: 'AMZN', name: 'Amazon' },
  { ticker: 'NVDA', name: 'NVIDIA' },
  { ticker: 'META', name: 'Meta' },
  { ticker: 'TSLA', name: 'Tesla' },
  { ticker: 'BRK-B', name: 'Berkshire' },
]

const FEATURES = [
  {
    icon: BarChart2,
    title: 'Financial Metrics',
    description: 'P/E, margins, growth, balance sheet — all the key ratios at a glance',
  },
  {
    icon: Brain,
    title: 'AI Agent Analysis',
    description: 'Claude runs 4 specialist agents: fundamental, technical, news, and synthesis',
  },
  {
    icon: TrendingUp,
    title: 'Price Charts',
    description: 'Historical price action with customizable time periods',
  },
  {
    icon: BookOpen,
    title: 'Investment Notebook',
    description: 'Write your thesis, track your thinking, review your history',
  },
]

export default function AnalyzePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-20">
        <div className="mb-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          Professional Investment Research
        </div>
        <h1 className="mt-4 text-center text-4xl font-extrabold tracking-tight text-slate-900">
          Analyze Any Stock
          <br />
          <span className="text-blue-600">in 30 Seconds</span>
        </h1>
        <p className="mt-4 max-w-md text-center text-base text-slate-500">
          Enter a ticker to get real financial data, AI-powered analysis from 4 specialist agents,
          and tools to write your investment thesis.
        </p>

        {/* Search */}
        <div className="mt-8 w-full max-w-xl">
          <TickerSearch placeholder="Search ticker or company name (e.g. AAPL, Apple)..." />
        </div>

        {/* Quick picks */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {POPULAR_TICKERS.map(({ ticker, name }) => (
            <a
              key={ticker}
              href={`/analyze/${ticker}`}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
            >
              {ticker}
              <span className="ml-1 text-slate-400">{name}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="border-t border-slate-200 bg-white px-8 py-12">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="mb-1 text-sm font-semibold text-slate-800">{title}</div>
              <div className="text-xs text-slate-500">{description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Data source note */}
      <div className="bg-slate-50 px-8 py-4 text-center text-xs text-slate-400 border-t border-slate-200">
        Data sourced from Yahoo Finance (free, real-time). AI analysis powered by Anthropic Claude.
      </div>
    </div>
  )
}
