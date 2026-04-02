import Anthropic from '@anthropic-ai/sdk'
import type { AgentInput, NewsReport } from './types'

const client = new Anthropic()

function buildPrompt(input: AgentInput): string {
  const { ticker, companyName, newsHeadlines } = input

  if (newsHeadlines.length === 0) {
    return `You are a financial news analyst. No recent news headlines were found for ${companyName} (${ticker}). Provide a neutral assessment noting the absence of recent news. Score: 5/10.`
  }

  const headlinesList = newsHeadlines.map((h, i) => `${i + 1}. ${h}`).join('\n')

  return `You are a financial news analyst specializing in sentiment analysis.

Analyze the following recent news headlines for ${companyName} (${ticker}) and provide a structured sentiment analysis.

--- RECENT HEADLINES ---
${headlinesList}

Your analysis should cover:
1. Overall news sentiment (bullish / neutral / bearish)
2. Key themes and narratives emerging from the headlines
3. Potential positive catalysts mentioned in the news
4. Potential risks or concerns mentioned
5. Significance of the news for the investment thesis

Be specific about which headlines drive your conclusions.`
}

export async function newsAgent(input: AgentInput): Promise<NewsReport> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    tools: [
      {
        name: 'submit_news_report',
        description: 'Submit the structured news sentiment analysis report',
        input_schema: {
          type: 'object' as const,
          properties: {
            summary: {
              type: 'string',
              description: '2-3 sentence news sentiment summary',
            },
            score: {
              type: 'number',
              description: 'News sentiment score 1-10 (10 = very positive news flow)',
            },
            sentiment: {
              type: 'string',
              enum: ['bullish', 'neutral', 'bearish'],
            },
            keyThemes: {
              type: 'array',
              items: { type: 'string' },
              description: '3-5 key themes from the news',
            },
            catalysts: {
              type: 'array',
              items: { type: 'string' },
              description: '2-4 potential positive catalysts from the news',
            },
            risks: {
              type: 'array',
              items: { type: 'string' },
              description: '2-3 risks or concerns from the news',
            },
          },
          required: ['summary', 'score', 'sentiment', 'keyThemes', 'catalysts', 'risks'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'submit_news_report' },
    messages: [{ role: 'user', content: buildPrompt(input) }],
  })

  const toolUse = response.content.find((b) => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('News agent did not return a tool use block')
  }

  const result = toolUse.input as Omit<NewsReport, 'type'>
  return { type: 'news', ...result }
}
