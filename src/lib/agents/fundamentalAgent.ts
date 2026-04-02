import Anthropic from '@anthropic-ai/sdk'
import type { AgentInput, FundamentalReport } from './types'
import { formatCurrency, formatPercent, formatMultiple } from '@/lib/utils'

const client = new Anthropic()

function buildPrompt(input: AgentInput): string {
  const { ticker, companyName, currentPrice, financials } = input
  const m = financials.metrics

  const metricsText = `
COMPANY: ${companyName} (${ticker}) — Current Price: ${formatCurrency(currentPrice)}

--- VALUATION ---
P/E (Trailing): ${formatMultiple(m.trailingPE)}
P/E (Forward): ${formatMultiple(m.forwardPE)}
P/B: ${formatMultiple(m.priceToBook)}
P/S: ${formatMultiple(m.priceToSales)}
PEG Ratio: ${formatMultiple(m.pegRatio)}
EV/Revenue: ${formatMultiple(m.enterpriseToRevenue)}
EV/EBITDA: ${formatMultiple(m.enterpriseToEbitda)}
Beta: ${formatMultiple(m.beta)}

--- PROFITABILITY ---
Gross Margin: ${formatPercent(m.grossMargins, { multiply: true })}
Operating Margin: ${formatPercent(m.operatingMargins, { multiply: true })}
EBITDA Margin: ${formatPercent(m.ebitdaMargins, { multiply: true })}
Net Margin: ${formatPercent(m.profitMargins, { multiply: true })}
ROE: ${formatPercent(m.returnOnEquity, { multiply: true })}
ROA: ${formatPercent(m.returnOnAssets, { multiply: true })}

--- GROWTH ---
Revenue Growth (YoY): ${formatPercent(m.revenueGrowth, { multiply: true })}
Earnings Growth (YoY): ${formatPercent(m.earningsGrowth, { multiply: true })}
EPS (TTM): ${formatCurrency(m.trailingEps)}
EPS (Forward): ${formatCurrency(m.forwardEps)}

--- BALANCE SHEET ---
Total Cash: ${formatCurrency(m.totalCash, { compact: true })}
Total Debt: ${formatCurrency(m.totalDebt, { compact: true })}
D/E Ratio: ${formatMultiple(m.debtToEquity)}
Current Ratio: ${formatMultiple(m.currentRatio)}

--- CASH FLOW ---
Free Cash Flow: ${formatCurrency(m.freeCashflow, { compact: true })}
Operating Cash Flow: ${formatCurrency(m.operatingCashflow, { compact: true })}

--- ANALYST ---
Target Price (Mean): ${formatCurrency(m.targetMeanPrice)}
Target Price (Range): ${formatCurrency(m.targetLowPrice)} – ${formatCurrency(m.targetHighPrice)}
Consensus: ${m.recommendationKey ?? 'N/A'}
# Analysts: ${m.numberOfAnalystOpinions ?? 'N/A'}

--- INCOME HISTORY (latest 4 quarters/years) ---
${financials.incomeHistory
  .slice(0, 4)
  .map(
    (row) =>
      `${row.date}: Revenue ${formatCurrency(row.totalRevenue, { compact: true })}, Net Income ${formatCurrency(row.netIncome, { compact: true })}`
  )
  .join('\n')}
`.trim()

  return `You are a professional investment analyst specializing in fundamental analysis.

Analyze the following financial data for ${companyName} (${ticker}) and provide a structured fundamental analysis.

${metricsText}

Your analysis should cover:
1. Earnings quality and sustainability
2. Revenue trends and growth outlook
3. Margin strength and trajectory
4. Balance sheet health and capital structure
5. Valuation relative to growth (is the stock cheap, fair, or expensive?)
6. Free cash flow generation
7. Key strengths and weaknesses

Be concise, insightful, and write like a CFA analyst preparing a research note.`
}

export async function fundamentalAgent(input: AgentInput): Promise<FundamentalReport> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    tools: [
      {
        name: 'submit_fundamental_report',
        description: 'Submit the structured fundamental analysis report',
        input_schema: {
          type: 'object' as const,
          properties: {
            summary: {
              type: 'string',
              description: '3-4 sentence plain-English fundamental summary',
            },
            score: {
              type: 'number',
              description: 'Fundamental score 1-10 (10 = excellent fundamentals)',
            },
            keyMetrics: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  value: { type: 'string' },
                  signal: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
                  note: { type: 'string' },
                },
                required: ['label', 'value', 'signal'],
              },
              description: '6-8 key metrics with signal assessment',
            },
            strengths: {
              type: 'array',
              items: { type: 'string' },
              description: '3-5 key fundamental strengths',
            },
            weaknesses: {
              type: 'array',
              items: { type: 'string' },
              description: '2-4 key fundamental weaknesses or risks',
            },
          },
          required: ['summary', 'score', 'keyMetrics', 'strengths', 'weaknesses'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'submit_fundamental_report' },
    messages: [{ role: 'user', content: buildPrompt(input) }],
  })

  const toolUse = response.content.find((b) => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Fundamental agent did not return a tool use block')
  }

  const result = toolUse.input as Omit<FundamentalReport, 'type'>
  return { type: 'fundamental', ...result }
}
