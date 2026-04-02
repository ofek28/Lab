import { NextRequest, NextResponse } from 'next/server'
import { runAnalysis } from '@/lib/agents/orchestrator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticker, forceRefresh } = body as { ticker: string; forceRefresh?: boolean }

    if (!ticker || typeof ticker !== 'string') {
      return NextResponse.json({ error: 'ticker is required' }, { status: 400 })
    }

    const report = await runAnalysis(ticker.toUpperCase(), forceRefresh ?? false)
    return NextResponse.json(report)
  } catch (err) {
    console.error('[agents/analyze]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Analysis failed' },
      { status: 500 }
    )
  }
}

// Allow up to 60 seconds for the multi-agent analysis
export const maxDuration = 60
