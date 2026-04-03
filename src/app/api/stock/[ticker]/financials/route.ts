import { NextRequest, NextResponse } from 'next/server'
import { fetchFinancials } from '@/lib/finnhub/client'

export async function GET(
  _request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase()

  try {
    const data = await fetchFinancials(ticker)
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (err) {
    console.error(`[financials] ${ticker}:`, err)
    return NextResponse.json(
      { error: `Could not fetch financials for ${ticker}` },
      { status: 500 }
    )
  }
}
