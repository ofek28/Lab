import { NextRequest, NextResponse } from 'next/server'
import { fetchHistorical } from '@/lib/yahoo/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase()
  const period = (request.nextUrl.searchParams.get('period') ?? '6mo') as
    | '1mo' | '3mo' | '6mo' | '1y' | '2y'

  try {
    const data = await fetchHistorical(ticker, period)
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    })
  } catch (err) {
    console.error(`[historical] ${ticker}:`, err)
    return NextResponse.json(
      { error: `Could not fetch historical prices for ${ticker}` },
      { status: 500 }
    )
  }
}
