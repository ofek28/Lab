import { NextRequest, NextResponse } from 'next/server'
import { fetchQuote } from '@/lib/yahoo/client'

export async function GET(
  _request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase()

  try {
    const quote = await fetchQuote(ticker)
    return NextResponse.json(quote, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    })
  } catch (err) {
    console.error(`[quote] ${ticker}:`, err)
    return NextResponse.json(
      { error: `Could not fetch quote for ${ticker}` },
      { status: 404 }
    )
  }
}
