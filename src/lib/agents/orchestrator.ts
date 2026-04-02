import Anthropic from '@anthropic-ai/sdk'
import { fetchQuote, fetchFinancials, fetchHistorical, fetchNewsHeadlines } from '@/lib/yahoo/client'
import { fundamentalAgent } from './fundamentalAgent'
import { technicalAgent } from './technicalAgent'
import { newsAgent } from './newsAgent'
import { createServerClient } from '@/lib/supabase/server'
import type { AgentInput, CompositeReport, FundamentalReport, TechnicalReport, NewsReport } from './types'

const anthropic = new Anthropic()

// -------------------------------------------------------
// Cache Check
// -------------------------------------------------------
async function getCachedReport(ticker: string): Promise<CompositeReport | null> {
  try {
    const supabase = createServerClient()
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('agent_reports')
      .select('content, created_at')
      .eq('ticker', ticker.toUpperCase())
      .eq('report_type', 'composite')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return null
    return data.content as CompositeReport
  } catch {
    return null
  }
}

async function saveReport(ticker: string, report: CompositeReport): Promise<void> {
  try {
    const supabase = createServerClient()
    await supabase.from('agent_reports').insert({
      ticker: ticker.toUpperCase(),
      report_type: 'composite',
      content: report,
      model_id: 'claude-sonnet-4-6',
    })
  } catch (err) {
    console.error('Failed to save agent report:', err)
  }
}

// -------------------------------------------------------
// Synthesis Agent
// -------------------------------------------------------
async function synthesisAgent(
  fundamental: FundamentalReport,
  technical: TechnicalReport,
  news: NewsReport,
  ticker: string,
  companyName: string
): Promise<Omit<CompositeReport, 'type' | 'ticker' | 'companyName' | 'fundamental' | 'technical' | 'news' | 'generatedAt'>> {
  const prompt = `You are a senior investment analyst synthesizing research from three specialist analysts.

COMPANY: ${companyName} (${ticker})

--- FUNDAMENTAL ANALYSIS (Score: ${fundamental.score}/10) ---
${fundamental.summary}
Strengths: ${fundamental.strengths.join('; ')}
Weaknesses: ${fundamental.weaknesses.join('; ')}

--- TECHNICAL ANALYSIS (Score: ${technical.score}/10) ---
${technical.summary}
Trend: ${technical.trend}, Momentum: ${technical.momentum}
Signals: ${technical.signals.join('; ')}

--- NEWS SENTIMENT (Score: ${news.score}/10) ---
${news.summary}
Sentiment: ${news.sentiment}
Catalysts: ${news.catalysts.join('; ')}
Risks: ${news.risks.join('; ')}

Based on all three analyses, provide:
1. An overall investment recommendation
2. A compelling executive summary (3-4 sentences) for an investment committee
3. The core investment thesis in 2-3 sentences
4. The top 3 key risks to the thesis`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1200,
    tools: [
      {
        name: 'submit_composite_report',
        description: 'Submit the final composite investment report',
        input_schema: {
          type: 'object' as const,
          properties: {
            overallScore: {
              type: 'number',
              description: 'Weighted composite score 1-10',
            },
            recommendation: {
              type: 'string',
              enum: ['strong_buy', 'buy', 'hold', 'sell', 'strong_sell'],
            },
            executiveSummary: {
              type: 'string',
              description: '3-4 sentence executive summary for an investment committee',
            },
            investmentThesis: {
              type: 'string',
              description: '2-3 sentence core bull case investment thesis',
            },
            keyRisks: {
              type: 'array',
              items: { type: 'string' },
              description: 'Top 3-4 key risks to the investment thesis',
            },
          },
          required: ['overallScore', 'recommendation', 'executiveSummary', 'investmentThesis', 'keyRisks'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'submit_composite_report' },
    messages: [{ role: 'user', content: prompt }],
  })

  const toolUse = response.content.find((b) => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Synthesis agent did not return a tool use block')
  }

  return toolUse.input as Omit<CompositeReport, 'type' | 'ticker' | 'companyName' | 'fundamental' | 'technical' | 'news' | 'generatedAt'>
}

// -------------------------------------------------------
// Main Orchestrator
// -------------------------------------------------------
export async function runAnalysis(ticker: string, forceRefresh = false): Promise<CompositeReport> {
  const normalizedTicker = ticker.toUpperCase()

  // Check cache first (unless forceRefresh)
  if (!forceRefresh) {
    const cached = await getCachedReport(normalizedTicker)
    if (cached) return cached
  }

  // 1. Fetch all data in parallel
  const [quote, financials, historicalPrices, newsHeadlines] = await Promise.all([
    fetchQuote(normalizedTicker),
    fetchFinancials(normalizedTicker),
    fetchHistorical(normalizedTicker, '6mo'),
    fetchNewsHeadlines(normalizedTicker),
  ])

  const input: AgentInput = {
    ticker: normalizedTicker,
    companyName: quote.longName || quote.shortName || normalizedTicker,
    currentPrice: quote.price,
    financials,
    historicalPrices,
    newsHeadlines,
  }

  // 2. Run the three specialist agents in parallel
  const [fundamental, technical, news] = await Promise.all([
    fundamentalAgent(input),
    technicalAgent(input),
    newsAgent(input),
  ])

  // 3. Synthesize with the orchestrator agent
  const synthesis = await synthesisAgent(
    fundamental,
    technical,
    news,
    normalizedTicker,
    input.companyName
  )

  // 4. Assemble final report
  const report: CompositeReport = {
    type: 'composite',
    ticker: normalizedTicker,
    companyName: input.companyName,
    ...synthesis,
    fundamental,
    technical,
    news,
    generatedAt: new Date().toISOString(),
  }

  // 5. Save to cache
  await saveReport(normalizedTicker, report)

  return report
}
