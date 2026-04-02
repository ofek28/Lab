import Anthropic from '@anthropic-ai/sdk'
import type { AgentInput, TechnicalReport } from './types'
import type { PriceBar } from '@/types/stock'

const client = new Anthropic()

function computeSimpleMovingAverage(prices: number[], period: number): number | null {
  if (prices.length < period) return null
  const slice = prices.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / period
}

function computeRSI(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null
  let gains = 0
  let losses = 0

  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff > 0) gains += diff
    else losses -= diff
  }

  const avgGain = gains / period
  const avgLoss = losses / period
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

function buildPrompt(input: AgentInput, indicators: Record<string, number | null | string>): string {
  const { ticker, companyName, currentPrice, historicalPrices } = input

  const recentBars = historicalPrices.slice(-20)
  const priceTable = recentBars
    .map((b) => `${b.date}: Close $${b.close.toFixed(2)}, Vol ${(b.volume / 1e6).toFixed(2)}M`)
    .join('\n')

  const high52w = Math.max(...historicalPrices.map((b) => b.high))
  const low52w = Math.min(...historicalPrices.map((b) => b.low))

  return `You are a professional technical analyst.

Analyze the following price data for ${companyName} (${ticker}).

Current Price: $${currentPrice.toFixed(2)}
52-Week High: $${high52w.toFixed(2)}
52-Week Low: $${low52w.toFixed(2)}

--- COMPUTED INDICATORS ---
SMA 20: ${indicators.sma20 != null ? `$${(indicators.sma20 as number).toFixed(2)}` : 'N/A'}
SMA 50: ${indicators.sma50 != null ? `$${(indicators.sma50 as number).toFixed(2)}` : 'N/A'}
SMA 200: ${indicators.sma200 != null ? `$${(indicators.sma200 as number).toFixed(2)}` : 'N/A'}
RSI (14): ${indicators.rsi != null ? (indicators.rsi as number).toFixed(1) : 'N/A'}
Price vs SMA20: ${indicators.vsSma20}
Price vs SMA200: ${indicators.vsSma200}

--- RECENT 20 TRADING DAYS ---
${priceTable}

Your analysis should cover:
1. Overall trend direction (uptrend / downtrend / sideways)
2. Key support and resistance levels (be specific with price levels)
3. Moving average analysis (golden cross, death cross, alignment)
4. RSI and momentum
5. Volume patterns
6. Notable chart patterns if any
7. Short-term and medium-term outlook

Provide specific price levels for support and resistance.`
}

export async function technicalAgent(input: AgentInput): Promise<TechnicalReport> {
  const closes = input.historicalPrices.map((b) => b.close)

  const indicators = {
    sma20: computeSimpleMovingAverage(closes, 20),
    sma50: computeSimpleMovingAverage(closes, 50),
    sma200: computeSimpleMovingAverage(closes, 200),
    rsi: computeRSI(closes),
    vsSma20: (() => {
      const sma = computeSimpleMovingAverage(closes, 20)
      if (!sma) return 'N/A'
      const pct = ((input.currentPrice - sma) / sma) * 100
      return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
    })(),
    vsSma200: (() => {
      const sma = computeSimpleMovingAverage(closes, 200)
      if (!sma) return 'N/A'
      const pct = ((input.currentPrice - sma) / sma) * 100
      return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
    })(),
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1200,
    tools: [
      {
        name: 'submit_technical_report',
        description: 'Submit the structured technical analysis report',
        input_schema: {
          type: 'object' as const,
          properties: {
            summary: {
              type: 'string',
              description: '3-4 sentence technical analysis summary',
            },
            score: {
              type: 'number',
              description: 'Technical score 1-10 (10 = very bullish setup)',
            },
            trend: {
              type: 'string',
              enum: ['uptrend', 'downtrend', 'sideways'],
            },
            support: {
              type: 'number',
              description: 'Key support price level',
            },
            resistance: {
              type: 'number',
              description: 'Key resistance price level',
            },
            signals: {
              type: 'array',
              items: { type: 'string' },
              description: '3-5 specific technical signals (e.g., "Above 200-day SMA", "RSI oversold at 28")',
            },
            momentum: {
              type: 'string',
              enum: ['strong_bullish', 'bullish', 'neutral', 'bearish', 'strong_bearish'],
            },
          },
          required: ['summary', 'score', 'trend', 'support', 'resistance', 'signals', 'momentum'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'submit_technical_report' },
    messages: [{ role: 'user', content: buildPrompt(input, indicators) }],
  })

  const toolUse = response.content.find((b) => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Technical agent did not return a tool use block')
  }

  const result = toolUse.input as Omit<TechnicalReport, 'type'>
  return { type: 'technical', ...result }
}
