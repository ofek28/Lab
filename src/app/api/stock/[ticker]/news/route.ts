import { NextRequest, NextResponse } from 'next/server'
import { fetchNewsHeadlines } from '@/lib/finnhub/client'

export async function GET(
  _request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase()

  try {
    const headlines = await fetchNewsHeadlines(ticker)
    return NextResponse.json({ headlines }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (err) {
    console.error(`[news] ${ticker}:`, err)
    return NextResponse.json({ headlines: [] })
  }
}
